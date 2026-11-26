import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  Param,
  Query,
  StreamableFile,
  Res,
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
import { FileAccess } from './file-access.service';
import type { Response } from 'express';

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
  constructor(
    private readonly storedFiles: StoredFileService,
    private readonly access?: FileAccess,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(StoredFileUploadInterceptor)
  async upload(
    @UploadedFile() file: UploadedMultipartFile | undefined,
    @CurrentTenantContext() context: TenantContext,
    @Query('recordId') recordId?: string,
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
      ...(recordId ? { recordId } : {}),
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

  @Get(':id/download-url')
  getDownloadUrl(
    @Param('id') id: string,
    @CurrentTenantContext() context: TenantContext,
  ) {
    return this.access!.getDownloadUrl(id, {
      tenantId: context.membership.tenant.id,
      membershipId: context.membership.id,
    });
  }

  @Get(':id/content')
  async download(
    @Param('id') id: string,
    @CurrentTenantContext() context: TenantContext,
    @Query('expires') expires: string,
    @Query('signature') signature: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const { file, object } = await this.access!.download(
      id,
      {
        tenantId: context.membership.tenant.id,
        membershipId: context.membership.id,
      },
      expires,
      signature,
    );
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
    );
    return new StreamableFile(
      object.body as NodeJS.ReadableStream as import('node:stream').Readable,
      {
        type: 'application/octet-stream',
        length: file.sizeBytes,
      },
    );
  }
}
