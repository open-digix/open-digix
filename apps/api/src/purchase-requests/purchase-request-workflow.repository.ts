import { Inject, Injectable } from '@nestjs/common';
import type { Pool, QueryResultRow } from 'pg';
import { DATABASE_POOL } from '../database/database.module';

export interface StartingWorkflowInstance {
  readonly id: string;
  readonly created: boolean;
  readonly status:
    'starting' | 'running' | 'failed' | 'reconciliation_required';
  readonly engineProcessInstanceId: string;
}

interface WorkflowInstanceRow extends QueryResultRow {
  id: string;
  status: StartingWorkflowInstance['status'];
  engine_process_instance_id: string;
}

@Injectable()
export class PurchaseRequestWorkflowRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async findWorkflowDefinitionId(
    tenantId: string,
    applicationId: string,
    applicationVersionId: string,
  ): Promise<string | null> {
    const result = await this.pool.query<{
      workflow_definition_id: string | null;
    }>(
      `
        SELECT workflow_definition_id
        FROM application_versions
        WHERE tenant_id = $1
          AND application_id = $2
          AND id = $3
      `,
      [tenantId, applicationId, applicationVersionId],
    );

    return result.rows[0]?.workflow_definition_id ?? null;
  }

  async findByRecord(
    tenantId: string,
    recordId: string,
  ): Promise<StartingWorkflowInstance | null> {
    const result = await this.pool.query<WorkflowInstanceRow>(
      `
        SELECT id, status, engine_process_instance_id
        FROM workflow_instances
        WHERE tenant_id = $1 AND record_id = $2
      `,
      [tenantId, recordId],
    );

    return result.rows[0] ? toWorkflowInstance(result.rows[0], false) : null;
  }

  async createStarting(input: {
    tenantId: string;
    recordId: string;
    applicationVersionId: string;
    pendingEngineId: string;
  }): Promise<StartingWorkflowInstance> {
    const result = await this.pool.query<WorkflowInstanceRow>(
      `
        INSERT INTO workflow_instances (
          tenant_id,
          record_id,
          application_version_id,
          engine_process_instance_id,
          status
        )
        VALUES ($1, $2, $3, $4, 'starting')
        ON CONFLICT (tenant_id, record_id) DO UPDATE
        SET application_version_id = EXCLUDED.application_version_id,
            engine_process_instance_id = EXCLUDED.engine_process_instance_id,
            status = 'starting'
        WHERE workflow_instances.status IN ('failed', 'reconciliation_required')
        RETURNING id, status, engine_process_instance_id
      `,
      [
        input.tenantId,
        input.recordId,
        input.applicationVersionId,
        input.pendingEngineId,
      ],
    );

    if (result.rows[0]) return toWorkflowInstance(result.rows[0], true);

    const existing = await this.findByRecord(input.tenantId, input.recordId);
    if (!existing) {
      throw new Error('Workflow instance was not created or found.');
    }
    return existing;
  }

  async markStarted(input: {
    tenantId: string;
    instanceId: string;
    engineProcessInstanceId: string;
  }): Promise<void> {
    await this.pool.query(
      `
        UPDATE workflow_instances
        SET engine_process_instance_id = $3,
            status = 'running'
        WHERE tenant_id = $1
          AND id = $2
          AND status = 'starting'
      `,
      [input.tenantId, input.instanceId, input.engineProcessInstanceId],
    );
  }

  async markFailed(input: {
    tenantId: string;
    instanceId: string;
  }): Promise<void> {
    await this.pool.query(
      `
        UPDATE workflow_instances
        SET status = 'failed'
        WHERE tenant_id = $1
          AND id = $2
          AND status = 'starting'
      `,
      [input.tenantId, input.instanceId],
    );
  }
}

function toWorkflowInstance(
  row: WorkflowInstanceRow,
  created: boolean,
): StartingWorkflowInstance {
  return {
    id: row.id,
    created,
    status: row.status,
    engineProcessInstanceId: row.engine_process_instance_id,
  };
}
