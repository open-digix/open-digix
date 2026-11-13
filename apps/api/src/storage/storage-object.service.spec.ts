import {
  GetObjectCommand,
  type GetObjectCommandOutput,
  PutObjectCommand,
  type S3Client,
} from '@aws-sdk/client-s3';
import {
  StorageObjectService,
  type StorageObjectBody,
} from './storage-object.service';
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

describe('StorageObjectService.getObject', () => {
  type SendGetObject = (
    command: GetObjectCommand,
  ) => Promise<GetObjectCommandOutput>;

  const config = {
    bucket: 'digix-files',
    client: {},
  } as StorageConfig;
  let send: jest.MockedFunction<SendGetObject>;
  let service: StorageObjectService;

  beforeEach(() => {
    send = jest.fn(
      (command: GetObjectCommand): Promise<GetObjectCommandOutput> => {
        void command;
        return Promise.resolve({ $metadata: {} });
      },
    );
    service = new StorageObjectService({ send } as unknown as S3Client, config);
  });

  it('gets an object stream and metadata from the configured bucket', async () => {
    const body = {} as StorageObjectBody;
    const lastModified = new Date('2026-11-13T00:00:00.000Z');
    send.mockResolvedValueOnce({
      $metadata: {},
      Body: body,
      ContentLength: 13,
      ContentType: 'text/plain',
      ETag: '"etag-value"',
      LastModified: lastModified,
      VersionId: 'version-1',
    });

    await expect(
      service.getObject('tenants/tenant-1/files/file-1'),
    ).resolves.toEqual({
      key: 'tenants/tenant-1/files/file-1',
      body,
      contentLength: 13,
      contentType: 'text/plain',
      etag: '"etag-value"',
      lastModified,
      versionId: 'version-1',
    });

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toBeInstanceOf(GetObjectCommand);
    expect(send.mock.calls[0][0].input).toEqual({
      Bucket: 'digix-files',
      Key: 'tenants/tenant-1/files/file-1',
    });
  });

  it('rejects an incomplete storage response without a body', async () => {
    send.mockResolvedValueOnce({ $metadata: {} });

    await expect(service.getObject('file-1')).rejects.toThrow(
      'Object storage returned a response without a body',
    );
  });

  it('does not hide storage download failures', async () => {
    const downloadFailure = new Error('download failed');
    send.mockRejectedValueOnce(downloadFailure);

    await expect(service.getObject('file-1')).rejects.toBe(downloadFailure);
  });
});
