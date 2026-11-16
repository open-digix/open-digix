import { BadRequestException } from '@nestjs/common';
import type { BuilderSourceSection } from './builder.types';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_NOTE_LENGTH = 10_000;
const NOTE_FIELDS = [
  ['inputNotes', 'inputs'],
  ['roleNotes', 'roles'],
  ['stepNotes', 'steps'],
  ['branchNotes', 'branches'],
  ['outputNotes', 'outputs'],
  ['exceptionNotes', 'exceptions'],
] as const satisfies readonly (readonly [string, BuilderSourceSection])[];
const ALLOWED_KEYS = new Set([
  ...NOTE_FIELDS.map(([field]) => field),
  'fileRefs',
]);

export interface CreateBuilderDescriptionBody {
  readonly sections: Readonly<Partial<Record<BuilderSourceSection, string>>>;
  readonly fileRefs: readonly string[];
}

interface InputIssue {
  readonly path: string;
  readonly message: string;
}

export function parseCreateBuilderDescriptionBody(
  body: unknown,
): CreateBuilderDescriptionBody {
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

  const sections: Partial<Record<BuilderSourceSection, string>> = {};
  NOTE_FIELDS.forEach(([field, section]) => {
    const note = parseNote(body[field], field, issues);
    if (note) sections[section] = note;
  });
  const fileRefs = parseFileRefs(body.fileRefs, issues);

  if (Object.keys(sections).length === 0 && fileRefs.length === 0) {
    issues.push({
      path: '/',
      message: 'At least one note or file reference is required.',
    });
  }
  if (issues.length > 0) throw invalidInput(issues);

  return { sections, fileRefs };
}

function parseNote(
  value: unknown,
  field: string,
  issues: InputIssue[],
): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') {
    issues.push({ path: `/${field}`, message: `${field} must be a string.` });
    return undefined;
  }

  const normalized = value.trim();
  if (!normalized) return undefined;
  if (normalized.length > MAX_NOTE_LENGTH) {
    issues.push({
      path: `/${field}`,
      message: `${field} must contain at most ${MAX_NOTE_LENGTH} characters.`,
    });
  }
  return normalized;
}

function parseFileRefs(value: unknown, issues: InputIssue[]): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    issues.push({
      path: '/fileRefs',
      message: 'fileRefs must be an array of UUIDs.',
    });
    return [];
  }

  const result: string[] = [];
  const seen = new Set<string>();
  value.forEach((item, index) => {
    const normalized =
      typeof item === 'string' ? item.trim().toLowerCase() : '';
    if (!UUID_PATTERN.test(normalized)) {
      issues.push({
        path: `/fileRefs/${index}`,
        message: 'File reference must be a valid UUID.',
      });
      return;
    }
    if (seen.has(normalized)) {
      issues.push({
        path: `/fileRefs/${index}`,
        message: `File reference '${normalized}' is duplicated.`,
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
      code: 'INVALID_SOURCE_INPUT',
      message: 'Builder source description is invalid.',
      issues,
    },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
