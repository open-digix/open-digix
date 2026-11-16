export const BUILDER_SCHEMA_VERSION = '1.0' as const;

export type BuilderSchemaVersion = typeof BUILDER_SCHEMA_VERSION;
export type BuilderFieldType =
  'string' | 'integer' | 'date' | 'boolean' | 'enum';
export type BuilderStepType = 'start' | 'task' | 'gateway' | 'end';
export type BuilderEndState = 'approved' | 'rejected';
export type BuilderComparisonOperator = 'eq' | 'lt' | 'gte';
export type BuilderComparisonValue = string | number | boolean;

export interface BuilderFieldDefinition {
  readonly id: string;
  readonly type: BuilderFieldType;
  readonly required: boolean;
  readonly min?: number;
  readonly max?: number;
  readonly options?: readonly string[];
}

export interface BuilderStepDefinition {
  readonly id: string;
  readonly type: BuilderStepType;
  readonly role?: string;
  readonly decisionField?: string;
  readonly endState?: BuilderEndState;
  readonly noSelfApproval?: boolean;
}

export interface BuilderComparison {
  readonly field: string;
  readonly op: BuilderComparisonOperator;
  readonly value: BuilderComparisonValue;
}

export interface BuilderCondition {
  readonly all: readonly BuilderComparison[];
}

export interface BuilderTransitionDefinition {
  readonly from: string;
  readonly to: string;
  readonly when?: BuilderCondition;
}

export interface BuilderApplicationDefinitionV1 {
  readonly schemaVersion: BuilderSchemaVersion;
  readonly appId: string;
  readonly tenantId: string;
  readonly version: number;
  readonly name: string;
  readonly roles: readonly string[];
  readonly fields: readonly BuilderFieldDefinition[];
  readonly steps: readonly BuilderStepDefinition[];
  readonly transitions: readonly BuilderTransitionDefinition[];
}

export type BuilderSourceSection =
  'goal' | 'inputs' | 'roles' | 'steps' | 'branches' | 'outputs' | 'exceptions';

export interface BuilderSourceSegment {
  readonly id: string;
  readonly section: BuilderSourceSection;
  readonly text: string;
}

export type BuilderSourceTargetType = 'role' | 'field' | 'step' | 'transition';

export interface BuilderSourceMapping {
  readonly targetType: BuilderSourceTargetType;
  readonly targetId: string;
  readonly sourceRevisionId: string;
  readonly segmentIds: readonly string[];
}

export interface BuilderOpenIssue {
  readonly code: string;
  readonly targetId?: string;
  readonly message: string;
  readonly blocking: boolean;
}

export interface BuilderDesignMetadata {
  readonly sourceMappings: readonly BuilderSourceMapping[];
  readonly openIssues: readonly BuilderOpenIssue[];
}

export type BuilderValidationSeverity = 'error' | 'warning';

export interface BuilderValidationIssue {
  readonly severity: BuilderValidationSeverity;
  readonly code: string;
  readonly path: string;
  readonly message: string;
  readonly stepId?: string;
}

export interface BuilderValidationResult {
  readonly valid: boolean;
  readonly snapshotChecksum: string;
  readonly issues: readonly BuilderValidationIssue[];
}
