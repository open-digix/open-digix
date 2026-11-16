import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  BuilderSourceFileUnavailableError,
  BuilderSourceRepository,
} from './builder-source.repository';
import { BuilderSourceService } from './builder-source.service';

describe('BuilderSourceService', () => {
  const command = {
    tenantId: '11111111-1111-4111-8111-111111111111',
    applicationId: '22222222-2222-4222-8222-222222222222',
    createdByMembershipId: '33333333-3333-4333-8333-333333333333',
    sections: {
      steps: 'Manager reviews the request.',
      inputs: 'Employee enters an amount.',
      branches: 'Approve or reject.',
    },
    fileRefs: ['44444444-4444-4444-8444-444444444444'],
  };

  let createRevision: jest.Mock;
  let service: BuilderSourceService;

  beforeEach(() => {
    createRevision = jest.fn();
    service = new BuilderSourceService({
      createRevision,
    } as unknown as BuilderSourceRepository);
  });

  it('creates stable source segments in Builder section order', async () => {
    createRevision.mockImplementationOnce((input) =>
      Promise.resolve({ id: 'revision-id', ...input, revisionNo: 1 }),
    );

    await service.createRevision(command);

    expect(createRevision).toHaveBeenCalledWith({
      ...command,
      segments: [
        {
          id: 'inputs_1',
          section: 'inputs',
          text: command.sections.inputs,
        },
        {
          id: 'steps_1',
          section: 'steps',
          text: command.sections.steps,
        },
        {
          id: 'branches_1',
          section: 'branches',
          text: command.sections.branches,
        },
      ],
    });
  });

  it('hides applications outside the active tenant as not found', async () => {
    createRevision.mockResolvedValueOnce(undefined);

    await expect(service.createRevision(command)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns a safe bad request for unavailable source files', async () => {
    createRevision.mockRejectedValueOnce(
      new BuilderSourceFileUnavailableError(),
    );

    try {
      await service.createRevision(command);
      throw new Error('Expected source creation to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect(error).toMatchObject({
        response: { error: { code: 'SOURCE_FILE_NOT_AVAILABLE' } },
      });
    }
  });
});
