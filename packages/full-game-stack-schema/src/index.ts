export const FULL_GAME_STACK_SCHEMA_VERSION = '1.0.0';

export type WorldDefinitionKind = 'game' | 'app' | 'site';
export type RouteTargetKind = 'scene' | 'page' | 'screen' | 'flow';
export type TrackSurface = 'asphalt' | 'dirt' | 'mixed';
export type VehicleDrivetrain = 'fwd' | 'rwd' | 'awd';

export interface SchemaMetadata {
  schemaVersion: string;
  createdWith?: string;
  tags: string[];
}

export interface ActionDefinition {
  id: string;
  type: string;
  targetId?: string;
  payload?: Record<string, unknown>;
}

export interface ComponentDefinition {
  id: string;
  type: string;
  props: Record<string, unknown>;
  children: ComponentDefinition[];
  actions: ActionDefinition[];
}

export interface SceneDefinition {
  id: string;
  name: string;
  components: ComponentDefinition[];
  actions: ActionDefinition[];
}

export interface PageDefinition {
  id: string;
  title: string;
  components: ComponentDefinition[];
  actions: ActionDefinition[];
}

export interface ScreenDefinition {
  id: string;
  title: string;
  components: ComponentDefinition[];
  actions: ActionDefinition[];
}

export interface FlowDefinition {
  id: string;
  name: string;
  stepIds: string[];
  actions: ActionDefinition[];
}

export interface RouteDefinition {
  id: string;
  path: string;
  targetKind: RouteTargetKind;
  targetId: string;
  guards: string[];
}

export interface TrackDefinition {
  id: string;
  name: string;
  lengthMeters: number;
  surface: TrackSurface;
  sectors: number;
}

export interface VehicleClassDefinition {
  id: string;
  name: string;
  horsepower: number;
  drivetrain: VehicleDrivetrain;
  tags: string[];
}

export interface RaceRuleset {
  id: string;
  name: string;
  lapCount: number;
  rollingStart: boolean;
  allowedVehicleClassIds: string[];
}

export interface WorldDefinition {
  id: string;
  name: string;
  kind: WorldDefinitionKind;
  metadata: SchemaMetadata;
  scenes: SceneDefinition[];
  pages: PageDefinition[];
  screens: ScreenDefinition[];
  flows: FlowDefinition[];
  routes: RouteDefinition[];
  track?: TrackDefinition;
  vehicleClasses: VehicleClassDefinition[];
  raceRuleset?: RaceRuleset;
}

export interface ParsedSchemaVersion {
  major: number;
  minor: number;
  patch: number;
}

export function validateWorldDefinition(
  value: unknown,
  label = 'worldDefinition',
): WorldDefinition {
  const object = readObject(value, label);
  return {
    id: readNonEmptyString(object.id, `${label}.id`),
    name: readNonEmptyString(object.name, `${label}.name`),
    kind: readWorldDefinitionKind(object.kind, `${label}.kind`),
    metadata: validateSchemaMetadata(object.metadata, `${label}.metadata`),
    scenes: readArray(
      object.scenes,
      `${label}.scenes`,
      validateSceneDefinition,
    ),
    pages: readArray(object.pages, `${label}.pages`, validatePageDefinition),
    screens: readArray(
      object.screens,
      `${label}.screens`,
      validateScreenDefinition,
    ),
    flows: readArray(object.flows, `${label}.flows`, validateFlowDefinition),
    routes: readArray(
      object.routes,
      `${label}.routes`,
      validateRouteDefinition,
    ),
    track:
      object.track === undefined
        ? undefined
        : validateTrackDefinition(object.track, `${label}.track`),
    vehicleClasses: readArray(
      object.vehicleClasses,
      `${label}.vehicleClasses`,
      validateVehicleClassDefinition,
    ),
    raceRuleset:
      object.raceRuleset === undefined
        ? undefined
        : validateRaceRuleset(object.raceRuleset, `${label}.raceRuleset`),
  };
}

export function validateSchemaMetadata(
  value: unknown,
  label = 'metadata',
): SchemaMetadata {
  const object = readObject(value, label);
  return {
    schemaVersion: readSchemaVersion(
      object.schemaVersion,
      `${label}.schemaVersion`,
    ),
    createdWith:
      object.createdWith === undefined
        ? undefined
        : readNonEmptyString(object.createdWith, `${label}.createdWith`),
    tags: readStringArray(object.tags, `${label}.tags`),
  };
}

