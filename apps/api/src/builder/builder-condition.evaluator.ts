import type {
  BuilderComparison,
  BuilderComparisonValue,
  BuilderCondition,
} from './builder.types';

export type BuilderConditionValues = Readonly<
  Record<string, BuilderComparisonValue | undefined>
>;

export function evaluateBuilderCondition(
  condition: BuilderCondition,
  values: BuilderConditionValues,
): boolean {
  return condition.all.every((comparison) =>
    evaluateComparison(comparison, values[comparison.field]),
  );
}

function evaluateComparison(
  comparison: BuilderComparison,
  actualValue: BuilderComparisonValue | undefined,
): boolean {
  if (actualValue === undefined) return false;

  switch (comparison.op) {
    case 'eq':
      return actualValue === comparison.value;
    case 'lt':
      return (
        typeof actualValue === 'number' &&
        typeof comparison.value === 'number' &&
        actualValue < comparison.value
      );
    case 'gte':
      return (
        typeof actualValue === 'number' &&
        typeof comparison.value === 'number' &&
        actualValue >= comparison.value
      );
  }
}
