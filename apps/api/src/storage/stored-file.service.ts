import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
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
  ) {}

  async uploadPending(
    input: UploadPendingFileInput,
  ): Promise<StoredFileMetadata> {
    const storageKey = createStorageObjectKey(input.tenantId);
    const checksumSha256 = createHash('sha256')
      .update(input.body)
      .digest('hex');

    await this.objectStorage.putObject({
      key: storageKey,
      body: input.body,
      contentType: input.contentType,
    });

    try {
      return await this.repository.createPending({
        tenantId: input.tenantId,
        recordId: input.recordId,
        storageKey,
        originalName: input.originalName,
        contentType: input.contentType,
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
