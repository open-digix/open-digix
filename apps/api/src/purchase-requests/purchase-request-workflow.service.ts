import { ConflictException, Injectable } from '@nestjs/common';
import { WorkflowRuntimeService } from '../workflow/workflow-runtime.service';
import { WorkflowTaskService } from '../workflow/workflow-task.service';
import { PurchaseRequestWorkflowRepository } from './purchase-request-workflow.repository';
import type { PurchaseRequestTaskListResult } from './purchase-requests.types';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface StartPurchaseRequestWorkflowInput {
  readonly tenantId: string;
  readonly applicationId: string;
  readonly applicationVersionId: string;
  readonly purchaseRequestId: string;
  readonly businessRecordId: string;
  readonly requesterMembershipId: string;
}

export interface CompletePurchaseRequestDecisionInput extends StartPurchaseRequestWorkflowInput {
  readonly actorMembershipId: string;
  readonly decision: 'approved' | 'rejected';
  readonly rejectionReason?: string;
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
    private readonly tasks: WorkflowTaskService,
  ) {}

  listOpenPurchaseRequestTasks(input: {
    tenantId: string;
    applicationId: string;
    membershipId: string;
  }): Promise<PurchaseRequestTaskListResult> {
    return this.repository.listOpenPurchaseRequestTasks(input);
  }

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
      await this.projectActiveTask({
        tenantId: input.tenantId,
        workflowInstanceId: workflowInstance.id,
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

  async completeDecisionIfConfigured(
    input: CompletePurchaseRequestDecisionInput,
  ): Promise<boolean> {
    const instance = await this.repository.findByRecord(
      input.tenantId,
      input.businessRecordId,
    );
    if (!instance) return false;
    if (instance.status !== 'running') {
      throw new ConflictException({
        error: {
          code: 'WORKFLOW_NOT_RUNNING',
          message: 'The purchase request workflow is not running.',
        },
      });
    }

    const task = await this.tasks.findActiveForProcess({
      tenantId: input.tenantId,
      processInstanceId: instance.engineProcessInstanceId,
    });
    if (!task) {
      throw new ConflictException({
        error: {
          code: 'WORKFLOW_TASK_NOT_FOUND',
          message: 'The purchase request has no active decision task.',
        },
      });
    }

    await this.tasks.complete({
      tenantId: input.tenantId,
      taskId: task.id,
      actorId: input.actorMembershipId,
      candidateGroups: ['approver'],
      variables: {
        manager_decision:
          input.decision === 'approved' ? 'approved' : 'rejected',
        ...(input.rejectionReason
          ? { rejection_reason: input.rejectionReason }
          : {}),
      },
    });
    await this.repository.markTaskCompleted({
      tenantId: input.tenantId,
      engineTaskId: task.id,
    });
    await this.repository.markCompleted({
      tenantId: input.tenantId,
      instanceId: instance.id,
    });
    return true;
  }

  private async projectActiveTask(input: {
    tenantId: string;
    workflowInstanceId: string;
    engineProcessInstanceId: string;
  }): Promise<void> {
    const task = await this.tasks.findActiveForProcess({
      tenantId: input.tenantId,
      processInstanceId: input.engineProcessInstanceId,
    });
    if (!task) return;

    await this.repository.upsertTask({
      tenantId: input.tenantId,
      workflowInstanceId: input.workflowInstanceId,
      engineTaskId: task.id,
      roleCode: 'approver',
      assigneeMembershipId: UUID_PATTERN.test(task.assignee ?? '')
        ? task.assignee
        : null,
    });
  }
}
