import { randomUUID } from 'node:crypto';
import { EXISTENTIAL_SCORE_MAX, EXISTENTIAL_SCORE_MIN } from './wiring';

export interface GovernancePolicy {
  id: string;
  name: string;
  meaningThreshold: number;
  riskThreshold: number;
  updatedAt: string;
}

export interface CreateGovernancePolicyInput {
  id?: string;
  name: string;
  meaningThreshold: number;
  riskThreshold: number;
}

export interface UpdateGovernancePolicyInput {
  meaningThreshold?: number;
  riskThreshold?: number;
}

export class GovernanceEngine {
  private readonly policies = new Map<string, GovernancePolicy>();

  createPolicy(input: CreateGovernancePolicyInput): GovernancePolicy {
    const id =
      input.id === undefined
        ? randomUUID()
        : readNonEmptyString(input.id, 'id');
    if (this.policies.has(id)) {
      throw new Error(`Policy "${id}" already exists.`);
    }

    const now = new Date().toISOString();
    const policy: GovernancePolicy = {
      id,
      name: readNonEmptyString(input.name, 'name'),
      meaningThreshold: readUnitInterval(
        input.meaningThreshold,
        'meaningThreshold',
      ),
      riskThreshold: readUnitInterval(input.riskThreshold, 'riskThreshold'),
      updatedAt: now,
    };
    this.policies.set(id, policy);
    return copyPolicy(policy);
  }

  getPolicy(id: string): GovernancePolicy | undefined {
    const policy = this.policies.get(readNonEmptyString(id, 'id'));
    return policy ? copyPolicy(policy) : undefined;
  }

  listPolicies(): GovernancePolicy[] {
    return [...this.policies.values()]
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name))
      .map(copyPolicy);
  }

  getPolicyCount(): number {
    return this.policies.size;
  }

  updatePolicy(
    id: string,
    updates: UpdateGovernancePolicyInput,
  ): GovernancePolicy {
    const normalizedId = readNonEmptyString(id, 'id');
    const current = this.policies.get(normalizedId);
    if (!current) {
      throw new Error(`Policy "${normalizedId}" does not exist.`);
    }

    if (
      updates.meaningThreshold === undefined &&
      updates.riskThreshold === undefined
    ) {
      throw new Error('At least one threshold update is required.');
    }

    const next: GovernancePolicy = {
      ...current,
      meaningThreshold:
        updates.meaningThreshold === undefined
          ? current.meaningThreshold
          : readUnitInterval(updates.meaningThreshold, 'meaningThreshold'),
      riskThreshold:
        updates.riskThreshold === undefined
          ? current.riskThreshold
          : readUnitInterval(updates.riskThreshold, 'riskThreshold'),
      updatedAt: new Date().toISOString(),
    };
    this.policies.set(normalizedId, next);
    return copyPolicy(next);
  }
}

function copyPolicy(policy: GovernancePolicy): GovernancePolicy {
  return {
    ...policy,
  };
}

function readNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }

  return value;
}

function readUnitInterval(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number.`);
  }

  if (value < EXISTENTIAL_SCORE_MIN || value > EXISTENTIAL_SCORE_MAX) {
    throw new Error(
      `${label} must be between ${EXISTENTIAL_SCORE_MIN} and ${EXISTENTIAL_SCORE_MAX}.`,
    );
  }

  return value;
}
