import { Injectable } from '@nestjs/common';
import Ajv2020 from 'ajv/dist/2020.js';
import type { ErrorObject } from 'ajv';
import type {
  CatalogComponent,
  CatalogFeature,
  CatalogFeaturesResponse,
} from '../catalog/catalog.types';
import { APP_DRAFT_V2_SCHEMA, APP_PUBLISHED_V2_SCHEMA } from './app-v2.schema';

export const APP_V2_ISSUE_CODES = [
  'SCHEMA_VALIDATION_ERROR',
  'PUBLISH_CONTEXT_INCOMPLETE',
  'CATALOG_VERSION_MISMATCH',
  'SCOPE_MISMATCH',
  'DUPLICATE_FEATURE',
  'UNSUPPORTED_FEATURE',
  'MISSING_DEPENDENCY',
  'FEATURE_IN_USE',
  'DUPLICATE_ROLE',
  'UNKNOWN_PERMISSION',
  'DUPLICATE_PAGE',
  'DUPLICATE_PATH',
  'DUPLICATE_MENU_ORDER',
  'DUPLICATE_COMPONENT',
  'DUPLICATE_ORDER',
  'DUPLICATE_WORKFLOW',
  'WORKFLOW_FEATURE_DISABLED',
  'UNKNOWN_WORKFLOW_TRIGGER',
  'UNKNOWN_ROLE',
  'INVALID_ZONE',
  'UNSUPPORTED_COMPONENT_VERSION',
  'COMPONENT_FEATURE_DISABLED',
  'UNSUPPORTED_COMPONENT',
  'UNKNOWN_RESOURCE',
  'MISSING_ACTION',
  'READ_ONLY_COMPONENT_ACTION',
  'INVALID_BINDING',
  'NO_VISIBLE_ROLE',
  'ROLE_LACKS_PERMISSION',
] as const;
export type AppV2IssueCode = (typeof APP_V2_ISSUE_CODES)[number];

export interface AppV2Issue {
  readonly code: AppV2IssueCode;
  readonly path: string;
  readonly message: string;
}

interface BaseContext {
  /** Must be the server-owned catalog snapshot selected for this app. */
  readonly catalog: CatalogFeaturesResponse;
  /** Registered workflow start events, not every action in the catalog. */
  readonly workflowTriggers: readonly { featureId: string; trigger: string }[];
  /** Permissions outside feature actions, issued by the app ACL registry. */
  readonly systemPermissions: readonly string[];
  /** Registry-owned component versions, e.g. { form: [1], table: [1] }. */
  readonly componentVersions: Readonly<
    Partial<Record<CatalogComponent, readonly number[]>>
  >;
}
export interface AppV2DraftContext extends BaseContext {
  readonly target: 'draft';
}
export interface AppV2PublishedContext extends BaseContext {
  readonly target: 'published';
  /** Scope resolved from the persisted app version, not the definition body. */
  readonly scope: {
    readonly tenantId: string;
    readonly appId: string;
    readonly version: number;
  };
  /** Pinned on the app version by B09; never supplied by the browser. */
  readonly pinnedCatalogVersion: string;
  /** Features with live records/workflows that cannot be disabled. Server-owned. */
  readonly inUseFeatureIds: readonly string[];
}
export type AppV2ValidationContext = AppV2DraftContext | AppV2PublishedContext;

export interface AppV2ValidationResult {
  readonly valid: boolean;
  readonly issues: readonly AppV2Issue[];
}

