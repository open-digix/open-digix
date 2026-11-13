import { PutObjectCommand, type S3Client } from '@aws-sdk/client-s3';
import { StorageObjectService } from './storage-object.service';
import type { StorageConfig } from './storage.config';

describe('StorageObjectService', () => {
  type PutObjectResponse = { ETag?: string; VersionId?: string };
  type SendPutObject = (
    command: PutObjectCommand,
  ) => Promise<PutObjectResponse>;

  const config = {
    bucket: 'digix-files',
    client: {},
  } as StorageConfig;
  let send: jest.MockedFunction<SendPutObject>;
  let client: { send: SendPutObject };
  let service: StorageObjectService;

  beforeEach(() => {
    send = jest.fn((command: PutObjectCommand): Promise<PutObjectResponse> => {
      void command;
      return Promise.resolve({});
    });
    client = { send };
    service = new StorageObjectService(client as unknown as S3Client, config);
  });

  it('puts an object in the configured bucket', async () => {
    const body = new TextEncoder().encode('hello storage');
    send.mockResolvedValueOnce({
      ETag: '"etag-value"',
      VersionId: 'version-1',
    });

    await expect(
      service.putObject({
        key: 'tenants/tenant-1/files/file-1',
        body,
        contentType: 'text/plain',
      }),
    ).resolves.toEqual({
      key: 'tenants/tenant-1/files/file-1',
      etag: '"etag-value"',
      versionId: 'version-1',
    });

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toBeInstanceOf(PutObjectCommand);
    expect(send.mock.calls[0][0].input).toEqual({
      Bucket: 'digix-files',
      Key: 'tenants/tenant-1/files/file-1',
      Body: body,
      ContentLength: body.byteLength,
      ContentType: 'text/plain',
    });
  });

  it('returns only the key when the storage omits optional metadata', async () => {
    send.mockResolvedValueOnce({});

    await expect(
      service.putObject({
        key: 'empty-file',
        body: new Uint8Array(),
        contentType: 'application/octet-stream',
      }),
    ).resolves.toEqual({
      key: 'empty-file',
      etag: undefined,
      versionId: undefined,
    });
  });

  it('does not hide storage upload failures', async () => {
    const uploadFailure = new Error('upload failed');
    send.mockRejectedValueOnce(uploadFailure);

    await expect(
      service.putObject({
        key: 'file-1',
        body: new Uint8Array([1]),
        contentType: 'application/octet-stream',
      }),
    ).rejects.toBe(uploadFailure);
  });
});
