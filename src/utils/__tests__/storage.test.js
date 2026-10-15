import { describe, it, expect } from 'vitest';
import { safeJsonParse, safeJsonStringify } from '../storage';

describe('storage utility', () => {
    describe('safeJsonParse', () => {
        it('parses valid JSON string correctly', () => {
            const data = { a: 1, b: 'test' };
            expect(safeJsonParse(JSON.stringify(data))).toEqual(data);
        });

        it('returns fallback for corrupted JSON string', () => {
            expect(safeJsonParse('{bad json', [])).toEqual([]);
            expect(safeJsonParse('undefined', null)).toBeNull();
        });

        it('returns fallback for null or undefined input', () => {
            expect(safeJsonParse(null, { default: true })).toEqual({ default: true });
            expect(safeJsonParse(undefined, 'fallback')).toBe('fallback');
        });

        it('returns fallback for non-string input', () => {
            expect(safeJsonParse(12345, null)).toBeNull();
            expect(safeJsonParse({}, [])).toEqual([]);
        });
    });

    describe('safeJsonStringify', () => {
        it('stringifies valid objects', () => {
            expect(safeJsonParse(safeJsonStringify({ ok: true }))).toEqual({ ok: true });
        });

        it('returns fallback on circular structure', () => {
            const circular = {};
            circular.self = circular;
            expect(safeJsonStringify(circular, '[]')).toBe('[]');
        });
    });
});
