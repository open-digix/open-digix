import { FileAccess } from './file-access.service';
import { StoredFileRepository } from './stored-file.repository';
import { StorageObjectService } from './storage-object.service';

describe('FileAccess', () => {
  const context = { tenantId: 'tenant-a', membershipId: 'member-a' };
  const file = {
    id: 'file-a',
    storageKey: 'opaque-key',
    originalName: 'safe.pdf',
    sizeBytes: 3,
  };
  const findReadable = jest.fn();
  const getObject = jest.fn();
  let access: FileAccess;

  beforeEach(() => {
    process.env.FILE_URL_SIGNING_KEY =
      'test-secret-at-least-thirty-two-characters';
    findReadable.mockReset().mockResolvedValue(file);
    getObject.mockReset().mockResolvedValue({ body: Buffer.from('abc') });
    access = new FileAccess(
      { findReadable } as unknown as StoredFileRepository,
      { getObject } as unknown as StorageObjectService,
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
});
