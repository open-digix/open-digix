import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BuilderSemanticValidator } from './builder-semantic.validator';
import type { BuilderApplicationDefinitionV1 } from './builder.types';

describe('BuilderSemanticValidator', () => {
  const validator = new BuilderSemanticValidator();

  it('accepts the configured leave workflow fixture', () => {
    expect(validator.validate(loadLeaveFixture())).toEqual({
      valid: true,
      issues: [],
    });
  });

  it('combines issues from the focused semantic validators', () => {
    const definition = loadLeaveFixture();
    definition.fields[0].min = 10;
    definition.steps[1].role = 'missing_role';
    definition.transitions[0].to = 'missing_step';
    definition.transitions = definition.transitions.filter(
      ({ from, to }) => !(from === 'manager_route' && to === 'declined'),
    );

    const result = validator.validate(definition);
    const codes = result.issues.map(({ code }) => code);

    expect(result.valid).toBe(false);
    expect(codes).toEqual(
      expect.arrayContaining([
        'FIELD_BOUNDS_NOT_SUPPORTED',
        'UNKNOWN_TASK_ROLE',
        'UNKNOWN_TRANSITION_TARGET',
        'MISSING_GATEWAY_BRANCH',
      ]),
    );
  });
});

function loadLeaveFixture(): MutableManifest {
  return JSON.parse(
    readFileSync(
      resolve(
        process.cwd(),
        '..',
        '..',
        'docs',
        'examples',
        'leave-app-v1.json',
      ),
      'utf8',
    ),
  ) as MutableManifest;
}

type Mutable<T> = T extends readonly (infer Item)[]
  ? Mutable<Item>[]
  : T extends object
    ? { -readonly [Property in keyof T]: Mutable<T[Property]> }
    : T;

type MutableManifest = Mutable<BuilderApplicationDefinitionV1>;
