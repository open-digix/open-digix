import { createHash } from 'node:crypto';
import {
  BadRequestException,
  Inject,
  Injectable,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
  NotFoundException,
} from '@nestjs/common';
import type { StorageConfig } from './storage.config';
import { STORAGE_CONFIG } from './storage.constants';
import { FILE_SCANNER } from './storage.constants';
import type { FileScanner } from './clamav-scanner';
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
    @Inject(FILE_SCANNER) private readonly scanner?: FileScanner,
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

    if (
      input.recordId &&
      !(await this.repository.recordOwnedBy(
        input.tenantId,
        input.recordId,
        input.createdByMembershipId,
      ))
    ) {
      throw new NotFoundException({
        error: { code: 'RECORD_NOT_FOUND', message: 'Record not found.' },
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

    let metadata: StoredFileMetadata;
    try {
      metadata = await this.repository.createPending({
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
    // Once persisted, never delete the object without removing its metadata.
    // A failed scan or status update leaves it inaccessible (pending/failed).
    if (!this.scanner) return metadata;
    let status: 'clean' | 'rejected' | 'failed';
    try {
      status = await this.scanner.scan(input.body);
    } catch {
      status = 'failed';
    }
    await this.repository.setScanStatus(input.tenantId, metadata.id, status);
    return { ...metadata, scanStatus: status };
  }
}
