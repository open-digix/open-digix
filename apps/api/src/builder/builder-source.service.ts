import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BuilderSourceFileUnavailableError,
  BuilderSourceRepository,
  type BuilderSourceRevisionRecord,
  type BuilderSourceSections,
} from './builder-source.repository';
import type {
  BuilderSourceSection,
  BuilderSourceSegment,
} from './builder.types';

const SECTION_ORDER: readonly BuilderSourceSection[] = [
  'inputs',
  'roles',
  'steps',
  'branches',
  'outputs',
  'exceptions',
];

export interface CreateBuilderSourceRevisionCommand {
  readonly tenantId: string;
  readonly applicationId: string;
  readonly createdByMembershipId: string;
  readonly sections: BuilderSourceSections;
  readonly fileRefs: readonly string[];
}

@Injectable()
export class BuilderSourceService {
  constructor(private readonly repository: BuilderSourceRepository) {}

  async createRevision(
    command: CreateBuilderSourceRevisionCommand,
  ): Promise<BuilderSourceRevisionRecord> {
    const segments = createSegments(command.sections);
    let revision: BuilderSourceRevisionRecord | undefined;

    try {
      revision = await this.repository.createRevision({
        ...command,
        segments,
      });
    } catch (error) {
      if (error instanceof BuilderSourceFileUnavailableError) {
        throw new BadRequestException({
          error: {
            code: 'SOURCE_FILE_NOT_AVAILABLE',
            message:
              'Every source file must belong to the active tenant and have a clean scan status.',
          },
        });
      }
      throw error;
    }

    if (!revision) {
      throw new NotFoundException({
        error: {
          code: 'APP_NOT_FOUND',
          message: 'Application was not found in the active tenant.',
        },
      });
    }
    return revision;
  }
}

function createSegments(
  sections: BuilderSourceSections,
): BuilderSourceSegment[] {
  return SECTION_ORDER.flatMap((section) => {
    const text = sections[section];
    return text ? [{ id: `${section}_1`, section, text }] : [];
  });
}
