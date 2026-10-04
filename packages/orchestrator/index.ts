import { orchestrateGateway } from './orchestrate-gateway';
import { orchestrateRouter } from './orchestrate-router';
import { orchestrateEngine } from './orchestrate-engine';
import { orchestrateWorldgraph } from './orchestrate-worldgraph';
import { orchestrateJobs } from './orchestrate-jobs';

export function orchestratePlatform() {
  orchestrateGateway();
  orchestrateRouter();
  orchestrateEngine();
  orchestrateWorldgraph();
  orchestrateJobs();
}
