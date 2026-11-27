import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CatalogService } from '../catalog/catalog.service';
import { CATALOG_VERSION } from '../catalog/catalog.types';
import { BuilderManifestSchemaValidator } from '../builder/builder-manifest-schema.validator';
import { BuilderSemanticValidator } from '../builder/builder-semantic.validator';
import { purchaseValidFixture } from '../builder/fixtures/purchase-valid.fixture';
import {
  AppV2Validator,
  normalizeAppV2Ui,
  type AppV2Definition,
  type AppV2DraftContext,
  type AppV2PublishedContext,
} from './app-v2.validator';
import { APP_DRAFT_V2_SCHEMA, APP_PUBLISHED_V2_SCHEMA } from './app-v2.schema';

const fixtures = resolve(process.cwd(), '..', '..', 'docs');
interface Fixture {
  tenantId?: string;
  appId: string;
  unexpected?: boolean;
  version: number;
  startingPoint: string;
  features: { id: string; version: number }[];
  roles: { id: string; permissions: string[] }[];
  pages: {
    path: string;
    components: {
      resource: string;
      action?: string;
      type: string;
      zone: string;
      visibleToRoles?: string[];
      componentVersion?: number;
    }[];
  }[];
  workflows: { trigger: string }[];
}
const load = (name: string): Fixture =>
  JSON.parse(
    readFileSync(resolve(fixtures, 'examples', name), 'utf8'),
  ) as Fixture;
const validator = new AppV2Validator();
const catalog = new CatalogService().getFeatures();
const registry = {
  catalog,
  workflowTriggers: [{ featureId: 'erp.purchase_requests', trigger: 'submit' }],
  systemPermissions: ['share.manage', 'ai.sources.manage'],
  componentVersions: {
    form: [1],
    table: [1],
    detail: [1],
    metric: [1],
    action: [1],
  },
};
const draft: AppV2DraftContext = { target: 'draft', ...registry };
const published: AppV2PublishedContext = {
  target: 'published',
  ...registry,
  scope: {
    tenantId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    appId: '22222222-2222-4222-8222-222222222222',
    version: 1,
  },
  pinnedCatalogVersion: CATALOG_VERSION,
  inUseFeatureIds: [],
};
const validate = (
  value: unknown,
  ctx: AppV2DraftContext | AppV2PublishedContext = published,
) =>
  validator.validate(
    value,
    ctx.target === 'published' && value && typeof value === 'object'
      ? {
          ...ctx,
          // A test fixture stands in for the server's persisted app identity.
          scope: {
            tenantId: (value as Fixture).tenantId ?? '',
            appId: (value as Fixture).appId,
            version: (value as Fixture).version,
          },
        }
      : ctx,
  );
const has = (value: unknown, code: string, path?: string) => {
  const result = validate(value);
  expect(result.issues).toContainEqual(
    expect.objectContaining({ code, ...(path ? { path } : {}) }),
  );
};

describe('B05 schema contracts', () => {
  it.each([
    ['digix-app-draft-v2.5.schema.json', APP_DRAFT_V2_SCHEMA],
    ['digix-app-v2.5.schema.json', APP_PUBLISHED_V2_SCHEMA],
  ])('keeps %s synchronized with the runtime schema', (name, schema) => {
    expect(schema).toEqual(
      JSON.parse(
        readFileSync(resolve(fixtures, 'reference', 'schema', name), 'utf8'),
      ),
    );
  });
});