export interface AppV2Definition {
  readonly tenantId: string;
  readonly appId: string;
  readonly version: number;
  readonly features: readonly { id: string; version: number }[];
  readonly roles: readonly { id: string; permissions: readonly string[] }[];
  readonly pages: readonly Page[];
  readonly workflows?: readonly {
    id: string;
    featureId: string;
    trigger: string;
  }[];
}
interface Page {
  readonly id: string;
  readonly path: string;
  readonly layout: 'single' | 'two_columns';
  readonly menuOrder?: number;
  readonly hidden?: boolean;
  readonly visibleToRoles?: readonly string[];
  readonly components: readonly Component[];
}
interface Component {
  readonly id: string;
  readonly type: string;
  readonly componentVersion?: number;
  readonly hidden?: boolean;
  readonly featureId: string;
  readonly resource: string;
  readonly action?: string;
  readonly zone: 'main' | 'side';
  readonly order?: number;
  readonly visibleToRoles?: readonly string[];
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validateDraft = ajv.compile(APP_DRAFT_V2_SCHEMA);
const validatePublished = ajv.compile(APP_PUBLISHED_V2_SCHEMA);

/** Call only after schema validation; returns a copy, never edits a stored snapshot. */
export function normalizeAppV2Ui<T extends AppV2Definition>(definition: T): T {
  const copy = structuredClone(definition);
  return {
    ...copy,
    pages: copy.pages.map((page) => ({
      ...page,
      hidden: page.hidden ?? false,
      components: page.components.map((component, index) => ({
        ...component,
        componentVersion: component.componentVersion ?? 1,
        hidden: component.hidden ?? false,
        order: component.order ?? index,
      })),
    })),
  };
}

function issue(
  code: AppV2IssueCode,
  path: string,
  message: string,
): AppV2Issue {
  return { code, path, message };
}

function escapePointer(value: string): string {
  return value.replaceAll('~', '~0').replaceAll('/', '~1');
}

function schemaIssue(error: ErrorObject): AppV2Issue {
  const params = error.params as Record<string, unknown>;
  const property =
    error.keyword === 'required'
      ? params.missingProperty
      : error.keyword === 'additionalProperties'
        ? params.additionalProperty
        : undefined;
  const path =
    error.instancePath +
    (typeof property === 'string' ? `/${escapePointer(property)}` : '');
  return issue(
    'SCHEMA_VALIDATION_ERROR',
    path || '/',
    error.message ?? 'App definition does not match the v2.5 schema.',
  );
}

function unique(
  values: readonly string[],
  path: string,
  code: AppV2IssueCode,
  issues: AppV2Issue[],
): void {
  const seen = new Set<string>();
  values.forEach((value, index) => {
    if (seen.has(value)) {
      issues.push(
        issue(code, `${path}/${index}`, `Duplicate value: ${value}.`),
      );
    }
    seen.add(value);
  });
}

@Injectable()
export class AppV2Validator {
  validate(
    config: unknown,
    ctx: AppV2ValidationContext,
  ): AppV2ValidationResult {
    const check = ctx.target === 'draft' ? validateDraft : validatePublished;
    if (!check(config)) {
      const issues = (check.errors ?? []).map(schemaIssue);
      return { valid: false, issues };
    }
    const definition = config as unknown as AppV2Definition;
    const issues: AppV2Issue[] = [];
    if (
      !Array.isArray(ctx.workflowTriggers) ||
      !Array.isArray(ctx.systemPermissions) ||
      !ctx.componentVersions ||
      typeof ctx.componentVersions !== 'object' ||
      (ctx.target === 'published' &&
        (!ctx.pinnedCatalogVersion ||
          !ctx.scope ||
          !ctx.scope.tenantId ||
          !ctx.scope.appId ||
          !Number.isInteger(ctx.scope.version) ||
          !Array.isArray(ctx.inUseFeatureIds)))
    ) {
      return {
        valid: false,
        issues: [
          issue(
            'PUBLISH_CONTEXT_INCOMPLETE',
            '/',
            'Server publish context is incomplete.',
          ),
        ],
      };
    }
    if (
      ctx.target === 'published' &&
      ctx.catalog.catalogVersion !== ctx.pinnedCatalogVersion
    ) {
      issues.push(
        issue(
          'CATALOG_VERSION_MISMATCH',
          '/features',
          'Catalog version differs from the pinned version.',
        ),
      );
    }
    if (ctx.target === 'published') {
      for (const field of ['tenantId', 'appId', 'version'] as const) {
        if (definition[field] !== ctx.scope[field]) {
          issues.push(
            issue(
              'SCOPE_MISMATCH',
              `/${field}`,
              `Definition ${field} does not match the persisted app version.`,
            ),
          );
        }
      }
    }

    const catalog = new Map(ctx.catalog.features.map((f) => [f.id, f]));
    const selected = new Map(definition.features.map((f) => [f.id, f]));
    unique(
      definition.features.map((f) => f.id),
      '/features',
      'DUPLICATE_FEATURE',
      issues,
    );
    definition.features.forEach((entry, index) => {
      const path = `/features/${index}`;
      const feature = catalog.get(entry.id);
      if (
        !feature ||
        feature.version !== entry.version ||
        feature.status !== 'supported'
      ) {
        issues.push(
          issue(
            'UNSUPPORTED_FEATURE',
            path,
            `Feature ${entry.id}:${entry.version} is not supported by this catalog.`,
          ),
        );
        return;
      }
      for (const dependency of feature.dependencies) {
        if (!selected.has(dependency)) {
          issues.push(
            issue(
              'MISSING_DEPENDENCY',
              path,
              `Feature ${entry.id} requires ${dependency}.`,
            ),
          );
        }
      }
    });
    if (ctx.target === 'published') {
      const inUseFeatureIds: readonly string[] = ctx.inUseFeatureIds;
      for (const featureId of inUseFeatureIds) {
        if (!selected.has(featureId)) {
          issues.push(
            issue(
              'FEATURE_IN_USE',
              '/features',
              `Feature ${featureId} has active records or workflows.`,
            ),
          );
        }
      }
    }

    const roles = new Map(definition.roles.map((role) => [role.id, role]));
    unique(
      definition.roles.map((role) => role.id),
      '/roles',
      'DUPLICATE_ROLE',
      issues,
    );
    const systemPermissions: readonly string[] = ctx.systemPermissions;
    const permissions = new Set([
      ...ctx.catalog.features
        .filter((f) => selected.has(f.id))
        .flatMap((f) => f.actions.map((a) => a.permission)),
      ...systemPermissions,
    ]);
    definition.roles.forEach((role, i) =>
      role.permissions.forEach((permission, j) => {
        if (!permissions.has(permission)) {
          issues.push(
            issue(
              'UNKNOWN_PERMISSION',
              `/roles/${i}/permissions/${j}`,
              `Permission ${permission} is not available.`,
            ),
          );
        }
      }),
    );

    unique(
      definition.pages.map((p) => p.id),
      '/pages',
      'DUPLICATE_PAGE',
      issues,
    );
    unique(
      definition.pages.map((p) => p.path),
      '/pages',
      'DUPLICATE_PATH',
      issues,
    );
    unique(
      definition.pages.map((p, i) => String(p.menuOrder ?? i)),
      '/pages',
      'DUPLICATE_MENU_ORDER',
      issues,
    );
    definition.pages.forEach((page, i) => {
      const path = `/pages/${i}`;
      this.checkRoles(
        page.visibleToRoles,
        `${path}/visibleToRoles`,
        roles,
        issues,
      );
      unique(
        page.components.map((c) => c.id),
        `${path}/components`,
        'DUPLICATE_COMPONENT',
        issues,
      );
      unique(
        page.components.map((c, j) => `${c.zone}:${c.order ?? j}`),
        `${path}/components`,
        'DUPLICATE_ORDER',
        issues,
      );
      page.components.forEach((component, j) =>
        this.checkComponent(
          component,
          `${path}/components/${j}`,
          page,
          roles,
          selected,
          catalog,
          ctx.componentVersions,
          ctx.target,
          issues,
        ),
      );
    });

    const workflows = definition.workflows ?? [];
    unique(
      workflows.map((w) => w.id),
      '/workflows',
      'DUPLICATE_WORKFLOW',
      issues,
    );
    workflows.forEach((workflow, i) => {
      const feature = catalog.get(workflow.featureId);
      if (!selected.has(workflow.featureId) || !feature) {
        issues.push(
          issue(
            'WORKFLOW_FEATURE_DISABLED',
            `/workflows/${i}/featureId`,
            'Workflow feature is not enabled.',
          ),
        );
      } else if (
        !ctx.workflowTriggers.some(
          (entry) =>
            entry.featureId === workflow.featureId &&
            entry.trigger === workflow.trigger,
        )
      ) {
        issues.push(
          issue(
            'UNKNOWN_WORKFLOW_TRIGGER',
            `/workflows/${i}/trigger`,
            'Trigger is not registered for this feature.',
          ),
        );
      }
    });
    return { valid: issues.length === 0, issues };
  }

