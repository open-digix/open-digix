import { ForbiddenException, Injectable } from '@nestjs/common';
import { WorkflowClient, WorkflowRequestError } from './workflow.client';

const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,254}$/;

export interface GetWorkflowTaskInput {
  tenantId: string;
  taskId: string;
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
}