describe('AppV2Validator', () => {
  it.each([
    'erp-a-app-v2.5.json',
    'crm-a-app-v2.5.json',
    'crm-b-app-v2.5.json',
    'hybrid-app-v2.5.json',
  ])('accepts published fixture %s', (name) => {
    expect(validate(load(name))).toEqual({ valid: true, issues: [] });
  });

  it('allows empty draft but rejects publication with paths', () => {
    const value = load('crm-a-app-v2.5.json');
    value.features = [];
    value.roles = [];
    value.pages = [];
    expect(validate(value, draft)).toEqual({ valid: true, issues: [] });
    expect(validate(value).issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: '/features' }),
        expect.objectContaining({ path: '/roles' }),
        expect.objectContaining({ path: '/pages' }),
      ]),
    );
  });

  it('accepts ERP without inventory, CRM with materials and blank after selection', () => {
    const erp = load('erp-a-app-v2.5.json');
    erp.features = erp.features.filter((f) => f.id !== 'erp.inventory');
    erp.pages.splice(1, 1);
    erp.roles[2].permissions = ['erp.materials.materials.read'];
    expect(validate(erp)).toEqual({ valid: true, issues: [] });

    const hybrid = load('hybrid-app-v2.5.json');
    expect(hybrid.startingPoint).toBe('crm');
    expect(hybrid.features.map((f) => f.id)).toContain('erp.materials');
    expect(validate(hybrid)).toEqual({ valid: true, issues: [] });

    const blank = load('crm-a-app-v2.5.json');
    blank.features = [];
    blank.roles = [];
    blank.pages = [];
    expect(validate(blank, draft).valid).toBe(true);
    expect(validate(blank).valid).toBe(false);
    const selected = load('crm-a-app-v2.5.json');
    expect(selected.startingPoint).toBe('blank');
    expect(validate(selected)).toEqual({ valid: true, issues: [] });
  });

  it('rejects a published page without components', () => {
    const value = load('crm-a-app-v2.5.json');
    value.pages[0].components = [];
    has(value, 'SCHEMA_VALIDATION_ERROR', '/pages/0/components');
    expect(validate(value, draft).valid).toBe(true);
  });

  it('rejects wrong UUID, layout, zone and arbitrary executable configuration', () => {
    const value = load('crm-a-app-v2.5.json');
    value.tenantId = 'tenant-alpha';
    value.pages[0].components[0].zone = 'offscreen';
    expect(validate(value).issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: '/tenantId' }),
        expect.objectContaining({ path: '/pages/0/components/0/zone' }),
      ]),
    );
    const page = value.pages[0] as (typeof value.pages)[number] & {
      layout?: string;
      script?: string;
    };
    page.layout = 'freeform';
    page.script = 'fetch("https://external.example")';
    expect(validate(value).issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: '/pages/0/layout' }),
        expect.objectContaining({ path: '/pages/0/script' }),
      ]),
    );
  });

  it('reports schema paths for missing/unknown properties and wrong versions', () => {
    const value = load('crm-a-app-v2.5.json');
    delete value.tenantId;
    value.unexpected = true;
    value.version = 0;
    expect(validate(value).issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: '/tenantId' }),
        expect.objectContaining({ path: '/unexpected' }),
        expect.objectContaining({ path: '/version' }),
      ]),
    );
  });

  it('does not infer selected features from startingPoint', () => {
    const value = load('crm-a-app-v2.5.json');
    value.startingPoint = 'erp';
    value.features.splice(0, 1);
    has(value, 'MISSING_DEPENDENCY', '/features/0');
    has(value, 'COMPONENT_FEATURE_DISABLED', '/pages/0/components/0/featureId');
  });

  it('checks feature identity, version, status and dependency', () => {
    const value = load('erp-a-app-v2.5.json');
    value.features[0].version = 2;
    has(value, 'UNSUPPORTED_FEATURE', '/features/0');
    value.features[0].version = 1;
    value.features.push({ id: 'erp.materials', version: 1 });
    has(value, 'DUPLICATE_FEATURE', '/features/3');
    value.features.pop();
    value.features.splice(0, 1);
    has(value, 'MISSING_DEPENDENCY', '/features/0');
  });

  it('rejects missing ERP dependency and deprecated/unknown catalog features', () => {
    const value = load('erp-a-app-v2.5.json');
    value.features.splice(0, 1);
    has(value, 'MISSING_DEPENDENCY', '/features/0');
    has(value, 'MISSING_DEPENDENCY', '/features/1');
    value.features[0].id = 'erp.unregistered';
    has(value, 'UNSUPPORTED_FEATURE', '/features/0');
    const deprecatedCatalog = structuredClone(catalog);
    const feature = deprecatedCatalog.features.find(
      (f) => f.id === 'crm.customers',
    );
    if (!feature) throw new Error('Missing catalog fixture');
    (feature as { status: string }).status = 'deprecated';
    expect(
      validate(load('crm-a-app-v2.5.json'), {
        ...published,
        catalog: deprecatedCatalog,
      }).issues,
    ).toContainEqual(
      expect.objectContaining({
        code: 'UNSUPPORTED_FEATURE',
        path: '/features/0',
      }),
    );
  });

  it('checks resource/action/type and exact resource permission', () => {
    const value = load('erp-a-app-v2.5.json');
    value.pages[1].components[0].resource = 'receipts';
    // warehouse can read stock, but cannot read receipts
    has(value, 'ROLE_LACKS_PERMISSION', '/pages/1/components/0/action');
    value.pages[1].components[0].type = 'action';
    value.pages[1].components[0].action = 'bogus';
    has(value, 'INVALID_BINDING', '/pages/1/components/0/action');
    value.pages[1].components[0].resource = 'outside';
    has(value, 'UNKNOWN_RESOURCE', '/pages/1/components/0/resource');
    value.pages[1].components[0].resource = 'stock';
    value.pages[1].components[0].type = 'form';
    has(value, 'UNSUPPORTED_COMPONENT', '/pages/1/components/0/type');
    value.pages[1].components[0].type = 'table';
    value.pages[1].components[0].action = 'receive';
    value.pages[1].components[0].resource = 'receipts';
    has(value, 'READ_ONLY_COMPONENT_ACTION', '/pages/1/components/0/action');
  });

  it('checks visible roles, page identity, order, zone and component version', () => {
    const value = load('crm-a-app-v2.5.json');
    value.pages[1].path = value.pages[0].path;
    value.pages[0].components[0].visibleToRoles = ['missing'];
    value.pages[1].components[0].componentVersion = 2;
    value.pages[1].components[0].zone = 'side';
    has(value, 'DUPLICATE_PATH');
    has(value, 'UNKNOWN_ROLE');
    has(value, 'UNSUPPORTED_COMPONENT_VERSION');
    has(value, 'INVALID_ZONE');
  });

  it('rejects duplicate role, page, menu and zone order, and unknown permission', () => {
    const value = load('crm-a-app-v2.5.json');
    value.roles.push({ id: 'sales', permissions: [] });
    value.roles[0].permissions.push('crm.customers.contacts.read');
    value.features = value.features.filter((f) => f.id !== 'crm.customers');
    has(value, 'UNKNOWN_PERMISSION', '/roles/0/permissions/5');
    value.pages[1].path = value.pages[0].path;
    value.pages[1].components[0].visibleToRoles = ['missing'];
    expect(validate(value).issues.map((entry) => entry.code)).toContain(
      'DUPLICATE_ROLE',
    );
    const orderValue = load('crm-a-app-v2.5.json');
    const pages = orderValue.pages as (Fixture['pages'][number] & {
      id?: string;
      menuOrder?: number;
      components: (Fixture['pages'][number]['components'][number] & {
        id?: string;
        order?: number;
      })[];
    })[];
    pages[1].id = pages[0].id;
    pages[1].menuOrder = 0;
    pages[0].menuOrder = 0;
    pages[0].components[1].id = pages[0].components[0].id;
    pages[0].components[1].zone = pages[0].components[0].zone;
    pages[0].components[0].order = 0;
    pages[0].components[1].order = 0;
    const codes = validate(orderValue).issues.map((entry) => entry.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        'DUPLICATE_PAGE',
        'DUPLICATE_MENU_ORDER',
        'DUPLICATE_COMPONENT',
        'DUPLICATE_ORDER',
      ]),
    );
  });

  it('does not infer permission across customer and contact resources', () => {
    const value = load('crm-a-app-v2.5.json');
    value.pages[0].components[0].resource = 'contacts';
    has(value, 'ROLE_LACKS_PERMISSION', '/pages/0/components/0/action');
  });

  it('checks workflow trigger and in-use feature removal', () => {
    const value = load('erp-a-app-v2.5.json');
    value.workflows[0].trigger = 'unknown';
    has(value, 'UNKNOWN_WORKFLOW_TRIGGER', '/workflows/0/trigger');
    value.workflows[0].trigger = 'submit';
    value.features.splice(2, 1);
    expect(
      validate(value, { ...published, inUseFeatureIds: ['erp.inventory'] })
        .issues,
    ).toContainEqual(expect.objectContaining({ code: 'FEATURE_IN_USE' }));
  });

  it('fails closed when workflow/registry or server context is absent', () => {
    const value = load('erp-a-app-v2.5.json');
    expect(
      validate(value, { ...published, workflowTriggers: [] }).issues,
    ).toContainEqual(
      expect.objectContaining({ code: 'UNKNOWN_WORKFLOW_TRIGGER' }),
    );
    value.workflows[0].trigger = 'read'; // an action, but not a start event
    has(value, 'UNKNOWN_WORKFLOW_TRIGGER', '/workflows/0/trigger');
    const incomplete = { ...published, inUseFeatureIds: undefined };
    expect(
      validate(value, incomplete as unknown as AppV2PublishedContext).issues,
    ).toContainEqual(
      expect.objectContaining({ code: 'PUBLISH_CONTEXT_INCOMPLETE' }),
    );
    expect(
      validate(load('crm-a-app-v2.5.json'), {
        ...published,
        componentVersions: {},
      }).issues,
    ).toContainEqual(
      expect.objectContaining({ code: 'UNSUPPORTED_COMPONENT_VERSION' }),
    );
  });

  it('checks the pinned catalog version when provided', () => {
    const value = load('crm-a-app-v2.5.json');
    expect(
      validate(value, { ...published, pinnedCatalogVersion: 'old' }).issues,
    ).toContainEqual(
      expect.objectContaining({ code: 'CATALOG_VERSION_MISMATCH' }),
    );
  });

  it('rejects a definition whose scope differs from the persisted app version', () => {
    const value = load('crm-a-app-v2.5.json');
    value.appId = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
    expect(validator.validate(value, published).issues).toContainEqual(
      expect.objectContaining({ code: 'SCOPE_MISMATCH', path: '/appId' }),
    );
  });

  it('does not mutate older optional UI fields', () => {
    const value = load('crm-a-app-v2.5.json');
    const before = structuredClone(value);
    expect(validate(value).valid).toBe(true);
    expect(value).toEqual(before);
    const normalized = normalizeAppV2Ui(value as unknown as AppV2Definition);
    expect(normalized.pages[0].hidden).toBe(false);
    expect(normalized.pages[0].components[0].componentVersion).toBe(1);
    expect(normalized.pages[0].components[0].order).toBe(0);
    expect(normalized.pages[0].components[0].hidden).toBe(false);
    expect(value).toEqual(before);
    (normalized.pages[0].components[0] as { resource: string }).resource =
      'tampered';
    expect(value).toEqual(before);
  });

  it('reports invalid draft bindings without requiring a complete app', () => {
    const value = load('crm-a-app-v2.5.json');
    value.pages[0].components[0].resource = 'unknown';
    expect(validate(value, draft).issues).toContainEqual(
      expect.objectContaining({
        code: 'UNKNOWN_RESOURCE',
        path: '/pages/0/components/0/resource',
      }),
    );
    has(value, 'UNKNOWN_RESOURCE', '/pages/0/components/0/resource');
  });

  it('reports invalid draft dependencies, actions and permissions at their paths', () => {
    const value = load('crm-a-app-v2.5.json');
    value.features.splice(0, 1);
    value.pages.splice(0, 1);
    value.pages[0].components[0].action = 'invented';
    value.roles[0].permissions.push('crm.opportunities.opportunities.invented');

    const issues = validate(value, draft).issues;
    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'MISSING_DEPENDENCY',
          path: '/features/0',
        }),
        expect.objectContaining({
          code: 'INVALID_BINDING',
          path: '/pages/0/components/0/action',
        }),
        expect.objectContaining({
          code: 'UNKNOWN_PERMISSION',
          path: '/roles/0/permissions/5',
        }),
      ]),
    );
    value.pages[0].components[0].action = 'create';
    value.pages[0].components[1].action = 'invented';
    expect(validate(value, draft).issues).toContainEqual(
      expect.objectContaining({
        code: 'READ_ONLY_COMPONENT_ACTION',
        path: '/pages/0/components/1/action',
      }),
    );
  });

  it('allows incomplete draft roles without masking explicitly invalid references', () => {
    const value = load('crm-a-app-v2.5.json');
    value.roles = [];
    expect(validate(value, draft)).toEqual({ valid: true, issues: [] });
    value.pages[0].components[0].visibleToRoles = ['missing'];
    expect(validate(value, draft).issues).toContainEqual(
      expect.objectContaining({
        code: 'UNKNOWN_ROLE',
        path: '/pages/0/components/0/visibleToRoles/0',
      }),
    );
  });

  it('rejects a role explicitly shown an action it cannot perform', () => {
    const value = load('erp-a-app-v2.5.json');
    value.pages[0].components[2].visibleToRoles = ['buyer'];
    has(value, 'ROLE_LACKS_PERMISSION', '/pages/0/components/2/visibleToRoles');
    const component = value.pages[0]
      .components[2] as (typeof value.pages)[0]['components'][number] & {
      hidden?: boolean;
    };
    component.hidden = true;
    has(value, 'ROLE_LACKS_PERMISSION', '/pages/0/components/2/visibleToRoles');
  });

  it('requires the published server to supply system permissions', () => {
    const value = load('erp-a-app-v2.5.json');
    expect(
      validate(value, { ...published, systemPermissions: [] }).issues,
    ).toContainEqual(
      expect.objectContaining({
        code: 'UNKNOWN_PERMISSION',
        path: '/roles/3/permissions/0',
      }),
    );
  });

  it('keeps the existing v1 schema and semantic path intact', () => {
    const legacy = structuredClone(purchaseValidFixture);
    expect('startingPoint' in legacy).toBe(false);
    expect(new BuilderManifestSchemaValidator().validate(legacy).valid).toBe(
      true,
    );
    expect(new BuilderSemanticValidator().validate(legacy).valid).toBe(true);
    expect(validate(legacy, draft).issues).toContainEqual(
      expect.objectContaining({ path: '/schemaVersion' }),
    );
  });
});
