import { BadRequestException } from '@nestjs/common';
import { parseTenantAdminRegistrationBody } from './tenant-admin-registration.input';

describe('parseTenantAdminRegistrationBody', () => {
  it('normalizes a valid tenant admin registration request', () => {
    expect(
      parseTenantAdminRegistrationBody({
        companyName: '  Acme Corporation  ',
        tenantSlug: '  acme_corp  ',
        adminEmail: '  ADMIN@EXAMPLE.COM ',
        adminDisplayName: '  Nguyen Van A  ',
        password: 'correct-horse-battery',
        passwordConfirmation: 'correct-horse-battery',
      }),
    ).toEqual({
      companyName: 'Acme Corporation',
      tenantSlug: 'acme_corp',
      adminEmail: 'admin@example.com',
      adminDisplayName: 'Nguyen Van A',
      password: 'correct-horse-battery',
      passwordConfirmation: 'correct-horse-battery',
    });
  });

  it.each([null, [], 'invalid'])('rejects a non-object body', (body) => {
    expectInvalid(body, '/');
  });

  it('rejects unknown properties', () => {
    expectInvalid(
      {
        companyName: 'Acme Corporation',
        tenantSlug: 'acme_corp',
        adminEmail: 'admin@example.com',
        adminDisplayName: 'Nguyen Van A',
        password: 'correct-horse-battery',
        passwordConfirmation: 'correct-horse-battery',
        tenantId: 'client-controlled',
      },
      '/tenantId',
    );
  });

  it('rejects invalid tenant and email identifiers', () => {
    expectInvalid(
      {
        companyName: 'Acme Corporation',
        tenantSlug: 'Acme Corporation',
        adminEmail: 'not-an-email',
        adminDisplayName: 'Nguyen Van A',
        password: 'correct-horse-battery',
        passwordConfirmation: 'correct-horse-battery',
      },
      '/tenantSlug',
      '/adminEmail',
    );
  });

  it('rejects a weak or mismatched password', () => {
    expectInvalid(
      {
        companyName: 'Acme Corporation',
        tenantSlug: 'acme_corp',
        adminEmail: 'admin@example.com',
        adminDisplayName: 'Nguyen Van A',
        password: 'short',
        passwordConfirmation: 'different',
      },
      '/password',
      '/passwordConfirmation',
    );
  });

  it('rejects missing required fields', () => {
    expectInvalid(
      {
        companyName: ' ',
        tenantSlug: 'acme_corp',
        adminEmail: 'admin@example.com',
        adminDisplayName: 'Nguyen Van A',
        password: 'correct-horse-battery',
      },
      '/companyName',
      '/passwordConfirmation',
    );
  });
});

function expectInvalid(body: unknown, ...paths: string[]): void {
  try {
    parseTenantAdminRegistrationBody(body);
    throw new Error('Expected parser to reject the request body');
  } catch (error) {
    expect(error).toBeInstanceOf(BadRequestException);
    const response = (error as BadRequestException).getResponse() as {
      error: { code: string; issues: Array<{ path: string }> };
    };
    expect(response.error.code).toBe('INVALID_TENANT_ADMIN_REGISTRATION_INPUT');
    expect(response.error.issues.map(({ path }) => path)).toEqual(
      expect.arrayContaining(paths),
    );
  }
}
