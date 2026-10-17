import { useTranslation } from '../i18n/useTranslation';
import './WeatherWidget.css';
import { memo, useState, useEffect, useRef } from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useWeather } from '../hooks/useWeather';
import { WeatherIcon, FeelsLikeIcon, HumidityIcon, WindIcon, SunriseIcon, SunsetIcon } from './WeatherIcons';
import { weekday } from '../i18n/core';

function forecastDay(day, locale) {
    if (typeof day.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day.date)) {
        return new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${day.date}T12:00:00Z`));
    }
    const names = { Sun: 'sunday', Mon: 'monday', Tue: 'tuesday', Wed: 'wednesday', Thu: 'thursday', Fri: 'friday', Sat: 'saturday' };
    return names[day.day] ? weekday(locale, names[day.day]) : day.day;
}

function formatWeatherValue(value, locale) {
    const match = String(value).match(/^(-?\d+(?:\.\d+)?)(.*)$/);
    if (!match) return value;
    const number = Number(match[1]);
    if (match[2] === '%') return new Intl.NumberFormat(locale, { style: 'percent' }).format(number / 100);
    if (match[2].trim() === 'km/h') return new Intl.NumberFormat(locale, { style: 'unit', unit: 'kilometer-per-hour', unitDisplay: 'short' }).format(number);
    return new Intl.NumberFormat(locale).format(number) + match[2];
}

const getIconClassName = (type) => {
    if (type === 'sun') return 'weather-icon-sun';
    if (type === 'partly-cloudy' || type === 'cloud') return 'weather-icon-cloud';
    return 'weather-icon-rain';
};

const getConditionLabel = (type) => {
    switch (type) {
        case 'sun': return 'Clear';
        case 'partly-cloudy': return 'Partly cloudy';
        case 'cloud': return 'Cloudy';
        case 'rain': return 'Rain';
        case 'snow': return 'Snow';
        case 'storm': return 'Storm';
        default: return 'Weather';
    }
};

export default memo(function WeatherWidget({ inline = false }) {
    const { t, locale } = useTranslation();
    const useCelsius = useSettingsStore(s => s.useCelsius);
    const fallbackCity = useSettingsStore(s => s.fallbackCity);
    const [expanded, setExpanded] = useState(false);
    const { weather, error, isOffline, isFallback, fetchWeatherRef } = useWeather(useCelsius, fallbackCity);
    const widgetRef = useRef(null);
    const panelRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                widgetRef.current && !widgetRef.current.contains(event.target) &&
                panelRef.current && !panelRef.current.contains(event.target)
            ) {
                setExpanded(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    if (!weather && !error) {
        if (inline) {
            return (
                <div className="weather-inline-card loading" aria-label={t("Loading weather")}>
                    <div className="weather-loading-icon" />
                    <div className="weather-loading-temp" />
                </div>
            );
        }
        return (
            <div className="weather-widget loading" id="weatherWidget" aria-label={t("Loading weather")}>
                <div className="weather-loading-icon" />
                <div className="weather-loading-temp" />
            </div>
        );
    }

    if (error) {
        if (inline) {
            return (
                <div className="weather-inline-card" style={{ opacity: 0.7 }}>
                    <span className="weather-icon-cloud" style={{ display: 'flex', alignItems: 'center' }}>⚠️</span>
                    <span style={{ color: 'var(--text-primary)' }}>{t("Weather unavailable")}</span>
                </div>
            );
        }
        return (
            <button 
                type="button" 
                className="weather-widget" 
                style={{ opacity: 0.6 }} 
                title={t("Weather failed to load. Click to retry.")}
                aria-label={t("Weather Error")}
                onClick={() => fetchWeatherRef.current?.()}
            >
                <span className="weather-icon-cloud" style={{ display: 'flex', alignItems: 'center' }}>⚠️</span>
                <span style={{ color: 'var(--text-primary)' }}>{t("Weather Error")}</span>
            </button>
        );
    }

    if (inline) {
        return (
            <div className="weather-inline" ref={widgetRef}>
                <button
                    className={`weather-inline-card ${expanded ? 'expanded' : ''}`}
                    onClick={() => setExpanded(!expanded)}
                    aria-expanded={expanded}
                    aria-label={t("Toggle weather details")}
                >
                    <span className={`weather-inline-icon ${weather ? getIconClassName(weather.iconType) : ''}`} aria-hidden="true">
                        {weather ? <WeatherIcon type={weather.iconType} /> : null}
                    </span>
                    <span className="weather-inline-main">
                        <span className="weather-inline-temp">{weather ? formatWeatherValue(weather.temp, locale) : '--°'}</span>
                        <span className="weather-inline-cond">
                            {weather ? t(getConditionLabel(weather.iconType)) : ''}
                            {isFallback && <span title={t("Location access denied. Showing fallback.")} style={{ marginLeft: 6 }}>📍</span>}
                        </span>
                    </span>
                    <span className={`weather-inline-chevron ${expanded ? 'open' : ''}`} aria-hidden="true">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </span>
                </button>

                <div className={`weather-inline-details ${expanded ? 'open' : ''}`} aria-hidden={!expanded} ref={panelRef} role="region" aria-label={t("Weather Details")}>
                    <div className="wd-row">
                        <span className="wd-label"><FeelsLikeIcon /> {t("Feels like")}</span>
                        <span>{weather ? formatWeatherValue(weather.feelsLike, locale) : '--°'}</span>
                    </div>
                    <div className="wd-row">
                        <span className="wd-label"><HumidityIcon /> {t("Humidity")}</span>
                        <span>{weather ? formatWeatherValue(weather.humidity, locale) : '--%'}</span>
                    </div>
                    <div className="wd-row">
                        <span className="wd-label"><WindIcon /> {t("Wind")}</span>
                        <span>{weather ? formatWeatherValue(weather.wind, locale) : '-- km/h'}</span>
                    </div>
                    <div className="wd-row">
                        <span className="wd-label"><SunriseIcon /> {t("Sunrise")}</span>
                        <span>{weather ? weather.sunrise : '--:--'}</span>
                    </div>
                    <div className="wd-row">
                        <span className="wd-label"><SunsetIcon /> {t("Sunset")}</span>
                        <span>{weather ? weather.sunset : '--:--'}</span>
                    </div>
                    {weather?.forecast && weather.forecast.length > 0 && (
                        <div className="weather-forecast">
                            <div className="weather-forecast-title">{t("3-Day Forecast")}</div>
                            <div className="weather-forecast-grid">
                                {weather.forecast.map((day, idx) => (
                                    <div key={idx} className="weather-forecast-day">
                                        <span className="weather-forecast-name">{forecastDay(day, locale)}</span>
                                        <span className={`weather-forecast-icon ${getIconClassName(day.iconType)}`}>
                                            <WeatherIcon type={day.iconType} />
                                        </span>
                                        <div className="weather-forecast-temps">
                                            <span className="weather-forecast-max">{new Intl.NumberFormat(locale).format(day.max)}°</span>
                                            <span className="weather-forecast-min">{new Intl.NumberFormat(locale).format(day.min)}°</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <>
            <button 
                type="button"
                className={`weather-widget ${expanded ? 'expanded' : ''}`} 
                id="weatherWidget"
                ref={widgetRef}
                onClick={() => setExpanded(!expanded)}
                aria-expanded={expanded}
                aria-label={t('Toggle weather details')}
            >
                <span id="weatherIcon" className={weather ? getIconClassName(weather.iconType) : ''} aria-hidden="true" style={{ display: 'flex', alignItems: 'center' }}>
                    {weather ? <WeatherIcon type={weather.iconType} /> : null}
                </span>
                <span id="weatherTemp" style={{ color: 'var(--text-primary)' }}>{weather ? formatWeatherValue(weather.temp, locale) : '--°C'}</span>
                <span className="weather-chevron" aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isFallback && <span title={t("Location access denied. Showing fallback.")} style={{ fontSize: '0.8rem', marginRight: '4px' }}>📍</span>}
                    {isOffline && <span title={t("Showing saved weather; refresh unavailable.")} style={{ fontSize: '0.8rem', marginRight: '4px', opacity: 0.8 }}>📡</span>}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </span>
            </button>
            <div 
                className={`weather-panel ${expanded ? 'open' : ''}`} 
                id="weatherPanel"
                ref={panelRef}
                role="region"
                aria-hidden={!expanded}
                aria-label={t("Weather Details")}
            >
                <div className="wd-row">
                    <span className="wd-label"><FeelsLikeIcon /> {t("Feels like")}</span>
                    <span id="wFeels">{weather ? formatWeatherValue(weather.feelsLike, locale) : '--°C'}</span>
                </div>
                <div className="wd-row">
                    <span className="wd-label"><HumidityIcon /> {t("Humidity")}</span>
                    <span id="wHumidity">{weather ? formatWeatherValue(weather.humidity, locale) : '--%'}</span>
                </div>
                <div className="wd-row">
                    <span className="wd-label"><WindIcon /> {t("Wind")}</span>
                    <span id="wWind">{weather ? formatWeatherValue(weather.wind, locale) : '-- km/h'}</span>
                </div>
                <div className="wd-row">
                    <span className="wd-label"><SunriseIcon /> {t("Sunrise")}</span>
                    <span id="wSunrise">{weather ? weather.sunrise : '--:--'}</span>
                </div>
                <div className="wd-row">
                    <span className="wd-label"><SunsetIcon /> {t("Sunset")}</span>
                    <span id="wSunset">{weather ? weather.sunset : '--:--'}</span>
                </div>
                
                {weather?.forecast && weather.forecast.length > 0 && (
                    <div className="weather-forecast">
                        <div className="weather-forecast-title">{t("3-Day Forecast")}</div>
                        <div className="weather-forecast-grid">
                            {weather.forecast.map((day, idx) => (
                                <div key={idx} className="weather-forecast-day">
                                    <span className="weather-forecast-name">{forecastDay(day, locale)}</span>
                                    <span className={`weather-forecast-icon ${getIconClassName(day.iconType)}`}>
                                        <WeatherIcon type={day.iconType} />
                                    </span>
                                    <div className="weather-forecast-temps">
                                        <span className="weather-forecast-max">{new Intl.NumberFormat(locale).format(day.max)}°</span>
                                        <span className="weather-forecast-min">{new Intl.NumberFormat(locale).format(day.min)}°</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {isOffline && weather?.timestamp && (
                    <div style={{ fontSize: '0.68rem', opacity: 0.5, textAlign: 'center', marginTop: '12px', paddingTop: '8px', borderTop: '1px dashed rgba(255,255,255,0.06)' }}>
                        {t('Offline. Updated {time}', { time: new Date(weather.timestamp).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) })}
                    </div>
                )}
            </div>
        </>
    );
});
