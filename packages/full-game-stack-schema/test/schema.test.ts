import { describe, expect, it } from 'vitest';
import {
  assertSchemaVersionCompatible,
  FULL_GAME_STACK_SCHEMA_VERSION,
  isSchemaVersionCompatible,
  validateWorldDefinition,
  type WorldDefinition,
} from '../src';

describe('full-game-stack schema', () => {
  it('validates and defensively copies nested schema values', () => {
    const input = baseWorldDefinition();
    const validated = validateWorldDefinition(input);

    input.metadata.tags.push('mutated');
    input.scenes[0]?.components[0]?.actions.push({
      id: 'late',
      type: 'mutate',
    });
    (input.scenes[0]?.components[0]?.props as Record<string, unknown>).label =
      'changed';
    (
      (input.scenes[0]?.components[0]?.props as Record<string, unknown>)
        .style as Record<string, unknown>
    ).color = 'blue';
    (
      input.scenes[0]?.components[0]?.actions[0]?.payload as Record<
        string,
        unknown
      >
    ).screen = 'mutated';

    expect(validated.metadata.tags).toEqual(['racing', 'prototype']);
    expect(validated.scenes[0]?.components[0]?.actions).toHaveLength(1);
    expect(validated.scenes[0]?.components[0]?.props).toEqual({
      label: 'Start race',
      style: { color: 'red' },
    });
    expect(validated.scenes[0]?.components[0]?.actions[0]?.payload).toEqual({
      screen: 'page-1',
      params: { source: 'menu' },
    });
  });

  it('rejects invalid nested data with labeled errors', () => {
    const input = baseWorldDefinition();
    input.routes[0]!.targetKind = 'invalid' as never;

    expect(() => validateWorldDefinition(input)).toThrow(
      /worldDefinition.routes\[0\]\.targetKind/i,
    );
  });

  it('checks schema compatibility by major version', () => {
    expect(isSchemaVersionCompatible('1.0.0')).toBe(true);
    expect(isSchemaVersionCompatible('1.1.0')).toBe(false);
    expect(isSchemaVersionCompatible('2.0.0')).toBe(false);
    expect(() => assertSchemaVersionCompatible('2.0.0')).toThrow(
      /not compatible/i,
    );
    expect(assertSchemaVersionCompatible(FULL_GAME_STACK_SCHEMA_VERSION)).toBe(
      FULL_GAME_STACK_SCHEMA_VERSION,
    );
  });
});

function baseWorldDefinition(): WorldDefinition {
  return {
    id: 'world-1',
    name: 'GT Demo',
    kind: 'game',
    metadata: {
      schemaVersion: FULL_GAME_STACK_SCHEMA_VERSION,
      createdWith: 'phase-1',
      tags: ['racing', 'prototype'],
    },
    scenes: [
      {
        id: 'scene-1',
        name: 'Menu',
        components: [
          {
            id: 'component-1',
            type: 'button',
            props: { label: 'Start race', style: { color: 'red' } },
            children: [],
            actions: [
              {
                id: 'action-1',
                type: 'navigate',
                targetId: 'page-1',
                payload: { screen: 'page-1', params: { source: 'menu' } },
              },
            ],
          },
        ],
        actions: [],
      },
    ],
    pages: [
      {
        id: 'page-1',
        title: 'Landing',
        components: [],
        actions: [],
      },
    ],
    screens: [
      {
        id: 'screen-1',
        title: 'Garage',
        components: [],
        actions: [],
      },
    ],
    flows: [
      {
        id: 'flow-1',
        name: 'Onboarding',
        stepIds: ['screen-1'],
        actions: [],
      },
    ],
    routes: [
      {
        id: 'route-1',
        path: '/',
        targetKind: 'page',
        targetId: 'page-1',
        guards: [],
      },
    ],
    track: {
      id: 'track-1',
      name: 'Trial Mountain',
      lengthMeters: 4200,
      surface: 'asphalt',
      sectors: 3,
    },
    vehicleClasses: [
      {
        id: 'gt3',
        name: 'GT3',
        horsepower: 500,
        drivetrain: 'rwd',
        tags: ['race'],
      },
    ],
    raceRuleset: {
      id: 'rules-1',
      name: 'Sprint',
      lapCount: 5,
      rollingStart: true,
      allowedVehicleClassIds: ['gt3'],
    },
  };
}
