import { EmergentAgentOrchestrator } from './emergentAgentOrchestrator';
import { EmergentAgentRuntime } from './emergentAgentRuntime';
import { recordEmergentJob } from './emergentJobs';
import { computeCost } from './costMetrics';
import { enrichWithIdentityStructure } from './identityStructure';
import { fuseMultimodal } from './multimodalFusionEngine';
import { recordTimelineEvent } from './jobTimeline';
import { selectModel } from './modelSelectionEngine';
import { composeScenes } from './sceneComposer';
import { audit } from './audit';
import { saveRaceState } from './raceStateStore';
import { WorldgraphClient } from './worldgraphClient';

export class EmergentAgentLoop {
  constructor(
    private readonly runtime: EmergentAgentRuntime,
    private readonly worldgraph: WorldgraphClient,
  ) {}

  async execute(request: any) {
    const jobId = `${request.raceConfig.raceId}-${Date.now().toString(36)}`;

    recordTimelineEvent({
      id: `logic-${jobId}-running`,
      jobId,
      type: 'logic',
      status: 'running',
      timestamp: Date.now(),
    });

    const enriched = enrichWithIdentityStructure(
      request,
      request.identity,
      request.structure,
    );

    const orchestrator = new EmergentAgentOrchestrator(this.runtime);
    const result = await orchestrator.handle(enriched, jobId);

    saveRaceState(result.raceState);
    const cost = computeCost(result.enginesUsed);
    const modelChoice = selectModel({
      task: 'video',
      maxCostTier: 3,
      prefersLuchii: true,
    });

    const scenes = composeScenes(result.raceState).filter(
      (scene) =>
        result.enginesUsed.includes(scene.type) ||
        scene.type === 'video',
    );
    const fusion = fuseMultimodal(scenes);

    let worldgraph: unknown = null;
    if (request.worldgraphUpdate) {
      try {
        await this.worldgraph.update(
          request.worldgraphUpdate.id,
          request.worldgraphUpdate.payload,
        );
        worldgraph = await this.worldgraph.get(request.worldgraphUpdate.id);
        recordTimelineEvent({
          id: `worldgraph-${jobId}`,
          jobId,
          type: 'worldgraph',
          status: 'completed',
          timestamp: Date.now(),
        });
      } catch (error) {
        recordTimelineEvent({
          id: `worldgraph-${jobId}`,
          jobId,
          type: 'worldgraph',
          status: 'failed',
          timestamp: Date.now(),
          meta: { error: (error as Error).message },
        });
      }
    }

    const anyFailed = (result.recovered as unknown[]).length > 0;
    recordEmergentJob({
      id: jobId,
      status: anyFailed ? 'completed_with_fallbacks' : 'completed',
      enginesUsed: result.enginesUsed,
      modelChoice,
      cost,
      multimodal: result.multimodal,
    });

    recordTimelineEvent({
      id: `logic-${jobId}-done`,
      jobId,
      type: 'logic',
      status: 'completed',
      timestamp: Date.now(),
      meta: { enginesUsed: result.enginesUsed },
    });

    audit('emergent.job.completed', {
      jobId,
      enginesUsed: result.enginesUsed,
      cost,
    });

    return { ...result, jobId, modelChoice, cost, fusion, worldgraph };
  }
}