export function validateSceneDefinition(
  value: unknown,
  label = 'sceneDefinition',
): SceneDefinition {
  const object = readObject(value, label);
  return {
    id: readNonEmptyString(object.id, `${label}.id`),
    name: readNonEmptyString(object.name, `${label}.name`),
    components: readArray(
      object.components,
      `${label}.components`,
      validateComponentDefinition,
    ),
    actions: readArray(
      object.actions,
      `${label}.actions`,
      validateActionDefinition,
    ),
  };
}

export function validatePageDefinition(
  value: unknown,
  label = 'pageDefinition',
): PageDefinition {
  const object = readObject(value, label);
  return {
    id: readNonEmptyString(object.id, `${label}.id`),
    title: readNonEmptyString(object.title, `${label}.title`),
    components: readArray(
      object.components,
      `${label}.components`,
      validateComponentDefinition,
    ),
    actions: readArray(
      object.actions,
      `${label}.actions`,
      validateActionDefinition,
    ),
  };
}

export function validateScreenDefinition(
  value: unknown,
  label = 'screenDefinition',
): ScreenDefinition {
  const object = readObject(value, label);
  return {
    id: readNonEmptyString(object.id, `${label}.id`),
    title: readNonEmptyString(object.title, `${label}.title`),
    components: readArray(
      object.components,
      `${label}.components`,
      validateComponentDefinition,
    ),
    actions: readArray(
      object.actions,
      `${label}.actions`,
      validateActionDefinition,
    ),
  };
}

export function validateFlowDefinition(
  value: unknown,
  label = 'flowDefinition',
): FlowDefinition {
  const object = readObject(value, label);
  return {
    id: readNonEmptyString(object.id, `${label}.id`),
    name: readNonEmptyString(object.name, `${label}.name`),
    stepIds: readStringArray(object.stepIds, `${label}.stepIds`),
    actions: readArray(
      object.actions,
      `${label}.actions`,
      validateActionDefinition,
    ),
  };
}

export function validateComponentDefinition(
  value: unknown,
  label = 'componentDefinition',
): ComponentDefinition {
  const object = readObject(value, label);
  return {
    id: readNonEmptyString(object.id, `${label}.id`),
    type: readNonEmptyString(object.type, `${label}.type`),
    props: readRecord(object.props, `${label}.props`),
    children: readArray(
      object.children,
      `${label}.children`,
      validateComponentDefinition,
    ),
    actions: readArray(
      object.actions,
      `${label}.actions`,
      validateActionDefinition,
    ),
  };
}

export function validateActionDefinition(
  value: unknown,
  label = 'actionDefinition',
): ActionDefinition {
  const object = readObject(value, label);
  return {
    id: readNonEmptyString(object.id, `${label}.id`),
    type: readNonEmptyString(object.type, `${label}.type`),
    targetId:
      object.targetId === undefined
        ? undefined
        : readNonEmptyString(object.targetId, `${label}.targetId`),
    payload:
      object.payload === undefined
        ? undefined
        : readRecord(object.payload, `${label}.payload`),
  };
}

export function validateRouteDefinition(
  value: unknown,
  label = 'routeDefinition',
): RouteDefinition {
  const object = readObject(value, label);
  return {
    id: readNonEmptyString(object.id, `${label}.id`),
    path: readNonEmptyString(object.path, `${label}.path`),
    targetKind: readRouteTargetKind(object.targetKind, `${label}.targetKind`),
    targetId: readNonEmptyString(object.targetId, `${label}.targetId`),
    guards: readStringArray(object.guards, `${label}.guards`),
  };
}

export function validateTrackDefinition(
  value: unknown,
  label = 'trackDefinition',
): TrackDefinition {
  const object = readObject(value, label);
  return {
    id: readNonEmptyString(object.id, `${label}.id`),
    name: readNonEmptyString(object.name, `${label}.name`),
    lengthMeters: readNonNegativeNumber(
      object.lengthMeters,
      `${label}.lengthMeters`,
    ),
    surface: readTrackSurface(object.surface, `${label}.surface`),
    sectors: readPositiveInteger(object.sectors, `${label}.sectors`),
  };
}

export function validateVehicleClassDefinition(
  value: unknown,
  label = 'vehicleClassDefinition',
): VehicleClassDefinition {
  const object = readObject(value, label);
  return {
    id: readNonEmptyString(object.id, `${label}.id`),
    name: readNonEmptyString(object.name, `${label}.name`),
    horsepower: readNonNegativeNumber(object.horsepower, `${label}.horsepower`),
    drivetrain: readVehicleDrivetrain(object.drivetrain, `${label}.drivetrain`),
    tags: readStringArray(object.tags, `${label}.tags`),
  };
}

