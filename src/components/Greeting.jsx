import { useTranslation } from '../i18n/useTranslation';
import './Greeting.css';
import { memo, useState, useEffect } from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { weatherCacheKey } from '../services/weather';
import { useWeatherStore, readCurrentWeather } from '../stores/useWeatherStore';
import { weatherConditionLabel } from '../constants/weather';
import { useTimeZone } from '../hooks/useTimeZone';
import { zonedParts } from '../utils/timeZone';

export default memo(function Greeting() {
    const { t, locale } = useTranslation();
    const timeZone = useTimeZone();
    const username = useSettingsStore(s => s.username);
    const useCelsius = useSettingsStore(s => s.useCelsius ?? true);
    const city = useSettingsStore(s => s.fallbackCity);
    const location = useSettingsStore(s => s.fallbackCityLocation);
    const weatherEnabled = useSettingsStore(s => s.showWeatherWidget ?? true);
    const weatherKey = weatherCacheKey(useCelsius, city, location);
    const snapshot = useWeatherStore(state => state.snapshot);
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        const updateGreeting = () => {
            const weatherCode = readCurrentWeather(weatherKey, weatherEnabled)?.weatherCode ?? null;
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
                    prefix += ` · ${t(weatherConditionLabel(weatherCode))}`;
                }
            }
            const cleanName = typeof username === 'string' ? username.trim() : '';
            setGreeting(cleanName ? `${prefix}, ${cleanName}` : prefix);
        };

        updateGreeting();
        const interval = setInterval(updateGreeting, 60000); // update every minute
        return () => clearInterval(interval);
    }, [username, snapshot, weatherKey, weatherEnabled, t, locale, timeZone]);

    return <div id="greeting">{greeting}</div>;
});
