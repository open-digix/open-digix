import type {
  BuilderApplicationDefinitionV1,
  BuilderFieldDefinition,
  BuilderValidationIssue,
} from './builder.types';

type StepValidationInput = Pick<
  BuilderApplicationDefinitionV1,
  'roles' | 'fields' | 'steps'
>;

export function validateBuilderSteps(
  definition: StepValidationInput,
): BuilderValidationIssue[] {
  const issues: BuilderValidationIssue[] = [];
  const roles = new Set<string>();
  const stepIds = new Set<string>();
  const fieldsById = new Map<string, BuilderFieldDefinition>();

  definition.fields.forEach((field) => {
    if (!fieldsById.has(field.id)) fieldsById.set(field.id, field);
  });

  definition.roles.forEach((role, index) => {
    if (roles.has(role)) {
      issues.push(
        issue(
          'DUPLICATE_ROLE',
          `/roles/${index}`,
          `Role identifier '${role}' is duplicated.`,
        ),
      );
    }
    roles.add(role);
  });

  definition.steps.forEach((step, index) => {
    const path = `/steps/${index}`;

    if (stepIds.has(step.id)) {
      issues.push(
        issue(
          'DUPLICATE_STEP',
          `${path}/id`,
          `Step identifier '${step.id}' is duplicated.`,
          step.id,
        ),
      );
    }
    stepIds.add(step.id);

    if (step.type === 'task') {
      validateTask(
        step.id,
        step.role,
        step.decisionField,
        step.noSelfApproval,
        path,
        roles,
        fieldsById,
        issues,
      );
    } else if (
      step.role !== undefined ||
      step.decisionField !== undefined ||
      step.noSelfApproval !== undefined
    ) {
      issues.push(
        issue(
          'TASK_PROPERTIES_NOT_ALLOWED',
          path,
          `Step '${step.id}' may use task properties only when its type is task.`,
          step.id,
        ),
      );
    }

    if (step.type === 'end' && !step.endState) {
      issues.push(
        issue(
          'END_STATE_REQUIRED',
          `${path}/endState`,
          `End step '${step.id}' must define an end state.`,
          step.id,
        ),
      );
    } else if (step.type !== 'end' && step.endState !== undefined) {
      issues.push(
        issue(
          'END_STATE_NOT_ALLOWED',
          `${path}/endState`,
          `Only end steps may define an end state.`,
          step.id,
        ),
      );
    }
  });

  return issues;
}

function validateTask(
  stepId: string,
  role: string | undefined,
  decisionField: string | undefined,
  noSelfApproval: boolean | undefined,
  path: string,
  roles: ReadonlySet<string>,
  fieldsById: ReadonlyMap<string, BuilderFieldDefinition>,
  issues: BuilderValidationIssue[],
): void {
  if (!role) {
    issues.push(
      issue(
        'TASK_ROLE_REQUIRED',
        `${path}/role`,
        `Task '${stepId}' must define a role.`,
        stepId,
      ),
    );
  } else if (!roles.has(role)) {
    issues.push(
      issue(
        'UNKNOWN_TASK_ROLE',
        `${path}/role`,
        `Task '${stepId}' references unknown role '${role}'.`,
        stepId,
      ),
    );
  }

  if (decisionField) {
    const field = fieldsById.get(decisionField);
    if (!field) {
      issues.push(
        issue(
          'UNKNOWN_DECISION_FIELD',
          `${path}/decisionField`,
          `Task '${stepId}' references unknown field '${decisionField}'.`,
          stepId,
        ),
      );
    } else if (field.type !== 'enum' && field.type !== 'boolean') {
      issues.push(
        issue(
          'INVALID_DECISION_FIELD_TYPE',
          `${path}/decisionField`,
          `Decision field '${field.id}' must be an enum or boolean.`,
          stepId,
        ),
      );
    }
  } else if (noSelfApproval) {
    issues.push(
      issue(
        'SELF_APPROVAL_RULE_REQUIRES_DECISION',
        `${path}/decisionField`,
        `Task '${stepId}' cannot block self-approval without a decision field.`,
        stepId,
      ),
    );
  }
}

function issue(
  code: string,
  path: string,
  message: string,
  stepId?: string,
): BuilderValidationIssue {
  return { severity: 'error', code, path, message, stepId };
}
