import { Injectable } from '@nestjs/common';
import { validateBuilderFields } from './builder-field.validator';
import { validateBuilderGateways } from './builder-gateway.validator';
import { validateBuilderSteps } from './builder-step.validator';
import { validateBuilderTransitions } from './builder-transition.validator';
import type {
  BuilderApplicationDefinitionV1,
  BuilderValidationIssue,
} from './builder.types';
import { validateBuilderWorkflowGraph } from './builder-workflow-graph.validator';

export interface BuilderSemanticValidationResult {
  readonly valid: boolean;
  readonly issues: readonly BuilderValidationIssue[];
}

@Injectable()
export class BuilderSemanticValidator {
  validate(
    definition: BuilderApplicationDefinitionV1,
  ): BuilderSemanticValidationResult {
    const issues = [
      ...validateBuilderFields(definition.fields),
      ...validateBuilderSteps(definition),
      ...validateBuilderTransitions(definition),
      ...validateBuilderWorkflowGraph(definition),
      ...validateBuilderGateways(definition),
    ];

    return { valid: issues.length === 0, issues };
  }
}
