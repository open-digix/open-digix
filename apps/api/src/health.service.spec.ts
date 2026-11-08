import { ServiceUnavailableException } from '@nestjs/common';
import type { Pool } from 'pg';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let pool: { query: jest.Mock };

  beforeEach(() => {
    pool = { query: jest.fn() };
  });

  it('reports healthy only after querying the database', async () => {
    pool.query.mockResolvedValue({});
    const service = new HealthService(pool as unknown as Pool);

    await expect(service.check()).resolves.toEqual({
      status: 'ok',
      database: 'ok',
    });
    expect(pool.query).toHaveBeenCalledWith('SELECT 1');
  });

  it('returns an unavailable error when the database cannot be reached', async () => {
    pool.query.mockRejectedValue(new Error('db down'));
    const service = new HealthService(pool as unknown as Pool);

    await expect(service.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
