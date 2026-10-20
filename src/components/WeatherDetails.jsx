import { WeatherIcon, FeelsLikeIcon, HumidityIcon, WindIcon, SunriseIcon, SunsetIcon } from './WeatherIcons';
import { formatWeatherValue, forecastDay, getIconClassName } from '../utils/weatherPresentation';
import { isTimeZone } from '../utils/timeZone';

const rows = [
    { key: 'feelsLike', label: 'Feels like', id: 'wFeels', Icon: FeelsLikeIcon },
    { key: 'humidity', label: 'Humidity', id: 'wHumidity', Icon: HumidityIcon },
    { key: 'wind', label: 'Wind', id: 'wWind', Icon: WindIcon },
    { key: 'sunrise', label: 'Sunrise', id: 'wSunrise', Icon: SunriseIcon },
    { key: 'sunset', label: 'Sunset', id: 'wSunset', Icon: SunsetIcon },
];

export default function WeatherDetails({ weather, stale, t, locale, inline = false }) {
    const updated = new Date(weather.observedAt || weather.timestamp).toLocaleString(locale, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        ...(isTimeZone(weather.timeZone) ? { timeZone: weather.timeZone } : {}),
    });
    return <>
        <div className="weather-status">
            <span>{t('Updated {time}', { time: updated })}</span>
            {stale && <span role="status">{t('Showing saved weather; refresh unavailable.')}</span>}
        </div>
        {rows.map(({ key, label, id, Icon }) => <div className="wd-row" key={key}>
            <span className="wd-label"><Icon /> {t(label)}</span>
            <span id={inline ? undefined : id}>{key === 'sunrise' || key === 'sunset' ? weather[key] : formatWeatherValue(weather[key], locale)}</span>
        </div>)}
        {weather.forecast?.length > 0 && <div className="weather-forecast">
            <div className="weather-forecast-title">{t('3-Day Forecast')}</div>
            <div className="weather-forecast-grid">{weather.forecast.map((day, index) => <div key={day.date || index} className="weather-forecast-day">
                <span className="weather-forecast-name">{forecastDay(day, locale)}</span>
                <span className={`weather-forecast-icon ${getIconClassName(day.iconType)}`}><WeatherIcon type={day.iconType} /></span>
                <div className="weather-forecast-temps">
                    <span className="weather-forecast-max">{new Intl.NumberFormat(locale).format(day.max)}°</span>
                    <span className="weather-forecast-min">{new Intl.NumberFormat(locale).format(day.min)}°</span>
                </div>
            </div>)}</div>
        </div>}
    </>;
}
