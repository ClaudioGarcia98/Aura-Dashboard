import { useTranslation } from '../i18n/useTranslation';
import './Greeting.css';
import { memo, useState, useEffect } from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { safeStorage, safeJsonParse } from '../utils/storage';
import { useTimeZone } from '../hooks/useTimeZone';
import { zonedParts } from '../utils/timeZone';

export default memo(function Greeting() {
    const { t, locale } = useTranslation();
    const timeZone = useTimeZone();
    const username = useSettingsStore(s => s.username);
    const [greeting, setGreeting] = useState('');
    const [weatherCode, setWeatherCode] = useState(() => {
        const data = safeJsonParse(safeStorage.getItem('dash_weather_cache'), null);
        return typeof data?.weatherCode === 'number' ? data.weatherCode : null;
    });

    useEffect(() => {
        const handleWeather = (e) => setWeatherCode(e.detail);
        window.addEventListener('weather-update', handleWeather);
        return () => window.removeEventListener('weather-update', handleWeather);
    }, []);

    useEffect(() => {
        const updateGreeting = () => {
            const hr = zonedParts(new Date(), timeZone).hour;
            let prefix = 'Good morning';
            
            if (hr >= 12 && hr < 18) {
                prefix = 'Good afternoon';
            } else if (hr >= 18 && hr < 22) {
                prefix = 'Good evening';
            } else if (hr >= 22 || hr < 5) {
                prefix = 'Time to rest';
            }

            // Weather modifier — full WMO code coverage
            const baseGreeting = prefix;
            if (locale === 'en' && weatherCode !== null && prefix !== 'Time to rest') {
                const t = prefix.split(' ')[1]; // morning / afternoon / evening
                if      (weatherCode === 0)                     prefix = `Clear skies this ${t}`;
                else if (weatherCode <= 2)                      prefix = `Beautiful ${t}`;
                else if (weatherCode === 3)                     prefix = `Overcast ${t}`;
                else if (weatherCode <= 48)                     prefix = `Foggy ${t}`;
                else if (weatherCode <= 55)                     prefix = `Drizzly ${t}`;
                else if (weatherCode <= 57)                     prefix = `Frosty ${t}`;
                else if (weatherCode <= 65)                     prefix = `Cozy rainy ${t}`;
                else if (weatherCode <= 67)                     prefix = `Icy ${t}`;
                else if (weatherCode <= 77)                     prefix = `Snowy ${t}`;
                else if (weatherCode <= 82)                     prefix = `Showery ${t}`;
                else if (weatherCode <= 86)                     prefix = `Snowy ${t}`;
                else if (weatherCode === 95)                    prefix = `Stormy ${t}`;
                else if (weatherCode >= 96)                     prefix = `Wild ${t}`;
            }

            if (locale !== 'en') {
                prefix = t(baseGreeting);
                if (weatherCode !== null && baseGreeting !== 'Time to rest') {
                    const condition = weatherCode === 0 ? 'Clear' : weatherCode <= 2 ? 'Partly cloudy' : weatherCode === 3 ? 'Cloudy'
                        : weatherCode <= 48 ? 'Fog' : weatherCode <= 55 ? 'Drizzle' : weatherCode <= 57 ? 'Frost'
                            : weatherCode <= 67 ? 'Rain' : weatherCode <= 77 ? 'Snow' : weatherCode <= 82 ? 'Rain' : weatherCode <= 86 ? 'Snow' : 'Storm';
                    prefix += ` · ${t(condition)}`;
                }
            }
            const cleanName = typeof username === 'string' ? username.trim() : '';
            setGreeting(cleanName ? `${prefix}, ${cleanName}` : prefix);
        };

        updateGreeting();
        const interval = setInterval(updateGreeting, 60000); // update every minute
        return () => clearInterval(interval);
    }, [username, weatherCode, t, locale, timeZone]);

    return <div id="greeting">{greeting}</div>;
});
