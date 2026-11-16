import { evaluateBuilderCondition } from './builder-condition.evaluator';

describe('evaluateBuilderCondition', () => {
  it('matches equality comparisons with AND semantics', () => {
    const result = evaluateBuilderCondition(
      {
        all: [
          { field: 'decision', op: 'eq', value: 'approved' },
          { field: 'urgent', op: 'eq', value: true },
        ],
      },
      { decision: 'approved', urgent: true },
    );

    expect(result).toBe(true);
  });

  it('returns false when any comparison in the group fails', () => {
    const result = evaluateBuilderCondition(
      {
        all: [
          { field: 'decision', op: 'eq', value: 'approved' },
          { field: 'urgent', op: 'eq', value: true },
        ],
      },
      { decision: 'approved', urgent: false },
    );

    expect(result).toBe(false);
  });

  it('evaluates integer less-than and greater-than-or-equal comparisons', () => {
    expect(
      evaluateBuilderCondition(
        { all: [{ field: 'amount', op: 'lt', value: 100 }] },
        { amount: 99 },
      ),
    ).toBe(true);
    expect(
      evaluateBuilderCondition(
        { all: [{ field: 'amount', op: 'gte', value: 100 }] },
        { amount: 100 },
      ),
    ).toBe(true);
  });

  it('does not match missing or incorrectly typed values', () => {
    const condition = {
      all: [{ field: 'amount', op: 'gte' as const, value: 100 }],
    };

    expect(evaluateBuilderCondition(condition, {})).toBe(false);
    expect(evaluateBuilderCondition(condition, { amount: '100' })).toBe(false);
  });
});
