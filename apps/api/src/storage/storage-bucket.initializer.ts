import {
  CreateBucketCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { S3_CLIENT, STORAGE_CONFIG } from './storage.constants';
import type { StorageConfig } from './storage.config';

interface S3ErrorLike extends Error {
  $metadata?: { httpStatusCode?: number };
}

function isMissingBucket(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const s3Error = error as S3ErrorLike;
  return (
    s3Error.$metadata?.httpStatusCode === 404 ||
    s3Error.name === 'NotFound' ||
    s3Error.name === 'NoSuchBucket'
  );
}

function isAlreadyOwnedBucket(error: unknown): boolean {
  return error instanceof Error && error.name === 'BucketAlreadyOwnedByYou';
}

@Injectable()
export class StorageBucketInitializer implements OnApplicationBootstrap {
  private readonly logger = new Logger(StorageBucketInitializer.name);

  constructor(
    @Inject(S3_CLIENT) private readonly client: S3Client,
    @Inject(STORAGE_CONFIG) private readonly config: StorageConfig,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.client.send(
        new HeadBucketCommand({ Bucket: this.config.bucket }),
      );
      return;
    } catch (error) {
      if (!isMissingBucket(error)) throw error;
    }

    try {
      await this.client.send(
        new CreateBucketCommand({ Bucket: this.config.bucket }),
      );
      this.logger.log(`Created object storage bucket ${this.config.bucket}`);
    } catch (error) {
      if (!isAlreadyOwnedBucket(error)) throw error;
    }
  }
}
