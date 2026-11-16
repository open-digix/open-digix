import { validateBuilderWorkflowGraph } from './builder-workflow-graph.validator';
import type { BuilderApplicationDefinitionV1 } from './builder.types';

describe('validateBuilderWorkflowGraph', () => {
  it('accepts a connected workflow from start to end', () => {
    expect(validateBuilderWorkflowGraph(validDefinition())).toEqual([]);
  });

  it('requires exactly one start and at least one end', () => {
    const definition = validDefinition();
    definition.steps = [
      { id: 'first_start', type: 'start' },
      { id: 'second_start', type: 'start' },
      { id: 'review', type: 'task', role: 'reviewer' },
    ];
    definition.transitions = [];

    expect(codes(validateBuilderWorkflowGraph(definition))).toEqual(
      expect.arrayContaining(['INVALID_START_COUNT', 'END_STEP_REQUIRED']),
    );
  });

  it('rejects incoming start and outgoing end transitions', () => {
    const definition = validDefinition();
    definition.transitions.push({ from: 'approved', to: 'submitted' });

    expect(codes(validateBuilderWorkflowGraph(definition))).toEqual(
      expect.arrayContaining([
        'START_HAS_INCOMING_TRANSITION',
        'END_HAS_OUTGOING_TRANSITION',
      ]),
    );
  });

  it('reports unreachable steps and paths that cannot reach an end', () => {
    const definition = validDefinition();
    definition.steps.push({
      id: 'orphan_review',
      type: 'task',
      role: 'reviewer',
    });

    const issues = validateBuilderWorkflowGraph(definition);

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'UNREACHABLE_STEP',
          stepId: 'orphan_review',
        }),
        expect.objectContaining({
          code: 'NO_PATH_TO_END',
          stepId: 'orphan_review',
        }),
      ]),
    );
  });

  it('reports only steps that participate in a cycle', () => {
    const definition = validDefinition();
    definition.steps.splice(2, 0, {
      id: 'second_review',
      type: 'task',
      role: 'reviewer',
    });
    definition.transitions = [
      { from: 'submitted', to: 'review' },
      { from: 'review', to: 'second_review' },
      { from: 'second_review', to: 'review' },
      { from: 'second_review', to: 'approved' },
    ];

    const cycleStepIds = validateBuilderWorkflowGraph(definition)
      .filter(({ code }) => code === 'WORKFLOW_CYCLE_NOT_SUPPORTED')
      .map(({ stepId }) => stepId);

    expect(cycleStepIds).toEqual(['review', 'second_review']);
  });

  it('avoids misleading graph errors while step references are invalid', () => {
    const definition = validDefinition();
    definition.transitions[0].to = 'missing_step';

    expect(validateBuilderWorkflowGraph(definition)).toEqual([]);
  });
});

function validDefinition(): MutableWorkflowGraphValidationInput {
  return {
    steps: [
      { id: 'submitted', type: 'start' },
      { id: 'review', type: 'task', role: 'reviewer' },
      { id: 'approved', type: 'end', endState: 'approved' },
    ],
    transitions: [
      { from: 'submitted', to: 'review' },
      { from: 'review', to: 'approved' },
    ],
  };
}

function codes(issues: readonly { code: string }[]): string[] {
  return issues.map(({ code }) => code);
}

type WorkflowGraphValidationInput = Pick<
  BuilderApplicationDefinitionV1,
  'steps' | 'transitions'
>;

type Mutable<T> = T extends readonly (infer Item)[]
  ? Mutable<Item>[]
  : T extends object
    ? { -readonly [Property in keyof T]: Mutable<T[Property]> }
    : T;

type MutableWorkflowGraphValidationInput =
  Mutable<WorkflowGraphValidationInput>;
