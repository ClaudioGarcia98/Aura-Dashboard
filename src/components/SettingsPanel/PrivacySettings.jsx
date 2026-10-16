import { useSettingsStore } from '../../stores/useSettingsStore';
import './PrivacySettings.css';

export default function PrivacySettings() {
    const remoteSuggestions = useSettingsStore(s => s.remoteSuggestions);
    const setRemoteSuggestions = useSettingsStore(s => s.setRemoteSuggestions);
    const pauseBackground = useSettingsStore(s => s.pauseBackground);
    const setPauseBackground = useSettingsStore(s => s.setPauseBackground);
    return <section className="sp-section sp-privacy" aria-labelledby="privacyMotionTitle">
        <div className="sp-label" id="privacyMotionTitle">Privacy &amp; Motion</div>
        <div className="sp-preferences">
            <label className="sp-preference">
                <span className="sp-preference-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 4 6v5c0 5 8 10 8 10s8-5 8-10V6l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg>
                </span>
                <span className="sp-preference-copy">
                    <span className="sp-preference-title" id="suggestionsTitle">Online search suggestions</span>
                    <span className="sp-preference-description" id="suggestionsDescription">Send typed search text to Google for suggestions. Your browser may block these requests.</span>
                    <span className="sp-preference-state">{remoteSuggestions ? 'On · Google suggestions' : 'Off · Local history only'}</span>
                </span>
                <input className="sp-switch" type="checkbox" role="switch" aria-labelledby="suggestionsTitle" aria-describedby="suggestionsDescription" checked={!!remoteSuggestions} onChange={e => setRemoteSuggestions(e.target.checked)} />
            </label>
            <label className="sp-preference">
                <span className="sp-preference-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9v6m4-6v6"/></svg>
                </span>
                <span className="sp-preference-copy">
                    <span className="sp-preference-title" id="backgroundMotionTitle">Pause background video</span>
                    <span className="sp-preference-description" id="backgroundMotionDescription">Keep video backgrounds still for a calmer dashboard.</span>
                    <span className="sp-preference-state">{pauseBackground ? 'On · Video paused' : 'Off · Video can play'}</span>
                </span>
                <input className="sp-switch" type="checkbox" role="switch" aria-labelledby="backgroundMotionTitle" aria-describedby="backgroundMotionDescription" checked={!!pauseBackground} onChange={e => setPauseBackground(e.target.checked)} />
            </label>
        </div>
    </section>;
}
