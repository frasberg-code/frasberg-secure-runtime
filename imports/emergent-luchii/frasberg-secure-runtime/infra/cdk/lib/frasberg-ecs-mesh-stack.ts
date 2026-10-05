import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';

const SERVICES = [
  'auth', 'compute', 'core', 'data', 'queue', 'cache', 'search', 'events', 'notify',
  'billing', 'identity', 'profile', 'preferences', 'sessions', 'state', 'presence',
  'activity', 'history', 'timeline', 'feed', 'stream', 'sync', 'merge', 'aggregate',
  'reduce', 'fold', 'compress', 'pack', 'bundle', 'wrap', 'seal', 'finalize',
  'deliver', 'dispatch', 'route', 'relay', 'transmit', 'broadcast', 'multicast',
  'fanout', 'spread', 'diffuse', 'propagate', 'radiate', 'beam', 'pulse', 'wave',
  'ripple', 'echo', 'resonate', 'amplify', 'boost', 'surge', 'flare', 'flash',
] as const;

export class FrasbergEcsMeshStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, 'FrasbergVpc', {
      vpcName: 'frasberg-vpc',
    });

    const privateSubnets = vpc.selectSubnets({
      subnetGroupName: 'private-compute',
    }).subnets;

    const cluster = ecs.Cluster.fromClusterAttributes(this, 'Cluster', {
      clusterName: 'frasberg-secure-runtime-cluster',
      vpc,
      securityGroups: [],
    });

    const ecsExecutionRole = iam.Role.fromRoleName(
      this,
      'EcsExecutionRole',
      'ecsTaskExecutionRole',
    );

    const frasbergRuntimeRole = iam.Role.fromRoleName(
      this,
      'FrasbergRuntimeRole',
      'frasberg-runtime-role',
    );

    for (const service of SERVICES) {
      const sg = new ec2.SecurityGroup(this, `SG-${service}`, {
        vpc,
        description: `Security group for internal ${service} ALB`,
        allowAllOutbound: true,
        securityGroupName: `frasberg-${service}-sg`,
      });

      sg.addIngressRule(
        ec2.Peer.ipv4('10.0.0.0/16'),
        ec2.Port.tcp(80),
        'Allow HTTP from VPC',
      );

      const task = new ecs.FargateTaskDefinition(this, `Task-${service}`, {
        cpu: 256,
        memoryLimitMiB: 512,
        executionRole: ecsExecutionRole,
        taskRole: frasbergRuntimeRole,
      });

      const container = task.addContainer(`Container-${service}`, {
        image: ecs.ContainerImage.fromRegistry(
          'luchii-games/frasberg-secure-runtime:latest',
        ),
        environment: {
          SERVICE_NAME: service,
          SERVICE_URL: `https://${service}.aws.frasberg.com`,
        },
        healthCheck: {
          command: ['CMD-SHELL', 'curl -f http://localhost/health || exit 1'],
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          retries: 3,
          startPeriod: cdk.Duration.seconds(10),
        },
        logging: ecs.LogDrivers.awsLogs({
          streamPrefix: `frasberg-${service}`,
        }),
      });

      container.addPortMappings({ containerPort: 80 });

      const targetGroup = elbv2.ApplicationTargetGroup.fromTargetGroupAttributes(
        this,
        `TG-${service}`,
        {
          targetGroupArn: `arn:aws:elasticloadbalancing:us-east-1:<ACCOUNT_ID>:targetgroup/frasberg-${service}-tg/<TG_ID>`,
        },
      );

      new ecs.FargateService(this, `Service-${service}`, {
        cluster,
        taskDefinition: task,
        desiredCount: 2,
        assignPublicIp: false,
        securityGroups: [sg],
        vpcSubnets: { subnets: privateSubnets },
        loadBalancers: [
          {
            targetGroupArn: targetGroup.targetGroupArn,
            containerName: container.containerName,
            containerPort: 80,
          },
        ],
      });
    }
  }
}
