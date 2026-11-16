import type {
  BuilderApplicationDefinitionV1,
  BuilderStepDefinition,
  BuilderValidationIssue,
} from './builder.types';

type WorkflowGraphValidationInput = Pick<
  BuilderApplicationDefinitionV1,
  'steps' | 'transitions'
>;

export function validateBuilderWorkflowGraph(
  definition: WorkflowGraphValidationInput,
): BuilderValidationIssue[] {
  const issues: BuilderValidationIssue[] = [];
  const starts = definition.steps.filter(({ type }) => type === 'start');
  const ends = definition.steps.filter(({ type }) => type === 'end');

  if (starts.length !== 1) {
    issues.push(
      issue(
        'INVALID_START_COUNT',
        '/steps',
        `Workflow must contain exactly one start step; found ${starts.length}.`,
      ),
    );
  }
  if (ends.length === 0) {
    issues.push(
      issue(
        'END_STEP_REQUIRED',
        '/steps',
        'Workflow must contain at least one end step.',
      ),
    );
  }

  if (!canBuildGraph(definition)) return issues;

  const outgoing = adjacency(definition, false);
  const incoming = adjacency(definition, true);

  starts.forEach((start) => {
    if ((incoming.get(start.id)?.length ?? 0) > 0) {
      issues.push(
        issue(
          'START_HAS_INCOMING_TRANSITION',
          stepPath(definition.steps, start.id),
          `Start step '${start.id}' cannot have incoming transitions.`,
          start.id,
        ),
      );
    }
  });
  ends.forEach((end) => {
    if ((outgoing.get(end.id)?.length ?? 0) > 0) {
      issues.push(
        issue(
          'END_HAS_OUTGOING_TRANSITION',
          stepPath(definition.steps, end.id),
          `End step '${end.id}' cannot have outgoing transitions.`,
          end.id,
        ),
      );
    }
  });

  if (starts.length === 1) {
    reportUnreachableSteps(definition.steps, starts[0].id, outgoing, issues);
  }
  if (ends.length > 0) {
    reportStepsWithoutEndPath(definition.steps, ends, incoming, issues);
  }

  findCycleNodes(outgoing).forEach((stepId) => {
    issues.push(
      issue(
        'WORKFLOW_CYCLE_NOT_SUPPORTED',
        stepPath(definition.steps, stepId),
        `Step '${stepId}' participates in a cycle; Builder v1 does not support loops.`,
        stepId,
      ),
    );
  });

  return issues;
}

function canBuildGraph(definition: WorkflowGraphValidationInput): boolean {
  const stepIds = definition.steps.map(({ id }) => id);
  const knownIds = new Set(stepIds);
  const hasDuplicateStep = knownIds.size !== stepIds.length;
  const hasUnknownReference = definition.transitions.some(
    ({ from, to }) => !knownIds.has(from) || !knownIds.has(to),
  );
  return !hasDuplicateStep && !hasUnknownReference;
}

function adjacency(
  definition: WorkflowGraphValidationInput,
  reverse: boolean,
): Map<string, string[]> {
  const result = new Map(
    definition.steps.map(({ id }) => [id, [] as string[]]),
  );
  definition.transitions.forEach(({ from, to }) => {
    result.get(reverse ? to : from)?.push(reverse ? from : to);
  });
  return result;
}

function reportUnreachableSteps(
  steps: readonly BuilderStepDefinition[],
  startId: string,
  outgoing: ReadonlyMap<string, readonly string[]>,
  issues: BuilderValidationIssue[],
): void {
  const reachable = walk(startId, outgoing);
  steps.forEach((step) => {
    if (!reachable.has(step.id)) {
      issues.push(
        issue(
          'UNREACHABLE_STEP',
          stepPath(steps, step.id),
          `Step '${step.id}' cannot be reached from the start.`,
          step.id,
        ),
      );
    }
  });
}

function reportStepsWithoutEndPath(
  steps: readonly BuilderStepDefinition[],
  ends: readonly BuilderStepDefinition[],
  incoming: ReadonlyMap<string, readonly string[]>,
  issues: BuilderValidationIssue[],
): void {
  const canReachEnd = new Set<string>();
  ends.forEach((end) => {
    walk(end.id, incoming).forEach((id) => canReachEnd.add(id));
  });

  steps.forEach((step) => {
    if (!canReachEnd.has(step.id)) {
      issues.push(
        issue(
          'NO_PATH_TO_END',
          stepPath(steps, step.id),
          `Step '${step.id}' has no path to an end step.`,
          step.id,
        ),
      );
    }
  });
}

function walk(
  start: string,
  graph: ReadonlyMap<string, readonly string[]>,
): Set<string> {
  const visited = new Set<string>();
  const pending = [start];

  while (pending.length > 0) {
    const current = pending.pop();
    if (!current || visited.has(current)) continue;
    visited.add(current);
    pending.push(...(graph.get(current) ?? []));
  }

  return visited;
}

function findCycleNodes(
  graph: ReadonlyMap<string, readonly string[]>,
): Set<string> {
  const visited = new Set<string>();
  const activePath: string[] = [];
  const activeIndexes = new Map<string, number>();
  const cycleNodes = new Set<string>();

  function visit(node: string): void {
    if (visited.has(node)) return;

    visited.add(node);
    activeIndexes.set(node, activePath.length);
    activePath.push(node);

    (graph.get(node) ?? []).forEach((next) => {
      const cycleStart = activeIndexes.get(next);
      if (cycleStart !== undefined) {
        activePath.slice(cycleStart).forEach((id) => cycleNodes.add(id));
      } else {
        visit(next);
      }
    });

    activePath.pop();
    activeIndexes.delete(node);
  }

  graph.forEach((_targets, node) => visit(node));
  return cycleNodes;
}

function stepPath(steps: readonly BuilderStepDefinition[], id: string): string {
  return `/steps/${steps.findIndex((step) => step.id === id)}`;
}

function issue(
  code: string,
  path: string,
  message: string,
  stepId?: string,
): BuilderValidationIssue {
  return { severity: 'error', code, path, message, stepId };
}
