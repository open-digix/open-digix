import { BadRequestException } from '@nestjs/common';
import { parseTenantAdminRegistrationBody } from './tenant-admin-registration.input';

describe('parseTenantAdminRegistrationBody', () => {
  it('normalizes a valid tenant admin registration request', () => {
    expect(
      parseTenantAdminRegistrationBody({
        tenantName: '  Acme Corporation  ',
        tenantSlug: '  Acme-Corp  ',
        admin: {
          firstName: '  Nguyen ',
          lastName: ' Van A ',
          email: ' ADMIN@EXAMPLE.COM ',
          username: ' Admin.User ',
          password: 'correct-horse-battery',
        },
      }),
    ).toEqual({
      tenantName: 'Acme Corporation',
      tenantSlug: 'acme-corp',
      admin: {
        firstName: 'Nguyen',
        lastName: 'Van A',
        email: 'admin@example.com',
        username: 'admin.user',
        password: 'correct-horse-battery',
      },
    });
  });

  it.each([null, [], 'invalid'])('rejects a non-object body', (body) => {
    expectInvalid(body, '/');
  });

  it('rejects unknown top-level and admin properties', () => {
    expectInvalid(
      {
        tenantName: 'Acme Corporation',
        tenantSlug: 'acme-corp',
        tenantId: 'client-controlled',
        admin: {
          firstName: 'Nguyen',
          lastName: 'Van A',
          email: 'admin@example.com',
          username: 'admin',
          password: 'correct-horse-battery',
          tenantRole: 'tenant_admin',
        },
      },
      '/tenantId',
      '/admin/tenantRole',
    );
  });

  it('rejects invalid tenant, email, and username identifiers', () => {
    expectInvalid(
      {
        tenantName: 'Acme Corporation',
        tenantSlug: 'Acme Corporation',
        admin: {
          firstName: 'Nguyen',
          lastName: 'Van A',
          email: 'not-an-email',
          username: 'Admin User',
          password: 'correct-horse-battery',
        },
      },
      '/tenantSlug',
      '/admin/email',
      '/admin/username',
    );
  });

  it('rejects tenant slugs that do not match the frontend format', () => {
    expectInvalid(
      {
        tenantName: 'Acme Corporation',
        tenantSlug: 'acme_corp',
        admin: {
          firstName: 'Nguyen',
          lastName: 'Van A',
          email: 'admin@example.com',
          username: 'admin',
          password: 'correct-horse-battery',
        },
      },
      '/tenantSlug',
    );
    expectInvalid(
      {
        tenantName: 'Acme Corporation',
        tenantSlug: 'acme-',
        admin: {
          firstName: 'Nguyen',
          lastName: 'Van A',
          email: 'admin@example.com',
          username: 'admin',
          password: 'correct-horse-battery',
        },
      },
      '/tenantSlug',
    );
  });

  it('requires a tenant name to contain at least two characters', () => {
    expectInvalid(
      {
        tenantName: 'A',
        tenantSlug: 'acme-corp',
        admin: {
          firstName: 'Nguyen',
          lastName: 'Van A',
          email: 'admin@example.com',
          username: 'admin',
          password: 'correct-horse-battery',
        },
      },
      '/tenantName',
    );
  });

  it('rejects a weak or missing password', () => {
    expectInvalid(
      {
        tenantName: 'Acme Corporation',
        tenantSlug: 'acme-corp',
        admin: {
          firstName: 'Nguyen',
          lastName: 'Van A',
          email: 'admin@example.com',
          username: 'admin',
          password: 'short',
        },
      },
      '/admin/password',
    );
  });

  it('rejects a display name that exceeds the database limit', () => {
    expectInvalid(
      {
        tenantName: 'Acme Corporation',
        tenantSlug: 'acme-corp',
        admin: {
          firstName: 'A'.repeat(80),
          lastName: 'B'.repeat(80),
          email: 'admin@example.com',
          username: 'admin',
          password: 'correct-horse-battery',
        },
      },
      '/admin',
    );
  });

  it('requires the nested admin object and all account fields', () => {
    expectInvalid(
      {
        tenantName: ' ',
        tenantSlug: 'acme-corp',
        admin: {
          firstName: 'Nguyen',
          email: 'admin@example.com',
          password: 'correct-horse-battery',
        },
      },
      '/tenantName',
      '/admin/lastName',
      '/admin/username',
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
    expect(response.error.code).toBe('VALIDATION_FAILED');
    expect(response.error.issues.map(({ path }) => path)).toEqual(
      expect.arrayContaining(paths),
    );
  }
}
