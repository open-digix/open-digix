import { BadRequestException } from '@nestjs/common';
import type { TenantContext } from '../identity/identity.types';
import { TENANT_CONTEXT_REQUIRED } from '../identity/tenant-context.decorator';
import {
  StoredFileController,
  type UploadedMultipartFile,
} from './stored-file.controller';
import { StoredFileService } from './stored-file.service';

describe('StoredFileController', () => {
  const context: TenantContext = {
    user: {
      id: '11111111-1111-4111-8111-111111111111',
      subject: 'keycloak-subject',
      email: 'dung@example.test',
      displayName: 'Dung',
      status: 'active',
    },
    membership: {
      id: '22222222-2222-4222-8222-222222222222',
      status: 'active',
      tenant: {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        slug: 'tenant_alpha',
        name: 'Tenant Alpha',
        status: 'active',
      },
      roles: ['employee'],
    },
  };
  const file: UploadedMultipartFile = {
    originalname: 'invoice.pdf',
    mimetype: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4'),
  };
  let storedFiles: { uploadPending: jest.Mock };
  let controller: StoredFileController;

  beforeEach(() => {
    storedFiles = { uploadPending: jest.fn() };
    controller = new StoredFileController(
      storedFiles as unknown as StoredFileService,
    );
  });

  it('uses the verified tenant context and omits the internal storage key', async () => {
    storedFiles.uploadPending.mockResolvedValueOnce({
      id: '33333333-3333-4333-8333-333333333333',
      tenantId: context.membership.tenant.id,
      recordId: null,
      storageKey:
        'tenants/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/files/44444444-4444-4444-8444-444444444444',
      originalName: file.originalname,
      contentType: file.mimetype,
      sizeBytes: file.buffer.byteLength,
      checksumSha256: 'a'.repeat(64),
      scanStatus: 'pending',
      createdByMembershipId: context.membership.id,
      createdAt: new Date('2026-11-14T00:00:00.000Z'),
    });

    await expect(controller.upload(file, context)).resolves.toEqual({
      id: '33333333-3333-4333-8333-333333333333',
      recordId: null,
      originalName: 'invoice.pdf',
      contentType: 'application/pdf',
      sizeBytes: 8,
      checksumSha256: 'a'.repeat(64),
      scanStatus: 'pending',
      createdAt: '2026-11-14T00:00:00.000Z',
    });
    expect(storedFiles.uploadPending).toHaveBeenCalledWith({
      tenantId: context.membership.tenant.id,
      originalName: file.originalname,
      contentType: file.mimetype,
      body: file.buffer,
      createdByMembershipId: context.membership.id,
    });
  });

  it('rejects a request without the file field', async () => {
    await expect(controller.upload(undefined, context)).rejects.toMatchObject({
      response: { error: { code: 'FILE_REQUIRED' } },
    });
    expect(storedFiles.uploadPending).not.toHaveBeenCalled();
  });

  it('requires a verified tenant context', () => {
    expect(
      Reflect.getMetadata(TENANT_CONTEXT_REQUIRED, StoredFileController),
    ).toBe(true);
  });

  it('uses a structured bad request for a missing file', async () => {
    await expect(controller.upload(undefined, context)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
