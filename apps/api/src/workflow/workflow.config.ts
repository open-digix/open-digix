export interface WorkflowConfig {
  baseUrl: string;
  username: string;
  password: string;
  timeoutMs: number;
}

function required(environment: NodeJS.ProcessEnv, name: string): string {
  const rawValue = environment[name];
  const value = rawValue?.trim();

  if (!value) {
    throw new Error(`${name} is required`);
  }

  if (rawValue !== value) {
    throw new Error(`${name} must not contain leading or trailing whitespace`);
  }

  return value;
}

function baseUrl(value: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error('WORKFLOW_BASE_URL must be a valid URL');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('WORKFLOW_BASE_URL must use http or https');
  }

  if (url.username || url.password || url.search || url.hash) {
    throw new Error(
      'WORKFLOW_BASE_URL must not contain credentials, query, or fragment',
    );
  }

  const path = url.pathname.replace(/\/+$/, '');
  return `${url.origin}${path}`;
}

function timeout(value: string): number {
  if (!/^[1-9]\d*$/.test(value)) {
    throw new Error('WORKFLOW_REQUEST_TIMEOUT_MS must be a positive integer');
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new Error('WORKFLOW_REQUEST_TIMEOUT_MS must be a safe integer');
  }

  return parsed;
}

export function loadWorkflowConfig(
  environment: NodeJS.ProcessEnv = process.env,
): WorkflowConfig {
  return {
    baseUrl: baseUrl(required(environment, 'WORKFLOW_BASE_URL')),
    username: required(environment, 'WORKFLOW_USERNAME'),
    password: required(environment, 'WORKFLOW_PASSWORD'),
    timeoutMs: timeout(required(environment, 'WORKFLOW_REQUEST_TIMEOUT_MS')),
  };
}
