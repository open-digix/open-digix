import { CATALOG_FEATURES, CATALOG_PRESETS } from './catalog.registry';
import { CATALOG_VERSION } from './catalog.types';
import { CatalogService } from './catalog.service';

describe('CatalogService', () => {
  const service = new CatalogService();

  it('returns the five supported features with a stable catalog version', () => {
    const response = service.getFeatures();

    expect(response.catalogVersion).toBe(CATALOG_VERSION);
    expect(response.features).toHaveLength(5);
    expect(response.features.map(({ id }) => id)).toEqual([
      'erp.materials',
      'erp.purchase_requests',
      'erp.inventory',
      'crm.customers',
      'crm.opportunities',
    ]);
  });

  it('publishes the required actions, permissions and components', () => {
    const features = service.getFeatures().features;

    expect(features[0]).toMatchObject({
      id: 'erp.materials',
      actions: [
        {
          resource: 'materials',
          action: 'create',
          permission: 'erp.materials.materials.create',
        },
        {
          resource: 'materials',
          action: 'read',
          permission: 'erp.materials.materials.read',
        },
        {
          resource: 'materials',
          action: 'update_note',
          permission: 'erp.materials.materials.update_note',
        },
      ],
      permissions: [
        'erp.materials.materials.create',
        'erp.materials.materials.read',
        'erp.materials.materials.update_note',
      ],
      components: ['form', 'table', 'detail', 'action'],
      status: 'supported',
    });
    expect(features[4]).toMatchObject({
      id: 'crm.opportunities',
      actions: [
        {
          resource: 'opportunities',
          action: 'create',
          permission: 'crm.opportunities.opportunities.create',
        },
        {
          resource: 'opportunities',
          action: 'read',
          permission: 'crm.opportunities.opportunities.read',
        },
        {
          resource: 'opportunities',
          action: 'advance',
          permission: 'crm.opportunities.opportunities.advance',
        },
      ],
      dependencies: ['crm.customers'],
      components: ['form', 'table', 'detail', 'metric', 'action'],
    });
  });

  it('publishes the required feature dependencies', () => {
    const features = service.getFeatures().features;

    expect(
      features.find(({ id }) => id === 'erp.purchase_requests'),
    ).toMatchObject({ dependencies: ['erp.materials'] });
    expect(features.find(({ id }) => id === 'erp.inventory')).toMatchObject({
      dependencies: ['erp.materials'],
    });
    expect(features.find(({ id }) => id === 'crm.opportunities')).toMatchObject(
      { dependencies: ['crm.customers'] },
    );
  });

  it('returns the ERP, CRM and blank presets', () => {
    const response = service.getPresets();

    expect(response.catalogVersion).toBe(CATALOG_VERSION);
    expect(response.presets).toEqual(CATALOG_PRESETS);
    expect(response.presets).toEqual([
      {
        id: 'erp',
        version: 1,
        suggestedFeatures: [
          'erp.materials',
          'erp.purchase_requests',
          'erp.inventory',
        ],
      },
      {
        id: 'crm',
        version: 1,
        suggestedFeatures: ['crm.customers', 'crm.opportunities'],
      },
      { id: 'blank', version: 1, suggestedFeatures: [] },
    ]);
  });

  it('returns copies instead of exposing the registry arrays', () => {
    const response = service.getFeatures();
    const firstFeature = response.features[0] as {
      resources: string[];
    };

    firstFeature.resources.push('unexpected-resource');

    expect(service.getFeature('erp.materials')?.resources).toEqual([
      'materials',
    ]);
    expect(CATALOG_FEATURES[0].resources).toEqual(['materials']);
  });
});
