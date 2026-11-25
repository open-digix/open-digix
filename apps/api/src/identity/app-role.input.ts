import { BadRequestException } from '@nestjs/common';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ROLE_CODE_PATTERN = /^[a-z][a-z0-9_-]{1,63}$/;

export interface ManageAppRoleBody {
  readonly roleCode: string;
}

export function parseAppRoleBody(body: unknown): ManageAppRoleBody {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw invalidInput('Request body must be a JSON object.');
  }

  const value = body as Record<string, unknown>;
  const keys = Object.keys(value);
  if (keys.some((key) => key !== 'roleCode')) {
    throw invalidInput('Only roleCode is allowed.');
  }

  if (typeof value.roleCode !== 'string') {
    throw invalidInput('roleCode must be a valid app role code.');
  }

  const roleCode = value.roleCode.trim().toLowerCase();
  if (!ROLE_CODE_PATTERN.test(roleCode)) {
    throw invalidInput('roleCode must be a valid app role code.');
  }

  return { roleCode };
}

export function parseAppId(value: string): string {
  return parseUuid(value, 'appId', 'INVALID_APP_ID');
}

export function parseMembershipId(value: string): string {
  return parseUuid(value, 'membershipId', 'INVALID_MEMBERSHIP_ID');
}

function parseUuid(value: string, field: string, code: string): string {
  const normalized = value.trim().toLowerCase();
  if (!UUID_PATTERN.test(normalized)) {
    throw new BadRequestException({
      error: {
        code,
        message: `${field} must be a valid UUID.`,
      },
    });
  }
  return normalized;
}

function invalidInput(message: string): BadRequestException {
  return new BadRequestException({
    error: {
      code: 'INVALID_APP_ROLE_INPUT',
      message,
    },
  });
}
