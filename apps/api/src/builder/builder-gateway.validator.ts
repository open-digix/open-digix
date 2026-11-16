import {
  evaluateBuilderCondition,
  type BuilderConditionValues,
} from './builder-condition.evaluator';
import { validateBuilderTransitions } from './builder-transition.validator';
import type {
  BuilderApplicationDefinitionV1,
  BuilderComparison,
  BuilderComparisonValue,
  BuilderFieldDefinition,
  BuilderValidationIssue,
} from './builder.types';

type GatewayValidationInput = Pick<
  BuilderApplicationDefinitionV1,
  'fields' | 'steps' | 'transitions'
>;

type BuilderTransition = BuilderApplicationDefinitionV1['transitions'][number];

const MAX_GATEWAY_CASES = 4096;

export function validateBuilderGateways(
  definition: GatewayValidationInput,
): BuilderValidationIssue[] {
  const issues: BuilderValidationIssue[] = [];
  const fieldsById = new Map(
    definition.fields.map((field) => [field.id, field]),
  );

  definition.steps.forEach((step, stepIndex) => {
    if (step.type !== 'gateway') return;

    const outgoing = definition.transitions.filter(
      ({ from }) => from === step.id,
    );
    const path = `/steps/${stepIndex}`;

    if (outgoing.length === 0) {
      issues.push(
        issue(
          'MISSING_GATEWAY_BRANCH',
          path,
          `Gateway '${step.id}' has no outgoing branch.`,
          step.id,
        ),
      );
      return;
    }

    if (!canAnalyze(definition, outgoing)) return;

    const assignments = buildAssignments(outgoing, fieldsById);
    if (!assignments) {
      issues.push(
        issue(
          'GATEWAY_ANALYSIS_LIMIT_EXCEEDED',
          path,
          `Gateway '${step.id}' exceeds the ${MAX_GATEWAY_CASES}-case analysis limit.`,
          step.id,
        ),
      );
      return;
    }

    let missingBranch = false;
    let ambiguousBranch = false;
    assignments.forEach((values) => {
      const matchCount = outgoing.filter(({ when }) =>
        evaluateBuilderCondition(when!, values),
      ).length;
      if (matchCount === 0) missingBranch = true;
      if (matchCount > 1) ambiguousBranch = true;
    });

    if (missingBranch) {
      issues.push(
        issue(
          'MISSING_GATEWAY_BRANCH',
          path,
          `Gateway '${step.id}' does not cover every valid input.`,
          step.id,
        ),
      );
    }
    if (ambiguousBranch) {
      issues.push(
        issue(
          'AMBIGUOUS_GATEWAY_BRANCH',
          path,
          `Gateway '${step.id}' has overlapping branch conditions.`,
          step.id,
        ),
      );
    }
  });

  return issues;
}

function canAnalyze(
  definition: GatewayValidationInput,
  outgoing: readonly BuilderTransition[],
): boolean {
  return (
    validateBuilderTransitions({
      fields: definition.fields,
      steps: definition.steps,
      transitions: outgoing,
    }).length === 0
  );
}

function buildAssignments(
  transitions: readonly BuilderTransition[],
  fieldsById: ReadonlyMap<string, BuilderFieldDefinition>,
): BuilderConditionValues[] | undefined {
  const comparisons = transitions.flatMap(({ when }) => when?.all ?? []);
  const fieldIds = [...new Set(comparisons.map(({ field }) => field))];
  let assignments: BuilderConditionValues[] = [{}];

  for (const fieldId of fieldIds) {
    const field = fieldsById.get(fieldId);
    if (!field) return [];

    const domain = fieldDomain(
      field,
      comparisons.filter(
        ({ field: comparedField }) => comparedField === fieldId,
      ),
    );
    if (assignments.length * domain.length > MAX_GATEWAY_CASES) {
      return undefined;
    }

    assignments = assignments.flatMap((current) =>
      domain.map((value) => ({ ...current, [fieldId]: value })),
    );
  }

  return assignments;
}

function fieldDomain(
  field: BuilderFieldDefinition,
  comparisons: readonly BuilderComparison[],
): BuilderComparisonValue[] {
  switch (field.type) {
    case 'enum':
      return [...(field.options ?? [])];
    case 'boolean':
      return [false, true];
    case 'integer':
      return integerDomain(field, comparisons);
    case 'string':
      return stringDomain(field, comparisons);
    case 'date':
      return stringDomain(field, comparisons);
  }
}

function integerDomain(
  field: BuilderFieldDefinition,
  comparisons: readonly BuilderComparison[],
): number[] {
  const candidates = new Set<number>();
  if (field.min !== undefined) candidates.add(field.min);
  if (field.max !== undefined) candidates.add(field.max);

  comparisons.forEach(({ value }) => {
    if (typeof value !== 'number' || !Number.isInteger(value)) return;
    candidates.add(value - 1);
    candidates.add(value);
    candidates.add(value + 1);
  });

  if (candidates.size === 0) candidates.add(0);
  return [...candidates]
    .filter(
      (value) =>
        (field.min === undefined || value >= field.min) &&
        (field.max === undefined || value <= field.max),
    )
    .sort((left, right) => left - right);
}

function stringDomain(
  field: BuilderFieldDefinition,
  comparisons: readonly BuilderComparison[],
): string[] {
  const values = new Set(
    comparisons
      .map(({ value }) => value)
      .filter((value): value is string => typeof value === 'string')
      .filter((value) => isValidLength(field, value)),
  );
  const otherValue = findOtherString(field, values);
  if (otherValue !== undefined) values.add(otherValue);
  return [...values];
}

function findOtherString(
  field: BuilderFieldDefinition,
  existing: ReadonlySet<string>,
): string | undefined {
  const minLength = Math.max(field.min ?? 0, 0);
  const maxLength = field.max ?? Number.POSITIVE_INFINITY;

  for (
    let length = minLength;
    length <= Math.min(maxLength, minLength + 2);
    length++
  ) {
    for (let code = 97; code <= 122; code++) {
      const candidate = String.fromCodePoint(code).repeat(length);
      if (!existing.has(candidate)) return candidate;
    }
  }
  return undefined;
}

function isValidLength(field: BuilderFieldDefinition, value: string): boolean {
  return (
    (field.min === undefined || value.length >= field.min) &&
    (field.max === undefined || value.length <= field.max)
  );
}

function issue(
  code: string,
  path: string,
  message: string,
  stepId: string,
): BuilderValidationIssue {
  return { severity: 'error', code, path, message, stepId };
}
