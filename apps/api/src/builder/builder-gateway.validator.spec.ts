import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateBuilderGateways } from './builder-gateway.validator';
import type { BuilderApplicationDefinitionV1 } from './builder.types';

describe('validateBuilderGateways', () => {
  it('accepts all branches in the leave workflow fixture', () => {
    expect(validateBuilderGateways(loadLeaveFixture())).toEqual([]);
  });

  it('detects a missing enum branch', () => {
    const definition = loadLeaveFixture();
    definition.transitions = definition.transitions.filter(
      ({ from, to }) => !(from === 'manager_route' && to === 'declined'),
    );

    expect(validateBuilderGateways(definition)).toContainEqual(
      expect.objectContaining({
        code: 'MISSING_GATEWAY_BRANCH',
        stepId: 'manager_route',
      }),
    );
  });

  it('detects overlapping branch conditions', () => {
    const definition = loadLeaveFixture();
    const approvedBranch = definition.transitions.find(
      ({ from, to }) => from === 'hr_route' && to === 'accepted',
    )!;
    definition.transitions.push({
      ...approvedBranch,
      to: 'declined',
      when: structuredClone(approvedBranch.when),
    });

    expect(validateBuilderGateways(definition)).toContainEqual(
      expect.objectContaining({
        code: 'AMBIGUOUS_GATEWAY_BRANCH',
        stepId: 'hr_route',
      }),
    );
  });

  it('detects a gateway without outgoing branches', () => {
    const definition = loadLeaveFixture();
    definition.transitions = definition.transitions.filter(
      ({ from }) => from !== 'hr_route',
    );

    expect(validateBuilderGateways(definition)).toContainEqual(
      expect.objectContaining({
        code: 'MISSING_GATEWAY_BRANCH',
        stepId: 'hr_route',
      }),
    );
  });

  it('supports exhaustive unbounded integer branches', () => {
    const definition = loadLeaveFixture();
    const managerBranches = definition.transitions.filter(
      ({ from }) => from === 'manager_route',
    );
    definition.fields.find(({ id }) => id === 'days')!.min = undefined;
    definition.fields.find(({ id }) => id === 'days')!.max = undefined;
    definition.transitions = definition.transitions.filter(
      ({ from }) => from !== 'manager_route',
    );
    definition.transitions.push(...managerBranches);

    expect(validateBuilderGateways(definition)).toEqual([]);
  });

  it('defers malformed conditions to the transition validator', () => {
    const definition = loadLeaveFixture();
    definition.transitions.find(
      ({ from }) => from === 'hr_route',
    )!.when!.all[0].value = true;

    const hrIssues = validateBuilderGateways(definition).filter(
      ({ stepId }) => stepId === 'hr_route',
    );

    expect(hrIssues).toEqual([]);
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
