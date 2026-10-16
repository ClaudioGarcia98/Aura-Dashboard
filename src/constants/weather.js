export function weatherIconType(code) {
    if (code === 0) return 'sun';
    if (code === 1 || code === 2) return 'partly-cloudy';
    if (code === 3) return 'cloud';
    if (code >= 45 && code <= 48) return 'cloud';
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
    if (code >= 95 && code <= 99) return 'storm';
    return 'unknown';
}
