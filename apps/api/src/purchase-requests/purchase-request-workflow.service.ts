import { ConflictException, Injectable } from '@nestjs/common';
import { WorkflowRuntimeService } from '../workflow/workflow-runtime.service';
import { PurchaseRequestWorkflowRepository } from './purchase-request-workflow.repository';

export interface StartPurchaseRequestWorkflowInput {
  readonly tenantId: string;
  readonly applicationId: string;
  readonly applicationVersionId: string;
  readonly purchaseRequestId: string;
  readonly businessRecordId: string;
  readonly requesterMembershipId: string;
}

export interface PurchaseRequestWorkflowStartResult {
  readonly workflowInstanceId: string;
  readonly engineProcessInstanceId: string;
}

@Injectable()
export class PurchaseRequestWorkflowService {
  constructor(
    private readonly repository: PurchaseRequestWorkflowRepository,
    private readonly runtime: WorkflowRuntimeService,
  ) {}

  async startIfConfigured(
    input: StartPurchaseRequestWorkflowInput,
  ): Promise<PurchaseRequestWorkflowStartResult | null> {
    const processDefinitionId = await this.repository.findWorkflowDefinitionId(
      input.tenantId,
      input.applicationId,
      input.applicationVersionId,
    );

    // Legacy seeded versions may not have a workflow yet. B10 will require
    // workflow_definition_id before publishing a v2.5 application.
    if (!processDefinitionId) return null;

    const pendingEngineId = `pending:${input.purchaseRequestId}`;
    const workflowInstance = await this.repository.createStarting({
      tenantId: input.tenantId,
      recordId: input.businessRecordId,
      applicationVersionId: input.applicationVersionId,
      pendingEngineId,
    });

    if (workflowInstance.status === 'running') {
      return {
        workflowInstanceId: workflowInstance.id,
        engineProcessInstanceId: workflowInstance.engineProcessInstanceId,
      };
    }
    if (workflowInstance.status === 'starting' && !workflowInstance.created) {
      throw new ConflictException({
        error: {
          code: 'WORKFLOW_START_IN_PROGRESS',
          message: 'The purchase request workflow is already starting.',
        },
      });
    }

    try {
      const process = await this.runtime.start({
        tenantId: input.tenantId,
        processDefinitionId,
        businessKey: input.purchaseRequestId,
        variables: {
          applicationId: input.applicationId,
          applicationVersionId: input.applicationVersionId,
          businessRecordId: input.businessRecordId,
          purchaseRequestId: input.purchaseRequestId,
          requesterMembershipId: input.requesterMembershipId,
          candidateGroup: 'approver',
        },
      });

      await this.repository.markStarted({
        tenantId: input.tenantId,
        instanceId: workflowInstance.id,
        engineProcessInstanceId: process.id,
      });

      return {
        workflowInstanceId: workflowInstance.id,
        engineProcessInstanceId: process.id,
      };
    } catch (error) {
      await this.repository.markFailed({
        tenantId: input.tenantId,
        instanceId: workflowInstance.id,
      });
      throw error;
    }
  }
}
