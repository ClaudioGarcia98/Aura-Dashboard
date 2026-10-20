import { weekday } from '../i18n/core';

export function forecastDay(day, locale) {
    if (typeof day.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day.date)) {
        return new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${day.date}T12:00:00Z`));
    }
    const names = { Sun: 'sunday', Mon: 'monday', Tue: 'tuesday', Wed: 'wednesday', Thu: 'thursday', Fri: 'friday', Sat: 'saturday' };
    return names[day.day] ? weekday(locale, names[day.day]) : day.day;
}

export function formatWeatherValue(value, locale) {
    const match = String(value).match(/^(-?\d+(?:\.\d+)?)(.*)$/);
    if (!match) return value;
    const number = Number(match[1]);
    if (match[2] === '%') return new Intl.NumberFormat(locale, { style: 'percent' }).format(number / 100);
    if (match[2].trim() === 'km/h') return new Intl.NumberFormat(locale, { style: 'unit', unit: 'kilometer-per-hour', unitDisplay: 'short' }).format(number);
    return new Intl.NumberFormat(locale).format(number) + match[2];
}

export function getIconClassName(type) {
    if (type === 'sun') return 'weather-icon-sun';
    if (['moon', 'partly-cloudy-night', 'fog', 'partly-cloudy', 'cloud', 'unknown'].includes(type)) return 'weather-icon-cloud';
    return 'weather-icon-rain';
}
