// Comprehensive Onboarding Service with All Steps
import { query } from '../db/client';
import { createTenant } from './tenants';
import { setTenantTier } from './tiers';
import { v4 as uuidv4 } from 'uuid';

export interface OnboardingStep {
  step: number;
  name: string;
  required: boolean;
  fields: Record<string, any>;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    step: 1,
    name: 'Create Tenant',
    required: true,
    fields: { name: 'string', email: 'string', company: 'string' },
  },
  {
    step: 2,
    name: 'Select Region',
    required: true,
    fields: { region: 'enum', dataResidency: 'string' },
  },
  {
    step: 3,
    name: 'Choose Autonomy Tier',
    required: true,
    fields: { tier: 'enum', startDate: 'date' },
  },
  {
    step: 4,
    name: 'Configure Policies',
    required: false,
    fields: { costTarget: 'number', performanceTarget: 'number', customPolicies: 'json' },
  },
  {
    step: 5,
    name: 'Configure Safety',
    required: false,
    fields: {
      safetyLevel: 'enum',
      maxConcurrent: 'number',
      failsafeThreshold: 'number',
    },
  },
  {
    step: 6,
    name: 'Configure Compliance',
    required: false,
    fields: { complianceBundle: 'enum', certifications: 'array' },
  },
  {
    step: 7,
    name: 'Configure SLA',
    required: false,
    fields: { slaProfile: 'enum', supportLevel: 'enum' },
  },
  {
    step: 8,
    name: 'Configure Federation',
    required: false,
    fields: { federationEnabled: 'boolean', federationRules: 'json' },
  },
  {
    step: 9,
    name: 'Launch Activation',
    required: true,
    fields: { activate: 'boolean', acceptTerms: 'boolean' },
  },
];

export async function getOnboardingSteps() {
  return ONBOARDING_STEPS;
}

export async function completeStep(
  tenantId: string,
  step: number,
  data: Record<string, any>
) {
  const onboardingStep = ONBOARDING_STEPS.find((s) => s.step === step);
  if (!onboardingStep) {
    throw new Error(`Invalid step: ${step}`);
  }

  // Store step completion
  await query(
    `INSERT INTO audit_logs (tenant_id, action, actor, resource, changes)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      tenantId,
      `onboarding_step_${step}_complete`,
      'tenant',
      tenantId,
      JSON.stringify({ step: onboardingStep.name, data }),
    ]
  );

  return {
    step,
    name: onboardingStep.name,
    completed: true,
    nextStep: step < ONBOARDING_STEPS.length ? step + 1 : null,
  };
}

export async function getOnboardingProgress(tenantId: string) {
  const result = await query(
    `SELECT action FROM audit_logs
     WHERE tenant_id = $1 AND action LIKE 'onboarding_step%'
     ORDER BY created_at DESC`,
    [tenantId]
  );

  const completedSteps = new Set<number>();
  result.rows.forEach((row) => {
    const match = row.action.match(/onboarding_step_(\d+)/);
    if (match) {
      completedSteps.add(parseInt(match[1]));
    }
  });

  const progress = ONBOARDING_STEPS.map((step) => ({
    ...step,
    completed: completedSteps.has(step.step),
  }));

  return {
    tenantId,
    currentStep: Math.max(...Array.from(completedSteps)) + 1 || 1,
    completedSteps: completedSteps.size,
    totalSteps: ONBOARDING_STEPS.length,
    progress,
  };
}

export async function launchActivation(tenantId: string) {
  // Verify all required steps completed
  const progress = await getOnboardingProgress(tenantId);
  const requiredSteps = ONBOARDING_STEPS.filter((s) => s.required);

  const allRequired = requiredSteps.every((s) => progress.progress.some((p) => p.step === s.step && p.completed));

  if (!allRequired) {
    throw new Error('Not all required steps completed');
  }

  // Mark as activated
  await query(
    `UPDATE tenants SET metadata = jsonb_set(metadata, '{activated}', 'true') WHERE id = $1`,
    [tenantId]
  );

  return {
    tenantId,
    activated: true,
    timestamp: new Date(),
    message: 'Autonomous Cloud activation complete!',
  };
}
