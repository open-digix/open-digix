import {
  StorageObjectService,
  type PutStorageObjectInput,
  type PutStorageObjectResult,
} from './storage-object.service';
import {
  StoredFileRepository,
  type CreatePendingStoredFileInput,
  type StoredFileMetadata,
} from './stored-file.repository';
import {
  StoredFileService,
  type UploadPendingFileInput,
} from './stored-file.service';

describe('StoredFileService', () => {
  const tenantId = '11111111-1111-4111-8111-111111111111';
  const membershipId = '22222222-2222-4222-8222-222222222222';
  const input: UploadPendingFileInput = {
    tenantId,
    recordId: '33333333-3333-4333-8333-333333333333',
    originalName: 'invoice.txt',
    contentType: 'text/plain',
    body: new TextEncoder().encode('abc'),
    createdByMembershipId: membershipId,
  };
  const createdAt = new Date('2026-11-14T00:00:00.000Z');
  let putObject: jest.MockedFunction<StorageObjectService['putObject']>;
  let deleteObject: jest.MockedFunction<StorageObjectService['deleteObject']>;
  let createPending: jest.MockedFunction<StoredFileRepository['createPending']>;
  let service: StoredFileService;

  beforeEach(() => {
    putObject = jest.fn(
      (object: PutStorageObjectInput): Promise<PutStorageObjectResult> =>
        Promise.resolve({ key: object.key }),
    );
    deleteObject = jest.fn((key: string): Promise<void> => {
      void key;
      return Promise.resolve();
    });
    createPending = jest.fn(
      (metadata: CreatePendingStoredFileInput): Promise<StoredFileMetadata> =>
        Promise.resolve({
          id: '44444444-4444-4444-8444-444444444444',
          tenantId: metadata.tenantId,
          recordId: metadata.recordId ?? null,
          storageKey: metadata.storageKey,
          originalName: metadata.originalName,
          contentType: metadata.contentType,
          sizeBytes: metadata.sizeBytes,
          checksumSha256: metadata.checksumSha256,
          scanStatus: 'pending',
          createdByMembershipId: metadata.createdByMembershipId,
          createdAt,
        }),
    );
    service = new StoredFileService(
      { putObject, deleteObject } as unknown as StorageObjectService,
      { createPending } as unknown as StoredFileRepository,
    );
  });

  it('uploads an object and persists server-derived pending metadata', async () => {
    const result = await service.uploadPending(input);
    const uploadedObject = putObject.mock.calls[0][0];
    const persistedMetadata = createPending.mock.calls[0][0];

    expect(uploadedObject.key).toMatch(
      new RegExp(
        `^tenants/${tenantId}/files/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`,
      ),
    );
    expect(uploadedObject).toEqual({
      key: persistedMetadata.storageKey,
      body: input.body,
      contentType: input.contentType,
    });
    expect(persistedMetadata).toEqual({
      tenantId,
      recordId: input.recordId,
      storageKey: uploadedObject.key,
      originalName: input.originalName,
      contentType: input.contentType,
      sizeBytes: 3,
      checksumSha256:
        'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
      createdByMembershipId: membershipId,
    });
    expect(result).toMatchObject({
      storageKey: uploadedObject.key,
      sizeBytes: 3,
      scanStatus: 'pending',
    });
    expect(deleteObject).not.toHaveBeenCalled();
  });

  it('does not persist metadata when the object upload fails', async () => {
    const uploadError = new Error('upload failed');
    putObject.mockRejectedValueOnce(uploadError);

    await expect(service.uploadPending(input)).rejects.toBe(uploadError);
    expect(createPending).not.toHaveBeenCalled();
    expect(deleteObject).not.toHaveBeenCalled();
  });

  it('deletes the uploaded object when metadata persistence fails', async () => {
    const databaseError = new Error('database failed');
    createPending.mockRejectedValueOnce(databaseError);

    await expect(service.uploadPending(input)).rejects.toBe(databaseError);
    expect(deleteObject).toHaveBeenCalledWith(putObject.mock.calls[0][0].key);
  });

  it('reports both the database and cleanup failures', async () => {
    const databaseError = new Error('database failed');
    const cleanupError = new Error('cleanup failed');
    createPending.mockRejectedValueOnce(databaseError);
    deleteObject.mockRejectedValueOnce(cleanupError);

    try {
      await service.uploadPending(input);
      throw new Error('Expected uploadPending to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(AggregateError);
      expect((error as AggregateError).errors).toEqual([
        databaseError,
        cleanupError,
      ]);
    }
  });
});
