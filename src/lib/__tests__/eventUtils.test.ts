import { describe, it, expect } from 'vitest';
import { parseNumericValue, roundCurrencyValue, normalizeTimestamp, pickFirstString, normalizeDjIds, mergeDjIds } from '../eventUtils';

describe('eventUtils', () => {
  it('parseNumericValue handles numbers and strings', () => {
    expect(parseNumericValue(10)).toBe(10);
    expect(parseNumericValue('10')).toBe(10);
    expect(parseNumericValue('10,5')).toBe(10.5);
    expect(parseNumericValue('')).toBeNull();
    expect(parseNumericValue(null)).toBeNull();
  });

  it('roundCurrencyValue rounds to 2 decimals', () => {
    expect(roundCurrencyValue(10.123)).toBe(10.12);
    expect(roundCurrencyValue(10.129)).toBe(10.13);
  });

  it('normalizeTimestamp works with strings and dates', () => {
    const iso = '2025-10-09T12:00:00Z';
    expect(normalizeTimestamp(new Date(iso))).toBe(new Date(iso).toISOString());
    expect(normalizeTimestamp(iso)).toBe(new Date(iso).toISOString());
    expect(normalizeTimestamp('invalid-date')).toBe('invalid-date');
  });

  it('pickFirstString returns first non empty string', () => {
    expect(pickFirstString('', null, 'abc', 'def')).toBe('abc');
    expect(pickFirstString(undefined, '  xyz  ')).toBe('xyz');
  });

  it('normalizeDjIds and mergeDjIds', () => {
    expect(normalizeDjIds(['a', 'b', 'a', ' c '])).toEqual(['a', 'b', 'c']);
    expect(mergeDjIds('x', ['a', 'x', 'b'])).toEqual(['x', 'a', 'b']);
  });
});
