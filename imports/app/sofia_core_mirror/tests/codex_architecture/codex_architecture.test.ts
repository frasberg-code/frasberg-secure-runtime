/**
 * Apex Validation Suite - Codex Architecture Tests
 * 
 * Comprehensive test suite for:
 * - Engine registration
 * - Routing correctness
 * - Fallback correctness
 * - Profiling accuracy
 */

import { BeamEngine } from '../../src/engines/beam-engine';
import { FieldBeamEngine } from '../../src/engines/field-beam-engine';
import { BeamFieldRouter } from '../../src/orchestration/beam-field-router';
import { DominionFallback } from '../../src/orchestration/dominion-fallback';
import { ContinuumPipeline } from '../../src/pipeline/continuum-pipeline';
import horizonConfig from '../../config/horizon.json';

describe('Apex Validation Suite - Engine Registration', () => {
  describe('BeamEngine', () => {
    test('should create a BeamEngine with valid capability', () => {
      const engine = new BeamEngine('test-capability');
      expect(engine).toBeDefined();
      expect(engine.getCapability()).toBe('test-capability');
    });

    test('should throw error for invalid capability', () => {
      expect(() => new BeamEngine('')).toThrow('BeamEngine requires a valid capability string');
    });

    test('should execute and return correct result', async () => {
      const engine = new BeamEngine('data-processing');
      const context = { data: 'test' };
      
      const result = await engine.execute(context);
      
      expect(result).toBeDefined();
      expect(result.capability).toBe('data-processing');
      expect(result.context).toEqual(context);
      expect(result.result).toBe('beam-executed');
      expect(result.direction).toBe('forward');
      expect(result.timestamp).toBeGreaterThan(0);
    });

    test('should track execution count', async () => {
      const engine = new BeamEngine('test');
      
      await engine.execute({});
      await engine.execute({});
      await engine.execute({});
      
      const stats = engine.getStats();
      expect(stats.executionCount).toBe(3);
      expect(stats.capability).toBe('test');
    });

    test('should reset execution count', async () => {
      const engine = new BeamEngine('test');
      
      await engine.execute({});
      await engine.execute({});
      
      engine.reset();
      
      const stats = engine.getStats();
      expect(stats.executionCount).toBe(0);
    });
  });

  describe('FieldBeamEngine', () => {
    test('should create a FieldBeamEngine with default config', () => {
      const engine = new FieldBeamEngine();
      const stats = engine.getStats();
      
      expect(stats.config.maxRetries).toBe(3);
      expect(stats.config.retryDelay).toBe(100);
      expect(stats.config.fieldStrength).toBe(1.0);
    });

    test('should create with custom config', () => {
      const engine = new FieldBeamEngine({
        maxRetries: 5,
        retryDelay: 200,
        fieldStrength: 0.8
      });
      
      const stats = engine.getStats();
      expect(stats.config.maxRetries).toBe(5);
      expect(stats.config.retryDelay).toBe(200);
      expect(stats.config.fieldStrength).toBe(0.8);
    });

    test('should throw error for invalid field strength', () => {
      expect(() => new FieldBeamEngine({ fieldStrength: 1.5 }))
        .toThrow('fieldStrength must be between 0 and 1');
      expect(() => new FieldBeamEngine({ fieldStrength: -0.1 }))
        .toThrow('fieldStrength must be between 0 and 1');
    });

    test('should set and get anchor point', () => {
      const engine = new FieldBeamEngine();
      const anchor = { x: 100, y: 200 };
      
      engine.setAnchor(anchor);
      
      expect(engine.getAnchor()).toEqual(anchor);
      expect(engine.getStats().anchored).toBe(true);
    });

    test('should execute successfully on first attempt', async () => {
      const engine = new FieldBeamEngine();
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await engine.executeWithRetry(operation);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.attempts).toBe(1);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    test('should retry on failure and eventually succeed', async () => {
      const engine = new FieldBeamEngine({ maxRetries: 3, retryDelay: 10 });
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');
      
      const result = await engine.executeWithRetry(operation);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.attempts).toBe(3);
      expect(operation).toHaveBeenCalledTimes(3);
    });

    test('should exhaust retries and return failure', async () => {
      const engine = new FieldBeamEngine({ maxRetries: 2, retryDelay: 10 });
      const operation = jest.fn().mockRejectedValue(new Error('permanent failure'));
      
      const result = await engine.executeWithRetry(operation);
      
      expect(result.success).toBe(false);
      expect(result.data.error).toBe('permanent failure');
      expect(result.attempts).toBe(3); // initial + 2 retries
      expect(operation).toHaveBeenCalledTimes(3);
    });

    test('should reset engine state', () => {
      const engine = new FieldBeamEngine();
      engine.setAnchor({ test: true });
      
      engine.reset();
      
      const stats = engine.getStats();
      expect(stats.anchored).toBe(false);
      expect(stats.executionCount).toBe(0);
    });
  });
});

