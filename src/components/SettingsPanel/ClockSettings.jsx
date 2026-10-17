import { memo } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useShallow } from 'zustand/react/shallow';

export default memo(function ClockSettings() {
    const { t } = useTranslation();
    const { clockMode, setClockMode, use24hClock, setUse24hClock } = useSettingsStore(useShallow(s => ({
        clockMode: s.clockMode, setClockMode: s.setClockMode,
        use24hClock: s.use24hClock, setUse24hClock: s.setUse24hClock,
    })));
    return <>
            <div className="sp-section">
                <div className="sp-label">{t("Clock Style")}</div>
                <div className="pill-row">
                    {['digital', 'analog', 'both'].map(m => (
                        <button
                            type="button"
                            key={m}
                            className={`pill ${clockMode === m ? 'active' : ''}`}
                            onClick={() => setClockMode(m)}
                        >
                            {t(m.charAt(0).toUpperCase() + m.slice(1))}
                        </button>
                    ))}
                </div>
            </div>

            <div className="sp-section">
                <div className="sp-label">{t("Clock Format")}</div>
                <div className="pill-row">
                    <button
                        type="button"
                        className={`pill ${!use24hClock ? 'active' : ''}`}
                        onClick={() => setUse24hClock(false)}
                    > {t("12-Hour")} </button>
                    <button
                        type="button"
                        className={`pill ${use24hClock ? 'active' : ''}`}
                        onClick={() => setUse24hClock(true)}
                    > {t("24-Hour")} </button>
                </div>
            </div>
    </>;
});
