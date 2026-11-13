import { createHash } from 'node:crypto';
import {
  BadRequestException,
  Inject,
  Injectable,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import type { StorageConfig } from './storage.config';
import { STORAGE_CONFIG } from './storage.constants';
import { createStorageObjectKey } from './storage-object-key';
import { StorageObjectService } from './storage-object.service';
import {
  StoredFileRepository,
  type StoredFileMetadata,
} from './stored-file.repository';

export interface UploadPendingFileInput {
  tenantId: string;
  recordId?: string;
  originalName: string;
  contentType: string;
  body: Uint8Array;
  createdByMembershipId: string;
}

@Injectable()
export class StoredFileService {
  constructor(
    private readonly objectStorage: StorageObjectService,
    private readonly repository: StoredFileRepository,
    @Inject(STORAGE_CONFIG) private readonly config: StorageConfig,
  ) {}

  async uploadPending(
    input: UploadPendingFileInput,
  ): Promise<StoredFileMetadata> {
    const contentType = input.contentType.trim().toLowerCase();

    if (input.body.byteLength === 0) {
      throw new BadRequestException({
        error: { code: 'EMPTY_FILE', message: 'File must not be empty.' },
      });
    }

    if (input.body.byteLength > this.config.upload.maxBytes) {
      throw new PayloadTooLargeException({
        error: {
          code: 'FILE_TOO_LARGE',
          message: `File must not exceed ${this.config.upload.maxBytes} bytes.`,
        },
      });
    }

    if (!this.config.upload.allowedContentTypes.includes(contentType)) {
      throw new UnsupportedMediaTypeException({
        error: {
          code: 'UNSUPPORTED_FILE_TYPE',
          message: 'File content type is not allowed.',
        },
      });
    }

    const storageKey = createStorageObjectKey(input.tenantId);
    const checksumSha256 = createHash('sha256')
      .update(input.body)
      .digest('hex');

    await this.objectStorage.putObject({
      key: storageKey,
      body: input.body,
      contentType,
    });

    try {
      return await this.repository.createPending({
        tenantId: input.tenantId,
        recordId: input.recordId,
        storageKey,
        originalName: input.originalName,
        contentType,
        sizeBytes: input.body.byteLength,
        checksumSha256,
        createdByMembershipId: input.createdByMembershipId,
      });
    } catch (databaseError) {
      try {
        await this.objectStorage.deleteObject(storageKey);
      } catch (cleanupError) {
        throw new AggregateError(
          [databaseError, cleanupError],
          'Failed to persist file metadata and roll back the uploaded object',
        );
      }

      throw databaseError;
    }
  }
}
