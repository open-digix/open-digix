import {
  DeleteObjectCommand,
  GetObjectCommand,
  type GetObjectCommandOutput,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
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

export type StorageObjectBody = NonNullable<GetObjectCommandOutput['Body']>;

export interface GetStorageObjectResult {
  key: string;
  body: StorageObjectBody;
  contentLength?: number;
  contentType?: string;
  etag?: string;
  lastModified?: Date;
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

  async getObject(key: string): Promise<GetStorageObjectResult> {
    const result = await this.client.send(
      new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      }),
    );

    if (!result.Body) {
      throw new Error('Object storage returned a response without a body');
    }

    return {
      key,
      body: result.Body,
      contentLength: result.ContentLength,
      contentType: result.ContentType,
      etag: result.ETag,
      lastModified: result.LastModified,
      versionId: result.VersionId,
    };
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      }),
    );
  }
}
