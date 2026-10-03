param(
    [string]$AwsRegion = 'us-east-1',
    [string]$ClusterName = 'frasberg-secure-runtime-cluster',
    [string]$AwsAccountId = $env:AWS_ACCOUNT_ID,
    [string]$VpcName = 'frasberg-vpc',
    [string]$PrivateSubnetAName = 'private-compute-a',
    [string]$PrivateSubnetBName = 'private-compute-b',
    [string]$ExecutionRoleName = 'ecsTaskExecutionRole',
    [string]$TaskRoleName = 'frasberg-runtime-role',
    [switch]$DryRun
)

function Invoke-AwsText {
    param([string[]]$Arguments)

    $value = & aws @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "AWS CLI command failed: aws $($Arguments -join ' ')"
    }
    return ($value | Out-String).Trim()
}

node ./scripts/generate-ecs-mesh-manifest.mjs | Out-Null

$json = Get-Content -Raw -Path './manifests/frasberg-ecs-mesh.json' | ConvertFrom-Json
$callerAccountId = Invoke-AwsText @('sts', 'get-caller-identity', '--query', 'Account', '--output', 'text', '--region', $AwsRegion)
if ($AwsAccountId -and $AwsAccountId -ne $callerAccountId) {
    throw "AWS_ACCOUNT_ID $AwsAccountId does not match the authenticated account $callerAccountId."
}
$AwsAccountId = $callerAccountId
$clusterStatus = Invoke-AwsText @('ecs', 'describe-clusters', '--region', $AwsRegion, '--clusters', $ClusterName, '--query', 'clusters[0].status', '--output', 'text')
if ($clusterStatus -ne 'ACTIVE') {
    throw "ECS cluster '$ClusterName' is not ACTIVE in $AwsRegion."
}

$executionRole = Invoke-AwsText @('iam', 'get-role', '--role-name', $ExecutionRoleName, '--query', 'Role.Arn', '--output', 'text')
$taskRole = Invoke-AwsText @('iam', 'get-role', '--role-name', $TaskRoleName, '--query', 'Role.Arn', '--output', 'text')
if (-not $executionRole -or -not $taskRole) {
    throw "Both IAM roles '$ExecutionRoleName' and '$TaskRoleName' must exist before deployment."
}

$repositoryUri = Invoke-AwsText @('ecr', 'describe-repositories', '--region', $AwsRegion, '--repository-names', 'frasberg-secure-runtime', '--query', 'repositories[0].repositoryUri', '--output', 'text')
if (-not $repositoryUri -or $repositoryUri -eq 'None') {
    throw "ECR repository 'frasberg-secure-runtime' must exist and contain the runtime image before deployment."
}

if ($DryRun) {
    Write-Host "[dry-run] authenticated AWS account: $AwsAccountId"
    Write-Host "[dry-run] target VPC: $VpcName"
    Write-Host "[dry-run] target subnets: $PrivateSubnetAName, $PrivateSubnetBName"
}

$vpcId = Invoke-AwsText @('ec2', 'describe-vpcs', '--filters', "Name=tag:Name,Values=$VpcName", '--query', 'Vpcs[0].VpcId', '--output', 'text', '--region', $AwsRegion)
if (-not $vpcId -or $vpcId -eq 'None') {
    throw "VPC '$VpcName' was not found in $AwsRegion."
}

$subnetAId = Invoke-AwsText @('ec2', 'describe-subnets', '--filters', "Name=vpc-id,Values=$vpcId", "Name=tag:Name,Values=$PrivateSubnetAName", '--query', 'Subnets[0].SubnetId', '--output', 'text', '--region', $AwsRegion)
$subnetBId = Invoke-AwsText @('ec2', 'describe-subnets', '--filters', "Name=vpc-id,Values=$vpcId", "Name=tag:Name,Values=$PrivateSubnetBName", '--query', 'Subnets[0].SubnetId', '--output', 'text', '--region', $AwsRegion)
if ($subnetAId -eq 'None' -or $subnetBId -eq 'None' -or -not $subnetAId -or -not $subnetBId) {
    throw "Both private subnets '$PrivateSubnetAName' and '$PrivateSubnetBName' must exist in VPC '$VpcName'."
}

$executionRoleArn = "arn:aws:iam::$AwsAccountId`:role/$ExecutionRoleName"
$taskRoleArn = "arn:aws:iam::$AwsAccountId`:role/$TaskRoleName"
$subnetIds = "$subnetAId,$subnetBId"

foreach ($svc in $json.services) {
    $taskFamily = "frasberg-$($svc.service)-task"
    $serviceName = "frasberg-$($svc.service)-service"
    $containerName = "frasberg-$($svc.service)-container"
    $securityGroupName = "frasberg-$($svc.service)-sg"
    $securityGroupId = Invoke-AwsText @('ec2', 'describe-security-groups', '--filters', "Name=vpc-id,Values=$vpcId", "Name=group-name,Values=$securityGroupName", '--query', 'SecurityGroups[0].GroupId', '--output', 'text', '--region', $AwsRegion)
    $targetGroupArn = Invoke-AwsText @('elbv2', 'describe-target-groups', '--names', "frasberg-$($svc.service)-tg", '--query', 'TargetGroups[0].TargetGroupArn', '--output', 'text', '--region', $AwsRegion)
    if ($securityGroupId -eq 'None' -or $targetGroupArn -eq 'None' -or -not $securityGroupId -or -not $targetGroupArn) {
        throw "Service '$($svc.service)' is missing security group '$securityGroupName' or target group 'frasberg-$($svc.service)-tg'."
    }

    $taskDefinition = $svc.taskDefinition
    $taskDefinition.executionRoleArn = $executionRoleArn
    $taskDefinition.taskRoleArn = $taskRoleArn
    $taskPayload = ($taskDefinition | ConvertTo-Json -Depth 20 -Compress)

    if ($DryRun) {
        Write-Host "[dry-run] $($svc.service): vpc=$vpcId subnets=$subnetIds securityGroup=$securityGroupId targetGroup=$targetGroupArn"
        continue
    }

    aws ecs register-task-definition --region $AwsRegion --family $taskFamily --network-mode awsvpc --requires-compatibilities FARGATE --cpu 256 --memory 512 --execution-role-arn $executionRoleArn --task-role-arn $taskRoleArn --container-definitions $taskPayload | Out-Null

    $serviceExists = Invoke-AwsText @('ecs', 'describe-services', '--region', $AwsRegion, '--cluster', $ClusterName, '--services', $serviceName, '--query', 'services[0].serviceName', '--output', 'text')
    if (-not $serviceExists -or $serviceExists -eq 'None') {
        aws ecs create-service --region $AwsRegion --cluster $ClusterName --service-name $serviceName --task-definition $taskFamily --desired-count 2 --launch-type FARGATE --network-configuration "awsvpcConfiguration={subnets=[$subnetAId,$subnetBId],securityGroups=[$securityGroupId],assignPublicIp=DISABLED}" --load-balancers "targetGroupArn=$targetGroupArn,containerName=$containerName,containerPort=4001" | Out-Null
    }
    else {
        aws ecs update-service --region $AwsRegion --cluster $ClusterName --service $serviceName --task-definition $taskFamily --desired-count 2 | Out-Null
    }
}

Write-Host "Frasberg ECS mesh deployment request completed for $ClusterName."
