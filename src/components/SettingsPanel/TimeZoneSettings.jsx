import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTranslation } from '../../i18n/useTranslation';
import { useTimeZone } from '../../hooks/useTimeZone';
import { timeZoneOptions } from '../../utils/timeZone';

export default function TimeZoneSettings() {
    const { t } = useTranslation();
    const timeZone = useTimeZone();
    const preference = useSettingsStore(state => state.timeZone) || 'auto';
    const setTimeZone = useSettingsStore(state => state.setTimeZone);
    const showJapanTime = useSettingsStore(state => state.showJapanTime) ?? true;
    const setShowJapanTime = useSettingsStore(state => state.setShowJapanTime);
    return <div className="sp-section language-settings">
        <label className="sp-label" htmlFor="time-zone-select">{t('Time zone')}</label>
        <select id="time-zone-select" value={preference} onChange={event => setTimeZone(event.target.value)} aria-describedby="time-zone-help">
            <option value="auto">{t('Automatic — device time zone')}</option>
            {timeZoneOptions(timeZone).map(zone => <option key={zone} value={zone}>{zone.replaceAll('_', ' ')}</option>)}
        </select>
        <p id="time-zone-help">{t('Clock, date and anime schedule use this time zone. No location permission needed.')}</p>
        <label className="preset-wallpaper-option" style={{ marginTop: 12, marginBottom: 0 }}>
            <input type="checkbox" checked={showJapanTime} onChange={event => setShowJapanTime(event.target.checked)} />
            <span>{t('Also show Japan time (JST) for anime')}</span>
        </label>
    </div>;
}
