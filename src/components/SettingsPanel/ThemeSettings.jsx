import { memo } from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useShallow } from 'zustand/react/shallow';
import { THEMES, FONTS, themeLabel } from '../../constants/settingsConstants';
import PresetSettings from './PresetSettings';
import './ThemeSettings.css';

export default memo(function ThemeSettings() {
    const { theme, setTheme, font, setFont, clockMode, setClockMode, use24hClock, setUse24hClock } = useSettingsStore(
        useShallow(s => ({
            theme: s.theme, setTheme: s.setTheme,
            font: s.font, setFont: s.setFont,
            clockMode: s.clockMode, setClockMode: s.setClockMode,
            use24hClock: s.use24hClock, setUse24hClock: s.setUse24hClock,
        }))
    );

    return (
        <>
            <div className="sp-section">
                <div className="sp-label">Theme</div>
                <div className="pill-row">
                    {Object.keys(THEMES).filter(t => !THEMES[t].curated).map(t => (
                        <button
                            type="button"
                            key={t}
                            className={`pill ${theme === t ? 'active' : ''}`}
                            aria-pressed={theme === t}
                            onClick={() => setTheme(t)}
                        >
                            <span
                                className="tdot"
                                style={{
                                    background: THEMES[t].accent || 'linear-gradient(135deg, #FFD26A 0%, #FF9F43 35%, #54a0ff 70%, #c482fb 100%)',
                                }}
                            ></span>
                            {themeLabel(t)}
                        </button>
                    ))}
                </div>
                <div className="curated-theme-label">Dark glass collection</div>
                <div className="curated-theme-grid" role="group" aria-label="Dark glass themes">
                    {Object.entries(THEMES).filter(([, value]) => value.curated).map(([key, value]) => <button key={key} type="button" className={`curated-theme${theme === key ? ' active' : ''}`} aria-label={themeLabel(key)} aria-pressed={theme === key} onClick={() => setTheme(key)}>
                        <span className="curated-theme-preview" style={{ background: value.base, '--preview-panel': value.panel, '--preview-accent': value.accent }} aria-hidden="true"><span /><i /><i /></span>
                        <span className="curated-theme-name">{themeLabel(key)}</span><span className="curated-theme-description">{value.description}</span>
                    </button>)}
                </div>
            </div>

            <PresetSettings />

            <div className="sp-section">
                <div className="sp-label">Font</div>
                <div className="pill-row">
                    {Object.keys(FONTS).map(f => (
                        <button
                            type="button"
                            key={f}
                            className={`pill ${font === f ? 'active' : ''}`}
                            onClick={() => setFont(f)}
                            style={{ fontFamily: FONTS[f].family }}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="sp-section">
                <div className="sp-label">Clock Style</div>
                <div className="pill-row">
                    {['digital', 'analog', 'both'].map(m => (
                        <button
                            type="button"
                            key={m}
                            className={`pill ${clockMode === m ? 'active' : ''}`}
                            onClick={() => setClockMode(m)}
                        >
                            {m.charAt(0).toUpperCase() + m.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="sp-section">
                <div className="sp-label">Clock Format</div>
                <div className="pill-row">
                    <button
                        type="button"
                        className={`pill ${!use24hClock ? 'active' : ''}`}
                        onClick={() => setUse24hClock(false)}
                    >
                        12-Hour
                    </button>
                    <button
                        type="button"
                        className={`pill ${use24hClock ? 'active' : ''}`}
                        onClick={() => setUse24hClock(true)}
                    >
                        24-Hour
                    </button>
                </div>
            </div>
        </>
    );
});
