import type {
  BuilderFieldDefinition,
  BuilderValidationIssue,
} from './builder.types';

export function validateBuilderFields(
  fields: readonly BuilderFieldDefinition[],
): BuilderValidationIssue[] {
  const issues: BuilderValidationIssue[] = [];
  const seenIds = new Set<string>();

  fields.forEach((field, index) => {
    const path = `/fields/${index}`;

    if (seenIds.has(field.id)) {
      issues.push(
        issue(
          'DUPLICATE_FIELD',
          `${path}/id`,
          `Field identifier '${field.id}' is duplicated.`,
        ),
      );
    }
    seenIds.add(field.id);

    validateBounds(field, path, issues);
    validateOptions(field, path, issues);
  });

  return issues;
}

function validateBounds(
  field: BuilderFieldDefinition,
  path: string,
  issues: BuilderValidationIssue[],
): void {
  const acceptsBounds = field.type === 'integer' || field.type === 'string';

  if (!acceptsBounds && (field.min !== undefined || field.max !== undefined)) {
    issues.push(
      issue(
        'FIELD_BOUNDS_NOT_SUPPORTED',
        path,
        `Field '${field.id}' of type '${field.type}' cannot define min or max.`,
      ),
    );
  }

  if (
    field.min !== undefined &&
    field.max !== undefined &&
    field.min > field.max
  ) {
    issues.push(
      issue(
        'INVALID_FIELD_BOUNDS',
        path,
        `Field '${field.id}' must have min less than or equal to max.`,
      ),
    );
  }
}

function validateOptions(
  field: BuilderFieldDefinition,
  path: string,
  issues: BuilderValidationIssue[],
): void {
  if (field.type === 'enum' && !field.options) {
    issues.push(
      issue(
        'ENUM_OPTIONS_REQUIRED',
        `${path}/options`,
        `Enum field '${field.id}' must define options.`,
      ),
    );
  }

  if (field.type !== 'enum' && field.options) {
    issues.push(
      issue(
        'FIELD_OPTIONS_NOT_SUPPORTED',
        `${path}/options`,
        'Only enum fields may define options.',
      ),
    );
  }
}

function issue(
  code: string,
  path: string,
  message: string,
): BuilderValidationIssue {
  return { severity: 'error', code, path, message };
}
