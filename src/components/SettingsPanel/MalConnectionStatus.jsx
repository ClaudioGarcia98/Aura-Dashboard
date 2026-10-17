import { useTranslation } from '../../i18n/useTranslation';
import { useSettingsStore } from '../../stores/useSettingsStore';

function formatSavedTime(ts, locale) {
    if (!Number.isFinite(ts) || ts <= 0) return '';
    try {
        return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(ts));
    } catch { return ''; }
}

export default function MalConnectionStatus() {
    const { t, locale } = useTranslation();
    const status = useSettingsStore(s => s.malStatus);
    const savedAt = useSettingsStore(s => s.malSavedAt);
    const loading = useSettingsStore(s => s.malLoading);
    const username = useSettingsStore(s => s.malUsername);
    const refresh = useSettingsStore(s => s.refreshMal);
    if (!username?.trim()) return null;

    const message = loading ? t("Connecting to MyAnimeList… This may take a few moments.") : {
        stale: formatSavedTime(savedAt, locale)
            ? t('Showing your saved watching list (saved {time}). MyAnimeList’s full list could not be refreshed.', { time: formatSavedTime(savedAt, locale) })
            : t('Showing your saved watching list. MyAnimeList’s full list could not be refreshed.'),
        rate_limited: t("Too many requests right now. Please wait a moment before retrying."),
        unavailable: t("MyAnimeList is temporarily unavailable or timed out. Please retry in a moment."),
        error: t("Could not load your list. Check your username and that your MAL anime list is public, then retry."),
        fresh: t("Connected · Full watching list synced"),
    }[status];

    return <div className="sp-mal-connection">
        {message && <p role="status" className={`sp-mal-message ${status === 'fresh' && !loading ? 'verified' : ''}`}>{message}</p>}
        {['stale', 'rate_limited', 'unavailable', 'error', 'fresh'].includes(status) && !loading &&
            <button type="button" className="pill" onClick={refresh}>{status === 'fresh' ? t("Refresh watching list") : t("Retry full list")}</button>}
    </div>;
}
