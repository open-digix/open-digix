import { randomUUID } from 'node:crypto';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { HealthService } from '../health.service';
import { StorageObjectService } from '../storage/storage-object.service';
import { WorkflowClient } from '../workflow/workflow.client';
import { WorkflowDeploymentService } from '../workflow/workflow-deployment.service';
import { WorkflowRuntimeService } from '../workflow/workflow-runtime.service';
import { WorkflowTaskService } from '../workflow/workflow-task.service';

interface ProcessDefinitionList {
  data: Array<{ id: string }>;
}

interface TaskList {
  data: Array<{ id: string }>;
  total: number;
}

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });
  const health = app.get(HealthService);
  const storage = app.get(StorageObjectService);
  const workflow = app.get(WorkflowClient);
  const deployments = app.get(WorkflowDeploymentService);
  const runtime = app.get(WorkflowRuntimeService);
  const tasks = app.get(WorkflowTaskService);
  const runId = randomUUID();
  const storageKey = `smoke-tests/m1-${runId}.txt`;
  const tenantId = 'smoke-m1';
  const processKey = `m1_smoke_${runId.replaceAll('-', '')}`;
  let deploymentId: string | undefined;

  try {
    const database = await health.check();
    if (database.status !== 'ok' || database.database !== 'ok') {
      throw new Error('Database health response is not healthy');
    }
    console.log('PASS database: SELECT 1');

    const expectedBody = 'digix-m1-storage-smoke';
    await storage.putObject({
      key: storageKey,
      body: new TextEncoder().encode(expectedBody),
      contentType: 'text/plain',
    });
    const storedObject = await storage.getObject(storageKey);
    const actualBody = await storedObject.body.transformToString('utf-8');
    if (actualBody !== expectedBody) {
      throw new Error('Object storage returned different content');
    }
    console.log('PASS object storage: put/get');

    const candidateGroup = `${tenantId}:reviewer`;
    const bpmnXml = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:flowable="http://flowable.org/bpmn" targetNamespace="https://digix.test/workflow">
  <process id="${processKey}" name="M1 core smoke" isExecutable="true">
    <startEvent id="start" />
    <userTask id="review" name="Review" flowable:candidateGroups="${candidateGroup}" />
    <endEvent id="end" />
    <sequenceFlow id="start_to_review" sourceRef="start" targetRef="review" />
    <sequenceFlow id="review_to_end" sourceRef="review" targetRef="end" />
  </process>
</definitions>`;
    const deployment = await deployments.deployGeneratedDefinition({
      tenantId,
      deploymentKey: `${tenantId}:m1-smoke:${runId}`,
      deploymentName: `DigiX M1 smoke ${runId}`,
      resourceName: `${processKey}.bpmn20.xml`,
      bpmnXml,
    });
    deploymentId = deployment.id;

    const definitions = await workflow.request<ProcessDefinitionList>(
      '/service/repository/process-definitions',
      {
        query: new URLSearchParams({ deploymentId, tenantId }),
      },
    );
    if (definitions.data.length !== 1) {
      throw new Error('Expected exactly one smoke process definition');
    }

    const instance = await runtime.start({
      tenantId,
      processDefinitionId: definitions.data[0].id,
      businessKey: `m1-smoke-${runId}`,
    });
    const activeTasks = await workflow.request<TaskList>(
      '/service/runtime/tasks',
      {
        query: new URLSearchParams({
          processInstanceId: instance.id,
          tenantId,
        }),
      },
    );
    if (activeTasks.data.length !== 1) {
      throw new Error('Expected exactly one active smoke task');
    }

    await tasks.complete({
      tenantId,
      taskId: activeTasks.data[0].id,
      actorId: 'm1-smoke-actor',
      candidateGroups: [candidateGroup],
      variables: { smoke_decision: 'approved' },
    });
    const remainingTasks = await workflow.request<TaskList>(
      '/service/runtime/tasks',
      {
        query: new URLSearchParams({
          processInstanceId: instance.id,
          tenantId,
        }),
      },
    );
    if (remainingTasks.total !== 0) {
      throw new Error('Completed smoke task is still active');
    }
    console.log('PASS workflow: deploy/start/read/complete');
  } finally {
    if (deploymentId) {
      await workflow.request<void>(
        `/service/repository/deployments/${deploymentId}`,
        {
          method: 'DELETE',
          query: new URLSearchParams({ cascade: 'true' }),
        },
      );
    }
    await storage.deleteObject(storageKey);
    await app.close();
  }

  console.log('PASS cleanup: workflow deployment and storage object removed');
  console.log('PASS M1 core smoke test');
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(`FAIL M1 core smoke test: ${message}`);
  process.exitCode = 1;
});
