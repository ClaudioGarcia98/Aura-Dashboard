const validZones = new Map();
const partFormatters = new Map();

export function isTimeZone(value) {
    if (typeof value !== 'string' || value.length > 100 || !/^[A-Za-z_+-]+(?:\/[A-Za-z0-9_+-]+)*$/.test(value)) return false;
    if (!validZones.has(value)) {
        try { new Intl.DateTimeFormat('en', { timeZone: value }).format(); validZones.set(value, true); }
        catch { validZones.set(value, false); }
    }
    return validZones.get(value);
}

export function deviceTimeZone() {
    try {
        const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return isTimeZone(zone) ? zone : 'UTC';
    } catch { return 'UTC'; }
}

export function resolveTimeZone(preference) {
    return preference !== 'auto' && isTimeZone(preference) ? preference : deviceTimeZone();
}

export function zonedParts(date = new Date(), timeZone = deviceTimeZone()) {
    const zone = isTimeZone(timeZone) ? timeZone : 'UTC';
    if (!partFormatters.has(zone)) partFormatters.set(zone, new Intl.DateTimeFormat('en-GB', {
        timeZone: zone, calendar: 'gregory', numberingSystem: 'latn',
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    }));
    return Object.fromEntries(partFormatters.get(zone).formatToParts(date).filter(part => part.type !== 'literal').map(part => [part.type, Number(part.value)]));
}

export function zonedDateKey(date = new Date(), timeZone = deviceTimeZone()) {
    const { year, month, day } = zonedParts(date, timeZone);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function timeZoneOptions(selected) {
    let zones;
    try { zones = Intl.supportedValuesOf('timeZone'); } catch { zones = []; }
    const unique = new Map();
    // Keep a saved alias selectable, but avoid listing aliases of the same zone twice.
    for (const zone of [selected, 'UTC', deviceTimeZone(), ...zones,
        'Europe/Lisbon', 'Europe/London', 'Europe/Paris', 'America/New_York', 'America/Los_Angeles', 'America/Sao_Paulo', 'Asia/Tokyo', 'Asia/Seoul', 'Asia/Kolkata', 'Australia/Sydney', 'Pacific/Auckland', 'Pacific/Honolulu']) {
        if (!isTimeZone(zone)) continue;
        const canonical = new Intl.DateTimeFormat('en', { timeZone: zone }).resolvedOptions().timeZone;
        if (!unique.has(canonical)) unique.set(canonical, zone);
    }
    return [...unique.values()].sort();
}
