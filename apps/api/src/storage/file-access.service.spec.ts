import { FileAccess } from './file-access.service';
import { AppAuthorizationService } from '../identity/app-authorization.service';
import { ForbiddenException } from '@nestjs/common';
import { StoredFileRepository } from './stored-file.repository';
import { StorageObjectService } from './storage-object.service';

describe('FileAccess', () => {
  const context = { tenantId: 'tenant-a', membershipId: 'member-a' };
  const file = {
    id: 'file-a',
    applicationId: 'app-a',
    storageKey: 'opaque-key',
    originalName: 'safe.pdf',
    sizeBytes: 3,
  };
  const findReadable = jest.fn();
  const getObject = jest.fn();
  const requireAppAccess = jest.fn();
  let access: FileAccess;

  beforeEach(() => {
    process.env.FILE_URL_SIGNING_KEY =
      'test-secret-at-least-thirty-two-characters';
    findReadable.mockReset().mockResolvedValue(file);
    getObject.mockReset().mockResolvedValue({ body: Buffer.from('abc') });
    requireAppAccess.mockReset().mockResolvedValue({ applicationId: 'app-a' });
    access = new FileAccess(
      { findReadable } as unknown as StoredFileRepository,
      { getObject } as unknown as StorageObjectService,
      { requireAppAccess } as unknown as AppAuthorizationService,
    );
  });

  afterAll(() => {
    delete process.env.FILE_URL_SIGNING_KEY;
  });

  it('only signs URLs for readable clean files', async () => {
    findReadable.mockResolvedValueOnce(null);
    await expect(access.getDownloadUrl(file.id, context)).rejects.toMatchObject(
      { status: 404 },
    );
    expect(getObject).not.toHaveBeenCalled();
  });

  it('rechecks tenant, membership and record on every download', async () => {
    const { url } = await access.getDownloadUrl(file.id, context);
    const params = new URL(url, 'http://localhost').searchParams;
    const expiry = params.get('expires')!;
    const signature = params.get('signature')!;
    await expect(
      access.download(file.id, context, expiry, signature),
    ).resolves.toMatchObject({ file });
    expect(requireAppAccess).toHaveBeenCalledWith({
      tenantId: context.tenantId,
      applicationId: file.applicationId,
      membershipId: context.membershipId,
    });
    await expect(
      access.download(
        file.id,
        { ...context, tenantId: 'tenant-b' },
        expiry,
        signature,
      ),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      access.download(
        file.id,
        { ...context, membershipId: 'member-b' },
        expiry,
        signature,
      ),
    ).rejects.toMatchObject({ status: 404 });
    findReadable.mockResolvedValueOnce(null);
    await expect(
      access.download(file.id, context, expiry, signature),
    ).rejects.toMatchObject({ status: 404 });
    expect(getObject).toHaveBeenCalledTimes(1);
  });

  it('rejects expired or forged URLs', async () => {
    const { url } = await access.getDownloadUrl(file.id, context);
    const params = new URL(url, 'http://localhost').searchParams;
    await expect(
      access.download(file.id, context, '1', params.get('signature')!),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      access.download(file.id, context, params.get('expires')!, '0'.repeat(64)),
    ).rejects.toMatchObject({ status: 404 });
    expect(getObject).not.toHaveBeenCalled();
  });

  it('denies a previously signed URL after app membership is revoked', async () => {
    const { url } = await access.getDownloadUrl(file.id, context);
    const params = new URL(url, 'http://localhost').searchParams;
    requireAppAccess.mockRejectedValueOnce(new ForbiddenException());
    await expect(
      access.download(
        file.id,
        context,
        params.get('expires')!,
        params.get('signature')!,
      ),
    ).rejects.toMatchObject({
      status: 404,
      response: { error: { code: 'FILE_NOT_FOUND' } },
    });
    expect(getObject).not.toHaveBeenCalled();
  });

  it('does not accept membership in another app of the same tenant', async () => {
    // The file belongs to app-a; membership in app-b alone is insufficient.
    requireAppAccess.mockImplementationOnce(({ applicationId }) => {
      expect(applicationId).toBe('app-a');
      throw new ForbiddenException();
    });
    await expect(access.getDownloadUrl(file.id, context)).rejects.toMatchObject(
      { status: 404, response: { error: { code: 'FILE_NOT_FOUND' } } },
    );
    expect(getObject).not.toHaveBeenCalled();
  });

  it('rechecks actual B03 app membership after signing despite an unchanged token', async () => {
    const roles = new Map([
      ['app-a', ['reader']],
      ['app-b', ['reader']],
    ]);
    const authorization = new AppAuthorizationService({
      findApplication: jest
        .fn()
        .mockResolvedValue({ id: 'app-a', status: 'active' }),
      findMembershipAccess: jest.fn(
        (_tenantId: string, applicationId: string) =>
          Promise.resolve({
            roleCodes: roles.get(applicationId) ?? [],
            permissions: [],
          }),
      ),
    });
    const scopedAccess = new FileAccess(
      { findReadable } as unknown as StoredFileRepository,
      { getObject } as unknown as StorageObjectService,
      authorization,
    );
    const { url } = await scopedAccess.getDownloadUrl(file.id, context);
    roles.delete('app-a'); // app-b role remains; URL and identity are unchanged
    const params = new URL(url, 'http://localhost').searchParams;
    await expect(
      scopedAccess.download(
        file.id,
        context,
        params.get('expires')!,
        params.get('signature')!,
      ),
    ).rejects.toMatchObject({ status: 404 });
    expect(getObject).not.toHaveBeenCalled();
  });
});
