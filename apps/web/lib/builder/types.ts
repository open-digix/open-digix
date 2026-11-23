/*
 * Copyright 2026 DigiX Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export const BUILDER_SCHEMA_VERSION = "1.0" as const;

export type BuilderSchemaVersion = typeof BUILDER_SCHEMA_VERSION;
export type BuilderFieldType =
  | "string"
  | "integer"
  | "date"
  | "boolean"
  | "enum";
export type BuilderStepType = "start" | "task" | "gateway" | "end";
export type BuilderEndState = "approved" | "rejected";
export type BuilderComparisonOperator = "eq" | "lt" | "gte";
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
  | "goal"
  | "inputs"
  | "roles"
  | "steps"
  | "branches"
  | "outputs"
  | "exceptions";

export interface BuilderSourceSegment {
  readonly id: string;
  readonly section: BuilderSourceSection;
  readonly text: string;
}

export type BuilderSourceTargetType = "role" | "field" | "step" | "transition";

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

export type BuilderValidationSeverity = "error" | "warning";

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

export interface StoredBuilderApp {
  appId: string;
  appKey: string;
  name: string;
  goal?: string;
  version: number;
  createdAt: string;
}

export function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id,
  );
}

export function isValidVersion(version: unknown): version is number {
  return typeof version === "number" && Number.isInteger(version) && version > 0;
}
