import type { Pool } from 'pg';
import { StoredFileRepository } from './stored-file.repository';

describe('StoredFileRepository', () => {
  const createdAt = new Date('2026-11-13T00:00:00.000Z');
  const input = {
    tenantId: '11111111-1111-4111-8111-111111111111',
    storageKey:
      'tenants/11111111-1111-4111-8111-111111111111/files/22222222-2222-4222-8222-222222222222',
    originalName: 'invoice.pdf',
    contentType: 'application/pdf',
    sizeBytes: 1234,
    checksumSha256: 'a'.repeat(64),
    createdByMembershipId: '33333333-3333-4333-8333-333333333333',
  };
  let pool: { query: jest.Mock };
  let repository: StoredFileRepository;

  beforeEach(() => {
    pool = { query: jest.fn() };
    repository = new StoredFileRepository(pool as unknown as Pool);
  });

  it('inserts and maps pending file metadata', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: '44444444-4444-4444-8444-444444444444',
          tenant_id: input.tenantId,
          record_id: null,
          storage_key: input.storageKey,
          original_name: input.originalName,
          content_type: input.contentType,
          size_bytes: String(input.sizeBytes),
          checksum_sha256: input.checksumSha256,
          scan_status: 'pending',
          created_by_membership_id: input.createdByMembershipId,
          created_at: createdAt,
        },
      ],
    });

    await expect(repository.createPending(input)).resolves.toEqual({
      id: '44444444-4444-4444-8444-444444444444',
      tenantId: input.tenantId,
      recordId: null,
      storageKey: input.storageKey,
      originalName: input.originalName,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
      checksumSha256: input.checksumSha256,
      scanStatus: 'pending',
      createdByMembershipId: input.createdByMembershipId,
      createdAt,
    });
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("'pending'"),
      [
        input.tenantId,
        null,
        input.storageKey,
        input.originalName,
        input.contentType,
        input.sizeBytes,
        input.checksumSha256,
        input.createdByMembershipId,
      ],
    );
  });

  it('fails when the database does not return the inserted row', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await expect(repository.createPending(input)).rejects.toThrow(
      'Database did not return the created file metadata',
    );
  });
});
