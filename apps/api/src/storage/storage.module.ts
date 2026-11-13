import { Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { StorageBucketInitializer } from './storage-bucket.initializer';
import { loadStorageConfig, type StorageConfig } from './storage.config';
import { S3_CLIENT, STORAGE_CONFIG } from './storage.constants';
import { StorageObjectService } from './storage-object.service';

@Module({
  providers: [
    {
      provide: STORAGE_CONFIG,
      useFactory: loadStorageConfig,
    },
    {
      provide: S3_CLIENT,
      inject: [STORAGE_CONFIG],
      useFactory: (config: StorageConfig) => new S3Client(config.client),
    },
    StorageBucketInitializer,
    StorageObjectService,
  ],
  exports: [S3_CLIENT, STORAGE_CONFIG, StorageObjectService],
})
export class StorageModule implements OnApplicationShutdown {
  constructor(@Inject(S3_CLIENT) private readonly client: S3Client) {}

  onApplicationShutdown(): void {
    this.client.destroy();
  }
}
