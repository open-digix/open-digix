import { validateBuilderSteps } from './builder-step.validator';
import type { BuilderApplicationDefinitionV1 } from './builder.types';

describe('validateBuilderSteps', () => {
  it('accepts valid task and end-step references', () => {
    expect(validateBuilderSteps(validDefinition())).toEqual([]);
  });

  it('rejects duplicate role and step identifiers', () => {
    const definition = validDefinition();
    definition.roles.push('reviewer');
    definition.steps.push({ ...definition.steps[1] });

    const issues = validateBuilderSteps(definition);

    expect(codes(issues)).toEqual(
      expect.arrayContaining(['DUPLICATE_ROLE', 'DUPLICATE_STEP']),
    );
  });

  it('requires every task to reference an existing role', () => {
    const definition = validDefinition();
    definition.steps.push({ id: 'unassigned', type: 'task' });
    definition.steps[1].role = 'missing_role';

    const issues = validateBuilderSteps(definition);

    expect(codes(issues)).toEqual(
      expect.arrayContaining(['TASK_ROLE_REQUIRED', 'UNKNOWN_TASK_ROLE']),
    );
  });

  it('checks optional decision fields and self-approval rules', () => {
    const definition = validDefinition();
    definition.steps[1].decisionField = 'request_title';
    definition.steps.push({
      id: 'missing_decision',
      type: 'task',
      role: 'reviewer',
      decisionField: 'unknown_field',
    });
    definition.steps.push({
      id: 'self_approval_rule',
      type: 'task',
      role: 'reviewer',
      noSelfApproval: true,
    });

    const issues = validateBuilderSteps(definition);

    expect(codes(issues)).toEqual(
      expect.arrayContaining([
        'INVALID_DECISION_FIELD_TYPE',
        'UNKNOWN_DECISION_FIELD',
        'SELF_APPROVAL_RULE_REQUIRES_DECISION',
      ]),
    );
  });

  it('allows task properties only on tasks and endState only on ends', () => {
    const definition = validDefinition();
    definition.steps[0].role = 'requester';
    definition.steps[0].endState = 'approved';
    definition.steps[2].endState = undefined;

    const issues = validateBuilderSteps(definition);

    expect(codes(issues)).toEqual(
      expect.arrayContaining([
        'TASK_PROPERTIES_NOT_ALLOWED',
        'END_STATE_NOT_ALLOWED',
        'END_STATE_REQUIRED',
      ]),
    );
  });
});

function validDefinition(): MutableStepValidationInput {
  return {
    roles: ['requester', 'reviewer'],
    fields: [
      { id: 'request_title', type: 'string', required: true },
      {
        id: 'decision',
        type: 'enum',
        required: false,
        options: ['approved', 'rejected'],
      },
    ],
    steps: [
      { id: 'submitted', type: 'start' },
      {
        id: 'review',
        type: 'task',
        role: 'reviewer',
        decisionField: 'decision',
        noSelfApproval: true,
      },
      { id: 'approved', type: 'end', endState: 'approved' },
    ],
  };
}

function codes(issues: readonly { code: string }[]): string[] {
  return issues.map(({ code }) => code);
}

type StepValidationInput = Pick<
  BuilderApplicationDefinitionV1,
  'roles' | 'fields' | 'steps'
>;

type Mutable<T> = T extends readonly (infer Item)[]
  ? Mutable<Item>[]
  : T extends object
    ? { -readonly [Property in keyof T]: Mutable<T[Property]> }
    : T;

type MutableStepValidationInput = Mutable<StepValidationInput>;
