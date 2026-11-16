import type {
  BuilderApplicationDefinitionV1,
  BuilderComparison,
  BuilderFieldDefinition,
  BuilderStepDefinition,
  BuilderValidationIssue,
} from './builder.types';

type TransitionValidationInput = Pick<
  BuilderApplicationDefinitionV1,
  'fields' | 'steps' | 'transitions'
>;

export function validateBuilderTransitions(
  definition: TransitionValidationInput,
): BuilderValidationIssue[] {
  const issues: BuilderValidationIssue[] = [];
  const fieldsById = firstById(definition.fields);
  const stepsById = firstById(definition.steps);

  definition.transitions.forEach((transition, index) => {
    const path = `/transitions/${index}`;
    const source = stepsById.get(transition.from);
    const target = stepsById.get(transition.to);

    if (!source) {
      issues.push(
        issue(
          'UNKNOWN_TRANSITION_SOURCE',
          `${path}/from`,
          `Transition source '${transition.from}' does not exist.`,
        ),
      );
    }
    if (!target) {
      issues.push(
        issue(
          'UNKNOWN_TRANSITION_TARGET',
          `${path}/to`,
          `Transition target '${transition.to}' does not exist.`,
        ),
      );
    }

    validateConditionPlacement(source, transition.when, path, issues);

    transition.when?.all.forEach((comparison, comparisonIndex) => {
      validateComparison(
        comparison,
        `${path}/when/all/${comparisonIndex}`,
        fieldsById,
        issues,
        source?.id,
      );
    });
  });

  return issues;
}

function validateConditionPlacement(
  source: BuilderStepDefinition | undefined,
  condition: BuilderApplicationDefinitionV1['transitions'][number]['when'],
  path: string,
  issues: BuilderValidationIssue[],
): void {
  if (source?.type === 'gateway' && !condition) {
    issues.push(
      issue(
        'GATEWAY_CONDITION_REQUIRED',
        `${path}/when`,
        `Transition from gateway '${source.id}' must have a condition.`,
        source.id,
      ),
    );
  }

  if (source && source.type !== 'gateway' && condition) {
    issues.push(
      issue(
        'UNEXPECTED_TRANSITION_CONDITION',
        `${path}/when`,
        'Only transitions from a gateway may have a condition.',
        source.id,
      ),
    );
  }
}

function validateComparison(
  comparison: BuilderComparison,
  path: string,
  fieldsById: ReadonlyMap<string, BuilderFieldDefinition>,
  issues: BuilderValidationIssue[],
  stepId?: string,
): void {
  const field = fieldsById.get(comparison.field);
  if (!field) {
    issues.push(
      issue(
        'UNKNOWN_CONDITION_FIELD',
        `${path}/field`,
        `Condition references unknown field '${comparison.field}'.`,
        stepId,
      ),
    );
    return;
  }

  if (
    (comparison.op === 'lt' || comparison.op === 'gte') &&
    field.type !== 'integer'
  ) {
    issues.push(
      issue(
        'INVALID_CONDITION_OPERATOR',
        `${path}/op`,
        `Operator '${comparison.op}' requires an integer field.`,
        stepId,
      ),
    );
  }

  if (!isValueCompatible(field, comparison.value)) {
    issues.push(
      issue(
        'CONDITION_VALUE_TYPE_MISMATCH',
        `${path}/value`,
        `Condition value does not match field '${field.id}' of type '${field.type}'.`,
        stepId,
      ),
    );
  } else if (
    field.type === 'enum' &&
    typeof comparison.value === 'string' &&
    !field.options?.includes(comparison.value)
  ) {
    issues.push(
      issue(
        'CONDITION_VALUE_NOT_IN_ENUM',
        `${path}/value`,
        `Value '${comparison.value}' is not an option of enum field '${field.id}'.`,
        stepId,
      ),
    );
  }
}

function isValueCompatible(
  field: BuilderFieldDefinition,
  value: string | number | boolean,
): boolean {
  switch (field.type) {
    case 'integer':
      return typeof value === 'number' && Number.isInteger(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'string':
    case 'date':
    case 'enum':
      return typeof value === 'string';
  }
}

function firstById<T extends { readonly id: string }>(
  values: readonly T[],
): Map<string, T> {
  const result = new Map<string, T>();
  values.forEach((value) => {
    if (!result.has(value.id)) result.set(value.id, value);
  });
  return result;
}

function issue(
  code: string,
  path: string,
  message: string,
  stepId?: string,
): BuilderValidationIssue {
  return { severity: 'error', code, path, message, stepId };
}
