const SunIcon = () => (
    <svg className="weather-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" fill="var(--accent-color)" opacity="0.3" />
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
);

const MoonIcon = () => (
    <svg className="weather-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z" />
    </svg>
);

const CloudyNightIcon = () => (
    <svg className="weather-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 9a6 6 0 0 1-6-6 6 6 0 0 0-4 10" />
        <path d="M8 21a4 4 0 1 1 0-8 5 5 0 0 1 9-1 4.5 4.5 0 1 1 1 9Z" />
    </svg>
);

const FogIcon = () => (
    <svg className="weather-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12a4 4 0 0 1 2-7 5 5 0 0 1 9 0 4 4 0 0 1 3 7M3 16h18M5 20h14" />
    </svg>
);

const PartlyCloudyIcon = () => (
    <svg className="weather-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 1v1M22 7h1M20.5 2.5l-.7.7M10.8 2.5l.7.7" />
        <path d="M13 6a3.5 3.5 0 1 1 6 3" />
        <path d="M7 21a4 4 0 1 1 0-8 5 5 0 0 1 9-1 4.5 4.5 0 1 1 1 9Z" fill="rgba(255,255,255,0.1)" />
    </svg>
);

const CloudIcon = () => (
    <svg className="weather-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="rgba(255,255,255,0.05)" />
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
);

const RainIcon = () => (
    <svg className="weather-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="rgba(255,255,255,0.05)" />
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
        <path d="M8 21l-1 2M12 21l-1 2M16 21l-1 2" />
    </svg>
);

const SnowIcon = () => (
    <svg className="weather-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="rgba(255,255,255,0.05)" />
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
        <path d="M8 22h.01M12 22h.01M16 22h.01" strokeWidth="3" />
    </svg>
);

const StormIcon = () => (
    <svg className="weather-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="rgba(255,255,255,0.05)" />
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
        <path d="m13 14-3 5h4l-2 4" />
    </svg>
);

export const FeelsLikeIcon = () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
    </svg>
);

export const HumidityIcon = () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22a7 7 0 0 0 5-11.97L12 4.1 7 10.03A7 7 0 0 0 12 22z" />
    </svg>
);

export const WindIcon = () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
    </svg>
);

export const SunriseIcon = () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 22H6M12 18V2M12 2l-4 4M12 2l4 4M12 10a4 4 0 0 1 4 4H8a4 4 0 0 1 4-4z" />
    </svg>
);

export const SunsetIcon = () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 22H6M12 2v16M12 18l-4-4M12 18l4-4M12 10a4 4 0 0 1 4 4H8a4 4 0 0 1 4-4z" />
    </svg>
);

export const WeatherIcon = ({ type }) => {
    switch (type) {
        case 'sun': return <SunIcon />;
        case 'moon': return <MoonIcon />;
        case 'partly-cloudy': return <PartlyCloudyIcon />;
        case 'partly-cloudy-night': return <CloudyNightIcon />;
        case 'cloud': return <CloudIcon />;
        case 'fog': return <FogIcon />;
        case 'rain': return <RainIcon />;
        case 'snow': return <SnowIcon />;
        case 'storm': return <StormIcon />;
        default: return <CloudIcon />;
    }
};