describe('Apex Validation Suite - Routing Correctness', () => {
  let router: BeamFieldRouter;

  beforeEach(() => {
    router = new BeamFieldRouter();
  });

  test('should register a routing rule', () => {
    router.registerRoute({
      world: 'alpha',
      profile: 'development',
      engineType: 'beam',
      priority: 10
    });

    const routes = router.getRoutes();
    expect(routes).toHaveLength(1);
    expect(routes[0].engineType).toBe('beam');
  });

  test('should route to correct engine based on environment', () => {
    router.registerRoute({
      world: 'alpha',
      profile: 'development',
      engineType: 'beam',
      priority: 10
    });

    const result = router.route({
      world: 'alpha',
      profile: 'development'
    });

    expect(result.engineType).toBe('beam');
    expect(result.route.world).toBe('alpha');
    expect(result.route.profile).toBe('development');
  });

  test('should use default routing when no rule matches', () => {
    const result = router.route({
      world: 'unknown',
      profile: 'development'
    });

    expect(result.engineType).toBe('beam'); // default for non-production
  });

  test('should use fieldbeam for production by default', () => {
    const result = router.route({
      world: 'prod',
      profile: 'production'
    });

    expect(result.engineType).toBe('fieldbeam');
  });

  test('should prioritize higher priority rules', () => {
    router.registerRoute({
      world: 'alpha',
      profile: 'testing',
      engineType: 'beam',
      priority: 10
    });

    router.registerRoute({
      world: 'alpha',
      profile: 'testing',
      engineType: 'fieldbeam',
      priority: 20
    });

    const result = router.route({
      world: 'alpha',
      profile: 'testing'
    });

    expect(result.engineType).toBe('fieldbeam'); // higher priority
    expect(result.route.priority).toBe(20);
  });

  test('should track routing statistics', () => {
    router.registerRoute({
      world: 'alpha',
      profile: 'development',
      engineType: 'beam',
      priority: 10
    });

    router.route({ world: 'alpha', profile: 'development' });
    router.route({ world: 'alpha', profile: 'development' });
    router.route({ world: 'beta', profile: 'production' });

    const stats = router.getRoutingStats();
    expect(stats.totalRoutings).toBe(3);
    expect(stats.routesByEngine.beam).toBe(2);
    expect(stats.routesByEngine.fieldbeam).toBe(1);
  });

  test('should load routes from horizon config', () => {
    // Load routes from horizon config
    for (const world of horizonConfig.worlds) {
      for (const profile of world.profiles) {
        router.registerRoute({
          world: world.name,
          profile: profile.name,
          engineType: profile.engineType as 'beam' | 'fieldbeam',
          priority: profile.priority
        });
      }
    }

    const routes = router.getRoutes();
    expect(routes.length).toBeGreaterThan(0);

    // Test alpha development routing
    const devResult = router.route({
      world: 'alpha',
      profile: 'development'
    });
    expect(devResult.engineType).toBe('beam');

    // Test production routing
    const prodResult = router.route({
      world: 'production',
      profile: 'production'
    });
    expect(prodResult.engineType).toBe('fieldbeam');
  });
});

