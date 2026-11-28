import type { WorkflowRuntimeService } from '../workflow/workflow-runtime.service';
import type { WorkflowTaskService } from '../workflow/workflow-task.service';
import { ConflictException } from '@nestjs/common';
import { PurchaseRequestWorkflowRepository } from './purchase-request-workflow.repository';
import { PurchaseRequestWorkflowService } from './purchase-request-workflow.service';

type RuntimeStartInput = {
  tenantId: string;
  processDefinitionId: string;
  businessKey: string;
  variables: Record<string, unknown>;
};

describe('PurchaseRequestWorkflowService', () => {
  const input = {
    tenantId: 'tenant-1',
    applicationId: 'app-1',
    applicationVersionId: 'version-1',
    purchaseRequestId: 'request-1',
    businessRecordId: 'record-1',
    requesterMembershipId: 'membership-1',
  };

  let repository: {
    findWorkflowDefinitionId: jest.Mock;
    findByRecord: jest.Mock;
    createStarting: jest.Mock;
    markStarted: jest.Mock;
    markFailed: jest.Mock;
  };
  let runtime: {
    start: jest.MockedFunction<
      (input: RuntimeStartInput) => Promise<{ id: string }>
    >;
  };
  let tasks: {
    findActiveForProcess: jest.Mock;
    complete: jest.Mock;
  };
  let service: PurchaseRequestWorkflowService;

  beforeEach(() => {
    repository = {
      findWorkflowDefinitionId: jest.fn().mockResolvedValue('definition-1'),
      findByRecord: jest.fn().mockResolvedValue(null),
      createStarting: jest.fn().mockResolvedValue({
        id: 'workflow-1',
        created: true,
        status: 'starting',
        engineProcessInstanceId: 'pending:request-1',
      }),
      markStarted: jest.fn().mockResolvedValue(undefined),
      markFailed: jest.fn().mockResolvedValue(undefined),
    };
    runtime = {
      start: jest.fn().mockResolvedValue({ id: 'engine-instance-1' }),
    };
    tasks = {
      findActiveForProcess: jest.fn().mockResolvedValue({ id: 'task-1' }),
      complete: jest.fn().mockResolvedValue(undefined),
    };
    service = new PurchaseRequestWorkflowService(
      repository as unknown as PurchaseRequestWorkflowRepository,
      runtime as unknown as WorkflowRuntimeService,
      tasks as unknown as WorkflowTaskService,
    );
  });

  it('starts Flowable and marks the local instance running', async () => {
    await expect(service.startIfConfigured(input)).resolves.toEqual({
      workflowInstanceId: 'workflow-1',
      engineProcessInstanceId: 'engine-instance-1',
    });
    const startInput = runtime.start.mock.calls[0]?.[0];
    expect(startInput).toMatchObject({
      tenantId: 'tenant-1',
      processDefinitionId: 'definition-1',
      businessKey: 'request-1',
    });
    expect(startInput.variables).toEqual(
      expect.objectContaining({
        purchaseRequestId: 'request-1',
        candidateGroup: 'approver',
      }),
    );
    expect(repository.markStarted).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      instanceId: 'workflow-1',
      engineProcessInstanceId: 'engine-instance-1',
    });
  });

  it('does not contact Flowable when the published version has no definition', async () => {
    repository.findWorkflowDefinitionId.mockResolvedValueOnce(null);

    await expect(service.startIfConfigured(input)).resolves.toBeNull();
    expect(repository.createStarting).not.toHaveBeenCalled();
    expect(runtime.start).not.toHaveBeenCalled();
  });

  it('marks a starting instance failed when Flowable cannot start', async () => {
    const error = new Error('workflow unavailable');
    runtime.start.mockRejectedValueOnce(error);

    await expect(service.startIfConfigured(input)).rejects.toBe(error);
    expect(repository.markFailed).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      instanceId: 'workflow-1',
    });
  });

  it('does not start a duplicate process while the local instance is starting', async () => {
    repository.createStarting.mockResolvedValueOnce({
      id: 'workflow-1',
      created: false,
      status: 'starting',
      engineProcessInstanceId: 'pending:request-1',
    });

    await expect(service.startIfConfigured(input)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(runtime.start).not.toHaveBeenCalled();
  });

  it('completes the active approval task for an app workflow', async () => {
    repository.findByRecord = jest.fn().mockResolvedValue({
      id: 'workflow-1',
      created: false,
      status: 'running',
      engineProcessInstanceId: 'engine-instance-1',
    });

    await expect(
      service.completeDecisionIfConfigured({
        ...input,
        actorMembershipId: 'approver-1',
        decision: 'approved',
      }),
    ).resolves.toBe(true);
    expect(tasks.findActiveForProcess).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      processInstanceId: 'engine-instance-1',
    });
    expect(tasks.complete).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      taskId: 'task-1',
      actorId: 'approver-1',
      candidateGroups: ['approver'],
      variables: { manager_decision: 'approved' },
    });
  });
});
