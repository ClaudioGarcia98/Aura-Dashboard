import { it, expect, afterEach, vi } from 'vitest';
import { getLocalDayRange, getScheduleDayFilter, formatBroadcastTime } from './time';
import { isTimeZone, zonedParts, zonedDateKey, timeZoneOptions } from '../../utils/timeZone';

afterEach(() => vi.useRealTimers());

it.each([
    ['Asia/Tokyo', '2026-10-17T12:00:00Z', '2026-10-16T15:00:00Z', 24],
    ['Asia/Kathmandu', '2026-10-17T12:00:00Z', '2026-10-16T18:15:00Z', 24],
    ['America/New_York', '2026-03-08T12:00:00Z', '2026-03-08T05:00:00Z', 23],
    ['America/New_York', '2026-11-01T12:00:00Z', '2026-11-01T04:00:00Z', 25],
    ['Australia/Lord_Howe', '2026-10-04T06:00:00Z', '2026-10-03T13:30:00Z', 23.5],
    ['America/Sao_Paulo', '2018-11-04T12:00:00Z', '2018-11-04T03:00:00Z', 23],
])('finds the actual calendar day in %s at %s', (zone, now, start, hours) => {
    vi.useFakeTimers(); vi.setSystemTime(new Date(now));
    const range = getLocalDayRange(getScheduleDayFilter(zone), zone);
    expect(range.startUtcSec).toBe(Date.parse(start) / 1000);
    expect(range.endUtcSec - range.startUtcSec).toBe(hours * 3600);
});

it('groups the same instant into different local dates and weekdays', () => {
    const date = new Date('2026-10-17T23:30:00Z');
    expect(getScheduleDayFilter('Asia/Tokyo', date)).toBe('sunday');
    expect(getScheduleDayFilter('America/Los_Angeles', date)).toBe('saturday');
    expect(zonedDateKey(date, 'Asia/Tokyo')).toBe('2026-10-18');
    expect(zonedParts(date, 'Asia/Kathmandu')).toMatchObject({ hour: 5, minute: 15, day: 18 });
});

it('supports 12-hour formatting and hiding the Japan reference', () => {
    const epoch = Date.parse('2026-10-17T23:30:00Z') / 1000;
    expect(formatBroadcastTime(null, epoch, 'en-US', 'America/New_York', false, false)).toMatch(/07:30 PM GMT-4/);
    expect(formatBroadcastTime(null, epoch, 'en-GB', 'Asia/Tokyo')).toBe('08:30 GMT+9');
    expect(formatBroadcastTime(null, epoch, 'en-GB', 'UTC')).toMatch(/^23:30 GMT(?:\+0)? \/ 08:30 JST \(Sun\)$/);
});

it('converts fallback broadcasts relative to the Japanese date, including extended hours', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-17T23:30:00Z'));
    expect(formatBroadcastTime('25:30', null, 'en-GB', 'UTC')).toMatch(/^16:30 GMT(?:\+0)? \/ 01:30 JST \(Mon\)$/);
    expect(formatBroadcastTime('48:00')).toBe('48:00');
    expect(formatBroadcastTime('23:99')).toBe('23:99');
});

it('validates manual zones and includes UTC and fractional offsets in the selector', () => {
    expect(isTimeZone('Asia/Kathmandu')).toBe(true);
    expect(isTimeZone('Mars/Olympus')).toBe(false);
    expect(isTimeZone({})).toBe(false);
    expect(getLocalDayRange('invalid', 'UTC')).toBeNull();
    expect(getLocalDayRange('monday', 'invalid')).toBeNull();
    expect(timeZoneOptions('Asia/Kathmandu')).toEqual(expect.arrayContaining(['UTC', 'Asia/Kathmandu']));
});
