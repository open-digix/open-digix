import { BuilderManifestSchemaValidator } from './builder-manifest-schema.validator';
import { BuilderSemanticValidator } from './builder-semantic.validator';
import { BuilderSourceNormalizer } from './builder-source.normalizer';

describe('BuilderSourceNormalizer', () => {
  const normalizer = new BuilderSourceNormalizer();
  const schemaValidator = new BuilderManifestSchemaValidator();
  const semanticValidator = new BuilderSemanticValidator();

  it('normalizes a laptop purchase workflow without AI', () => {
    const result = normalizer.normalize({
      appId: 'laptop_request',
      tenantId: 'tenant_alpha',
      version: 1,
      name: 'Đề nghị cấp laptop',
      sourceRevisionId: '11111111-1111-4111-8111-111111111111',
      sections: {
        roles: 'employee: Nhân viên\nmanager: Quản lý\ndirector: Giám đốc',
        inputs: [
          'device_name: string, required',
          'estimated_price: integer, required, min: 1, max: 50000000',
          'reason: string, required',
          'needed_date: date, required',
          'manager_decision: enum, options: approved, rejected',
          'director_decision: enum, options: approved, rejected',
        ].join('\n'),
        steps: [
          'manager_review: manager, decisionField: manager_decision',
          'director_review: director, decisionField: director_decision',
        ].join('\n'),
        branches: [
          'manager_decision = rejected -> declined',
          'manager_decision = approved AND estimated_price < 20000000 -> accepted',
          'manager_decision = approved AND estimated_price >= 20000000 -> director_review',
          'director_decision = approved -> accepted',
          'director_decision = rejected -> declined',
        ].join('\n'),
        outputs: 'accepted: approved\ndeclined: rejected',
        exceptions: 'Escalate when no manager exists.',
      },
      segments: [
        { id: 'roles_1', section: 'roles', text: '...' },
        { id: 'inputs_1', section: 'inputs', text: '...' },
        { id: 'steps_1', section: 'steps', text: '...' },
        { id: 'branches_1', section: 'branches', text: '...' },
        { id: 'outputs_1', section: 'outputs', text: '...' },
        { id: 'exceptions_1', section: 'exceptions', text: '...' },
      ],
    });

    const validation = schemaValidator.validate(result.definition);
    expect(validation.valid).toBe(true);

    const semantic = semanticValidator.validate(result.definition);
    expect(semantic.valid).toBe(true);

    expect(result.definition.roles).toEqual([
      'employee',
      'manager',
      'director',
    ]);

    expect(result.definition.fields.map((f) => f.id)).toEqual([
      'device_name',
      'estimated_price',
      'reason',
      'needed_date',
      'manager_decision',
      'director_decision',
    ]);
    const priceField = result.definition.fields.find(
      (f) => f.id === 'estimated_price',
    );
    expect(priceField?.type).toBe('integer');
    expect(priceField?.min).toBe(1);
    expect(priceField?.max).toBe(50000000);

    const stepIds = result.definition.steps.map((s) => s.id);
    expect(stepIds).toContain('submitted');
    expect(stepIds).toContain('manager_review');
    expect(stepIds).toContain('manager_route');
    expect(stepIds).toContain('director_review');
    expect(stepIds).toContain('accepted');
    expect(stepIds).toContain('declined');

    expect(result.sourceMappings.length).toBeGreaterThan(0);
    const roleMappings = result.sourceMappings.filter(
      (m) => m.targetType === 'role',
    );
    expect(roleMappings).toHaveLength(3);
    expect(roleMappings[0]?.segmentIds).toContain('roles_1');

    const fieldMappings = result.sourceMappings.filter(
      (m) => m.targetType === 'field',
    );
    expect(fieldMappings).toHaveLength(6);

    expect(result.openIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'UNHANDLED_EXCEPTION_NOTE',
          blocking: false,
        }),
      ]),
    );
  });

  it('normalizes a leave request workflow and matches expected structure', () => {
    const result = normalizer.normalize({
      appId: 'leave_request',
      tenantId: 'tenant_beta',
      version: 1,
      name: 'Đăng ký nghỉ phép',
      sourceRevisionId: '22222222-2222-4222-8222-222222222222',
      sections: {
        roles: 'employee, manager, hr, publisher',
        inputs: [
          'start_date: date, required',
          'days: integer, required, min: 1, max: 30',
          'leave_type: enum, required, options: annual, unpaid',
          'reason: string, required, min: 5, max: 500',
          'manager_decision: enum, options: approved, rejected',
          'hr_decision: enum, options: approved, rejected',
        ].join('\n'),
        steps: [
          'manager_review: manager, decisionField: manager_decision',
          'hr_review: hr, decisionField: hr_decision',
        ].join('\n'),
        branches: [
          'manager_decision = rejected -> declined',
          'manager_decision = approved AND days < 3 -> accepted',
          'manager_decision = approved AND days >= 3 -> hr_review',
          'hr_decision = approved -> accepted',
          'hr_decision = rejected -> declined',
        ].join('\n'),
        outputs: 'accepted: approved, declined: rejected',
      },
      segments: [
        { id: 'roles_1', section: 'roles', text: '...' },
        { id: 'inputs_1', section: 'inputs', text: '...' },
        { id: 'steps_1', section: 'steps', text: '...' },
        { id: 'branches_1', section: 'branches', text: '...' },
        { id: 'outputs_1', section: 'outputs', text: '...' },
      ],
    });

    const validation = schemaValidator.validate(result.definition);
    expect(validation.valid).toBe(true);

    const semantic = semanticValidator.validate(result.definition);
    expect(semantic.valid).toBe(true);

    expect(result.definition.roles).toEqual([
      'employee',
      'manager',
      'hr',
      'publisher',
    ]);
    expect(result.definition.transitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ from: 'submitted', to: 'manager_review' }),
        expect.objectContaining({
          from: 'manager_route',
          to: 'declined',
          when: {
            all: [{ field: 'manager_decision', op: 'eq', value: 'rejected' }],
          },
        }),
        expect.objectContaining({
          from: 'manager_route',
          to: 'accepted',
          when: {
            all: [
              { field: 'manager_decision', op: 'eq', value: 'approved' },
              { field: 'days', op: 'lt', value: 3 },
            ],
          },
        }),
      ]),
    );
  });

  it('flags blocking open issues when tasks lack roles or conditions refer to unknown fields', () => {
    const result = normalizer.normalize({
      appId: 'incomplete_request',
      tenantId: 'tenant_alpha',
      version: 1,
      name: 'Incomplete Request',
      sourceRevisionId: '33333333-3333-4333-8333-333333333333',
      sections: {
        inputs: 'title: string',
        steps: 'anonymous_task: no role here',
        branches: 'mystery_field = 10 -> accepted',
      },
      segments: [
        { id: 'inputs_1', section: 'inputs', text: '...' },
        { id: 'steps_1', section: 'steps', text: '...' },
        { id: 'branches_1', section: 'branches', text: '...' },
      ],
    });

    expect(result.openIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'TASK_MISSING_ROLE',
          blocking: true,
        }),
        expect.objectContaining({
          code: 'UNKNOWN_CONDITION_FIELD',
          targetId: 'mystery_field',
          blocking: true,
        }),
      ]),
    );
  });

  it('provides safe fallbacks and schema compliance for empty/minimal descriptions', () => {
    const result = normalizer.normalize({
      appId: 'blank_request',
      tenantId: 'tenant_alpha',
      version: 1,
      name: 'Blank Request',
      sourceRevisionId: '44444444-4444-4444-8444-444444444444',
      sections: {},
      segments: [],
    });

    const validation = schemaValidator.validate(result.definition);
    expect(validation.valid).toBe(true);
    expect(result.openIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'NO_ROLES_DEFINED',
          blocking: true,
        }),
      ]),
    );
  });
});
