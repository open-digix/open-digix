import { Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { StorageBucketInitializer } from './storage-bucket.initializer';
import { loadStorageConfig, type StorageConfig } from './storage.config';
import { S3_CLIENT, STORAGE_CONFIG } from './storage.constants';
import { StorageObjectService } from './storage-object.service';
import { StoredFileController } from './stored-file.controller';
import { StoredFileRepository } from './stored-file.repository';
import { StoredFileService } from './stored-file.service';
import { StoredFileUploadInterceptor } from './stored-file-upload.interceptor';
import { ClamavScanner } from './clamav-scanner';
import { loadScannerConfig } from './scanner.config';
import { FILE_SCANNER, SCANNER_CONFIG } from './storage.constants';
import { FileAccess } from './file-access.service';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [IdentityModule],
  controllers: [StoredFileController],
  providers: [
    { provide: SCANNER_CONFIG, useFactory: loadScannerConfig },
    { provide: FILE_SCANNER, useClass: ClamavScanner },
    FileAccess,
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
    StoredFileRepository,
    StoredFileService,
    StoredFileUploadInterceptor,
  ],
  exports: [
    S3_CLIENT,
    STORAGE_CONFIG,
    StorageObjectService,
    StoredFileRepository,
    StoredFileService,
    FileAccess,
  ],
})
export class StorageModule implements OnApplicationShutdown {
  constructor(@Inject(S3_CLIENT) private readonly client: S3Client) {}

  onApplicationShutdown(): void {
    this.client.destroy();
  }
}
