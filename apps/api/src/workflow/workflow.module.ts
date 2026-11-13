import { Module } from '@nestjs/common';
import { loadWorkflowConfig } from './workflow.config';
import { WORKFLOW_CONFIG } from './workflow.constants';

@Module({
  providers: [
    {
      provide: WORKFLOW_CONFIG,
      useFactory: loadWorkflowConfig,
    },
  ],
  exports: [WORKFLOW_CONFIG],
})
export class WorkflowModule {}
