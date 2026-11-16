import { BadRequestException } from '@nestjs/common';

const IDENTIFIER_PATTERN = /^[a-z][a-z0-9_-]{1,63}$/;
const ALLOWED_KEYS = new Set([
  'appKey',
  'name',
  'goal',
  'departmentRefs',
  'templateKey',
]);

export interface CreateBuilderApplicationBody {
  readonly appKey: string;
  readonly name: string;
  readonly goal: string;
  readonly departmentRefs: readonly string[];
  readonly templateKey?: string;
}

interface InputIssue {
  readonly path: string;
  readonly message: string;
}

export function parseCreateBuilderApplicationBody(
  body: unknown,
): CreateBuilderApplicationBody {
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

  const appKey = requiredString(body, 'appKey', 64, issues);
  const name = requiredString(body, 'name', 120, issues);
  const goal = requiredString(body, 'goal', 2000, issues);
  const templateKey = optionalString(body, 'templateKey', 64, issues);
  const departmentRefs = parseDepartmentRefs(body.departmentRefs, issues);

  if (appKey && !IDENTIFIER_PATTERN.test(appKey)) {
    issues.push({
      path: '/appKey',
      message:
        'appKey must start with a lowercase letter and contain only lowercase letters, digits, underscores or hyphens.',
    });
  }
  if (templateKey && !IDENTIFIER_PATTERN.test(templateKey)) {
    issues.push({
      path: '/templateKey',
      message:
        'templateKey must start with a lowercase letter and contain only lowercase letters, digits, underscores or hyphens.',
    });
  }

  if (issues.length > 0) throw invalidInput(issues);

  return {
    appKey: appKey!,
    name: name!,
    goal: goal!,
    departmentRefs,
    ...(templateKey ? { templateKey } : {}),
  };
}

function requiredString(
  body: Record<string, unknown>,
  key: string,
  maxLength: number,
  issues: InputIssue[],
): string | undefined {
  const value = body[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    issues.push({
      path: `/${key}`,
      message: `${key} must be a non-empty string.`,
    });
    return undefined;
  }

  const normalized = value.trim();
  if (normalized.length > maxLength) {
    issues.push({
      path: `/${key}`,
      message: `${key} must contain at most ${maxLength} characters.`,
    });
  }
  return normalized;
}

function optionalString(
  body: Record<string, unknown>,
  key: string,
  maxLength: number,
  issues: InputIssue[],
): string | undefined {
  if (body[key] === undefined) return undefined;
  return requiredString(body, key, maxLength, issues);
}

function parseDepartmentRefs(value: unknown, issues: InputIssue[]): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    issues.push({
      path: '/departmentRefs',
      message: 'departmentRefs must be an array of strings.',
    });
    return [];
  }

  const result: string[] = [];
  const seen = new Set<string>();
  value.forEach((item, index) => {
    const normalized = typeof item === 'string' ? item.trim() : '';
    if (!normalized || normalized.length > 64) {
      issues.push({
        path: `/departmentRefs/${index}`,
        message:
          'Department reference must be a non-empty string of at most 64 characters.',
      });
      return;
    }
    if (seen.has(normalized)) {
      issues.push({
        path: `/departmentRefs/${index}`,
        message: `Department reference '${normalized}' is duplicated.`,
      });
      return;
    }
    seen.add(normalized);
    result.push(normalized);
  });
  return result;
}

function invalidInput(issues: readonly InputIssue[]): BadRequestException {
  return new BadRequestException({
    error: {
      code: 'INVALID_APP_INPUT',
      message: 'Application input is invalid.',
      issues,
    },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
