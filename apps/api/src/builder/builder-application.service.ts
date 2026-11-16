import { Injectable } from '@nestjs/common';
import {
  BuilderApplicationRepository,
  type CreatedBuilderApplication,
} from './builder-application.repository';
import { builderJsonChecksum } from './builder-checksum';
import { BUILDER_SCHEMA_VERSION } from './builder.types';

export interface CreateBlankBuilderApplicationCommand {
  readonly tenantId: string;
  readonly createdByMembershipId: string;
  readonly appKey: string;
  readonly name: string;
  readonly goal?: string;
  readonly departmentRefs?: readonly string[];
}

@Injectable()
export class BuilderApplicationService {
  constructor(private readonly repository: BuilderApplicationRepository) {}

  createBlankDraft(
    command: CreateBlankBuilderApplicationCommand,
  ): Promise<CreatedBuilderApplication> {
    const initialDefinition = {};

    return this.repository.createDraft({
      tenantId: command.tenantId,
      createdByMembershipId: command.createdByMembershipId,
      appKey: command.appKey,
      name: command.name,
      goal: command.goal,
      departmentRefs: command.departmentRefs ?? [],
      schemaVersion: BUILDER_SCHEMA_VERSION,
      initialDefinition,
      definitionChecksum: builderJsonChecksum(initialDefinition),
    });
  }
}
