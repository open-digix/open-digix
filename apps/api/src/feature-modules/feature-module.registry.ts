import { Injectable } from '@nestjs/common';
import type { FeatureModuleDefinition } from './feature-module.types';

export class FeatureModuleRegistrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FeatureModuleRegistrationError';
  }
}

@Injectable()
export class FeatureModuleRegistry {
  private readonly modules = new Map<string, FeatureModuleDefinition>();

  register(definition: FeatureModuleDefinition): FeatureModuleDefinition {
    validateDefinition(definition);

    const key = moduleKey(definition.featureId, definition.version);
    if (this.modules.has(key)) {
      throw new FeatureModuleRegistrationError(
        `Feature module '${key}' is already registered.`,
      );
    }

    const stored = freezeDefinition(definition);
    this.modules.set(key, stored);
    return stored;
  }

  get(featureId: string, version: number): FeatureModuleDefinition | undefined {
    return this.modules.get(moduleKey(featureId, version));
  }

  list(): readonly FeatureModuleDefinition[] {
    return [...this.modules.values()];
  }
}

function moduleKey(featureId: string, version: number): string {
  return `${featureId}:${version}`;
}

function validateDefinition(definition: FeatureModuleDefinition): void {
  if (!definition.featureId.trim()) {
    throw new FeatureModuleRegistrationError(
      'Feature module featureId must not be blank.',
    );
  }
  if (!Number.isSafeInteger(definition.version) || definition.version < 1) {
    throw new FeatureModuleRegistrationError(
      'Feature module version must be a positive integer.',
    );
  }
  if (!definition.route.startsWith('/')) {
    throw new FeatureModuleRegistrationError(
      'Feature module route must start with /.',
    );
  }
  if (!definition.metric.trim()) {
    throw new FeatureModuleRegistrationError(
      'Feature module metric must not be blank.',
    );
  }
  if (
    definition.permissions.length === 0 ||
    new Set(definition.permissions).size !== definition.permissions.length ||
    definition.permissions.some((permission) => !permission.trim())
  ) {
    throw new FeatureModuleRegistrationError(
      'Feature module permissions must be non-empty and unique.',
    );
  }
  if (typeof definition.handler !== 'function') {
    throw new FeatureModuleRegistrationError(
      'Feature module handler must be a function.',
    );
  }
}

function freezeDefinition(
  definition: FeatureModuleDefinition,
): FeatureModuleDefinition {
  return Object.freeze({
    ...definition,
    permissions: Object.freeze([...definition.permissions]),
  });
}
