// Runtime copies of the design schemas in docs/reference/schema. Keep the
// parity test in app-v2.validator.spec.ts when either contract changes.
const uuid = {
  type: 'string',
  pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
};
const id = {
  type: 'string',
  pattern: '^[a-z][a-z0-9_-]{1,63}$',
};
const featureId = {
  type: 'string',
  pattern: '^[a-z][a-z0-9_-]{1,63}\\.[a-z][a-z0-9_-]{1,63}$',
};
const component = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'type', 'featureId', 'resource', 'zone'],
  properties: {
    id: { $ref: '#/$defs/id' },
    type: { enum: ['form', 'table', 'detail', 'metric', 'action'] },
    componentVersion: { type: 'integer', minimum: 1, default: 1 },
    featureId: { $ref: '#/$defs/featureId' },
    resource: { $ref: '#/$defs/id' },
    action: { $ref: '#/$defs/id' },
    zone: { enum: ['main', 'side'] },
    label: { type: 'string', minLength: 1 },
    order: { type: 'integer', minimum: 0 },
    visibleToRoles: {
      type: 'array',
      minItems: 1,
      uniqueItems: true,
      items: { $ref: '#/$defs/id' },
    },
    hidden: { type: 'boolean', default: false },
  },
};
const page = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'label', 'path', 'layout', 'components'],
  properties: {
    id: { $ref: '#/$defs/id' },
    label: { type: 'string', minLength: 1 },
    path: { $ref: '#/$defs/id' },
    layout: { enum: ['single', 'two_columns'] },
    menuOrder: { type: 'integer', minimum: 0 },
    visibleToRoles: {
      type: 'array',
      minItems: 1,
      uniqueItems: true,
      items: { $ref: '#/$defs/id' },
    },
    hidden: { type: 'boolean', default: false },
    components: { type: 'array', items: { $ref: '#/$defs/component' } },
  },
};
const properties = {
  schemaVersion: { const: '2.5' },
  startingPoint: { enum: ['erp', 'crm', 'blank'] },
  tenantId: { $ref: '#/$defs/uuid' },
  appId: { $ref: '#/$defs/uuid' },
  version: { type: 'integer', minimum: 1 },
  name: { type: 'string', minLength: 1, maxLength: 120 },
  features: {
    type: 'array',
    items: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'version'],
      properties: {
        id: { $ref: '#/$defs/featureId' },
        version: { type: 'integer', minimum: 1 },
      },
    },
  },
  roles: {
    type: 'array',
    items: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'permissions'],
      properties: {
        id: { $ref: '#/$defs/id' },
        permissions: {
          type: 'array',
          uniqueItems: true,
          items: { type: 'string', minLength: 1 },
        },
      },
    },
  },
  pages: { type: 'array', items: { $ref: '#/$defs/page' } },
  workflows: {
    type: 'array',
    items: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'featureId', 'trigger'],
      properties: {
        id: { $ref: '#/$defs/id' },
        featureId: { $ref: '#/$defs/featureId' },
        trigger: { $ref: '#/$defs/id' },
      },
    },
  },
};
const definitions = { uuid, id, featureId, page, component };
const required = [
  'schemaVersion',
  'tenantId',
  'appId',
  'version',
  'name',
  'features',
  'roles',
  'pages',
];

export const APP_DRAFT_V2_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://digix.example/schema/app-draft-v2.5',
  title: 'DigiX application draft v2.5 (design contract; not implemented)',
  type: 'object',
  additionalProperties: false,
  required,
  properties,
  $defs: definitions,
};

export const APP_PUBLISHED_V2_SCHEMA = {
  ...APP_DRAFT_V2_SCHEMA,
  $id: 'https://digix.example/schema/app-v2.5',
  title:
    'DigiX published composable application v2.5 (design contract; not implemented)',
  properties: {
    ...properties,
    startingPoint: {
      ...properties.startingPoint,
      description:
        'Optional creation provenance; never determines enabled features, authorization or runtime behavior.',
    },
    features: { ...properties.features, minItems: 1 },
    roles: { ...properties.roles, minItems: 1 },
    pages: { ...properties.pages, minItems: 1 },
  },
  $defs: {
    ...definitions,
    page: {
      ...page,
      properties: {
        ...page.properties,
        components: { ...page.properties.components, minItems: 1 },
      },
    },
  },
};
