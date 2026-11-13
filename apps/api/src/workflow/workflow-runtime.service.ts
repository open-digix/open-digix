import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { WorkflowClient, WorkflowRequestError } from './workflow.client';

const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,254}$/;
const VARIABLE_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]{0,127}$/;

export type WorkflowVariableValue = string | number | boolean;

export interface StartWorkflowInput {
  tenantId: string;
  processDefinitionId: string;
  businessKey: string;
  variables?: Readonly<Record<string, WorkflowVariableValue>>;
}

export interface WorkflowProcessInstance {
  id: string;
  processDefinitionId: string;
  businessKey: string;
  tenantId: string;
  suspended: boolean;
  ended: boolean;
  completed: boolean;
}

interface FlowableProcessDefinitionResponse {
  id?: unknown;
  tenantId?: unknown;
  suspended?: unknown;
}

interface FlowableProcessInstanceResponse {
  id?: unknown;
  processDefinitionId?: unknown;
  businessKey?: unknown;
  tenantId?: unknown;
  suspended?: unknown;
  ended?: unknown;
  completed?: unknown;
}

function validateIdentifier(value: string, field: string): void {
  if (!IDENTIFIER_PATTERN.test(value)) {
    throw new Error(`${field} is not a valid workflow identifier`);
  }
}

function validateInput(input: StartWorkflowInput): void {
  validateIdentifier(input.tenantId, 'tenantId');
  validateIdentifier(input.processDefinitionId, 'processDefinitionId');
  validateIdentifier(input.businessKey, 'businessKey');

  for (const [name, value] of Object.entries(input.variables ?? {})) {
    if (!VARIABLE_NAME_PATTERN.test(name) || name === 'tenantId') {
      throw new Error(`Invalid workflow variable name: ${name}`);
    }
    if (typeof value === 'number' && !Number.isFinite(value)) {
      throw new Error(`Workflow variable ${name} must be a finite number`);
    }
  }
}

function responseString(
  response: Record<string, unknown>,
  field: string,
  status: number,
): string {
  const value = response[field];
  if (typeof value !== 'string' || value.length === 0) {
    throw new WorkflowRequestError(
      `Workflow response is missing ${field}`,
      'invalid_response',
      status,
      false,
    );
  }
  return value;
}

function responseBoolean(
  response: Record<string, unknown>,
  field: string,
  status: number,
): boolean {
  const value = response[field];
  if (typeof value !== 'boolean') {
    throw new WorkflowRequestError(
      `Workflow response is missing ${field}`,
      'invalid_response',
      status,
      false,
    );
  }
  return value;
}

@Injectable()
export class WorkflowRuntimeService {
  constructor(private readonly client: WorkflowClient) {}

  async start(input: StartWorkflowInput): Promise<WorkflowProcessInstance> {
    validateInput(input);

    const definition =
      await this.client.request<FlowableProcessDefinitionResponse>(
        `/service/repository/process-definitions/${encodeURIComponent(input.processDefinitionId)}`,
      );
    const definitionRecord = definition as Record<string, unknown>;
    const definitionId = responseString(definitionRecord, 'id', 200);
    const definitionTenantId = responseString(
      definitionRecord,
      'tenantId',
      200,
    );

    if (definitionId !== input.processDefinitionId) {
      throw new WorkflowRequestError(
        'Workflow definition response does not match the requested definition',
        'invalid_response',
        200,
        false,
      );
    }
    if (definitionTenantId !== input.tenantId) {
      throw new ForbiddenException({
        error: {
          code: 'WORKFLOW_DEFINITION_TENANT_MISMATCH',
          message: 'The workflow definition does not belong to this tenant',
        },
      });
    }
    if (responseBoolean(definitionRecord, 'suspended', 200)) {
      throw new ConflictException({
        error: {
          code: 'WORKFLOW_DEFINITION_SUSPENDED',
          message: 'The workflow definition is suspended',
        },
      });
    }

    const variables = [
      { name: 'tenantId', value: input.tenantId },
      ...Object.entries(input.variables ?? {}).map(([name, value]) => ({
        name,
        value,
      })),
    ];
    const response = await this.client.request<FlowableProcessInstanceResponse>(
      '/service/runtime/process-instances',
      {
        method: 'POST',
        json: {
          processDefinitionId: input.processDefinitionId,
          businessKey: input.businessKey,
          variables,
        },
      },
    );
    const responseRecord = response as Record<string, unknown>;
    const instance: WorkflowProcessInstance = {
      id: responseString(responseRecord, 'id', 201),
      processDefinitionId: responseString(
        responseRecord,
        'processDefinitionId',
        201,
      ),
      businessKey: responseString(responseRecord, 'businessKey', 201),
      tenantId: responseString(responseRecord, 'tenantId', 201),
      suspended: responseBoolean(responseRecord, 'suspended', 201),
      ended: responseBoolean(responseRecord, 'ended', 201),
      completed: responseBoolean(responseRecord, 'completed', 201),
    };

    if (
      instance.processDefinitionId !== input.processDefinitionId ||
      instance.businessKey !== input.businessKey ||
      instance.tenantId !== input.tenantId
    ) {
      throw new WorkflowRequestError(
        'Workflow process instance response does not match the start request',
        'invalid_response',
        201,
        false,
      );
    }

    return instance;
  }
}