  private checkRoles(
    ids: readonly string[] | undefined,
    path: string,
    roles: Map<string, AppV2Definition['roles'][number]>,
    issues: AppV2Issue[],
  ): void {
    ids?.forEach((id, i) => {
      if (!roles.has(id))
        issues.push(
          issue('UNKNOWN_ROLE', `${path}/${i}`, `Role ${id} does not exist.`),
        );
    });
  }

  private checkComponent(
    component: Component,
    path: string,
    page: Page,
    roles: Map<string, AppV2Definition['roles'][number]>,
    selected: Map<string, AppV2Definition['features'][number]>,
    catalog: Map<string, CatalogFeature>,
    componentVersions: BaseContext['componentVersions'],
    target: AppV2ValidationContext['target'],
    issues: AppV2Issue[],
  ): void {
    this.checkRoles(
      component.visibleToRoles,
      `${path}/visibleToRoles`,
      roles,
      issues,
    );
    if (page.layout === 'single' && component.zone === 'side') {
      issues.push(
        issue(
          'INVALID_ZONE',
          `${path}/zone`,
          'Single-column pages have no side zone.',
        ),
      );
    }
    if (
      !componentVersions[component.type as CatalogComponent]?.includes(
        component.componentVersion ?? 1,
      )
    ) {
      issues.push(
        issue(
          'UNSUPPORTED_COMPONENT_VERSION',
          `${path}/componentVersion`,
          'Component version is not supported.',
        ),
      );
    }
    const feature = selected.has(component.featureId)
      ? catalog.get(component.featureId)
      : undefined;
    if (
      !feature ||
      feature.version !== selected.get(component.featureId)?.version ||
      feature.status !== 'supported'
    ) {
      issues.push(
        issue(
          'COMPONENT_FEATURE_DISABLED',
          `${path}/featureId`,
          'Component feature is not enabled or supported.',
        ),
      );
      return;
    }
    if (
      !feature.components.includes(
        component.type as CatalogFeature['components'][number],
      )
    ) {
      issues.push(
        issue(
          'UNSUPPORTED_COMPONENT',
          `${path}/type`,
          'Component type is not supported by this feature.',
        ),
      );
    }
    if (!feature.resources.includes(component.resource)) {
      issues.push(
        issue(
          'UNKNOWN_RESOURCE',
          `${path}/resource`,
          'Resource is not in this feature.',
        ),
      );
      return;
    }
    if (
      (component.type === 'form' || component.type === 'action') &&
      !component.action
    ) {
      issues.push(
        issue(
          'MISSING_ACTION',
          `${path}/action`,
          'Write components must specify an action.',
        ),
      );
      return;
    }
    // Read-only components without an explicit action bind to read on their
    // exact resource; they never gain access to other resources in the feature.
    const action = component.action ?? 'read';
    if (
      (component.type === 'table' ||
        component.type === 'detail' ||
        component.type === 'metric') &&
      action !== 'read'
    ) {
      issues.push(
        issue(
          'READ_ONLY_COMPONENT_ACTION',
          `${path}/action`,
          'Read-only components cannot bind a write action.',
        ),
      );
      return;
    }
    const binding = feature.actions.find(
      (a) => a.resource === component.resource && a.action === action,
    );
    if (!binding) {
      issues.push(
        issue(
          'INVALID_BINDING',
          `${path}/action`,
          'Action is not registered for this feature and resource.',
        ),
      );
      return;
    }
    // Roles may not have been configured yet in a draft. Invalid explicit
    // visibleToRoles references were already reported above.
    if (target === 'draft' && roles.size === 0) return;
    const pageRoles = page.visibleToRoles ?? [...roles.keys()];
    const visibleRoles = component.visibleToRoles
      ? pageRoles.filter((role) => component.visibleToRoles!.includes(role))
      : pageRoles;
    if (visibleRoles.length === 0) {
      issues.push(
        issue(
          'NO_VISIBLE_ROLE',
          `${path}/visibleToRoles`,
          'No role can see this component.',
        ),
      );
    } else if (component.visibleToRoles || page.visibleToRoles) {
      visibleRoles.forEach((role) => {
        if (
          roles.has(role) &&
          !roles.get(role)!.permissions.includes(binding.permission)
        ) {
          issues.push(
            issue(
              'ROLE_LACKS_PERMISSION',
              `${path}/visibleToRoles`,
              `Role ${role} lacks ${binding.permission}.`,
            ),
          );
        }
      });
    } else if (
      !visibleRoles.some((role) =>
        roles.get(role)?.permissions.includes(binding.permission),
      )
    ) {
      issues.push(
        issue(
          'ROLE_LACKS_PERMISSION',
          `${path}/action`,
          `No role has ${binding.permission}.`,
        ),
      );
    }
  }
}
