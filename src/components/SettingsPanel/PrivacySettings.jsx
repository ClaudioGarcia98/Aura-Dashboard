import { useTranslation } from '../../i18n/useTranslation';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useState } from 'react';
import { ONLINE_DATA_PERMISSIONS, requestExtensionDataPermissions, usesFirefoxDataConsent } from '../../services/extensionPermissions';
import { useExtensionPermission } from '../../hooks/useExtensionPermission';
import './PrivacySettings.css';

export default function PrivacySettings() {
    const { t } = useTranslation();
    const remoteSuggestions = useSettingsStore(s => s.remoteSuggestions);
    const setRemoteSuggestions = useSettingsStore(s => s.setRemoteSuggestions);
    const pauseBackground = useSettingsStore(s => s.pauseBackground);
    const setPauseBackground = useSettingsStore(s => s.setPauseBackground);
    const [permissionMessage, setPermissionMessage] = useState('');
    const locationAllowed = useExtensionPermission('locationInfo');
    const accountAllowed = useExtensionPermission('authenticationInfo');
    const searchAllowed = useExtensionPermission('searchTerms');
    const faviconsAllowed = useExtensionPermission('browsingActivity');
    const allAllowed = locationAllowed && accountAllowed && searchAllowed && faviconsAllowed;
    return <section className="sp-section sp-privacy" aria-labelledby="privacyMotionTitle">
        <div className="sp-label" id="privacyMotionTitle">{t("Privacy & Motion")}</div>
        {usesFirefoxDataConsent() && <div className="sp-extension-consent">
            <p className="sp-preference-title">{t('Online features')}</p>
            <p className="sp-preference-description">{t('Weather sends your city or coordinates to Open-Meteo and may use IPAPI for approximate location. MyAnimeList sends your public username to the Aura relay and MyAnimeList. Searches and optional suggestions send text to your search provider. Site icons send saved website domains to Google.')}</p>
            <p className="sp-preference-description">{t('Allow these optional features in Firefox, or keep using the local clock, focus timer, settings, and wallpapers. Permissions can be changed in Firefox’s extension settings.')}</p>
            {!allAllowed && <button type="button" className="pill" onClick={() => {
                requestExtensionDataPermissions(ONLINE_DATA_PERMISSIONS).then(granted => {
                    setPermissionMessage(granted ? 'Online features enabled.' : 'Permission was not granted. Local features remain available.');
                });
            }}>{t('Enable online features')}</button>}
            <p role="status" className="sp-preference-state">{permissionMessage ? t(permissionMessage) : allAllowed ? t('Online features enabled.') : t('Online features need your permission.')}</p>
        </div>}
        <div className="sp-preferences">
            <label className="sp-preference">
                <span className="sp-preference-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 4 6v5c0 5 8 10 8 10s8-5 8-10V6l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg>
                </span>
                <span className="sp-preference-copy">
                    <span className="sp-preference-title" id="suggestionsTitle">{t("Online search suggestions")}</span>
                    <span className="sp-preference-description" id="suggestionsDescription">{t("Send typed search text to Google for suggestions. Your browser may block these requests.")}</span>
                    <span className="sp-preference-state">{remoteSuggestions ? t("On · Google suggestions") : t("Off · Local history only")}</span>
                </span>
                <input className="sp-switch" type="checkbox" role="switch" aria-labelledby="suggestionsTitle" aria-describedby="suggestionsDescription" checked={!!remoteSuggestions} onChange={e => setRemoteSuggestions(e.target.checked)} />
            </label>
            <label className="sp-preference">
                <span className="sp-preference-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9v6m4-6v6"/></svg>
                </span>
                <span className="sp-preference-copy">
                    <span className="sp-preference-title" id="backgroundMotionTitle">{t("Pause background video")}</span>
                    <span className="sp-preference-description" id="backgroundMotionDescription">{t("Keep video backgrounds still for a calmer dashboard.")}</span>
                    <span className="sp-preference-state">{pauseBackground ? t("On · Video paused") : t("Off · Video can play")}</span>
                </span>
                <input className="sp-switch" type="checkbox" role="switch" aria-labelledby="backgroundMotionTitle" aria-describedby="backgroundMotionDescription" checked={!!pauseBackground} onChange={e => setPauseBackground(e.target.checked)} />
            </label>
        </div>
    </section>;
}
