import { WorkflowClient, WorkflowRequestError } from './workflow.client';
import type { WorkflowConfig } from './workflow.config';

describe('WorkflowClient', () => {
  const config: WorkflowConfig = {
    baseUrl: 'http://workflow-engine:8080/flowable-rest',
    username: 'rest-admin',
    password: 'local-secret',
    timeoutMs: 5000,
  };
  let fetchMock: jest.SpiedFunction<typeof fetch>;
  let client: WorkflowClient;

  beforeEach(() => {
    fetchMock = jest.spyOn(global, 'fetch');
    client = new WorkflowClient(config);
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  it('sends an authenticated GET request with query parameters', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 'UP' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    await expect(
      client.request<{ status: string }>('/actuator/health', {
        query: new URLSearchParams({ details: 'false' }),
      }),
    ).resolves.toEqual({ status: 'UP' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      'http://workflow-engine:8080/flowable-rest/actuator/health?details=false',
    );
    expect(init).toMatchObject({
      method: 'GET',
      headers: {
        accept: 'application/json',
        authorization: 'Basic cmVzdC1hZG1pbjpsb2NhbC1zZWNyZXQ=',
      },
      body: undefined,
    });
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it('serializes a JSON request body', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'process-1' }), { status: 201 }),
    );

    await client.request('/service/runtime/process-instances', {
      method: 'POST',
      json: { processDefinitionKey: 'approval' },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://workflow-engine:8080/flowable-rest/service/runtime/process-instances',
      expect.objectContaining({
        method: 'POST',
        headers: {
          accept: 'application/json',
          authorization: 'Basic cmVzdC1hZG1pbjpsb2NhbC1zZWNyZXQ=',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ processDefinitionKey: 'approval' }),
      }),
    );
  });

  it('lets fetch set the multipart boundary for form data', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'deployment-1' }), { status: 201 }),
    );
    const form = new FormData();
    form.append('file', new Blob(['bpmn']), 'approval.bpmn20.xml');

    await client.request('/service/repository/deployments', {
      method: 'POST',
      form,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: form,
        headers: {
          accept: 'application/json',
          authorization: 'Basic cmVzdC1hZG1pbjpsb2NhbC1zZWNyZXQ=',
        },
      }),
    );
  });

  it.each([
    'http://other-service.test/path',
    '//other-service.test/path',
    '/service/../admin',
    '/service/tasks?user=admin',
    '/service/tasks#debug',
  ])('rejects an unsafe request path %s before fetch', async (path) => {
    await expect(client.request(path)).rejects.toThrow(
      'Workflow request path must be an absolute path',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a request with both JSON and form data', async () => {
    await expect(
      client.request('/service/test', {
        method: 'POST',
        json: {},
        form: new FormData(),
      }),
    ).rejects.toThrow('cannot contain both JSON and form data');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [401, false],
    [408, true],
    [429, true],
    [503, true],
  ])(
    'maps HTTP %s without exposing the response body',
    async (status, retryable) => {
      fetchMock.mockResolvedValueOnce(
        new Response('internal Flowable details', { status }),
      );

      try {
        await client.request('/service/test');
        throw new Error('Expected the workflow request to fail');
      } catch (error) {
        expect(error).toMatchObject({
          name: WorkflowRequestError.name,
          kind: 'http',
          status,
          retryable,
        });
        expect((error as Error).message).not.toContain(
          'internal Flowable details',
        );
      }
    },
  );

  it('maps network failures as retryable', async () => {
    fetchMock.mockRejectedValueOnce(new Error('connection refused'));

    await expect(client.request('/service/test')).rejects.toMatchObject({
      kind: 'network',
      status: undefined,
      retryable: true,
    });
  });

  it('maps timeout failures as retryable', async () => {
    fetchMock.mockRejectedValueOnce(
      new DOMException('timed out', 'TimeoutError'),
    );

    await expect(client.request('/service/test')).rejects.toMatchObject({
      kind: 'timeout',
      status: undefined,
      retryable: true,
    });
  });

  it('supports successful responses without a body', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(client.request('/service/test')).resolves.toBeUndefined();
  });

  it('supports an explicitly empty HTTP 200 response', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 200 }));

    await expect(
      client.request('/service/runtime/tasks/task-1', {
        method: 'POST',
        json: { action: 'complete' },
        responseType: 'empty',
      }),
    ).resolves.toBeUndefined();
  });

  it('rejects an invalid successful JSON response', async () => {
    fetchMock.mockResolvedValueOnce(new Response('not-json', { status: 200 }));

    await expect(client.request('/service/test')).rejects.toMatchObject({
      kind: 'invalid_response',
      status: 200,
      retryable: false,
    });
  });
});
