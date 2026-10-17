import { useTranslation } from '../../i18n/useTranslation';
import { memo } from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useShallow } from 'zustand/react/shallow';
import { THEMES, FONTS, themeLabel } from '../../constants/settingsConstants';
import PresetSettings from './PresetSettings';
import BackgroundSettings from './BackgroundSettings';
import './ThemeSettings.css';

export default memo(function ThemeSettings() {
    const { t } = useTranslation();
    const { theme, setTheme, font, setFont } = useSettingsStore(
        useShallow(s => ({
            theme: s.theme, setTheme: s.setTheme,
            font: s.font, setFont: s.setFont,
        }))
    );

    return (
        <>
            <div className="sp-section">
                <div className="sp-label">{t("Theme")}</div>
                <div className="theme-grid" role="group" aria-label={t("Themes")}>
                    {Object.entries(THEMES).map(([key, value]) => (
                        <button key={key} type="button" className={`theme-option${theme === key ? ' active' : ''}`} aria-label={themeLabel(key)} aria-pressed={theme === key} onClick={() => setTheme(key)}>
                            <span className="theme-preview" style={{
                                background: value.base || '#0b0c10',
                                '--preview-panel': value.panel || '#10121a',
                                '--preview-accent': value.accent || '#FFD26A',
                                '--preview-highlight': value.timeBased ? 'linear-gradient(90deg, #FFD26A, #FF9F43, #54a0ff, #c482fb)' : value.accent,
                            }} aria-hidden="true"><span /><i /><i /></span>
                            <span className="theme-name">{themeLabel(key)}</span>
                            <span className="theme-description">{t(value.description)}</span>
                        </button>
                    ))}
                </div>
            </div>


            <div className="sp-section">
                <div className="sp-label">{t("Font")}</div>
                <div className="pill-row">
                    {Object.keys(FONTS).map(f => (
                        <button
                            type="button"
                            key={f}
                            className={`pill ${font === f ? 'active' : ''}`}
                            onClick={() => setFont(f)}
                            style={{ fontFamily: FONTS[f].family }}
                        >
                            {t(f.charAt(0).toUpperCase() + f.slice(1))}
                        </button>
                    ))}
                </div>
            </div>

            <BackgroundSettings />
            <PresetSettings />
        </>
    );
});
