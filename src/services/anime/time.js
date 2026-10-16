export function getLocalDayRange(dayFilter, timeZone = 'Europe/Lisbon') {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetIdx = days.indexOf(dayFilter?.toLowerCase());
    if (targetIdx === -1) return null;

    const now = new Date();
    const localDayName = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long' }).format(now).toLowerCase();
    const currentLocalIdx = days.indexOf(localDayName);
    const diff = targetIdx - currentLocalIdx;

    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    }).formatToParts(now);

    const year = parseInt(parts.find(p => p.type === 'year').value, 10);
    const month = parseInt(parts.find(p => p.type === 'month').value, 10);
    const day = parseInt(parts.find(p => p.type === 'day').value, 10);

    const targetDateUtc = new Date(Date.UTC(year, month - 1, day + diff));
    const targetY = targetDateUtc.getUTCFullYear();
    const targetM = targetDateUtc.getUTCMonth() + 1;
    const targetD = targetDateUtc.getUTCDate();

    const midnight = (y, m, d) => {
        const target = Date.UTC(y, m - 1, d);
        let t = target;
        for (let i = 0; i < 4; i++) {
            const parts = new Intl.DateTimeFormat('en-GB', {
                timeZone, year: 'numeric', month: 'numeric', day: 'numeric',
                hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23',
            }).formatToParts(new Date(t));
            const part = type => Number(parts.find(p => p.type === type).value);
            const wallTime = Date.UTC(part('year'), part('month') - 1, part('day'), part('hour'), part('minute'), part('second'));
            const delta = target - wallTime;
            t += delta;
            if (!delta) break;
        }
        return Math.floor(t / 1000);
    };
    const startUtcSec = midnight(targetY, targetM, targetD);
    const next = new Date(Date.UTC(targetY, targetM - 1, targetD + 1));
    const endUtcSec = midnight(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate());

    return { startUtcSec, endUtcSec };
}

export const getJstDayRange = getLocalDayRange;

export function formatBroadcastTime(timeStr, airingAt) {
    if (airingAt && typeof airingAt === 'number') {
        const date = new Date(airingAt * 1000);
        const ptTime = date.toLocaleTimeString('en-GB', {
            timeZone: 'Europe/Lisbon',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
        const jstTime = date.toLocaleTimeString('en-GB', {
            timeZone: 'Asia/Tokyo',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
        return `${ptTime} PT / ${jstTime} JST`;
    }
    if (!timeStr) return '?';
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (isNaN(hours) || isNaN(minutes)) return timeStr;

    // Convert JST (UTC+9) to Portugal time (Europe/Lisbon)
    const now = new Date();
    const utcDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hours - 9, minutes));
    const ptTime = utcDate.toLocaleTimeString('en-GB', {
        timeZone: 'Europe/Lisbon',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

    return `${ptTime} PT / ${timeStr} JST`;
}
