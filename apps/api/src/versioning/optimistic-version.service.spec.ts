import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { OptimisticVersionService } from './optimistic-version.service';

describe('OptimisticVersionService', () => {
  const service = new OptimisticVersionService();

  it('updates when expectedVersion matches', async () => {
    const updateIfVersionMatches = jest.fn().mockResolvedValue({
      id: 'draft-a',
      version: 2,
    });
    const getCurrentVersion = jest.fn();

    await expect(
      service.update({
        expectedVersion: 1,
        updateIfVersionMatches,
        getCurrentVersion,
      }),
    ).resolves.toEqual({ id: 'draft-a', version: 2 });

    expect(updateIfVersionMatches).toHaveBeenCalledWith(1);
    expect(getCurrentVersion).not.toHaveBeenCalled();
  });

  it('returns VERSION_CONFLICT when the expectedVersion is stale', async () => {
    const updateIfVersionMatches = jest.fn().mockResolvedValue(null);
    const getCurrentVersion = jest.fn().mockResolvedValue(2);

    await expect(
      service.update({
        expectedVersion: 1,
        updateIfVersionMatches,
        getCurrentVersion,
      }),
    ).rejects.toMatchObject({
      response: {
        error: {
          code: 'VERSION_CONFLICT',
          expectedVersion: 1,
          currentVersion: 2,
        },
      },
    } as Partial<ConflictException>);
  });

  it('does not mutate when the resource no longer exists', async () => {
    const updateIfVersionMatches = jest.fn().mockResolvedValue(null);
    const getCurrentVersion = jest.fn().mockResolvedValue(null);

    await expect(
      service.update({
        expectedVersion: 1,
        updateIfVersionMatches,
        getCurrentVersion,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects an invalid expectedVersion before calling the repository', async () => {
    const updateIfVersionMatches = jest.fn();
    const getCurrentVersion = jest.fn();

    await expect(
      service.update({
        expectedVersion: 0,
        updateIfVersionMatches,
        getCurrentVersion,
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    expect(updateIfVersionMatches).not.toHaveBeenCalled();
    expect(getCurrentVersion).not.toHaveBeenCalled();
  });
});
