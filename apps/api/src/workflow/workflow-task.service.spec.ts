import { ForbiddenException } from '@nestjs/common';
import type { WorkflowClient, WorkflowRequestOptions } from './workflow.client';
import { WorkflowTaskService } from './workflow-task.service';

describe('WorkflowTaskService', () => {
  type Request = (
    path: string,
    options?: WorkflowRequestOptions,
  ) => Promise<unknown>;

  const flowableTask = {
    id: 'task-44',
    name: 'Manager review',
    assignee: null,
    taskDefinitionKey: 'manager_review',
    processInstanceId: 'instance-43',
    processDefinitionId: 'tenant-beta_leave-request_v1:1:42',
    tenantId: 'tenant-beta',
    suspended: false,
    createTime: '2026-11-14T02:00:00.000+0000',
    url: 'http://workflow-engine/internal-task-url',
  };
  let request: jest.MockedFunction<Request>;
  let service: WorkflowTaskService;

  beforeEach(() => {
    request = jest.fn<
      Promise<unknown>,
      [path: string, options?: WorkflowRequestOptions]
    >();
    service = new WorkflowTaskService({
      request,
    } as unknown as WorkflowClient);
  });

  it('returns a tenant-scoped task without internal Flowable URLs', async () => {
    request.mockResolvedValueOnce(flowableTask);

    await expect(
      service.get({ tenantId: 'tenant-beta', taskId: 'task-44' }),
    ).resolves.toEqual({
      id: 'task-44',
      name: 'Manager review',
      assignee: null,
      taskDefinitionKey: 'manager_review',
      processInstanceId: 'instance-43',
      processDefinitionId: 'tenant-beta_leave-request_v1:1:42',
      tenantId: 'tenant-beta',
      suspended: false,
      createdAt: '2026-11-14T02:00:00.000+0000',
    });
    expect(request).toHaveBeenCalledWith('/service/runtime/tasks/task-44');
  });

  it.each([
    { tenantId: '../tenant-beta', taskId: 'task-44' },
    { tenantId: 'tenant-beta', taskId: 'task/44' },
  ])(
    'rejects invalid identifiers before contacting Flowable',
    async (input) => {
      await expect(service.get(input)).rejects.toThrow();
      expect(request).not.toHaveBeenCalled();
    },
  );

  it('rejects a task response for another tenant', async () => {
    request.mockResolvedValueOnce({
      ...flowableTask,
      tenantId: 'tenant-alpha',
    });

    await expect(
      service.get({ tenantId: 'tenant-beta', taskId: 'task-44' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it.each([
    { id: 'task-45' },
    { processInstanceId: undefined },
    { suspended: 'false' },
    { assignee: 123 },
  ])('rejects an invalid Flowable task response', async (change) => {
    request.mockResolvedValueOnce({ ...flowableTask, ...change });

    await expect(
      service.get({ tenantId: 'tenant-beta', taskId: 'task-44' }),
    ).rejects.toMatchObject({
      kind: 'invalid_response',
      status: 200,
      retryable: false,
    });
  });
});
