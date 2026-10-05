#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { FrasbergEcsMeshStack } from '../lib/frasberg-ecs-mesh-stack';

const app = new cdk.App();
new FrasbergEcsMeshStack(app, 'FrasbergEcsMeshStack', {
  env: { region: 'us-east-1' },
});
