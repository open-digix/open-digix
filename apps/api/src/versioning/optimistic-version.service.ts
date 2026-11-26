import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { OptimisticUpdateCommand } from './optimistic-version.types';

@Injectable()
export class OptimisticVersionService {
  async update<T>(command: OptimisticUpdateCommand<T>): Promise<T> {
    validateExpectedVersion(command.expectedVersion);

    const updated = await command.updateIfVersionMatches(
      command.expectedVersion,
    );
    if (updated !== null) {
      return updated;
    }

    const currentVersion = await command.getCurrentVersion();
    if (currentVersion === null) {
      throw new NotFoundException({
        error: {
          code: 'VERSIONED_RESOURCE_NOT_FOUND',
          message: 'The versioned resource was not found.',
        },
      });
    }

    throw new ConflictException({
      error: {
        code: 'VERSION_CONFLICT',
        message: 'The resource has been modified. Please reload and try again.',
        expectedVersion: command.expectedVersion,
        currentVersion,
      },
    });
  }
}

function validateExpectedVersion(expectedVersion: number): void {
  if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 1) {
    throw new UnprocessableEntityException({
      error: {
        code: 'INVALID_EXPECTED_VERSION',
        message: 'expectedVersion must be a positive integer.',
      },
    });
  }
}
