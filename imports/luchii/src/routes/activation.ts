// Activation Control Routes - Master Orchestrator
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import {
  initializeAutonomousCloud,
  activateAutonomousLifecycle,
  enableGovernanceAndSafety,
  getActivationStatus,
} from '../services/lifecycleActivation';
import { verifyControlPlaneWiring, getControlPlaneStatus } from '../services/controlPlaneWiring';
import { getReadinessChecklist, getReadinessStatus, updateChecklistItem } from '../services/readinessChecklist';
import { getDeploymentPlan, deployRegion, getDeploymentStatus, scaleTenantsInRegion } from '../services/regionDeployment';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// === ACTIVATION PHASE ===

router.post(
  '/initialize',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const result = await initializeAutonomousCloud();
    res.json({
      message: '🚀 Initializing Global Control Plane...',
      ...result,
    });
  })
);

router.post(
  '/activate-lifecycle',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const result = await activateAutonomousLifecycle();
    res.json({
      message: '🔥 Autonomous Lifecycle Activated!',
      ...result,
    });
  })
);

router.post(
  '/enable-governance',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const result = await enableGovernanceAndSafety();
    res.json({
      message: '🛡️ Governance & Safety Enabled!',
      ...result,
    });
  })
);

router.get(
  '/status',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const status = await getActivationStatus();
    res.json({ activationStatus: status });
  })
);

// === CONTROL PLANE WIRING ===

router.post(
  '/wire-control-plane',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const wiring = await verifyControlPlaneWiring();
    res.json({
      message: 'Control Plane Wiring Verified',
      components: wiring,
    });
  })
);

router.get(
  '/control-plane-status',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const status = await getControlPlaneStatus();
    res.json(status);
  })
);

// === READINESS CHECKLIST ===

router.get(
  '/readiness-checklist',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const checklist = await getReadinessChecklist();
    res.json({ checklist });
  })
);

router.post(
  '/readiness-check/:item',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const result = await updateChecklistItem(req.params.item, req.body.status);
    res.json(result);
  })
);

router.get(
  '/readiness-status',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const status = await getReadinessStatus();
    res.json(status);
  })
);

// === REGION DEPLOYMENT ===

router.get(
  '/deployment-plan',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const plan = await getDeploymentPlan();
    res.json({ deploymentPlan: plan });
  })
);

router.post(
  '/deploy-region/:region',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const result = await deployRegion(req.params.region);
    res.json({
      message: `Region ${req.params.region} deployed`,
      deployment: result,
    });
  })
);

router.get(
  '/deployment-status',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const status = await getDeploymentStatus();
    res.json(status);
  })
);

router.post(
  '/scale-region/:region',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const result = await scaleTenantsInRegion(req.params.region, req.body.count);
    res.json({
      message: `Scaled ${req.body.count} tenants in ${req.params.region}`,
      deployment: result,
    });
  })
);

// === MASTER ACTIVATION ===

router.post(
  '/full-activation',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    console.log('🚀🚀🚀 FULL AUTONOMOUS CLOUD ACTIVATION SEQUENCE 🚀🚀🚀');

    // Step 1: Initialize
    console.log('STEP 1: Initializing...');
    await initializeAutonomousCloud();

    // Step 2: Wire control plane
    console.log('STEP 2: Wiring Global Control Plane...');
    await verifyControlPlaneWiring();

    // Step 3: Activate lifecycle
    console.log('STEP 3: Activating Autonomous Lifecycle...');
    await activateAutonomousLifecycle();

    // Step 4: Enable governance
    console.log('STEP 4: Enabling Governance & Safety...');
    await enableGovernanceAndSafety();

    // Step 5: Check readiness
    console.log('STEP 5: Checking Rollout Readiness...');
    const readiness = await getReadinessStatus();

    if (!readiness.readyForProduction) {
      return res.status(400).json({
        error: 'Not ready for production',
        readiness,
      });
    }

    // Step 6: Deploy core regions
    console.log('STEP 6: Deploying Core Regions...');
    await deployRegion('us-west');
    await deployRegion('us-east');
    await deployRegion('eu-central');

    console.log('✅ FULL ACTIVATION COMPLETE');
    console.log('🌍 Frasberg Autonomous Cloud is now LIVE');

    res.json({
      status: 'ACTIVATED',
      message: 'Frasberg Autonomous Cloud is now operating autonomously',
      readiness,
      deployment: await getDeploymentStatus(),
      nextSteps: [
        'Monitor control plane dashboard',
        'Review ACO health',
        'Track federation metrics',
        'Begin customer onboarding',
      ],
    });
  })
);

export default router;
