import {
  CreateBucketCommand,
  HeadBucketCommand,
  type S3Client,
} from '@aws-sdk/client-s3';
import { StorageBucketInitializer } from './storage-bucket.initializer';
import type { StorageConfig } from './storage.config';

describe('StorageBucketInitializer', () => {
  const config = {
    bucket: 'digix-files',
    client: {},
  } as StorageConfig;
  let client: { send: jest.Mock };
  let initializer: StorageBucketInitializer;

  beforeEach(() => {
    client = { send: jest.fn() };
    initializer = new StorageBucketInitializer(
      client as unknown as S3Client,
      config,
    );
  });

  it('keeps an existing bucket unchanged', async () => {
    client.send.mockResolvedValueOnce({});

    await initializer.onApplicationBootstrap();

    expect(client.send).toHaveBeenCalledTimes(1);
    expect(client.send.mock.calls[0][0]).toBeInstanceOf(HeadBucketCommand);
    expect(client.send.mock.calls[0][0].input).toEqual({
      Bucket: 'digix-files',
    });
  });

  it.each([
    Object.assign(new Error('missing'), {
      name: 'NotFound',
      $metadata: { httpStatusCode: 404 },
    }),
    Object.assign(new Error('missing'), { name: 'NoSuchBucket' }),
  ])('creates the bucket when it is missing', async (missingError) => {
    client.send.mockRejectedValueOnce(missingError).mockResolvedValueOnce({});

    await initializer.onApplicationBootstrap();

    expect(client.send).toHaveBeenCalledTimes(2);
    expect(client.send.mock.calls[1][0]).toBeInstanceOf(CreateBucketCommand);
    expect(client.send.mock.calls[1][0].input).toEqual({
      Bucket: 'digix-files',
    });
  });

  it('does not hide access or connectivity failures', async () => {
    const accessDenied = Object.assign(new Error('denied'), {
      name: 'AccessDenied',
      $metadata: { httpStatusCode: 403 },
    });
    client.send.mockRejectedValueOnce(accessDenied);

    await expect(initializer.onApplicationBootstrap()).rejects.toBe(
      accessDenied,
    );
    expect(client.send).toHaveBeenCalledTimes(1);
  });

  it('tolerates another instance creating the same owned bucket first', async () => {
    const alreadyOwned = Object.assign(new Error('already owned'), {
      name: 'BucketAlreadyOwnedByYou',
    });
    client.send
      .mockRejectedValueOnce(
        Object.assign(new Error('missing'), {
          name: 'NotFound',
          $metadata: { httpStatusCode: 404 },
        }),
      )
      .mockRejectedValueOnce(alreadyOwned);

    await expect(initializer.onApplicationBootstrap()).resolves.toBeUndefined();
  });

  it('does not hide bucket creation failures', async () => {
    const createFailure = new Error('create failed');
    client.send
      .mockRejectedValueOnce(
        Object.assign(new Error('missing'), {
          name: 'NotFound',
          $metadata: { httpStatusCode: 404 },
        }),
      )
      .mockRejectedValueOnce(createFailure);

    await expect(initializer.onApplicationBootstrap()).rejects.toBe(
      createFailure,
    );
  });
});
