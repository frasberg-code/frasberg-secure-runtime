// Rollout Readiness Checklist - Gate to Production
import { query } from '../db/client';

export interface ReadinessItem {
  category: string;
  item: string;
  required: boolean;
  status: 'pending' | 'checking' | 'pass' | 'fail';
  lastChecked?: Date;
}

export const ROLLOUT_READINESS_CHECKLIST: ReadinessItem[] = [
  // Platform
  { category: 'platform', item: 'Multi-region runtime healthy', required: true, status: 'pending' },
  { category: 'platform', item: 'Fusion loop stable under load', required: true, status: 'pending' },
  { category: 'platform', item: 'Recovery/drift/calibration loops active', required: true, status: 'pending' },

  // Governance & Safety
  { category: 'governance', item: 'Global policies validated', required: true, status: 'pending' },
  { category: 'governance', item: 'Safety envelope tuned', required: true, status: 'pending' },
  { category: 'governance', item: 'ACO process defined and staffed', required: true, status: 'pending' },
  { category: 'governance', item: 'Audit & certification pipelines passing', required: true, status: 'pending' },

  // Commercial & Billing
  { category: 'commercial', item: 'Tiers configured (Basic-Ultra)', required: true, status: 'pending' },
  { category: 'commercial', item: 'Billing events tracked and summarized', required: true, status: 'pending' },
  { category: 'commercial', item: 'Pricing mapped to tiers and usage', required: true, status: 'pending' },

  // Compliance & SLA
  { category: 'compliance', item: 'SLA profiles defined per tier', required: true, status: 'pending' },
  { category: 'compliance', item: 'Compliance bundles documented', required: true, status: 'pending' },
  { category: 'compliance', item: 'Legal review completed', required: true, status: 'pending' },

  // Experience
  { category: 'experience', item: 'Onboarding flow tested end-to-end', required: true, status: 'pending' },
  { category: 'experience', item: 'Marketing site live (staging)', required: true, status: 'pending' },
  { category: 'experience', item: 'Docs generator sections complete', required: true, status: 'pending' },
  { category: 'experience', item: 'Status page live and monitored', required: true, status: 'pending' },

  // Ecosystem
  { category: 'ecosystem', item: 'Partner program structure defined', required: false, status: 'pending' },
  { category: 'ecosystem', item: 'Initial partners onboarded', required: false, status: 'pending' },
  { category: 'ecosystem', item: 'Integrations validated', required: false, status: 'pending' },

  // Launch
  { category: 'launch', item: 'Keynote script finalized', required: true, status: 'pending' },
  { category: 'launch', item: 'Launch site content ready', required: true, status: 'pending' },
  { category: 'launch', item: 'Press kit assembled', required: true, status: 'pending' },
  { category: 'launch', item: 'Support & ops runbooks ready', required: true, status: 'pending' },
];

export async function getReadinessChecklist() {
  return ROLLOUT_READINESS_CHECKLIST;
}

export async function updateChecklistItem(item: string, status: 'pass' | 'fail') {
  const checkItem = ROLLOUT_READINESS_CHECKLIST.find((i) => i.item === item);
  if (checkItem) {
    checkItem.status = status;
    checkItem.lastChecked = new Date();
  }

  await query(
    `INSERT INTO audit_logs (tenant_id, action, actor, resource, changes)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      null,
      `readiness_check_${status}`,
      'system',
      item,
      JSON.stringify({ timestamp: new Date() }),
    ]
  );

  return checkItem;
}

export async function getReadinessStatus() {
  const total = ROLLOUT_READINESS_CHECKLIST.length;
  const passed = ROLLOUT_READINESS_CHECKLIST.filter((i) => i.status === 'pass').length;
  const failed = ROLLOUT_READINESS_CHECKLIST.filter((i) => i.status === 'fail').length;
  const required = ROLLOUT_READINESS_CHECKLIST.filter((i) => i.required).length;
  const requiredPassed = ROLLOUT_READINESS_CHECKLIST.filter(
    (i) => i.required && i.status === 'pass'
  ).length;

  const readyForProduction = requiredPassed === required && failed === 0;

  return {
    total,
    passed,
    failed,
    percentComplete: Math.round((passed / total) * 100),
    requiredItems: required,
    requiredPassed,
    readyForProduction,
    status: readyForProduction ? 'GO' : 'NO GO',
  };
}
