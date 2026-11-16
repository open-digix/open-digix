import { BadRequestException } from '@nestjs/common';
import { parseCreateBuilderApplicationBody } from './create-builder-application.input';

describe('parseCreateBuilderApplicationBody', () => {
  it('normalizes a valid request body', () => {
    expect(
      parseCreateBuilderApplicationBody({
        appKey: 'purchase_request',
        name: '  Purchase request  ',
        goal: '  Control purchase approvals  ',
        departmentRefs: [' finance ', 'operations'],
        templateKey: 'purchase_v1',
      }),
    ).toEqual({
      appKey: 'purchase_request',
      name: 'Purchase request',
      goal: 'Control purchase approvals',
      departmentRefs: ['finance', 'operations'],
      templateKey: 'purchase_v1',
    });
  });

  it('defaults omitted department references to an empty list', () => {
    expect(
      parseCreateBuilderApplicationBody({
        appKey: 'blank_request',
        name: 'Blank request',
        goal: 'Build manually',
      }),
    ).toMatchObject({ departmentRefs: [] });
  });

  it.each([null, [], 'invalid'])('rejects a non-object body', (body) => {
    expectInvalid(body, '/');
  });

  it('rejects unknown properties including client-selected tenant context', () => {
    expectInvalid(
      {
        appKey: 'blank_request',
        name: 'Blank request',
        goal: 'Build manually',
        tenantId: 'client-controlled',
      },
      '/tenantId',
    );
  });

  it('rejects missing or malformed required strings', () => {
    expectInvalid(
      { appKey: 'Invalid Key', name: ' ', goal: 123 },
      '/appKey',
      '/name',
      '/goal',
    );
  });

  it('rejects invalid or duplicate department references', () => {
    expectInvalid(
      {
        appKey: 'blank_request',
        name: 'Blank request',
        goal: 'Build manually',
        departmentRefs: ['finance', ' finance ', 123],
      },
      '/departmentRefs/1',
      '/departmentRefs/2',
    );
  });

  it('rejects a malformed template key', () => {
    expectInvalid(
      {
        appKey: 'blank_request',
        name: 'Blank request',
        goal: 'Build manually',
        templateKey: 'Purchase Template',
      },
      '/templateKey',
    );
  });
});

function expectInvalid(body: unknown, ...paths: string[]): void {
  try {
    parseCreateBuilderApplicationBody(body);
    throw new Error('Expected parser to reject the request body');
  } catch (error) {
    expect(error).toBeInstanceOf(BadRequestException);
    const response = (error as BadRequestException).getResponse() as {
      error: { code: string; issues: Array<{ path: string }> };
    };
    expect(response.error.code).toBe('INVALID_APP_INPUT');
    expect(response.error.issues.map(({ path }) => path)).toEqual(
      expect.arrayContaining(paths),
    );
  }
}
