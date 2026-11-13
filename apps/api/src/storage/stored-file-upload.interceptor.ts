import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
  PayloadTooLargeException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Observable } from 'rxjs';
import type { StorageConfig } from './storage.config';
import { STORAGE_CONFIG } from './storage.constants';

@Injectable()
export class StoredFileUploadInterceptor implements NestInterceptor {
  private readonly delegate: NestInterceptor;

  constructor(@Inject(STORAGE_CONFIG) private readonly config: StorageConfig) {
    const MultipartFileInterceptor = FileInterceptor('file', {
      limits: {
        fileSize: config.upload.maxBytes,
        files: 1,
        fields: 0,
        parts: 1,
      },
      preservePath: false,
      defParamCharset: 'utf8',
    });
    this.delegate = new MultipartFileInterceptor();
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    try {
      return await this.delegate.intercept(context, next);
    } catch (error) {
      if (error instanceof PayloadTooLargeException) {
        throw new PayloadTooLargeException({
          error: {
            code: 'FILE_TOO_LARGE',
            message: `File must not exceed ${this.config.upload.maxBytes} bytes.`,
          },
        });
      }

      if (error instanceof BadRequestException) {
        throw new BadRequestException({
          error: {
            code: 'INVALID_MULTIPART_UPLOAD',
            message: 'Expected one file in multipart field "file".',
          },
        });
      }

      throw error;
    }
  }
}
