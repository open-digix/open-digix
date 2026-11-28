import { BadRequestException } from '@nestjs/common';
import {
  advanceInput,
  contactInput,
  customerInput,
  pageInput,
  writeKey,
} from './crm.input';

describe('CRM input', () => {
  it('normalizes customer fields and rejects unknown body fields', () => {
    expect(customerInput({ customerCode: ' A ', name: ' Alice ' })).toEqual({
      customerCode: 'A',
      name: 'Alice',
    });
    expect(() =>
      customerInput({ customerCode: 'A', name: 'Alice', tenantId: 'other' }),
    ).toThrow(BadRequestException);
  });

  it('rejects invalid contact email and stage transitions', () => {
    expect(() =>
      contactInput({ name: 'Alice', email: 'not-an-email' }),
    ).toThrow(BadRequestException);
    expect(advanceInput({ expectedStage: 'won', expectedVersion: 4 })).toEqual({
      expectedStage: 'won',
      expectedVersion: 4,
    });
    expect(() =>
      advanceInput({ expectedStage: 'new', expectedVersion: 0 }),
    ).toThrow(BadRequestException);
  });

  it('bounds pagination and requires an idempotency key', () => {
    expect(pageInput()).toEqual({ limit: 20, cursor: null });
    expect(() => pageInput('101')).toThrow(BadRequestException);
    expect(() => pageInput('20', 'invalid')).toThrow(BadRequestException);
    expect(() => writeKey(' ')).toThrow(BadRequestException);
  });
});