describe('Apex Validation Suite - Fallback Correctness', () => {
  let fallback: DominionFallback;

  beforeEach(() => {
    fallback = new DominionFallback();
  });

  test('should create fallback with default authority level', () => {
    expect(fallback.getAuthorityLevel()).toBe(1.0);
  });

  test('should create fallback with custom authority level', () => {
    const fb = new DominionFallback(0.75);
    expect(fb.getAuthorityLevel()).toBe(0.75);
  });

  test('should throw error for invalid authority level', () => {
    expect(() => new DominionFallback(1.5)).toThrow('authorityLevel must be between 0 and 1');
    expect(() => new DominionFallback(-0.1)).toThrow('authorityLevel must be between 0 and 1');
  });

  test('should register fallback strategy', () => {
    fallback.registerStrategy({
      name: 'retry',
      priority: 10,
      handler: async (ctx, err) => 'retried'
    });

    const strategies = fallback.getStrategies();
    expect(strategies).toHaveLength(1);
    expect(strategies[0].name).toBe('retry');
  });

  test('should execute first successful strategy', async () => {
    fallback.registerStrategy({
      name: 'strategy1',
      priority: 20,
      handler: async () => 'success from strategy1'
    });

    fallback.registerStrategy({
      name: 'strategy2',
      priority: 10,
      handler: async () => 'success from strategy2'
    });

    const result = await fallback.executeFallback({}, new Error('test error'));

    expect(result.success).toBe(true);
    expect(result.strategyUsed).toBe('strategy1'); // higher priority
    expect(result.result).toBe('success from strategy1');
    expect(result.attemptedStrategies).toContain('strategy1');
  });

  test('should try next strategy if first fails', async () => {
    fallback.registerStrategy({
      name: 'strategy1',
      priority: 20,
      handler: async () => {
        throw new Error('strategy1 failed');
      }
    });

    fallback.registerStrategy({
      name: 'strategy2',
      priority: 10,
      handler: async () => 'success from strategy2'
    });

    const result = await fallback.executeFallback({}, new Error('test error'));

    expect(result.success).toBe(true);
    expect(result.strategyUsed).toBe('strategy2');
    expect(result.attemptedStrategies).toEqual(['strategy1', 'strategy2']);
  });

  test('should fail when all strategies exhausted', async () => {
    fallback.registerStrategy({
      name: 'strategy1',
      priority: 20,
      handler: async () => {
        throw new Error('fail1');
      }
    });

    fallback.registerStrategy({
      name: 'strategy2',
      priority: 10,
      handler: async () => {
        throw new Error('fail2');
      }
    });

    const result = await fallback.executeFallback({}, new Error('primary error'));

    expect(result.success).toBe(false);
    expect(result.strategyUsed).toBeNull();
    expect(result.result.error).toBe('All fallback strategies exhausted');
    expect(result.result.originalError).toBe('primary error');
    expect(result.attemptedStrategies).toEqual(['strategy1', 'strategy2']);
  });

  test('should track fallback statistics', async () => {
    fallback.registerStrategy({
      name: 'strategy1',
      priority: 10,
      handler: async () => 'success'
    });

    await fallback.executeFallback({}, new Error('error1'));
    await fallback.executeFallback({}, new Error('error2'));

    const stats = fallback.getStats();
    expect(stats.totalFallbacks).toBe(2);
    expect(stats.successCount).toBe(2);
    expect(stats.successRate).toBe(1.0);
    expect(stats.strategyUsage['strategy1']).toBe(2);
  });

  test('should load strategies from horizon config', () => {
    for (const strategy of horizonConfig.fallbackStrategies) {
      fallback.registerStrategy({
        name: strategy.name,
        priority: strategy.priority,
        handler: async (ctx, err) => `handled by ${strategy.name}`
      });
    }

    const strategies = fallback.getStrategies();
    expect(strategies.length).toBe(horizonConfig.fallbackStrategies.length);
    
    // Verify highest priority strategy is first
    expect(strategies[0].name).toBe('retry-with-backoff');
  });
});

