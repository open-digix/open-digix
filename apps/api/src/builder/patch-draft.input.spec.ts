import { BadRequestException } from '@nestjs/common';
import { parsePatchDraftBody } from './patch-draft.input';

describe('parsePatchDraftBody', () => {
  const validDefinition = {
    schemaVersion: '1.0',
    appId: 'test_app',
    tenantId: 'tenant_alpha',
    version: 1,
    name: 'Test App',
    roles: ['employee'],
    fields: [{ id: 'title', type: 'string', required: true }],
    steps: [
      { id: 'submitted', type: 'start' },
      { id: 'accepted', type: 'end', endState: 'approved' },
      { id: 'declined', type: 'end', endState: 'rejected' },
    ],
    transitions: [
      { from: 'submitted', to: 'accepted' },
      { from: 'submitted', to: 'declined' },
    ],
  };

  it('accepts valid input with lockVersion and definition', () => {
    const res = parsePatchDraftBody({
      lockVersion: 1,
      definition: validDefinition,
    });
    expect(res.lockVersion).toBe(1);
    expect(res.definition).toEqual(validDefinition);
    expect(res.designMetadata).toBeUndefined();
  });

  it('accepts optional designMetadata', () => {
    const res = parsePatchDraftBody({
      lockVersion: 2,
      definition: validDefinition,
      designMetadata: {
        sourceMappings: [],
        openIssues: [],
      },
    });
    expect(res.designMetadata).toEqual({
      sourceMappings: [],
      openIssues: [],
    });
  });

  it('rejects missing or invalid lockVersion', () => {
    expect(() => parsePatchDraftBody({ definition: validDefinition })).toThrow(
      BadRequestException,
    );
    expect(() =>
      parsePatchDraftBody({ lockVersion: 0, definition: validDefinition }),
    ).toThrow(BadRequestException);
    expect(() =>
      parsePatchDraftBody({ lockVersion: -1, definition: validDefinition }),
    ).toThrow(BadRequestException);
  });

  it('rejects missing or invalid definition', () => {
    expect(() => parsePatchDraftBody({ lockVersion: 1 })).toThrow(
      BadRequestException,
    );
    expect(() =>
      parsePatchDraftBody({ lockVersion: 1, definition: 'invalid' }),
    ).toThrow(BadRequestException);
  });

  it('rejects non-object body', () => {
    expect(() => parsePatchDraftBody(null)).toThrow(BadRequestException);
    expect(() => parsePatchDraftBody('invalid')).toThrow(BadRequestException);
  });
});
