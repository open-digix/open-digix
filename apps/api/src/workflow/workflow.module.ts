import { Module } from '@nestjs/common';
import { WorkflowClient } from './workflow.client';
import { loadWorkflowConfig } from './workflow.config';
import { WORKFLOW_CONFIG } from './workflow.constants';
import { WorkflowDeploymentService } from './workflow-deployment.service';
import { WorkflowRuntimeService } from './workflow-runtime.service';

@Module({
  providers: [
    {
      provide: WORKFLOW_CONFIG,
      useFactory: loadWorkflowConfig,
    },
    WorkflowClient,
    WorkflowDeploymentService,
    WorkflowRuntimeService,
  ],
  exports: [
    WORKFLOW_CONFIG,
    WorkflowClient,
    WorkflowDeploymentService,
    WorkflowRuntimeService,
  ],
})
export class WorkflowModule {}
