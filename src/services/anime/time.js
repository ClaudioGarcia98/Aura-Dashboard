import { deviceTimeZone, isTimeZone, zonedParts, zonedDateKey } from '../../utils/timeZone';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export function getScheduleDayFilter(timeZone = deviceTimeZone(), date = new Date()) {
    const { year, month, day } = zonedParts(date, timeZone);
    return DAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}

export function getLocalDayRange(dayFilter, timeZone = deviceTimeZone()) {
    const targetIdx = DAYS.indexOf(dayFilter?.toLowerCase());
    if (targetIdx === -1 || !isTimeZone(timeZone)) return null;
    const now = new Date();
    const { year, month, day } = zonedParts(now, timeZone);
    const diff = targetIdx - DAYS.indexOf(getScheduleDayFilter(timeZone, now));
    const target = Date.UTC(year, month - 1, day + diff);
    // Find the first instant of each local calendar date. Unlike subtracting a
    // fixed UTC offset, this handles DST, fractional offsets and skipped midnight.
    const boundary = utcDay => {
        const dateKey = new Date(utcDay).toISOString().slice(0, 10);
        let low = Math.floor(utcDay / 1000) - 36 * 3600;
        let high = Math.floor(utcDay / 1000) + 36 * 3600;
        while (low < high) {
            const middle = Math.floor((low + high) / 2);
            if (zonedDateKey(new Date(middle * 1000), timeZone) < dateKey) low = middle + 1;
            else high = middle;
        }
        return low;
    };
    return { startUtcSec: boundary(target), endUtcSec: boundary(target + 86400000) };
}

export function formatBroadcastTime(timeStr, airingAt, locale = 'en-GB', timeZone = deviceTimeZone(), showJapanTime = true, use24hClock = true) {
    let date;
    if (Number.isFinite(airingAt) && airingAt > 0) date = new Date(airingAt * 1000);
    else {
        if (!timeStr) return '?';
        const match = typeof timeStr === 'string' && timeStr.match(/^(\d{1,2}):(\d{2})$/);
        if (!match || Number(match[1]) > 47 || Number(match[2]) > 59) return timeStr;
        const { year, month, day } = zonedParts(new Date(), 'Asia/Tokyo');
        date = new Date(Date.UTC(year, month - 1, day, Number(match[1]) - 9, Number(match[2])));
    }
    const zone = isTimeZone(timeZone) ? timeZone : deviceTimeZone();
    const format = tz => new Intl.DateTimeFormat(locale, { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: !use24hClock, ...use24hClock && { hourCycle: 'h23' } }).format(date);
    const zoneName = new Intl.DateTimeFormat(locale, { timeZone: zone, timeZoneName: 'shortOffset' }).formatToParts(date).find(part => part.type === 'timeZoneName')?.value || zone;
    const local = `${format(zone)} ${zoneName}`;
    if (!showJapanTime || zone === 'Asia/Tokyo') return local;
    const differentDay = zonedDateKey(date, zone) !== zonedDateKey(date, 'Asia/Tokyo');
    const japanDay = differentDay ? ` (${new Intl.DateTimeFormat(locale, { timeZone: 'Asia/Tokyo', weekday: 'short' }).format(date)})` : '';
    return `${local} / ${format('Asia/Tokyo')} JST${japanDay}`;
}