describe('Apex Validation Suite - Profiling Accuracy', () => {
  describe('ContinuumPipeline', () => {
    let pipeline: ContinuumPipeline;

    beforeEach(() => {
      pipeline = new ContinuumPipeline();
    });

    test('should create pipeline with auto-renewal enabled', () => {
      const stats = pipeline.getStats();
      expect(stats.autoRenewal).toBe(true);
    });

    test('should add stages to pipeline', () => {
      pipeline.addStage({
        name: 'stage1',
        handler: async (data) => data
      });

      pipeline.addStage({
        name: 'stage2',
        handler: async (data) => data
      });

      const stages = pipeline.getStages();
      expect(stages).toHaveLength(2);
    });

    test('should execute pipeline stages in order', async () => {
      const executionOrder: string[] = [];

      pipeline.addStage({
        name: 'stage1',
        handler: async (data) => {
          executionOrder.push('stage1');
          return { ...data, stage1: true };
        }
      });

      pipeline.addStage({
        name: 'stage2',
        handler: async (data) => {
          executionOrder.push('stage2');
          return { ...data, stage2: true };
        }
      });

      const result = await pipeline.execute({ initial: true });

      expect(result.success).toBe(true);
      expect(executionOrder).toEqual(['stage1', 'stage2']);
      expect(result.stagesExecuted).toEqual(['stage1', 'stage2']);
      expect(result.data.stage1).toBe(true);
      expect(result.data.stage2).toBe(true);
    });

    test('should handle stage failure', async () => {
      pipeline.addStage({
        name: 'stage1',
        handler: async (data) => data
      });

      pipeline.addStage({
        name: 'failing-stage',
        handler: async () => {
          throw new Error('stage failure');
        }
      });

      pipeline.addStage({
        name: 'stage3',
        handler: async (data) => data
      });

      const result = await pipeline.execute({ test: true });

      expect(result.success).toBe(false);
      expect(result.data.error).toBe('stage failure');
      expect(result.stagesExecuted).toEqual(['stage1', 'failing-stage']);
    });

    test('should track pipeline statistics', async () => {
      pipeline.addStage({
        name: 'stage1',
        handler: async (data) => data
      });

      await pipeline.execute({ test: 1 });
      await pipeline.execute({ test: 2 });
      await pipeline.execute({ test: 3 });

      const stats = pipeline.getStats();
      expect(stats.totalExecutions).toBe(3);
      expect(stats.successCount).toBe(3);
      expect(stats.failureCount).toBe(0);
      expect(stats.successRate).toBe(1.0);
    });

    test('should support manual renewal', async () => {
      pipeline.addStage({
        name: 'stage1',
        handler: async (data) => data
      });

      await pipeline.execute({});
      
      const statsBefore = pipeline.getStats();
      expect(statsBefore.renewalCount).toBe(0);

      await pipeline.renew();

      const statsAfter = pipeline.getStats();
      expect(statsAfter.renewalCount).toBe(1);
    });

    test('should configure from horizon config', () => {
      const config = horizonConfig.pipelineConfig;
      
      pipeline.setAutoRenewal(config.autoRenewal);
      
      const stats = pipeline.getStats();
      expect(stats.autoRenewal).toBe(config.autoRenewal);
    });
  });

  describe('Integration - Complete Flow', () => {
    test('should route, execute with fallback if needed', async () => {
      const router = new BeamFieldRouter();
      const fallback = new DominionFallback();
      const pipeline = new ContinuumPipeline();

      // Setup routing
      router.registerRoute({
        world: 'alpha',
        profile: 'development',
        engineType: 'beam',
        priority: 10
      });

      // Setup fallback
      fallback.registerStrategy({
        name: 'use-cached',
        priority: 10,
        handler: async () => ({ cached: true })
      });

      // Setup pipeline
      pipeline.addStage({
        name: 'route-stage',
        handler: async (data) => {
          const routeResult = router.route({ world: 'alpha', profile: 'development' });
          return { ...data, route: routeResult };
        }
      });

      pipeline.addStage({
        name: 'execute-stage',
        handler: async (data) => {
          if (data.route.engineType === 'beam') {
            const engine = new BeamEngine('test');
            const result = await engine.execute(data);
            return { ...data, execution: result };
          }
          return data;
        }
      });

      const result = await pipeline.execute({ test: true });

      expect(result.success).toBe(true);
      expect(result.data.route).toBeDefined();
      expect(result.data.route.engineType).toBe('beam');
      expect(result.data.execution).toBeDefined();
      expect(result.data.execution.result).toBe('beam-executed');
    });
  });
});
