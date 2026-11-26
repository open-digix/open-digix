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

export type LayoutType = "single" | "two_columns";
export type ComponentZone = "main" | "side";
export type ComponentType = "form" | "table" | "detail" | "metric" | "action" | string;

export interface AppRole {
  id: string;
  permissions: string[];
}

export interface AppFeature {
  id: string;
  version: number;
}

export interface ComponentConfig {
  id: string;
  type: ComponentType;
  componentVersion?: number;
  featureId: string;
  resource: string;
  action?: string;
  zone: ComponentZone;
  label?: string;
  order?: number;
  visibleToRoles?: string[];
  hidden?: boolean;
}

export interface NormalizedComponent extends ComponentConfig {
  componentVersion: number;
  hidden: boolean;
  order: number;
}

export interface PageConfig {
  id: string;
  label: string;
  path: string;
  layout: LayoutType;
  menuOrder?: number;
  visibleToRoles?: string[];
  hidden?: boolean;
  components: ComponentConfig[];
}

export interface NormalizedPage extends PageConfig {
  menuOrder: number;
  hidden: boolean;
  components: NormalizedComponent[];
}

export interface AppWorkflow {
  id: string;
  featureId: string;
  trigger: string;
}

export interface PublishedAppV25 {
  schemaVersion: "2.5";
  startingPoint?: "erp" | "crm" | "blank";
  tenantId: string;
  appId: string;
  version: number;
  name: string;
  features: AppFeature[];
  roles: AppRole[];
  pages: PageConfig[];
  workflows?: AppWorkflow[];
}

export interface NormalizedApp extends Omit<PublishedAppV25, "pages"> {
  pages: NormalizedPage[];
}

export interface DataSourceQuery {
  limit?: number;
  cursor?: string;
  filter?: Record<string, unknown>;
}

export interface DataSourceListResult<T = Record<string, unknown>> {
  items: T[];
  nextCursor?: string;
}

export interface DataSource {
  isMock: boolean;
  list(resource: string, query?: DataSourceQuery): Promise<DataSourceListResult>;
  get(resource: string, id: string): Promise<Record<string, unknown> | null>;
  submit(
    resource: string,
    action: string,
    data: Record<string, unknown>
  ): Promise<{ success: boolean; id?: string; message?: string }>;
  runAction(
    resource: string,
    action: string,
    payload?: Record<string, unknown>
  ): Promise<{ success: boolean; message?: string }>;
}
