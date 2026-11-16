import { validateBuilderTransitions } from './builder-transition.validator';
import type { BuilderApplicationDefinitionV1 } from './builder.types';

describe('validateBuilderTransitions', () => {
  it('accepts valid transition references and conditions', () => {
    expect(validateBuilderTransitions(validDefinition())).toEqual([]);
  });

  it('rejects unknown transition source and target steps', () => {
    const definition = validDefinition();
    definition.transitions[0].from = 'missing_source';
    definition.transitions[0].to = 'missing_target';

    expect(codes(validateBuilderTransitions(definition))).toEqual(
      expect.arrayContaining([
        'UNKNOWN_TRANSITION_SOURCE',
        'UNKNOWN_TRANSITION_TARGET',
      ]),
    );
  });

  it('requires conditions only on transitions from gateways', () => {
    const definition = validDefinition();
    definition.transitions[0].when = {
      all: [{ field: 'amount', op: 'gte', value: 1 }],
    };
    definition.transitions[1].when = undefined;

    expect(codes(validateBuilderTransitions(definition))).toEqual(
      expect.arrayContaining([
        'UNEXPECTED_TRANSITION_CONDITION',
        'GATEWAY_CONDITION_REQUIRED',
      ]),
    );
  });

  it('rejects unknown condition fields and mismatched values', () => {
    const definition = validDefinition();
    definition.transitions[1].when!.all[0].field = 'missing_field';
    definition.transitions[2].when!.all[0].value = true;

    expect(codes(validateBuilderTransitions(definition))).toEqual(
      expect.arrayContaining([
        'UNKNOWN_CONDITION_FIELD',
        'CONDITION_VALUE_TYPE_MISMATCH',
      ]),
    );
  });

  it('checks comparison operators and enum options', () => {
    const definition = validDefinition();
    definition.transitions[1].when!.all[0].op = 'lt';
    definition.transitions[2].when!.all[0].value = 'pending';

    expect(codes(validateBuilderTransitions(definition))).toEqual(
      expect.arrayContaining([
        'INVALID_CONDITION_OPERATOR',
        'CONDITION_VALUE_NOT_IN_ENUM',
      ]),
    );
  });
});

function validDefinition(): MutableTransitionValidationInput {
  return {
    fields: [
      { id: 'amount', type: 'integer', required: true, min: 1 },
      {
        id: 'decision',
        type: 'enum',
        required: false,
        options: ['approved', 'rejected'],
      },
    ],
    steps: [
      { id: 'submitted', type: 'start' },
      { id: 'route_decision', type: 'gateway' },
      { id: 'approved', type: 'end', endState: 'approved' },
      { id: 'rejected', type: 'end', endState: 'rejected' },
    ],
    transitions: [
      { from: 'submitted', to: 'route_decision' },
      {
        from: 'route_decision',
        to: 'approved',
        when: {
          all: [{ field: 'decision', op: 'eq', value: 'approved' }],
        },
      },
      {
        from: 'route_decision',
        to: 'rejected',
        when: {
          all: [{ field: 'decision', op: 'eq', value: 'rejected' }],
        },
      },
    ],
  };
}

function codes(issues: readonly { code: string }[]): string[] {
  return issues.map(({ code }) => code);
}

type TransitionValidationInput = Pick<
  BuilderApplicationDefinitionV1,
  'fields' | 'steps' | 'transitions'
>;

type Mutable<T> = T extends readonly (infer Item)[]
  ? Mutable<Item>[]
  : T extends object
    ? { -readonly [Property in keyof T]: Mutable<T[Property]> }
    : T;

type MutableTransitionValidationInput = Mutable<TransitionValidationInput>;
