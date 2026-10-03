import fs from 'node:fs';
import path from 'node:path';

const services = [
  'auth', 'compute', 'core', 'data', 'queue', 'cache', 'search', 'events', 'notify',
  'billing', 'identity', 'profile', 'preferences', 'sessions', 'state', 'presence',
  'activity', 'history', 'timeline', 'feed', 'stream', 'sync', 'merge', 'aggregate',
  'reduce', 'fold', 'compress', 'pack', 'bundle', 'wrap', 'seal', 'finalize',
  'deliver', 'dispatch', 'route', 'relay', 'transmit', 'broadcast', 'multicast',
  'fanout', 'spread', 'diffuse', 'propagate', 'radiate', 'beam', 'pulse', 'wave',
  'ripple', 'echo', 'resonate', 'amplify', 'boost', 'surge', 'flare', 'flash',
];

const clusterName = 'frasberg-secure-runtime-cluster';
const vpcName = 'frasberg-vpc';
const privateSubnets = ['private-compute-a', 'private-compute-b'];
const awsRegion = process.env.AWS_REGION ?? 'us-east-1';
const accountId = process.env.AWS_ACCOUNT_ID ?? '<ACCOUNT_ID>';
const containerImage =
  process.env.CONTAINER_IMAGE ??
  `${accountId}.dkr.ecr.${awsRegion}.amazonaws.com/frasberg-secure-runtime:latest`;
const containerPort = 4001;

const manifest = {
  cluster: clusterName,
  vpcName,
  privateSubnets,
  services: services.map((service) => ({
    service,
    taskFamily: `frasberg-${service}-task`,
    serviceName: `frasberg-${service}-service`,
    securityGroup: `frasberg-${service}-sg`,
    targetGroup: `frasberg-${service}-tg`,
    containerName: `frasberg-${service}-container`,
    desiredCount: 2,
    taskDefinition: {
      family: `frasberg-${service}-task`,
      networkMode: 'awsvpc',
      requiresCompatibilities: ['FARGATE'],
      cpu: '256',
      memory: '512',
      executionRoleArn: `arn:aws:iam::${accountId}:role/ecsTaskExecutionRole`,
      taskRoleArn: `arn:aws:iam::${accountId}:role/frasberg-runtime-role`,
      containerDefinitions: [
        {
          name: `frasberg-${service}-container`,
          image: containerImage,
          essential: true,
          portMappings: [{ containerPort, protocol: 'tcp' }],
          environment: [
            { name: 'SERVICE_NAME', value: service },
            { name: 'SERVICE_URL', value: `https://${service}.aws.frasberg.com` },
            { name: 'RUNTIME_ROUTER_HOST', value: '0.0.0.0' },
          ],
          healthCheck: {
            command: [
              'CMD-SHELL',
              `node -e "fetch('http://localhost:${containerPort}/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"`,
            ],
            interval: 30,
            timeout: 5,
            retries: 3,
            startPeriod: 10,
          },
        },
      ],
    },
    serviceDefinition: {
      serviceName: `frasberg-${service}-service`,
      cluster: clusterName,
      launchType: 'FARGATE',
      desiredCount: 2,
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets: privateSubnets,
          securityGroups: [`frasberg-${service}-sg`],
          assignPublicIp: 'DISABLED',
        },
      },
      loadBalancers: [
        {
          targetGroupArn: `arn:aws:elasticloadbalancing:${awsRegion}:${accountId}:targetgroup/frasberg-${service}-tg/<TG_ID>`,
          containerName: `frasberg-${service}-container`,
          containerPort,
        },
      ],
      deploymentConfiguration: {
        maximumPercent: 200,
        minimumHealthyPercent: 100,
      },
    },
  })),
};

const outputDir = path.resolve(process.cwd(), 'manifests');
fs.mkdirSync(outputDir, { recursive: true });
const outputPath = path.join(outputDir, 'frasberg-ecs-mesh.json');
fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${manifest.services.length} ECS service definitions to ${outputPath}`);
