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

export const CATALOG_VERSION = '2026-11-demo-1' as const;
export const CATALOG_SCHEMA_VERSION = 1 as const;

export type CatalogSchemaVersion = typeof CATALOG_SCHEMA_VERSION;
export type CatalogFeatureStatus = 'supported' | 'deprecated';
export type CatalogDomain = 'erp' | 'crm';
export type CatalogComponent =
  'form' | 'table' | 'detail' | 'metric' | 'action';

export interface CatalogAction {
  readonly resource: string;
  readonly action: string;
  readonly permission: string;
}

export interface CatalogFeature {
  readonly id: string;
  readonly version: CatalogSchemaVersion;
  readonly domain: CatalogDomain;
  readonly resources: readonly string[];
  readonly actions: readonly CatalogAction[];
  readonly permissions: readonly string[];
  readonly dependencies: readonly string[];
  readonly components: readonly CatalogComponent[];
  readonly status: CatalogFeatureStatus;
}

export interface CatalogPreset {
  readonly id: 'erp' | 'crm' | 'blank';
  readonly version: CatalogSchemaVersion;
  readonly suggestedFeatures: readonly string[];
}

export interface CatalogFeaturesResponse {
  readonly catalogVersion: typeof CATALOG_VERSION;
  readonly features: readonly CatalogFeature[];
}

export interface CatalogPresetsResponse {
  readonly catalogVersion: typeof CATALOG_VERSION;
  readonly presets: readonly CatalogPreset[];
}
