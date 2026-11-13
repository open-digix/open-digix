import { Inject, Injectable } from '@nestjs/common';
import type { WorkflowConfig } from './workflow.config';
import { WORKFLOW_CONFIG } from './workflow.constants';

export type WorkflowRequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
export type WorkflowRequestErrorKind =
  'http' | 'network' | 'timeout' | 'invalid_response';

export interface WorkflowRequestOptions {
  method?: WorkflowRequestMethod;
  query?: URLSearchParams;
  json?: unknown;
  form?: FormData;
}

export class WorkflowRequestError extends Error {
  constructor(
    message: string,
    readonly kind: WorkflowRequestErrorKind,
    readonly status: number | undefined,
    readonly retryable: boolean,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = WorkflowRequestError.name;
  }
}

function validatePath(path: string): void {
  const segments = path.split('/');
  if (
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.includes('?') ||
    path.includes('#') ||
    segments.includes('.') ||
    segments.includes('..')
  ) {
    throw new Error(
      'Workflow request path must be an absolute path without origin, query, fragment, or traversal segments',
    );
  }
}

function isTimeout(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const name = (error as { name?: unknown }).name;
  return name === 'TimeoutError' || name === 'AbortError';
}

@Injectable()
export class WorkflowClient {
  private readonly authorization: string;

  constructor(
    @Inject(WORKFLOW_CONFIG) private readonly config: WorkflowConfig,
  ) {
    this.authorization = `Basic ${Buffer.from(
      `${config.username}:${config.password}`,
      'utf8',
    ).toString('base64')}`;
  }

  async request<T>(
    path: string,
    options: WorkflowRequestOptions = {},
  ): Promise<T> {
    validatePath(path);

    if (options.json !== undefined && options.form !== undefined) {
      throw new Error(
        'Workflow request cannot contain both JSON and form data',
      );
    }

    const query = options.query?.toString();
    const url = `${this.config.baseUrl}${path}${query ? `?${query}` : ''}`;
    const headers: Record<string, string> = {
      accept: 'application/json',
      authorization: this.authorization,
    };
    let body: BodyInit | undefined;

    if (options.json !== undefined) {
      headers['content-type'] = 'application/json';
      body = JSON.stringify(options.json);
    } else if (options.form !== undefined) {
      body = options.form;
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method: options.method ?? 'GET',
        headers,
        body,
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch (error) {
      if (isTimeout(error)) {
        throw new WorkflowRequestError(
          'Workflow request timed out',
          'timeout',
          undefined,
          true,
          { cause: error },
        );
      }

      throw new WorkflowRequestError(
        'Workflow service could not be reached',
        'network',
        undefined,
        true,
        { cause: error },
      );
    }

    if (!response.ok) {
      throw new WorkflowRequestError(
        `Workflow request failed with HTTP ${response.status}`,
        'http',
        response.status,
        response.status === 408 ||
          response.status === 429 ||
          response.status >= 500,
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    try {
      return (await response.json()) as T;
    } catch (error) {
      throw new WorkflowRequestError(
        'Workflow service returned an invalid JSON response',
        'invalid_response',
        response.status,
        false,
        { cause: error },
      );
    }
  }
}
