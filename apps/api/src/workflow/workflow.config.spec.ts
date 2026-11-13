import { loadWorkflowConfig } from './workflow.config';

describe('loadWorkflowConfig', () => {
  const validEnvironment: NodeJS.ProcessEnv = {
    WORKFLOW_BASE_URL: 'http://workflow-engine:8080/flowable-rest',
    WORKFLOW_USERNAME: 'rest-admin',
    WORKFLOW_PASSWORD: 'local-secret',
    WORKFLOW_REQUEST_TIMEOUT_MS: '5000',
  };

  it('loads an explicit workflow REST configuration', () => {
    expect(loadWorkflowConfig(validEnvironment)).toEqual({
      baseUrl: 'http://workflow-engine:8080/flowable-rest',
      username: 'rest-admin',
      password: 'local-secret',
      timeoutMs: 5000,
    });
  });

  it('normalizes trailing slashes from the base URL', () => {
    expect(
      loadWorkflowConfig({
        ...validEnvironment,
        WORKFLOW_BASE_URL: 'https://workflow.example.test/flowable-rest///',
      }).baseUrl,
    ).toBe('https://workflow.example.test/flowable-rest');
  });

  it.each([
    'WORKFLOW_BASE_URL',
    'WORKFLOW_USERNAME',
    'WORKFLOW_PASSWORD',
    'WORKFLOW_REQUEST_TIMEOUT_MS',
  ])('fails fast when %s is missing', (name) => {
    const environment = { ...validEnvironment };
    delete environment[name];

    expect(() => loadWorkflowConfig(environment)).toThrow(
      `${name} is required`,
    );
  });

  it('rejects a non-HTTP base URL', () => {
    expect(() =>
      loadWorkflowConfig({
        ...validEnvironment,
        WORKFLOW_BASE_URL: 'file:///tmp/workflow',
      }),
    ).toThrow('WORKFLOW_BASE_URL must use http or https');
  });

  it.each([
    'http://user:password@workflow-engine:8080/flowable-rest',
    'http://workflow-engine:8080/flowable-rest?debug=true',
    'http://workflow-engine:8080/flowable-rest#debug',
  ])('rejects credentials or metadata in the base URL %s', (value) => {
    expect(() =>
      loadWorkflowConfig({
        ...validEnvironment,
        WORKFLOW_BASE_URL: value,
      }),
    ).toThrow(
      'WORKFLOW_BASE_URL must not contain credentials, query, or fragment',
    );
  });

  it.each(['0', '-1', '1.5', 'five-seconds'])(
    'rejects invalid request timeout %s',
    (value) => {
      expect(() =>
        loadWorkflowConfig({
          ...validEnvironment,
          WORKFLOW_REQUEST_TIMEOUT_MS: value,
        }),
      ).toThrow('WORKFLOW_REQUEST_TIMEOUT_MS must be a positive integer');
    },
  );

  it('rejects a request timeout outside the safe integer range', () => {
    expect(() =>
      loadWorkflowConfig({
        ...validEnvironment,
        WORKFLOW_REQUEST_TIMEOUT_MS: '9007199254740992',
      }),
    ).toThrow('WORKFLOW_REQUEST_TIMEOUT_MS must be a safe integer');
  });

  it.each(['WORKFLOW_USERNAME', 'WORKFLOW_PASSWORD'])(
    'rejects whitespace around %s',
    (name) => {
      expect(() =>
        loadWorkflowConfig({
          ...validEnvironment,
          [name]: ` ${validEnvironment[name]}`,
        }),
      ).toThrow(`${name} must not contain leading or trailing whitespace`);
    },
  );
});
