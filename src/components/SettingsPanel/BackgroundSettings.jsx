import { useTranslation } from '../../i18n/useTranslation';
import { useState, useRef } from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { BACKGROUND_ACCEPT, BackgroundMediaError, changeBackground } from '../../services/backgroundMedia';

export default function BackgroundSettings() {
    const { t } = useTranslation();
    const gifName = useSettingsStore(s => s.gifName);
    const [bgError, setBgError] = useState('');
    const [busy, setBusy] = useState(false);
    const request = useRef(0);
    const bgFileInputRef = useRef(null);
    const handleFileChange = async (e) => {
        const f = e.target.files[0];
        e.target.value = '';
        if (!f) return;
        const current = ++request.current;
        setBgError('');
        setBusy(true);
        try {
            await changeBackground({ blob: f, name: f.name });
        } catch (err) {
            if (current === request.current && err.name !== 'AbortError') setBgError(err instanceof BackgroundMediaError ? err.message : 'Failed to store media in local database');
        } finally { if (current === request.current) setBusy(false); }
    };

    const handleRestoreDefaultBackground = async () => {
        const current = ++request.current;
        setBgError(''); setBusy(true);
        try {
            await changeBackground();
        } catch (err) {
            if (current === request.current && err.name !== 'AbortError') setBgError('Could not remove the saved background. Please try again.');
        } finally { if (current === request.current) setBusy(false); }
        if (bgFileInputRef.current) bgFileInputRef.current.value = '';
    };

    return (<>
            <div className="sp-section">
                <div className="sp-label">{t("Background")}</div>
                <div
                    className="gif-btn"
                    onClick={() => bgFileInputRef.current?.click()}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); bgFileInputRef.current?.click(); } }}
                    role="button"
                    tabIndex={0}
                >
                    <span>🎞</span><span>{gifName ? t("Change GIF…") : t("Choose local GIF…")}</span>
                </div>
                <div className="gif-name" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {gifName || t("Default (animated_gif.mp4)")}
                    </span>
                    {gifName && (
                        <button
                            type="button"
                            className="pill"
                            style={{ fontSize: '0.72rem', padding: '3px 8px', flexShrink: 0 }}
                            onClick={handleRestoreDefaultBackground}
                            title={t("Restore default animation")}
                        > {t("↺ Restore")} </button>
                    )}
                </div>
                {busy && <div role="status">{t('Checking your background…')}</div>}
                {bgError && (
                    <div style={{ color: '#ff6b6b', fontSize: '0.75rem', marginTop: '6px' }} role="alert">
                        {t(bgError)}
                    </div>
                )}
                <input
                    type="file"
                    ref={bgFileInputRef}
                    style={{ display: 'none' }}
                    accept={BACKGROUND_ACCEPT}
                    onChange={handleFileChange}
                />
            </div>

    </>);
}
