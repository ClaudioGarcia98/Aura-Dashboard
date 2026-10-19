export function weatherIconType(code, isDay = 1) {
    if (code === 0 || code === 1) return isDay === 0 ? 'moon' : 'sun';
    if (code === 2) return isDay === 0 ? 'partly-cloudy-night' : 'partly-cloudy';
    if (code === 3) return 'cloud';
    if (code === 45 || code === 48) return 'fog';
    if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow';
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'rain';
    if ([95, 96, 97, 99].includes(code)) return 'storm';
    return 'unknown';
}

export function weatherConditionLabel(code) {
    if (code === 0) return 'Clear';
    if (code === 1) return 'Mainly clear';
    if (code === 2) return 'Partly cloudy';
    if (code === 3) return 'Cloudy';
    if (code === 45 || code === 48) return 'Fog';
    if ([51, 53, 55].includes(code)) return 'Drizzle';
    if ([56, 57].includes(code)) return 'Freezing drizzle';
    if ([66, 67].includes(code)) return 'Freezing rain';
    const icon = weatherIconType(code);
    return { rain: 'Rain', snow: 'Snow', storm: 'Storm' }[icon] || 'Weather';
}
