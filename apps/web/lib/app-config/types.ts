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

/**
 * Feature ID pattern: ^[a-z][a-z0-9_-]{1,63}\.[a-z][a-z0-9_-]{1,63}$
 * Defined as string to remain flexible when catalog introduces new features.
 */
export type FeatureId = string;

export const KNOWN_FEATURE_IDS = [
  "erp.materials",
  "erp.purchase_requests",
  "erp.inventory",
  "crm.customers",
  "crm.opportunities",
] as const;

export type StartingPoint = "erp" | "crm" | "blank";

export type FeatureDomain = "erp" | "crm" | string;

export interface CatalogFeature {
  id: FeatureId;
  version: number;
  domain: FeatureDomain;
  dependencies: FeatureId[];
  resources: string[];
  actions: string[];
  permissions: string[];
  components: Array<"form" | "table" | "detail" | "metric" | "action">;
  status: string; // e.g., "supported", "beta", "deprecated"
  label?: string; // Optional in catalog contract
  description?: string; // Optional in catalog contract
}

export interface CatalogPreset {
  id: StartingPoint;
  version: number;
  suggestedFeatures: FeatureId[];
  label?: string;
  description?: string;
}

export interface CatalogResponse {
  catalogVersion: string;
  features: CatalogFeature[];
}

export interface PresetsResponse {
  catalogVersion: string;
  presets: CatalogPreset[];
}

export interface AppDraftFeature {
  id: FeatureId;
  version: number;
}

export interface AppDraftRole {
  id: string;
  permissions: string[];
}

export interface AppDraftComponent {
  id: string;
  type: "form" | "table" | "detail" | "metric" | "action";
  componentVersion?: number;
  featureId: FeatureId;
  resource: string;
  action?: string; // Optional per schema draft/published
  zone: "main" | "side";
  label?: string; // Optional per schema draft/published
  order?: number;
  visibleToRoles?: string[];
  hidden?: boolean;
}

export interface AppDraftPage {
  id: string;
  label: string;
  path: string;
  layout: "single" | "two_columns";
  menuOrder?: number;
  visibleToRoles?: string[];
  hidden?: boolean;
  components: AppDraftComponent[];
}

export interface AppDraftWorkflow {
  id: string;
  featureId: FeatureId;
  trigger: string;
}

export interface AppDraftDefinitionV25 {
  schemaVersion: "2.5";
  startingPoint?: StartingPoint;
  tenantId: string;
  appId: string;
  version: number;
  name: string;
  features: AppDraftFeature[];
  roles: AppDraftRole[];
  pages: AppDraftPage[];
  workflows?: AppDraftWorkflow[];
}

export interface AppSummary {
  appId: string;
  appKey: string;
  name: string;
  schemaVersion: "1.0" | "2.5";
  startingPoint?: StartingPoint;
  version: number;
  status: "draft" | "published";
  updatedAt: string;
  featureCount?: number;
  features?: AppDraftFeature[];
}

export interface CreateAppRequest {
  schemaVersion: "2.5";
  name: string;
  appKey: string;
  startingPoint?: StartingPoint;
  presetVersion?: number;
}

export interface CreateAppResponse {
  appId: string;
  lockVersion: number;
  draft: AppDraftDefinitionV25;
}

export interface PatchDraftRequest {
  lockVersion: number;
  name?: string;
  startingPoint?: StartingPoint;
  features?: AppDraftFeature[];
  roles?: AppDraftRole[];
  pages?: AppDraftPage[];
  workflows?: AppDraftWorkflow[];
}

export interface DraftResponseV25 {
  appId: string;
  definition: AppDraftDefinitionV25;
  lockVersion: number;
  snapshotChecksum?: string;
  updatedAt?: string;
}

export interface ValidateDraftIssue {
  code: string;
  path: string;
  message: string;
}

export interface ValidateDraftResponse {
  valid: boolean;
  snapshotChecksum?: string;
  issues: ValidateDraftIssue[];
}

export const APP_KEY_REGEX = /^[a-z][a-z0-9_-]{1,63}$/;
