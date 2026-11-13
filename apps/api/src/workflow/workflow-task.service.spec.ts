import { ConflictException, ForbiddenException } from '@nestjs/common';
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

  it('completes a task assigned directly to the actor', async () => {
    request.mockResolvedValueOnce({ ...flowableTask, assignee: 'user-7' });
    request.mockResolvedValueOnce(undefined);

    await expect(
      service.complete({
        tenantId: 'tenant-beta',
        taskId: 'task-44',
        actorId: 'user-7',
        candidateGroups: [],
        variables: { manager_decision: 'approved' },
      }),
    ).resolves.toBeUndefined();

    expect(request).toHaveBeenNthCalledWith(
      2,
      '/service/runtime/tasks/task-44',
      {
        method: 'POST',
        json: {
          action: 'complete',
          variables: [{ name: 'manager_decision', value: 'approved' }],
        },
        responseType: 'empty',
      },
    );
  });

  it('completes an unassigned task for a matching candidate group', async () => {
    request
      .mockResolvedValueOnce(flowableTask)
      .mockResolvedValueOnce([
        { user: null, group: 'tenant-beta:manager', type: 'candidate' },
      ])
      .mockResolvedValueOnce(undefined);

    await expect(
      service.complete({
        tenantId: 'tenant-beta',
        taskId: 'task-44',
        actorId: 'user-7',
        candidateGroups: ['tenant-beta:manager'],
      }),
    ).resolves.toBeUndefined();

    expect(request).toHaveBeenNthCalledWith(
      2,
      '/service/runtime/tasks/task-44/identitylinks',
    );
    expect(request).toHaveBeenCalledTimes(3);
  });

  it('blocks an actor when the task is assigned to another user', async () => {
    request.mockResolvedValueOnce({ ...flowableTask, assignee: 'user-8' });

    await expect(
      service.complete({
        tenantId: 'tenant-beta',
        taskId: 'task-44',
        actorId: 'user-7',
        candidateGroups: [],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('blocks an actor without a matching candidate identity link', async () => {
    request
      .mockResolvedValueOnce(flowableTask)
      .mockResolvedValueOnce([
        { user: null, group: 'tenant-beta:hr', type: 'candidate' },
      ]);

    await expect(
      service.complete({
        tenantId: 'tenant-beta',
        taskId: 'task-44',
        actorId: 'user-7',
        candidateGroups: ['tenant-beta:manager'],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('blocks a suspended task', async () => {
    request.mockResolvedValueOnce({ ...flowableTask, suspended: true });

    await expect(
      service.complete({
        tenantId: 'tenant-beta',
        taskId: 'task-44',
        actorId: 'user-7',
        candidateGroups: ['tenant-beta:manager'],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid completion variables before contacting Flowable', async () => {
    await expect(
      service.complete({
        tenantId: 'tenant-beta',
        taskId: 'task-44',
        actorId: 'user-7',
        candidateGroups: [],
        variables: { tenantId: 'tenant-alpha' },
      }),
    ).rejects.toThrow('Invalid workflow variable name');
    expect(request).not.toHaveBeenCalled();
  });
});
