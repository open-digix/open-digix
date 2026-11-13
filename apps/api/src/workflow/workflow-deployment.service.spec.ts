import type { WorkflowRequestOptions, WorkflowClient } from './workflow.client';
import {
  WorkflowDeploymentService,
  type DeployWorkflowDefinitionInput,
} from './workflow-deployment.service';

describe('WorkflowDeploymentService', () => {
  type Request = (
    path: string,
    options?: WorkflowRequestOptions,
  ) => Promise<unknown>;

  const input: DeployWorkflowDefinitionInput = {
    tenantId: 'tenant-beta',
    deploymentKey: 'tenant-beta:leave-request:v1',
    deploymentName: 'Leave request v1',
    resourceName: 'tenant-beta_leave-request_v1.bpmn20.xml',
    bpmnXml: '<?xml version="1.0"?><definitions />',
  };
  const flowableResponse = {
    id: 'deployment-1',
    name: 'Leave request v1',
    tenantId: 'tenant-beta',
    deploymentTime: '2026-11-14T01:00:00.000+0000',
    url: 'http://workflow-engine/internal-url',
  };
  let request: jest.MockedFunction<Request>;
  let service: WorkflowDeploymentService;

  beforeEach(() => {
    request = jest.fn<
      Promise<unknown>,
      [path: string, options?: WorkflowRequestOptions]
    >();
    service = new WorkflowDeploymentService({
      request,
    } as unknown as WorkflowClient);
  });

  it('deploys generated BPMN in the tenant namespace', async () => {
    request.mockResolvedValueOnce(flowableResponse);

    await expect(service.deployGeneratedDefinition(input)).resolves.toEqual({
      id: 'deployment-1',
      name: 'Leave request v1',
      tenantId: 'tenant-beta',
      deploymentTime: '2026-11-14T01:00:00.000+0000',
    });

    expect(request).toHaveBeenCalledTimes(1);
    const [path, options] = request.mock.calls[0];
    expect(path).toBe('/service/repository/deployments');
    expect(options?.method).toBe('POST');
    expect(options?.query?.toString()).toBe(
      'tenantId=tenant-beta&deploymentKey=tenant-beta%3Aleave-request%3Av1&deploymentName=Leave+request+v1',
    );

    const file = options?.form?.get('file');
    expect(file).toBeInstanceOf(File);
    if (!(file instanceof File)) {
      throw new Error('Expected the deployment form to contain a BPMN file');
    }
    expect(file.name).toBe('tenant-beta_leave-request_v1.bpmn20.xml');
    expect(file.type).toBe('application/xml');
    await expect(file.text()).resolves.toBe(input.bpmnXml);
  });

  it.each([
    ['tenantId', { tenantId: '../tenant-beta' }],
    ['deploymentKey', { deploymentKey: 'tenant beta/leave' }],
    ['deploymentName', { deploymentName: ' Leave request v1' }],
    ['resourceName', { resourceName: '../leave.bpmn20.xml' }],
    ['bpmnXml', { bpmnXml: '   ' }],
  ])('rejects an invalid %s before calling Flowable', async (_, change) => {
    await expect(
      service.deployGeneratedDefinition({ ...input, ...change }),
    ).rejects.toThrow();
    expect(request).not.toHaveBeenCalled();
  });

  it('rejects an incomplete Flowable response', async () => {
    request.mockResolvedValueOnce({ ...flowableResponse, id: undefined });

    await expect(
      service.deployGeneratedDefinition(input),
    ).rejects.toMatchObject({
      kind: 'invalid_response',
      status: 201,
      retryable: false,
    });
  });

  it('rejects a deployment response for another tenant', async () => {
    request.mockResolvedValueOnce({
      ...flowableResponse,
      tenantId: 'tenant-alpha',
    });

    await expect(
      service.deployGeneratedDefinition(input),
    ).rejects.toMatchObject({
      kind: 'invalid_response',
      status: 201,
      retryable: false,
    });
  });
});
