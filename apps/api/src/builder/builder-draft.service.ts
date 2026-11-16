import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { builderJsonChecksum } from './builder-checksum';
import {
  BuilderDraftRepository,
  type SavedNormalizedDraftResult,
} from './builder-draft.repository';
import { BuilderSourceNormalizer } from './builder-source.normalizer';
import type {
  BuilderApplicationDefinitionV1,
  BuilderOpenIssue,
  BuilderSourceMapping,
} from './builder.types';

export interface NormalizeDraftCommand {
  readonly tenantId: string;
  readonly tenantSlug: string;
  readonly applicationId: string;
  readonly version: number;
  readonly createdByMembershipId: string;
  readonly sourceRevisionId?: string;
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
  ) {}

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
}
