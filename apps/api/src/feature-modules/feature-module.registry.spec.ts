import {
  FeatureModuleRegistrationError,
  FeatureModuleRegistry,
} from './feature-module.registry';
import type { FeatureModuleDefinition } from './feature-module.types';

const handler = jest.fn();

const definition: FeatureModuleDefinition = {
  featureId: 'erp.materials',
  version: 1,
  route: '/v1/apps/:appId/materials',
  permissions: ['erp.materials.materials.read'],
  metric: 'erp_materials_requests_total',
  handler,
};

describe('FeatureModuleRegistry', () => {
  it('registers and looks up a versioned feature module', () => {
    const registry = new FeatureModuleRegistry();

    const registered = registry.register(definition);

    expect(registry.get('erp.materials', 1)).toBe(registered);
    expect(registry.list()).toEqual([registered]);
    expect(registered.permissions).toEqual(['erp.materials.materials.read']);
  });

  it('allows separate versions but rejects a duplicate version', () => {
    const registry = new FeatureModuleRegistry();

    registry.register(definition);
    registry.register({ ...definition, version: 2 });

    expect(registry.list()).toHaveLength(2);
    expect(() => registry.register(definition)).toThrow(
      FeatureModuleRegistrationError,
    );
  });

  it('freezes registry metadata and rejects invalid definitions', () => {
    const registry = new FeatureModuleRegistry();

    const registered = registry.register(definition);
    expect(Object.isFrozen(registered)).toBe(true);
    expect(Object.isFrozen(registered.permissions)).toBe(true);

    expect(() => registry.register({ ...definition, featureId: ' ' })).toThrow(
      FeatureModuleRegistrationError,
    );
    expect(() =>
      registry.register({ ...definition, route: 'v1/materials' }),
    ).toThrow(FeatureModuleRegistrationError);
    expect(() =>
      registry.register({
        ...definition,
        permissions: ['materials.read', 'materials.read'],
      }),
    ).toThrow(FeatureModuleRegistrationError);
  });
});
