import { Module } from '@nestjs/common';
import { WorkflowClient } from './workflow.client';
import { loadWorkflowConfig } from './workflow.config';
import { WORKFLOW_CONFIG } from './workflow.constants';

@Module({
  providers: [
    {
      provide: WORKFLOW_CONFIG,
      useFactory: loadWorkflowConfig,
    },
    WorkflowClient,
  ],
  exports: [WORKFLOW_CONFIG, WorkflowClient],
})
export class WorkflowModule {}
