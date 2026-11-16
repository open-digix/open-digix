import { BadRequestException } from '@nestjs/common';
import {
  parseApplicationId,
  parseDraftVersion,
  parseNormalizeDraftBody,
} from './normalize-draft.input';

describe('normalize-draft.input', () => {
  const validUuid = '11111111-1111-4111-8111-111111111111';

  describe('parseApplicationId', () => {
    it('accepts and normalizes valid UUID', () => {
      expect(parseApplicationId(validUuid.toUpperCase())).toBe(validUuid);
    });

    it('rejects invalid UUID', () => {
      expect(() => parseApplicationId('invalid')).toThrow(BadRequestException);
    });
  });

  describe('parseDraftVersion', () => {
    it('accepts valid integer strings and numbers', () => {
      expect(parseDraftVersion('1')).toBe(1);
      expect(parseDraftVersion(2)).toBe(2);
    });

    it('rejects invalid or non-positive versions', () => {
      expect(() => parseDraftVersion('0')).toThrow(BadRequestException);
      expect(() => parseDraftVersion('-1')).toThrow(BadRequestException);
      expect(() => parseDraftVersion('abc')).toThrow(BadRequestException);
    });
  });

  describe('parseNormalizeDraftBody', () => {
    it('accepts empty or undefined body', () => {
      expect(parseNormalizeDraftBody(undefined)).toEqual({});
      expect(parseNormalizeDraftBody({})).toEqual({});
    });

    it('accepts valid sourceRevisionId', () => {
      expect(
        parseNormalizeDraftBody({ sourceRevisionId: validUuid.toUpperCase() }),
      ).toEqual({
        sourceRevisionId: validUuid,
      });
    });

    it('rejects invalid sourceRevisionId format or type', () => {
      expect(() =>
        parseNormalizeDraftBody({ sourceRevisionId: 'not-a-uuid' }),
      ).toThrow(BadRequestException);
      expect(() => parseNormalizeDraftBody({ sourceRevisionId: 123 })).toThrow(
        BadRequestException,
      );
    });

    it('rejects extra unknown properties', () => {
      expect(() =>
        parseNormalizeDraftBody({ sourceRevisionId: validUuid, extra: true }),
      ).toThrow(BadRequestException);
    });

    it('rejects non-object body', () => {
      expect(() => parseNormalizeDraftBody('invalid')).toThrow(
        BadRequestException,
      );
      expect(() => parseNormalizeDraftBody([1, 2, 3])).toThrow(
        BadRequestException,
      );
    });
  });
});
