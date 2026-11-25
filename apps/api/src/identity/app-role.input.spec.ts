import { BadRequestException } from '@nestjs/common';
import {
  parseAppId,
  parseAppRoleBody,
  parseMembershipId,
} from './app-role.input';

describe('app role input parsers', () => {
  it('normalizes role codes and UUID route parameters', () => {
    expect(parseAppRoleBody({ roleCode: ' DESIGNER ' })).toEqual({
      roleCode: 'designer',
    });
    expect(parseAppId('AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA')).toBe(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    );
    expect(parseMembershipId('BBBBBBBB-BBBB-4BBB-8BBB-BBBBBBBBBBBB')).toBe(
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    );
  });

  it('rejects invalid role bodies', () => {
    const invalidBodies = [
      null,
      [],
      { roleCode: '' },
      { roleCode: 'designer', extra: true },
    ];

    for (const body of invalidBodies) {
      expect(() => parseAppRoleBody(body)).toThrow(BadRequestException);
    }
  });

  it('rejects invalid UUID route parameters', () => {
    expect(() => parseAppId('not-an-app')).toThrow(BadRequestException);
    expect(() => parseMembershipId('not-a-membership')).toThrow(
      BadRequestException,
    );
  });
});
