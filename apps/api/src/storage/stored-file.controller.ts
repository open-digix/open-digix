import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import type { TenantContext } from '../identity/identity.types';
import {
  CurrentTenantContext,
  TenantScoped,
} from '../identity/tenant-context.decorator';
import type { StoredFileScanStatus } from './stored-file.repository';
import { StoredFileService } from './stored-file.service';
import { StoredFileUploadInterceptor } from './stored-file-upload.interceptor';

export interface UploadedMultipartFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

export interface StoredFileResponse {
  id: string;
  recordId: string | null;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  checksumSha256: string;
  scanStatus: StoredFileScanStatus;
  createdAt: string;
}

@TenantScoped()
@Controller('v1/files')
export class StoredFileController {
  constructor(private readonly storedFiles: StoredFileService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(StoredFileUploadInterceptor)
  async upload(
    @UploadedFile() file: UploadedMultipartFile | undefined,
    @CurrentTenantContext() context: TenantContext,
  ): Promise<StoredFileResponse> {
    if (!file) {
      throw new BadRequestException({
        error: {
          code: 'FILE_REQUIRED',
          message: 'Multipart field "file" is required.',
        },
      });
    }

    const metadata = await this.storedFiles.uploadPending({
      tenantId: context.membership.tenant.id,
      originalName: file.originalname,
      contentType: file.mimetype,
      body: file.buffer,
      createdByMembershipId: context.membership.id,
    });

    return {
      id: metadata.id,
      recordId: metadata.recordId,
      originalName: metadata.originalName,
      contentType: metadata.contentType,
      sizeBytes: metadata.sizeBytes,
      checksumSha256: metadata.checksumSha256,
      scanStatus: metadata.scanStatus,
      createdAt: metadata.createdAt.toISOString(),
    };
  }
}
