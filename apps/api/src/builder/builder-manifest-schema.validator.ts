import { Injectable } from '@nestjs/common';
import type { ErrorObject } from 'ajv';
import Ajv2020 from 'ajv/dist/2020.js';
import { BUILDER_APPLICATION_SCHEMA_V1 } from './builder.schema';
import type {
  BuilderApplicationDefinitionV1,
  BuilderValidationIssue,
} from './builder.types';

export type BuilderManifestSchemaValidationResult =
  | {
      readonly valid: true;
      readonly definition: BuilderApplicationDefinitionV1;
      readonly issues: readonly [];
    }
  | {
      readonly valid: false;
      readonly issues: readonly BuilderValidationIssue[];
    };

const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
  allowUnionTypes: true,
});
const validateManifest = ajv.compile<BuilderApplicationDefinitionV1>(
  BUILDER_APPLICATION_SCHEMA_V1,
);

@Injectable()
export class BuilderManifestSchemaValidator {
  validate(input: unknown): BuilderManifestSchemaValidationResult {
    if (validateManifest(input)) {
      return {
        valid: true,
        definition: input as BuilderApplicationDefinitionV1,
        issues: [],
      };
    }

    return {
      valid: false,
      issues: (validateManifest.errors ?? []).map(toValidationIssue),
    };
  }
}

function toValidationIssue(error: ErrorObject): BuilderValidationIssue {
  return {
    severity: 'error',
    code: 'SCHEMA_VALIDATION_ERROR',
    path: errorPath(error),
    message: error.message ?? 'Manifest does not match the Builder schema.',
  };
}

function errorPath(error: ErrorObject): string {
  const property = errorProperty(error);
  const path = property
    ? `${error.instancePath}/${escapeJsonPointer(property)}`
    : error.instancePath;

  return path || '/';
}

function errorProperty(error: ErrorObject): string | undefined {
  if (error.keyword === 'required') {
    return stringParam(error, 'missingProperty');
  }

  if (error.keyword === 'additionalProperties') {
    return stringParam(error, 'additionalProperty');
  }

  return undefined;
}

function stringParam(error: ErrorObject, key: string): string | undefined {
  const params = error.params as Record<string, unknown>;
  const value = params[key];
  return typeof value === 'string' ? value : undefined;
}

function escapeJsonPointer(value: string): string {
  return value.replaceAll('~', '~0').replaceAll('/', '~1');
}
