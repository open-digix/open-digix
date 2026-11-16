import { BadRequestException } from '@nestjs/common';
import { parseCreateBuilderDescriptionBody } from './create-builder-description.input';

describe('parseCreateBuilderDescriptionBody', () => {
  const fileId = '11111111-1111-4111-8111-111111111111';

  it('maps and normalizes structured notes', () => {
    expect(
      parseCreateBuilderDescriptionBody({
        inputNotes: '  Employee enters an amount.  ',
        roleNotes: 'Employee, Manager',
        stepNotes: 'Manager reviews the request.',
        branchNotes: 'Approve or reject.',
        outputNotes: 'Return the final state.',
        exceptionNotes: 'Escalate when no manager exists.',
        fileRefs: [fileId.toUpperCase()],
      }),
    ).toEqual({
      sections: {
        inputs: 'Employee enters an amount.',
        roles: 'Employee, Manager',
        steps: 'Manager reviews the request.',
        branches: 'Approve or reject.',
        outputs: 'Return the final state.',
        exceptions: 'Escalate when no manager exists.',
      },
      fileRefs: [fileId],
    });
  });

  it('ignores blank optional notes', () => {
    expect(
      parseCreateBuilderDescriptionBody({
        inputNotes: 'Required input',
        stepNotes: '   ',
      }),
    ).toEqual({
      sections: { inputs: 'Required input' },
      fileRefs: [],
    });
  });

  it.each([null, [], 'invalid'])('rejects a non-object body', (body) => {
    expectInvalid(body, '/');
  });

  it('requires at least one note or file reference', () => {
    expectInvalid({ inputNotes: '  ', fileRefs: [] }, '/');
  });

  it('rejects unknown properties including tenant context', () => {
    expectInvalid(
      { inputNotes: 'Required input', tenantId: 'client-controlled' },
      '/tenantId',
    );
  });

  it('rejects note values that are not strings', () => {
    expectInvalid({ inputNotes: 123 }, '/inputNotes');
  });

  it('rejects invalid and duplicate file references', () => {
    expectInvalid(
      {
        inputNotes: 'Required input',
        fileRefs: [fileId, fileId, 'not-a-uuid'],
      },
      '/fileRefs/1',
      '/fileRefs/2',
    );
  });

  it('allows a description that contains only file references', () => {
    expect(parseCreateBuilderDescriptionBody({ fileRefs: [fileId] })).toEqual({
      sections: {},
      fileRefs: [fileId],
    });
  });
});

function expectInvalid(body: unknown, ...paths: string[]): void {
  try {
    parseCreateBuilderDescriptionBody(body);
    throw new Error('Expected parser to reject the request body');
  } catch (error) {
    expect(error).toBeInstanceOf(BadRequestException);
    const response = (error as BadRequestException).getResponse() as {
      error: { code: string; issues: Array<{ path: string }> };
    };
    expect(response.error.code).toBe('INVALID_SOURCE_INPUT');
    expect(response.error.issues.map(({ path }) => path)).toEqual(
      expect.arrayContaining(paths),
    );
  }
}
