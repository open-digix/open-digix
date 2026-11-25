import { BadRequestException } from '@nestjs/common';

const TENANT_SLUG_PATTERN = /^[a-z][a-z0-9_-]{1,63}$/;
const USERNAME_PATTERN = /^[a-z][a-z0-9._-]{2,63}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_KEYS = new Set(['tenantName', 'tenantSlug', 'admin']);
const ADMIN_ALLOWED_KEYS = new Set([
  'firstName',
  'lastName',
  'email',
  'username',
  'password',
]);

export interface TenantAdminRegistrationBody {
  readonly tenantName: string;
  readonly tenantSlug: string;
  readonly admin: TenantAdminAccountInput;
}

export interface TenantAdminAccountInput {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly username: string;
  readonly password: string;
}

interface InputIssue {
  readonly path: string;
  readonly message: string;
}

export function parseTenantAdminRegistrationBody(
  body: unknown,
): TenantAdminRegistrationBody {
  if (!isRecord(body)) {
    throw invalidInput([
      { path: '/', message: 'Request body must be a JSON object.' },
    ]);
  }

  const issues: InputIssue[] = [];
  collectUnknownProperties(body, ALLOWED_KEYS, '', issues);

  const tenantName = requiredString(body, 'tenantName', 160, issues);
  const tenantSlugValue = requiredString(body, 'tenantSlug', 64, issues);
  const tenantSlug = tenantSlugValue?.toLowerCase();
  const admin = parseAdmin(body.admin, issues);

  if (tenantSlug && !TENANT_SLUG_PATTERN.test(tenantSlug)) {
    issues.push({
      path: '/tenantSlug',
      message:
        'tenantSlug must start with a lowercase letter and contain only lowercase letters, digits, underscores or hyphens.',
    });
  }

  if (issues.length > 0) throw invalidInput(issues);

  return {
    tenantName: tenantName!,
    tenantSlug: tenantSlug!,
    admin: admin!,
  };
}

function parseAdmin(
  value: unknown,
  issues: InputIssue[],
): TenantAdminAccountInput | undefined {
  if (!isRecord(value)) {
    issues.push({
      path: '/admin',
      message: 'admin must be a JSON object.',
    });
    return undefined;
  }

  collectUnknownProperties(value, ADMIN_ALLOWED_KEYS, '/admin', issues);

  const firstName = requiredString(value, 'firstName', 80, issues, '/admin');
  const lastName = requiredString(value, 'lastName', 80, issues, '/admin');
  const emailValue = requiredString(value, 'email', 320, issues, '/admin');
  const usernameValue = requiredString(value, 'username', 64, issues, '/admin');
  const password = requiredSecret(value, 'password', 128, issues, '/admin');
  const email = emailValue?.toLowerCase();
  const username = usernameValue?.toLowerCase();

  if (email && !EMAIL_PATTERN.test(email)) {
    issues.push({
      path: '/admin/email',
      message: 'email must be a valid email address.',
    });
  }
  if (username && !USERNAME_PATTERN.test(username)) {
    issues.push({
      path: '/admin/username',
      message:
        'username must start with a lowercase letter and contain only lowercase letters, digits, dots, underscores or hyphens.',
    });
  }
  if (password && password.length < 8) {
    issues.push({
      path: '/admin/password',
      message: 'password must contain at least 8 characters.',
    });
  }

  return {
    firstName: firstName!,
    lastName: lastName!,
    email: email!,
    username: username!,
    password: password!,
  };
}

function requiredString(
  body: Record<string, unknown>,
  key: string,
  maxLength: number,
  issues: InputIssue[],
  pathPrefix = '',
): string | undefined {
  const path = `${pathPrefix}/${key}`;
  const value = body[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    issues.push({
      path,
      message: `${key} must be a non-empty string.`,
    });
    return undefined;
  }

  const normalized = value.trim();
  if (normalized.length > maxLength) {
    issues.push({
      path,
      message: `${key} must contain at most ${maxLength} characters.`,
    });
  }
  return normalized;
}

function requiredSecret(
  body: Record<string, unknown>,
  key: string,
  maxLength: number,
  issues: InputIssue[],
  pathPrefix: string,
): string | undefined {
  const path = `${pathPrefix}/${key}`;
  const value = body[key];
  if (typeof value !== 'string' || value.length === 0) {
    issues.push({
      path,
      message: `${key} must be a non-empty string.`,
    });
    return undefined;
  }
  if (value.length > maxLength) {
    issues.push({
      path,
      message: `${key} must contain at most ${maxLength} characters.`,
    });
  }
  return value;
}

function collectUnknownProperties(
  body: Record<string, unknown>,
  allowedKeys: ReadonlySet<string>,
  pathPrefix: string,
  issues: InputIssue[],
): void {
  Object.keys(body).forEach((key) => {
    if (!allowedKeys.has(key)) {
      issues.push({
        path: `${pathPrefix}/${key}`,
        message: 'Property is not allowed.',
      });
    }
  });
}

function invalidInput(issues: readonly InputIssue[]): BadRequestException {
  return new BadRequestException({
    error: {
      code: 'VALIDATION_FAILED',
      message: 'Tenant registration input is invalid.',
      issues,
    },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
