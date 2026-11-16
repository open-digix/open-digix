import { BuilderManifestSchemaValidator } from './builder-manifest-schema.validator';
import { BuilderSemanticValidator } from './builder-semantic.validator';
import { BuilderSourceNormalizer } from './builder-source.normalizer';
import { purchaseMissingRoleFixture } from './fixtures/purchase-missing-role.fixture';
import { purchaseValidFixture } from './fixtures/purchase-valid.fixture';
import { purchaseWrongBranchFixture } from './fixtures/purchase-wrong-branch.fixture';
import { purchaseWrongFieldTypeFixture } from './fixtures/purchase-wrong-field-type.fixture';

describe('M2 acceptance — TC-BLD-01: source mapping', () => {
  const normalizer = new BuilderSourceNormalizer();
  const schemaValidator = new BuilderManifestSchemaValidator();

  it('normalizes purchase source without AI and maps each section to its segment', () => {
    const sourceRevisionId = 'src-rev-01';
    const rolesSegId = 'seg-roles-01';
    const inputsSegId = 'seg-inputs-01';
    const stepsSegId = 'seg-steps-01';
    const branchesSegId = 'seg-branches-01';
    const outputsSegId = 'seg-outputs-01';

    const result = normalizer.normalize({
      appId: 'purchase-request',
      tenantId: 'acme',
      version: 1,
      name: 'Purchase Request',
      sourceRevisionId,
      sections: {
        roles: 'requester: Người yêu cầu\nmanager: Quản lý\nfinance: Tài chính',
        inputs: [
          'item_name: string, required',
          'amount: integer, required, min: 1',
          'manager_decision: enum, options: approved, rejected',
          'finance_decision: enum, options: approved, rejected',
        ].join('\n'),
        steps: [
          'manager_review: manager, decisionField: manager_decision',
          'finance_review: finance, decisionField: finance_decision',
        ].join('\n'),
        branches: [
          'manager_decision = approved -> finance_review',
          'manager_decision = rejected -> declined',
          'finance_decision = approved -> accepted',
          'finance_decision = rejected -> declined',
        ].join('\n'),
        outputs: 'accepted: approved\ndeclined: rejected',
      },
      segments: [
        {
          id: rolesSegId,
          section: 'roles',
          text: 'requester, manager, finance',
        },
        {
          id: inputsSegId,
          section: 'inputs',
          text: 'item_name, amount, manager_decision, finance_decision',
        },
        {
          id: stepsSegId,
          section: 'steps',
          text: 'manager_review, finance_review',
        },
        { id: branchesSegId, section: 'branches', text: 'routing conditions' },
        { id: outputsSegId, section: 'outputs', text: 'accepted, declined' },
      ],
    });

    expect(result.definition.roles).toContain('requester');
    expect(result.definition.roles).toContain('manager');
    expect(result.definition.roles).toContain('finance');

    const rolesMappings = result.sourceMappings.filter(
      (m) => m.targetType === 'role',
    );
    expect(rolesMappings.length).toBeGreaterThan(0);
    rolesMappings.forEach((m) => {
      expect(m.sourceRevisionId).toBe(sourceRevisionId);
      expect(m.segmentIds.length).toBeGreaterThan(0);
    });

    const fieldsMappings = result.sourceMappings.filter(
      (m) => m.targetType === 'field',
    );
    expect(fieldsMappings.length).toBeGreaterThan(0);
    fieldsMappings.forEach((m) => {
      expect(m.sourceRevisionId).toBe(sourceRevisionId);
    });

    const stepsMappings = result.sourceMappings.filter(
      (m) => m.targetType === 'step',
    );
    expect(stepsMappings.length).toBeGreaterThan(0);

    const managerRoleMapping = rolesMappings.find(
      (m) => m.targetId === 'manager',
    );
    expect(managerRoleMapping).toBeDefined();
    expect(managerRoleMapping?.segmentIds[0]).toBe(rolesSegId);

    const itemNameMapping = fieldsMappings.find(
      (m) => m.targetId === 'item_name',
    );
    expect(itemNameMapping).toBeDefined();
    expect(itemNameMapping?.segmentIds[0]).toBe(inputsSegId);

    const schemaResult = schemaValidator.validate(result.definition);
    expect(schemaResult.valid).toBe(true);
  });
});

