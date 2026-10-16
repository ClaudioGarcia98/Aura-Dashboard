import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useShallow } from 'zustand/react/shallow';
import { fetchJson } from '../../services/http';

export default function WeatherSettings({ active }) {
    const { fallbackCity, setFallbackCity, useCelsius, setUseCelsius } = useSettingsStore(useShallow(s => ({
        fallbackCity: s.fallbackCity, setFallbackCity: s.setFallbackCity, useCelsius: s.useCelsius, setUseCelsius: s.setUseCelsius,
    })));
    const cityHintRef = useRef(null);
    const [citySearchText, setCitySearchText] = useState(fallbackCity);
    const [citySuggestions, setCitySuggestions] = useState([]);
    const [isSearchingCity, setIsSearchingCity] = useState(false);
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [cityHintPos, setCityHintPos] = useState(null);

    // Debounced city geocoding
    useEffect(() => {
        if (!active || citySearchText === fallbackCity || !showCityDropdown) return;
        const controller = new AbortController();
        let current = true;
        const delayDebounceFn = setTimeout(async () => {
            if (citySearchText.length > 2) {
                setIsSearchingCity(true);
                try {
                    const data = await fetchJson(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(citySearchText)}&count=5`, { signal: controller.signal });
                    if (current) setCitySuggestions(data.results || []);
                } catch {
                    if (current) setCitySuggestions([]);
                }
                if (current) setIsSearchingCity(false);
            } else {
                setCitySuggestions([]);
            }
        }, 500);
        return () => { current = false; controller.abort(); clearTimeout(delayDebounceFn); };
    }, [active, citySearchText, fallbackCity, showCityDropdown]);

    return (<>
                {/* Weather */}
                <div className="sp-section">
                    <div className="sp-label">Weather</div>
                    <div className="sp-group" style={{ position: 'relative' }}>
                        <label htmlFor="fallbackCityInput" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            Your City
                            <span
                                ref={cityHintRef}
                                style={{ display: 'inline-flex', alignItems: 'center', cursor: 'help', lineHeight: 1 }}
                                onMouseEnter={() => {
                                    if (cityHintRef.current) {
                                        const rect = cityHintRef.current.getBoundingClientRect();
                                        setCityHintPos({ top: rect.bottom + 8, left: rect.left });
                                    }
                                }}
                                onMouseLeave={() => setCityHintPos(null)}
                            >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="info-icon">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="16" x2="12" y2="12"></line>
                                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                </svg>
                            </span>
                            {cityHintPos && createPortal(
                                <div className="settings-hint-card" style={{ top: cityHintPos.top, left: cityHintPos.left }}>
                                    <p>This is only used when your browser's GPS location is unavailable or denied.</p>
                                </div>,
                                document.body
                            )}
                        </label>
                        <input
                            type="text"
                            id="fallbackCityInput"
                            placeholder="e.g. London"
                            value={citySearchText}
                            onChange={(e) => {
                                const text = e.target.value;
                                setCitySearchText(text);
                                setCitySuggestions([]);
                                setIsSearchingCity(false);
                                setShowCityDropdown(text.trim().length > 2);
                                // Clearing the field is a saved change, just like selecting a city.
                                // Other edits remain a search draft until a suggestion is selected.
                                if (!text.trim()) setFallbackCity('');
                            }}
                            onFocus={() => { if (citySearchText) setShowCityDropdown(true); }}
                        />
                        {showCityDropdown && (citySuggestions.length > 0 || isSearchingCity) && (
                            <ul className="city-suggestions-dropdown">
                                {isSearchingCity ? (
                                    <li className="city-suggestion-item">Searching...</li>
                                ) : (
                                    citySuggestions.map((s, i) => (
                                        <li key={i} className="city-suggestion-item" role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.currentTarget.click(); } }} onClick={() => {
                                            const fullName = `${s.name}${s.admin1 ? ', ' + s.admin1 : ''}, ${s.country}`;
                                            setCitySearchText(fullName);
                                            setFallbackCity(fullName);
                                            setShowCityDropdown(false);
                                        }}>
                                            <span style={{ fontWeight: 'bold' }}>{s.name}</span>
                                            {s.admin1 && <span style={{ opacity: 0.7 }}>, {s.admin1}</span>}
                                            <span style={{ opacity: 0.5, marginLeft: '4px' }}>({s.country})</span>
                                        </li>
                                    ))
                                )}
                            </ul>
                        )}
                    </div>
                                    <div className="sp-section" style={{ marginTop: '15px' }}>
                        <div className="sp-label">Temperature Unit</div>
                        <div className="pill-row">
                            <button type="button" className={`pill ${useCelsius ? 'active' : ''}`} onClick={() => setUseCelsius(true)}>Celsius (°C)</button>
                            <button type="button" className={`pill ${!useCelsius ? 'active' : ''}`} onClick={() => setUseCelsius(false)}>Fahrenheit (°F)</button>
                        </div>
                    </div>
                </div>
    </>);
}
