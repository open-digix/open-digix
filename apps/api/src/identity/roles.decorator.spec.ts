import 'reflect-metadata';
import { REQUIRED_ROLES, RequireRoles } from './roles.decorator';
import { TENANT_CONTEXT_REQUIRED } from './tenant-context.decorator';

describe('RequireRoles', () => {
  class TestController {
    @RequireRoles(' Manager ', 'publisher', 'manager')
    endpoint(this: void): void {}
  }

  it('normalizes role codes and marks the endpoint as tenant-scoped', () => {
    expect(
      Reflect.getMetadata(REQUIRED_ROLES, TestController.prototype.endpoint),
    ).toEqual(['manager', 'publisher']);
    expect(
      Reflect.getMetadata(
        TENANT_CONTEXT_REQUIRED,
        TestController.prototype.endpoint,
      ),
    ).toBe(true);
  });

  it('rejects an empty role declaration', () => {
    expect(() => RequireRoles()).toThrow(
      'RequireRoles needs at least one role code',
    );
  });

  it('rejects a role code that cannot exist in the database schema', () => {
    expect(() => RequireRoles('invalid role')).toThrow(
      'RequireRoles received an invalid role code',
    );
  });
});