describe('M2 acceptance — TC-BLD-02: configuration error reporting', () => {
  const schemaValidator = new BuilderManifestSchemaValidator();
  const semanticValidator = new BuilderSemanticValidator();

  it('reports UNKNOWN_TASK_ROLE when task references a role not in the roles list', () => {
    const schemaResult = schemaValidator.validate(purchaseMissingRoleFixture);
    expect(schemaResult.valid).toBe(true);

    const semanticResult = semanticValidator.validate(
      purchaseMissingRoleFixture,
    );
    expect(semanticResult.valid).toBe(false);

    const unknownRoleIssue = semanticResult.issues.find(
      (i) => i.code === 'UNKNOWN_TASK_ROLE',
    );
    expect(unknownRoleIssue).toBeDefined();
    expect(unknownRoleIssue?.stepId).toBe('manager_review');
    expect(unknownRoleIssue?.path).toContain('role');
  });

  it('reports MISSING_GATEWAY_BRANCH when a gateway does not cover all inputs', () => {
    const schemaResult = schemaValidator.validate(purchaseWrongBranchFixture);
    expect(schemaResult.valid).toBe(true);

    const semanticResult = semanticValidator.validate(
      purchaseWrongBranchFixture,
    );
    expect(semanticResult.valid).toBe(false);

    const gatewayIssue = semanticResult.issues.find(
      (i) => i.code === 'MISSING_GATEWAY_BRANCH',
    );
    expect(gatewayIssue).toBeDefined();
    expect(gatewayIssue?.stepId).toBe('manager_route');
  });

  it('reports INVALID_DECISION_FIELD_TYPE when decisionField is not enum or boolean', () => {
    const schemaResult = schemaValidator.validate(
      purchaseWrongFieldTypeFixture,
    );
    expect(schemaResult.valid).toBe(true);

    const semanticResult = semanticValidator.validate(
      purchaseWrongFieldTypeFixture,
    );
    expect(semanticResult.valid).toBe(false);

    const typeIssue = semanticResult.issues.find(
      (i) => i.code === 'INVALID_DECISION_FIELD_TYPE',
    );
    expect(typeIssue).toBeDefined();
    expect(typeIssue?.stepId).toBe('manager_review');
  });

  it('schema validator rejects manifest missing required roles field', () => {
    const noRoles = { ...purchaseValidFixture, roles: undefined };
    const result = schemaValidator.validate(noRoles);
    expect(result.valid).toBe(false);
    const issue = result.issues.find((i) => i.path.includes('roles'));
    expect(issue).toBeDefined();
  });

  it('schema validator rejects manifest missing required steps field', () => {
    const noSteps = { ...purchaseValidFixture, steps: undefined };
    const result = schemaValidator.validate(noSteps);
    expect(result.valid).toBe(false);
    const issue = result.issues.find((i) => i.path.includes('steps'));
    expect(issue).toBeDefined();
  });

  it('schema validator rejects manifest missing required transitions field', () => {
    const noTransitions = { ...purchaseValidFixture, transitions: undefined };
    const result = schemaValidator.validate(noTransitions);
    expect(result.valid).toBe(false);
    const issue = result.issues.find((i) => i.path.includes('transitions'));
    expect(issue).toBeDefined();
  });
});

describe('M2 acceptance — TC-BLD-03: manual edit without AI produces valid manifest', () => {
  const normalizer = new BuilderSourceNormalizer();
  const schemaValidator = new BuilderManifestSchemaValidator();
  const semanticValidator = new BuilderSemanticValidator();

  it('valid fixture passes schema and semantic validation', () => {
    const schemaResult = schemaValidator.validate(purchaseValidFixture);
    expect(schemaResult.valid).toBe(true);
    expect(schemaResult.issues).toHaveLength(0);

    const semanticResult = semanticValidator.validate(purchaseValidFixture);
    expect(semanticResult.valid).toBe(true);
    expect(semanticResult.issues).toHaveLength(0);
  });

  it('normalize then manually patch roles produces a valid manifest', () => {
    const sourceRevisionId = 'src-rev-manual-01';

    const normalizeResult = normalizer.normalize({
      appId: 'purchase-request',
      tenantId: 'acme',
      version: 1,
      name: 'Purchase Request',
      sourceRevisionId,
      sections: {
        roles: 'requester\nmanager\nfinance',
        inputs:
          'item_name: string, required\namount: integer, required, min: 1\nmanager_decision: enum, options: approved, rejected\nfinance_decision: enum, options: approved, rejected',
        steps:
          'manager_review: manager, decisionField: manager_decision\nfinance_review: finance, decisionField: finance_decision',
        branches:
          'manager_decision = approved -> finance_review\nmanager_decision = rejected -> declined\nfinance_decision = approved -> accepted\nfinance_decision = rejected -> declined',
        outputs: 'accepted: approved\ndeclined: rejected',
      },
      segments: [
        { id: 'seg-r', section: 'roles', text: 'roles' },
        { id: 'seg-i', section: 'inputs', text: 'inputs' },
        { id: 'seg-s', section: 'steps', text: 'steps' },
        { id: 'seg-b', section: 'branches', text: 'branches' },
        { id: 'seg-o', section: 'outputs', text: 'outputs' },
      ],
    });

    const patched = {
      ...normalizeResult.definition,
      roles: ['requester', 'manager', 'finance'],
    };

    const schemaResult = schemaValidator.validate(patched);
    expect(schemaResult.valid).toBe(true);

    const semanticResult = semanticValidator.validate(patched);
    expect(semanticResult.valid).toBe(true);
  });

  it('cross-tenant isolation: normalizer uses tenantId from params, not from fixture', () => {
    const result = normalizer.normalize({
      appId: purchaseValidFixture.appId,
      tenantId: 'other-tenant',
      version: purchaseValidFixture.version,
      name: purchaseValidFixture.name,
      sourceRevisionId: 'src-rev-cross-tenant',
      sections: { roles: 'requester\nmanager' },
      segments: [],
    });

    expect(result.definition.tenantId).toBe('other-tenant');
    expect(result.definition.tenantId).not.toBe(purchaseValidFixture.tenantId);
  });
});
