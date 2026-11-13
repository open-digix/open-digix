import { ConflictException, ForbiddenException } from '@nestjs/common';
import type { WorkflowClient, WorkflowRequestOptions } from './workflow.client';
import {
  WorkflowRuntimeService,
  type StartWorkflowInput,
} from './workflow-runtime.service';

describe('WorkflowRuntimeService', () => {
  type Request = (
    path: string,
    options?: WorkflowRequestOptions,
  ) => Promise<unknown>;

  const input: StartWorkflowInput = {
    tenantId: 'tenant-beta',
    processDefinitionId: 'tenant-beta_leave-request_v1:1:42',
    businessKey: 'request-123',
    variables: { appId: 'leave-request', version: 1, days: 4 },
  };
  const definition = {
    id: input.processDefinitionId,
    tenantId: input.tenantId,
    suspended: false,
  };
  const processInstance = {
    id: 'instance-43',
    processDefinitionId: input.processDefinitionId,
    businessKey: input.businessKey,
    tenantId: input.tenantId,
    suspended: false,
    ended: false,
    completed: false,
  };
  let request: jest.MockedFunction<Request>;
  let service: WorkflowRuntimeService;

  beforeEach(() => {
    request = jest.fn<
      Promise<unknown>,
      [path: string, options?: WorkflowRequestOptions]
    >();
    service = new WorkflowRuntimeService({
      request,
    } as unknown as WorkflowClient);
  });

  it('verifies the tenant before starting the pinned definition', async () => {
    request
      .mockResolvedValueOnce(definition)
      .mockResolvedValueOnce(processInstance);

    await expect(service.start(input)).resolves.toEqual(processInstance);
    expect(request).toHaveBeenNthCalledWith(
      1,
      '/service/repository/process-definitions/tenant-beta_leave-request_v1%3A1%3A42',
    );
    expect(request).toHaveBeenNthCalledWith(
      2,
      '/service/runtime/process-instances',
      {
        method: 'POST',
        json: {
          processDefinitionId: input.processDefinitionId,
          businessKey: 'request-123',
          variables: [
            { name: 'tenantId', value: 'tenant-beta' },
            { name: 'appId', value: 'leave-request' },
            { name: 'version', value: 1 },
            { name: 'days', value: 4 },
          ],
        },
      },
    );
  });

  it('blocks a definition owned by another tenant before start', async () => {
    request.mockResolvedValueOnce({ ...definition, tenantId: 'tenant-alpha' });

    await expect(service.start(input)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('blocks a suspended definition before start', async () => {
    request.mockResolvedValueOnce({ ...definition, suspended: true });

    await expect(service.start(input)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(request).toHaveBeenCalledTimes(1);
  });

  it.each<Partial<StartWorkflowInput>>([
    { tenantId: '../tenant-beta' },
    { processDefinitionId: 'definition/id' },
    { businessKey: 'request 123' },
    { variables: { tenantId: 'tenant-alpha' } },
    { variables: { days: Number.NaN } },
  ])('rejects invalid input before contacting Flowable', async (change) => {
    await expect(service.start({ ...input, ...change })).rejects.toThrow();
    expect(request).not.toHaveBeenCalled();
  });

  it('rejects a malformed definition response before start', async () => {
    request.mockResolvedValueOnce({ ...definition, tenantId: undefined });

    await expect(service.start(input)).rejects.toMatchObject({
      kind: 'invalid_response',
      status: 200,
      retryable: false,
    });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('rejects a process instance response for another tenant', async () => {
    request.mockResolvedValueOnce(definition).mockResolvedValueOnce({
      ...processInstance,
      tenantId: 'tenant-alpha',
    });

    await expect(service.start(input)).rejects.toMatchObject({
      kind: 'invalid_response',
      status: 201,
      retryable: false,
    });
  });
});
