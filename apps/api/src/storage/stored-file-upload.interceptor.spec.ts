import {
  Controller,
  INestApplication,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import type { StorageConfig } from './storage.config';
import { STORAGE_CONFIG } from './storage.constants';
import type { UploadedMultipartFile } from './stored-file.controller';
import { StoredFileUploadInterceptor } from './stored-file-upload.interceptor';

@Controller('__test/storage-upload')
class UploadTestController {
  @Post()
  @UseInterceptors(StoredFileUploadInterceptor)
  upload(@UploadedFile() file: UploadedMultipartFile) {
    return { sizeBytes: file.buffer.byteLength };
  }
}

describe('StoredFileUploadInterceptor', () => {
  const config: StorageConfig = {
    bucket: 'digix-files',
    client: {},
    upload: {
      maxBytes: 4,
      allowedContentTypes: ['application/pdf'],
    },
  };
  let app: INestApplication<App>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UploadTestController],
      providers: [
        StoredFileUploadInterceptor,
        { provide: STORAGE_CONFIG, useValue: config },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('accepts one multipart file in memory', async () => {
    await request(app.getHttpServer())
      .post('/__test/storage-upload')
      .attach('file', Buffer.from('1234'), {
        filename: 'invoice.pdf',
        contentType: 'application/pdf',
      })
      .expect(201)
      .expect({ sizeBytes: 4 });
  });

  it('rejects a file before buffering beyond the configured limit', async () => {
    const response = await request(app.getHttpServer())
      .post('/__test/storage-upload')
      .attach('file', Buffer.from('12345'), {
        filename: 'invoice.pdf',
        contentType: 'application/pdf',
      })
      .expect(413);

    expect(response.body).toEqual({
      error: {
        code: 'FILE_TOO_LARGE',
        message: 'File must not exceed 4 bytes.',
      },
    });
  });

  it('rejects an unexpected multipart field', async () => {
    const response = await request(app.getHttpServer())
      .post('/__test/storage-upload')
      .attach('document', Buffer.from('1234'), {
        filename: 'invoice.pdf',
        contentType: 'application/pdf',
      })
      .expect(400);

    expect(response.body).toEqual({
      error: {
        code: 'INVALID_MULTIPART_UPLOAD',
        message: 'Expected one file in multipart field "file".',
      },
    });
  });
});
