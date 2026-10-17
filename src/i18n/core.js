import { catalogs } from './messages';

export const LANGUAGES = Object.freeze({
    en: 'English', 'pt-PT': 'Português (Portugal)', 'pt-BR': 'Português (Brasil)',
    es: 'Español', fr: 'Français', de: 'Deutsch', ja: '日本語', ko: '한국어',
});

export function resolveLocale(preference = 'auto', browserLanguages = globalThis.navigator?.languages || [globalThis.navigator?.language]) {
    if (Object.hasOwn(LANGUAGES, preference)) return preference;
    for (const language of browserLanguages || []) {
        if (typeof language !== 'string') continue;
        const tag = language.replaceAll('_', '-').toLowerCase();
        const exact = Object.keys(LANGUAGES).find(key => key.toLowerCase() === tag);
        if (exact) return exact;
        const base = tag.split('-')[0];
        if (base === 'pt') return tag.split('-')[1] === 'br' ? 'pt-BR' : 'pt-PT';
        if (Object.hasOwn(LANGUAGES, base)) return base;
    }
    return 'en';
}

export function translate(locale, key, values = {}) {
    if (typeof key !== 'string') return key;
    const catalog = Object.hasOwn(catalogs, locale) ? catalogs[locale] : null;
    const text = catalog && Object.hasOwn(catalog, key) ? catalog[key] : key;
    return text.replace(/\{(\w+)\}/g, (match, name) => Object.hasOwn(values, name) ? String(values[name]) : match);
}

export function errorMessage(locale, message) {
    if (locale === 'en') return message || 'Something went wrong. Please try again.';
    if (catalogs[locale]?.[message]) return translate(locale, message);
    if (Object.values(catalogs[locale] || {}).includes(message)) return message;
    if (/^(Unknown setting:|Invalid setting:|Invalid or duplicate item in )/.test(message || '')) return translate(locale, 'The backup contains invalid or unsupported settings.');
    return translate(locale, 'Something went wrong. Please try again.');
}

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
export function weekday(locale, day, width = 'short') {
    const index = DAYS.indexOf(day?.toLowerCase());
    return index < 0 ? day : new Intl.DateTimeFormat(locale, { weekday: width, timeZone: 'UTC' }).format(new Date(Date.UTC(2024, 0, 7 + index)));
}

export function formatDuration(locale, value) {
    return value?.replace(/(\d+)([dhm])/g, (_, amount, unit) => new Intl.NumberFormat(locale, {
        style: 'unit', unit: { d: 'day', h: 'hour', m: 'minute' }[unit], unitDisplay: ['ja', 'ko'].includes(locale) ? 'short' : 'narrow',
    }).format(Number(amount)));
}

export function plural(locale, key, count) {
    const category = new Intl.PluralRules(locale).select(count);
    const specific = `${key}.${category}`;
    const selected = catalogs[locale]?.[specific] ? specific : `${key}.other`;
    const english = { 'stations.one': '{count} Lofi station', 'stations.other': '{count} Lofi stations' };
    return translate(locale, catalogs[locale]?.[selected] ? selected : english[`${key}.${category}`] || english[`${key}.other`], { count: new Intl.NumberFormat(locale).format(count) });
}
