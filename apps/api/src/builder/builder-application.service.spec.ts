import { BuilderApplicationRepository } from './builder-application.repository';
import { BuilderApplicationService } from './builder-application.service';
import { builderJsonChecksum } from './builder-checksum';

describe('BuilderApplicationService', () => {
  const command = {
    tenantId: '11111111-1111-4111-8111-111111111111',
    createdByMembershipId: '22222222-2222-4222-8222-222222222222',
    appKey: 'blank_request',
    name: 'Blank request',
    goal: 'Build a workflow manually',
    departmentRefs: ['operations'],
  };
  const created = {
    appId: '33333333-3333-4333-8333-333333333333',
    appKey: command.appKey,
    name: command.name,
    status: 'draft' as const,
    versionId: '44444444-4444-4444-8444-444444444444',
    version: 1,
    versionStatus: 'draft' as const,
    lockVersion: 1,
  };

  let createDraft: jest.Mock;
  let service: BuilderApplicationService;

  beforeEach(() => {
    createDraft = jest.fn().mockResolvedValue(created);
    const repository = { createDraft };
    service = new BuilderApplicationService(
      repository as unknown as BuilderApplicationRepository,
    );
  });

  it('creates a blank schema-v1 draft with a stable checksum', async () => {
    await expect(service.createBlankDraft(command)).resolves.toEqual(created);
    expect(createDraft).toHaveBeenCalledWith({
      tenantId: command.tenantId,
      createdByMembershipId: command.createdByMembershipId,
      appKey: command.appKey,
      name: command.name,
      goal: command.goal,
      departmentRefs: command.departmentRefs,
      schemaVersion: '1.0',
      initialDefinition: {},
      definitionChecksum: builderJsonChecksum({}),
    });
  });

  it('defaults optional department references to an empty list', async () => {
    await service.createBlankDraft({
      tenantId: command.tenantId,
      createdByMembershipId: command.createdByMembershipId,
      appKey: command.appKey,
      name: command.name,
    });

    expect(createDraft).toHaveBeenCalledWith(
      expect.objectContaining({ departmentRefs: [] }),
    );
  });
});
