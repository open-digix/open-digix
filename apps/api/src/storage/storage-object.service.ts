import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Inject, Injectable } from '@nestjs/common';
import { S3_CLIENT, STORAGE_CONFIG } from './storage.constants';
import type { StorageConfig } from './storage.config';

export interface PutStorageObjectInput {
  key: string;
  body: Uint8Array;
  contentType: string;
}

export interface PutStorageObjectResult {
  key: string;
  etag?: string;
  versionId?: string;
}

@Injectable()
export class StorageObjectService {
  constructor(
    @Inject(S3_CLIENT) private readonly client: S3Client,
    @Inject(STORAGE_CONFIG) private readonly config: StorageConfig,
  ) {}

  async putObject(
    input: PutStorageObjectInput,
  ): Promise<PutStorageObjectResult> {
    const result = await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: input.key,
        Body: input.body,
        ContentLength: input.body.byteLength,
        ContentType: input.contentType,
      }),
    );

    return {
      key: input.key,
      etag: result.ETag,
      versionId: result.VersionId,
    };
  }
}
