import { BadRequestException } from '@nestjs/common';

const TENANT_SLUG_PATTERN = /^[a-z][a-z0-9_-]{1,63}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_KEYS = new Set([
  'companyName',
  'tenantSlug',
  'adminEmail',
  'adminDisplayName',
  'password',
  'passwordConfirmation',
]);

export interface TenantAdminRegistrationBody {
  readonly companyName: string;
  readonly tenantSlug: string;
  readonly adminEmail: string;
  readonly adminDisplayName: string;
  readonly password: string;
  readonly passwordConfirmation: string;
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
  Object.keys(body).forEach((key) => {
    if (!ALLOWED_KEYS.has(key)) {
      issues.push({ path: `/${key}`, message: 'Property is not allowed.' });
    }
  });

  const companyName = requiredString(body, 'companyName', 160, issues);
  const tenantSlug = requiredString(body, 'tenantSlug', 64, issues);
  const adminEmail = requiredString(body, 'adminEmail', 320, issues);
  const adminDisplayName = requiredString(
    body,
    'adminDisplayName',
    160,
    issues,
  );
  const password = requiredString(body, 'password', 128, issues, false);
  const passwordConfirmation = requiredString(
    body,
    'passwordConfirmation',
    128,
    issues,
    false,
  );

  if (tenantSlug && !TENANT_SLUG_PATTERN.test(tenantSlug)) {
    issues.push({
      path: '/tenantSlug',
      message:
        'tenantSlug must start with a lowercase letter and contain only lowercase letters, digits, underscores or hyphens.',
    });
  }

  if (adminEmail && !EMAIL_PATTERN.test(adminEmail)) {
    issues.push({
      path: '/adminEmail',
      message: 'adminEmail must be a valid email address.',
    });
  }

  if (password && password.length < 8) {
    issues.push({
      path: '/password',
      message: 'password must contain at least 8 characters.',
    });
  }

  if (
    password !== undefined &&
    passwordConfirmation !== undefined &&
    password !== passwordConfirmation
  ) {
    issues.push({
      path: '/passwordConfirmation',
      message: 'passwordConfirmation must match password.',
    });
  }

  if (issues.length > 0) throw invalidInput(issues);

  return {
    companyName: companyName!,
    tenantSlug: tenantSlug!,
    adminEmail: adminEmail!.toLowerCase(),
    adminDisplayName: adminDisplayName!,
    password: password!,
    passwordConfirmation: passwordConfirmation!,
  };
}

function requiredString(
  body: Record<string, unknown>,
  key: string,
  maxLength: number,
  issues: InputIssue[],
  trim = true,
): string | undefined {
  const value = body[key];
  if (typeof value !== 'string' || (trim && value.trim().length === 0)) {
    issues.push({
      path: `/${key}`,
      message: `${key} must be a non-empty string.`,
    });
    return undefined;
  }

  if (!trim && value.length === 0) {
    issues.push({
      path: `/${key}`,
      message: `${key} must be a non-empty string.`,
    });
    return undefined;
  }

  const normalized = trim ? value.trim() : value;
  if (normalized.length > maxLength) {
    issues.push({
      path: `/${key}`,
      message: `${key} must contain at most ${maxLength} characters.`,
    });
  }
  return normalized;
}

function invalidInput(issues: readonly InputIssue[]): BadRequestException {
  return new BadRequestException({
    error: {
      code: 'INVALID_TENANT_ADMIN_REGISTRATION_INPUT',
      message: 'Tenant admin registration input is invalid.',
      issues,
    },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
