import { ServiceUnavailableException } from '@nestjs/common';
import { Pool } from 'pg';
import { HealthService } from './health.service';

describe('HealthService', () => {
  afterEach(() => jest.restoreAllMocks());

  it('reports healthy only after querying the database', async () => {
    const query = jest
      .spyOn(Pool.prototype, 'query')
      .mockResolvedValue({} as never);
    const service = new HealthService();

    await expect(service.check()).resolves.toEqual({
      status: 'ok',
      database: 'ok',
    });
    expect(query).toHaveBeenCalledWith('SELECT 1');
    await service.onModuleDestroy();
  });

  it('returns an unavailable error when the database cannot be reached', async () => {
    jest.spyOn(Pool.prototype, 'query').mockRejectedValue(new Error('db down'));
    const service = new HealthService();

    await expect(service.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    await service.onModuleDestroy();
  });
});
