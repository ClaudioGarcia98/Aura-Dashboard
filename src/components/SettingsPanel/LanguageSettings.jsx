import { LANGUAGES } from '../../i18n/core';
import { useTranslation } from '../../i18n/useTranslation';
import { useSettingsStore } from '../../stores/useSettingsStore';

export default function LanguageSettings() {
    const { t } = useTranslation();
    const language = useSettingsStore(state => state.language) || 'auto';
    const setLanguage = useSettingsStore(state => state.setLanguage);
    return <div className="sp-section language-settings">
        <label className="sp-label" htmlFor="language-select">{t('Language')}</label>
        <select id="language-select" value={language} onChange={event => setLanguage(event.target.value)} aria-describedby="language-help">
            <option value="auto">{t('Automatic (browser language)')}</option>
            {Object.entries(LANGUAGES).map(([code, name]) => <option key={code} value={code} lang={code}>{name}</option>)}
        </select>
        <p id="language-help">{t('Choose your language. Dates and numbers follow this choice.')}</p>
    </div>;
}
