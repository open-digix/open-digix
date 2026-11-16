import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { builderJsonChecksum } from './builder-checksum';
import {
  BuilderDraftRepository,
  BuilderVersionConflictError,
  type DraftDetailsRecord,
  type SavedNormalizedDraftResult,
} from './builder-draft.repository';
import { BuilderManifestSchemaValidator } from './builder-manifest-schema.validator';
import { BuilderSemanticValidator } from './builder-semantic.validator';
import { BuilderSourceNormalizer } from './builder-source.normalizer';
import type {
  BuilderApplicationDefinitionV1,
  BuilderDesignMetadata,
  BuilderOpenIssue,
  BuilderSourceMapping,
  BuilderValidationResult,
} from './builder.types';

export interface NormalizeDraftCommand {
  readonly tenantId: string;
  readonly tenantSlug: string;
  readonly applicationId: string;
  readonly version: number;
  readonly createdByMembershipId: string;
  readonly sourceRevisionId?: string;
}

export interface PatchDraftCommand {
  readonly tenantId: string;
  readonly applicationId: string;
  readonly version: number;
  readonly lockVersion: number;
  readonly createdByMembershipId: string;
  readonly definition: BuilderApplicationDefinitionV1;
  readonly designMetadata?: BuilderDesignMetadata;
}

export interface NormalizedDraftResult {
  readonly revisionId: string;
  readonly revisionNo: number;
  readonly lockVersion: number;
  readonly snapshotChecksum: string;
  readonly definition: BuilderApplicationDefinitionV1;
  readonly sourceMappings: readonly BuilderSourceMapping[];
  readonly openIssues: readonly BuilderOpenIssue[];
  readonly createdAt: Date;
}

@Injectable()
export class BuilderDraftService {
  constructor(
    private readonly repository: BuilderDraftRepository,
    private readonly normalizer: BuilderSourceNormalizer,
    private readonly schemaValidator: BuilderManifestSchemaValidator,
    private readonly semanticValidator: BuilderSemanticValidator,
  ) {}

  async getDraft(
    tenantId: string,
    applicationId: string,
    version: number,
  ): Promise<DraftDetailsRecord> {
    const draft = await this.repository.findDraftDetails(
      tenantId,
      applicationId,
      version,
    );

    if (!draft) {
      throw new NotFoundException({
        error: {
          code: 'APP_NOT_FOUND',
          message: 'Application draft was not found in the active tenant.',
        },
      });
    }

    return draft;
  }

  async normalizeDraft(
    command: NormalizeDraftCommand,
  ): Promise<NormalizedDraftResult> {
    const appVersion = await this.repository.findApplicationVersion(
      command.tenantId,
      command.applicationId,
      command.version,
    );

    if (!appVersion) {
      throw new NotFoundException({
        error: {
          code: 'APP_NOT_FOUND',
          message: 'Application or version was not found in the active tenant.',
        },
      });
    }

    if (
      appVersion.appStatus !== 'draft' ||
      appVersion.versionStatus !== 'draft'
    ) {
      throw new BadRequestException({
        error: {
          code: 'CANNOT_NORMALIZE_NON_DRAFT',
          message: 'Only draft application versions can be normalized.',
        },
      });
    }

    const sourceRevision = await this.repository.findSourceRevision(
      command.tenantId,
      command.applicationId,
      command.sourceRevisionId,
    );

    if (!sourceRevision) {
      throw new BadRequestException({
        error: {
          code: 'SOURCE_REVISION_NOT_FOUND',
          message: 'No source revision found to normalize.',
        },
      });
    }

    const normalized = this.normalizer.normalize({
      appId: appVersion.appKey,
      tenantId: command.tenantSlug,
      version: appVersion.version,
      name: appVersion.appName,
      sourceRevisionId: sourceRevision.id,
      sections: sourceRevision.sections,
      segments: sourceRevision.segments,
    });

    const snapshotChecksum = builderJsonChecksum(normalized.definition);

    const saved: SavedNormalizedDraftResult =
      await this.repository.saveNormalizedDraft({
        tenantId: command.tenantId,
        applicationId: command.applicationId,
        applicationVersionId: appVersion.versionId,
        version: appVersion.version,
        sourceRevisionId: sourceRevision.id,
        definition: normalized.definition,
        sourceMappings: normalized.sourceMappings,
        openIssues: normalized.openIssues,
        snapshotChecksum,
        createdByMembershipId: command.createdByMembershipId,
      });

    return {
      revisionId: saved.revisionId,
      revisionNo: saved.revisionNo,
      lockVersion: saved.lockVersion,
      snapshotChecksum: saved.snapshotChecksum,
      definition: normalized.definition,
      sourceMappings: normalized.sourceMappings,
      openIssues: normalized.openIssues,
      createdAt: saved.createdAt,
    };
  }

  async patchDraft(
    command: PatchDraftCommand,
  ): Promise<SavedNormalizedDraftResult> {
    const appVersion = await this.repository.findApplicationVersion(
      command.tenantId,
      command.applicationId,
      command.version,
    );

    if (!appVersion) {
      throw new NotFoundException({
        error: {
          code: 'APP_NOT_FOUND',
          message: 'Application draft was not found in the active tenant.',
        },
      });
    }

    if (
      appVersion.appStatus !== 'draft' ||
      appVersion.versionStatus !== 'draft'
    ) {
      throw new BadRequestException({
        error: {
          code: 'CANNOT_EDIT_NON_DRAFT',
          message: 'Only draft application versions can be edited.',
        },
      });
    }

    const snapshotChecksum = builderJsonChecksum(command.definition);
    const metadata = command.designMetadata ?? {
      sourceMappings: [],
      openIssues: [],
    };

    try {
      return await this.repository.updateDraftRevision({
        tenantId: command.tenantId,
        applicationId: command.applicationId,
        applicationVersionId: appVersion.versionId,
        version: command.version,
        lockVersion: command.lockVersion,
        definition: command.definition,
        sourceMappings: metadata.sourceMappings ?? [],
        openIssues: metadata.openIssues ?? [],
        snapshotChecksum,
        createdByMembershipId: command.createdByMembershipId,
      });
    } catch (error) {
      if (error instanceof BuilderVersionConflictError) {
        throw new ConflictException({
          error: {
            code: 'VERSION_CONFLICT',
            message:
              'The draft has been modified by another change. Please reload.',
          },
        });
      }
      throw error;
    }
  }

  async validateDraft(
    tenantId: string,
    applicationId: string,
    version: number,
  ): Promise<BuilderValidationResult> {
    const draft = await this.getDraft(tenantId, applicationId, version);
    const snapshotChecksum = draft.snapshotChecksum;

    const schemaResult = this.schemaValidator.validate(draft.definition);
    if (!schemaResult.valid) {
      return {
        valid: false,
        snapshotChecksum,
        issues: schemaResult.issues,
      };
    }

    const semanticResult = this.semanticValidator.validate(
      schemaResult.definition,
    );
    return {
      valid: semanticResult.valid,
      snapshotChecksum,
      issues: semanticResult.issues,
    };
  }
}
