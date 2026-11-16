import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BuilderManifestSchemaValidator } from './builder-manifest-schema.validator';
import { BUILDER_APPLICATION_SCHEMA_V1 } from './builder.schema';
import type { BuilderApplicationDefinitionV1 } from './builder.types';

const VALID_MANIFEST: BuilderApplicationDefinitionV1 = {
  schemaVersion: '1.0',
  appId: 'generic_request',
  tenantId: 'tenant_alpha',
  version: 1,
  name: 'Generic request',
  roles: ['requester', 'reviewer'],
  fields: [
    { id: 'request_title', type: 'string', required: true },
    {
      id: 'decision',
      type: 'enum',
      required: true,
      options: ['approve', 'reject'],
    },
  ],
  steps: [
    { id: 'submitted', type: 'start' },
    {
      id: 'review',
      type: 'task',
      role: 'reviewer',
      decisionField: 'decision',
    },
    { id: 'route_decision', type: 'gateway' },
    { id: 'approved', type: 'end', endState: 'approved' },
    { id: 'rejected', type: 'end', endState: 'rejected' },
  ],
  transitions: [
    { from: 'submitted', to: 'review' },
    { from: 'review', to: 'route_decision' },
    {
      from: 'route_decision',
      to: 'approved',
      when: {
        all: [{ field: 'decision', op: 'eq', value: 'approve' }],
      },
    },
    {
      from: 'route_decision',
      to: 'rejected',
      when: {
        all: [{ field: 'decision', op: 'eq', value: 'reject' }],
      },
    },
  ],
};

describe('BuilderManifestSchemaValidator', () => {
  const validator = new BuilderManifestSchemaValidator();

  it('accepts a manifest that matches schema v1', () => {
    expect(validator.validate(VALID_MANIFEST)).toEqual({
      valid: true,
      definition: VALID_MANIFEST,
      issues: [],
    });
  });

  it('reports the path of a missing required property', () => {
    const input = structuredClone(VALID_MANIFEST) as unknown as Record<
      string,
      unknown
    >;
    delete input.roles;

    const result = validator.validate(input);

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: 'SCHEMA_VALIDATION_ERROR',
        path: '/roles',
      }),
    );
  });

  it('reports the path of an invalid nested value', () => {
    const input = structuredClone(VALID_MANIFEST) as unknown as {
      fields: Array<Record<string, unknown>>;
    };
    input.fields[0].type = 'money';

    const result = validator.validate(input);

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ path: '/fields/0/type' }),
    );
  });

  it('rejects unknown properties and reports their path', () => {
    const input = {
      ...structuredClone(VALID_MANIFEST),
      unexpected: true,
    };

    const result = validator.validate(input);

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ path: '/unexpected' }),
    );
  });

  it('rejects a non-positive manifest version', () => {
    const input = { ...structuredClone(VALID_MANIFEST), version: 0 };

    const result = validator.validate(input);

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ path: '/version' }),
    );
  });
});

describe('BUILDER_APPLICATION_SCHEMA_V1', () => {
  it('stays synchronized with the canonical schema in docs', () => {
    const docsSchema = JSON.parse(
      readFileSync(
        resolve(
          process.cwd(),
          '..',
          '..',
          'docs',
          'reference',
          'schema',
          'digix-app-v1.schema.json',
        ),
        'utf8',
      ),
    ) as unknown;

    expect(BUILDER_APPLICATION_SCHEMA_V1).toEqual(docsSchema);
  });
});
