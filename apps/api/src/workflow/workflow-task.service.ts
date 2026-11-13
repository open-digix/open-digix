import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { WorkflowClient, WorkflowRequestError } from './workflow.client';
import type { WorkflowVariableValue } from './workflow-runtime.service';

const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,254}$/;
const VARIABLE_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]{0,127}$/;

export interface GetWorkflowTaskInput {
  tenantId: string;
  taskId: string;
}

export interface CompleteWorkflowTaskInput extends GetWorkflowTaskInput {
  actorId: string;
  candidateGroups: readonly string[];
  variables?: Readonly<Record<string, WorkflowVariableValue>>;
}

export interface WorkflowTask {
  id: string;
  name: string | null;
  assignee: string | null;
  taskDefinitionKey: string;
  processInstanceId: string;
  processDefinitionId: string;
  tenantId: string;
  suspended: boolean;
  createdAt: string;
}

interface FlowableTaskResponse {
  id?: unknown;
  name?: unknown;
  assignee?: unknown;
  taskDefinitionKey?: unknown;
  processInstanceId?: unknown;
  processDefinitionId?: unknown;
  tenantId?: unknown;
  suspended?: unknown;
  createTime?: unknown;
}

interface FlowableIdentityLink {
  user?: unknown;
  group?: unknown;
  type?: unknown;
}

function validateIdentifier(value: string, field: string): void {
  if (!IDENTIFIER_PATTERN.test(value)) {
    throw new Error(`${field} is not a valid workflow identifier`);
  }
}

function requiredString(
  response: Record<string, unknown>,
  field: string,
): string {
  const value = response[field];
  if (typeof value !== 'string' || value.length === 0) {
    throw new WorkflowRequestError(
      `Workflow task response is missing ${field}`,
      'invalid_response',
      200,
      false,
    );
  }
  return value;
}

function nullableString(
  response: Record<string, unknown>,
  field: string,
): string | null {
  const value = response[field];
  if (value === null) {
    return null;
  }
  if (typeof value !== 'string') {
    throw new WorkflowRequestError(
      `Workflow task response has an invalid ${field}`,
      'invalid_response',
      200,
      false,
    );
  }
  return value;
}

function identityValue(value: unknown, field: string): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'string' || value.length === 0) {
    throw new WorkflowRequestError(
      `Workflow identity link has an invalid ${field}`,
      'invalid_response',
      200,
      false,
    );
  }
  return value;
}

function validateCompletionInput(input: CompleteWorkflowTaskInput): void {
  validateIdentifier(input.actorId, 'actorId');
  for (const group of input.candidateGroups) {
    validateIdentifier(group, 'candidateGroup');
  }
  for (const [name, value] of Object.entries(input.variables ?? {})) {
    if (!VARIABLE_NAME_PATTERN.test(name) || name === 'tenantId') {
      throw new Error(`Invalid workflow variable name: ${name}`);
    }
    if (typeof value === 'number' && !Number.isFinite(value)) {
      throw new Error(`Workflow variable ${name} must be a finite number`);
    }
  }
}

@Injectable()
export class WorkflowTaskService {
  constructor(private readonly client: WorkflowClient) {}

  async get(input: GetWorkflowTaskInput): Promise<WorkflowTask> {
    validateIdentifier(input.tenantId, 'tenantId');
    validateIdentifier(input.taskId, 'taskId');

    const response = await this.client.request<FlowableTaskResponse>(
      `/service/runtime/tasks/${encodeURIComponent(input.taskId)}`,
    );
    const record = response as Record<string, unknown>;
    const task: WorkflowTask = {
      id: requiredString(record, 'id'),
      name: nullableString(record, 'name'),
      assignee: nullableString(record, 'assignee'),
      taskDefinitionKey: requiredString(record, 'taskDefinitionKey'),
      processInstanceId: requiredString(record, 'processInstanceId'),
      processDefinitionId: requiredString(record, 'processDefinitionId'),
      tenantId: requiredString(record, 'tenantId'),
      suspended: record.suspended === true,
      createdAt: requiredString(record, 'createTime'),
    };

    if (task.id !== input.taskId) {
      throw new WorkflowRequestError(
        'Workflow task response does not match the requested task',
        'invalid_response',
        200,
        false,
      );
    }
    if (typeof record.suspended !== 'boolean') {
      throw new WorkflowRequestError(
        'Workflow task response has an invalid suspended state',
        'invalid_response',
        200,
        false,
      );
    }
    if (task.tenantId !== input.tenantId) {
      throw new ForbiddenException({
        error: {
          code: 'WORKFLOW_TASK_TENANT_MISMATCH',
          message: 'The workflow task does not belong to this tenant',
        },
      });
    }

    return task;
  }

  async complete(input: CompleteWorkflowTaskInput): Promise<void> {
    validateCompletionInput(input);
    const task = await this.get(input);

    if (task.suspended) {
      throw new ConflictException({
        error: {
          code: 'WORKFLOW_TASK_SUSPENDED',
          message: 'The workflow task is suspended',
        },
      });
    }

    if (task.assignee !== null) {
      if (task.assignee !== input.actorId) {
        throw new ForbiddenException({
          error: {
            code: 'WORKFLOW_TASK_NOT_ASSIGNED',
            message: 'The workflow task is assigned to another user',
          },
        });
      }
    } else {
      const links = await this.client.request<FlowableIdentityLink[]>(
        `/service/runtime/tasks/${encodeURIComponent(input.taskId)}/identitylinks`,
      );
      if (!Array.isArray(links)) {
        throw new WorkflowRequestError(
          'Workflow identity link response is not an array',
          'invalid_response',
          200,
          false,
        );
      }

      const candidateGroups = new Set(input.candidateGroups);
      const eligible = links.some((link) => {
        if (typeof link !== 'object' || link === null) {
          throw new WorkflowRequestError(
            'Workflow identity link response contains an invalid item',
            'invalid_response',
            200,
            false,
          );
        }
        if (link.type !== 'candidate') {
          return false;
        }
        const user = identityValue(link.user, 'user');
        const group = identityValue(link.group, 'group');
        return (
          user === input.actorId ||
          (group !== null && candidateGroups.has(group))
        );
      });

      if (!eligible) {
        throw new ForbiddenException({
          error: {
            code: 'WORKFLOW_TASK_NOT_CANDIDATE',
            message: 'The user is not a candidate for this workflow task',
          },
        });
      }
    }

    await this.client.request<void>(
      `/service/runtime/tasks/${encodeURIComponent(input.taskId)}`,
      {
        method: 'POST',
        json: {
          action: 'complete',
          variables: Object.entries(input.variables ?? {}).map(
            ([name, value]) => ({ name, value }),
          ),
        },
        responseType: 'empty',
      },
    );
  }
}
