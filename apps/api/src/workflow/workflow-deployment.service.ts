import { Injectable } from '@nestjs/common';
import { WorkflowClient, WorkflowRequestError } from './workflow.client';

const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,254}$/;
const RESOURCE_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,230}\.bpmn20\.xml$/;

export interface DeployWorkflowDefinitionInput {
  tenantId: string;
  deploymentKey: string;
  deploymentName: string;
  resourceName: string;
  bpmnXml: string;
}

export interface WorkflowDeployment {
  id: string;
  name: string;
  tenantId: string;
  deploymentTime: string;
}

interface FlowableDeploymentResponse {
  id?: unknown;
  name?: unknown;
  tenantId?: unknown;
  deploymentTime?: unknown;
}

function validateIdentifier(value: string, field: string): void {
  if (!IDENTIFIER_PATTERN.test(value)) {
    throw new Error(
      `${field} must start with an alphanumeric character and contain only letters, numbers, dot, underscore, colon, or hyphen`,
    );
  }
}

function validateInput(input: DeployWorkflowDefinitionInput): void {
  validateIdentifier(input.tenantId, 'tenantId');
  validateIdentifier(input.deploymentKey, 'deploymentKey');

  if (
    input.deploymentName.length === 0 ||
    input.deploymentName.length > 255 ||
    input.deploymentName.trim() !== input.deploymentName ||
    /[\r\n]/.test(input.deploymentName)
  ) {
    throw new Error(
      'deploymentName must be 1-255 characters without surrounding whitespace or line breaks',
    );
  }

  if (!RESOURCE_NAME_PATTERN.test(input.resourceName)) {
    throw new Error(
      'resourceName must be a safe filename ending in .bpmn20.xml',
    );
  }

  if (input.bpmnXml.trim().length === 0) {
    throw new Error('bpmnXml must not be empty');
  }
}

function responseString(
  response: FlowableDeploymentResponse,
  field: keyof FlowableDeploymentResponse,
): string {
  const value = response[field];
  if (typeof value !== 'string' || value.length === 0) {
    throw new WorkflowRequestError(
      `Workflow deployment response is missing ${field}`,
      'invalid_response',
      201,
      false,
    );
  }
  return value;
}

@Injectable()
export class WorkflowDeploymentService {
  constructor(private readonly client: WorkflowClient) {}

  async deployGeneratedDefinition(
    input: DeployWorkflowDefinitionInput,
  ): Promise<WorkflowDeployment> {
    validateInput(input);

    const form = new FormData();
    form.append(
      'file',
      new Blob([input.bpmnXml], { type: 'application/xml' }),
      input.resourceName,
    );

    const response = await this.client.request<FlowableDeploymentResponse>(
      '/service/repository/deployments',
      {
        method: 'POST',
        query: new URLSearchParams({
          tenantId: input.tenantId,
          deploymentKey: input.deploymentKey,
          deploymentName: input.deploymentName,
        }),
        form,
      },
    );

    const deployment: WorkflowDeployment = {
      id: responseString(response, 'id'),
      name: responseString(response, 'name'),
      tenantId: responseString(response, 'tenantId'),
      deploymentTime: responseString(response, 'deploymentTime'),
    };

    if (deployment.tenantId !== input.tenantId) {
      throw new WorkflowRequestError(
        'Workflow deployment response belongs to a different tenant',
        'invalid_response',
        201,
        false,
      );
    }

    return deployment;
  }
}