export function validateRaceRuleset(
  value: unknown,
  label = 'raceRuleset',
): RaceRuleset {
  const object = readObject(value, label);
  return {
    id: readNonEmptyString(object.id, `${label}.id`),
    name: readNonEmptyString(object.name, `${label}.name`),
    lapCount: readPositiveInteger(object.lapCount, `${label}.lapCount`),
    rollingStart: readBoolean(object.rollingStart, `${label}.rollingStart`),
    allowedVehicleClassIds: readStringArray(
      object.allowedVehicleClassIds,
      `${label}.allowedVehicleClassIds`,
    ),
  };
}

export function parseSchemaVersion(value: string): ParsedSchemaVersion {
  const normalized = readSchemaVersion(value, 'schemaVersion');
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(normalized);
  if (!match) {
    throw new Error('schemaVersion must use major.minor.patch format.');
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

export function isSchemaVersionCompatible(
  candidate: string,
  supportedVersion = FULL_GAME_STACK_SCHEMA_VERSION,
): boolean {
  const supported = parseSchemaVersion(supportedVersion);
  const requested = parseSchemaVersion(candidate);
  return (
    requested.major === supported.major && requested.minor <= supported.minor
  );
}

export function assertSchemaVersionCompatible(
  candidate: string,
  supportedVersion = FULL_GAME_STACK_SCHEMA_VERSION,
): string {
  if (!isSchemaVersionCompatible(candidate, supportedVersion)) {
    throw new Error(
      `schemaVersion ${candidate} is not compatible with supported version ${supportedVersion}.`,
    );
  }

  return candidate;
}

function readObject(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }

  return value as Record<string, unknown>;
}

function readRecord(value: unknown, label: string): Record<string, unknown> {
  const object = readObject(value, label);
  const cloned = cloneJsonValue(object, label);
  if (!cloned || typeof cloned !== 'object' || Array.isArray(cloned)) {
    throw new Error(`${label} must be an object.`);
  }

  return cloned as Record<string, unknown>;
}

function readNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }

  return value;
}

function readSchemaVersion(value: unknown, label: string): string {
  return readNonEmptyString(value, label);
}

function readStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`);
  }

  return value.map((entry, index) =>
    readNonEmptyString(entry, `${label}[${index}]`),
  );
}

function readArray<T>(
  value: unknown,
  label: string,
  reader: (value: unknown, label: string) => T,
): T[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`);
  }

  return value.map((entry, index) => reader(entry, `${label}[${index}]`));
}

function readWorldDefinitionKind(
  value: unknown,
  label: string,
): WorldDefinitionKind {
  if (value !== 'game' && value !== 'app' && value !== 'site') {
    throw new Error(`${label} must be one of: game, app, site.`);
  }

  return value;
}

function readRouteTargetKind(value: unknown, label: string): RouteTargetKind {
  if (
    value !== 'scene' &&
    value !== 'page' &&
    value !== 'screen' &&
    value !== 'flow'
  ) {
    throw new Error(`${label} must be one of: scene, page, screen, flow.`);
  }

  return value;
}

function readTrackSurface(value: unknown, label: string): TrackSurface {
  if (value !== 'asphalt' && value !== 'dirt' && value !== 'mixed') {
    throw new Error(`${label} must be one of: asphalt, dirt, mixed.`);
  }

  return value;
}

function readVehicleDrivetrain(
  value: unknown,
  label: string,
): VehicleDrivetrain {
  if (value !== 'fwd' && value !== 'rwd' && value !== 'awd') {
    throw new Error(`${label} must be one of: fwd, rwd, awd.`);
  }

  return value;
}

function readNonNegativeNumber(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(
      `${label} must be a finite number greater than or equal to 0.`,
    );
  }

  return value;
}

function readPositiveInteger(value: unknown, label: string): number {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    !Number.isFinite(value) ||
    value < 1
  ) {
    throw new Error(`${label} must be a positive integer.`);
  }

  return value;
}

function readBoolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`${label} must be a boolean.`);
  }

  return value;
}

function cloneJsonValue(value: unknown, label: string): unknown {
  if (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry, index) =>
      cloneJsonValue(entry, `${label}[${index}]`),
    );
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        cloneJsonValue(entry, `${label}.${key}`),
      ]),
    );
  }

  throw new Error(`${label} must contain JSON-like values only.`);
}
