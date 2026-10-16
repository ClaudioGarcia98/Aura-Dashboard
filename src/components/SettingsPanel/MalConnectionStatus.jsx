import { useSettingsStore } from '../../stores/useSettingsStore';

function formatSavedTime(ts) {
    if (!Number.isFinite(ts) || ts <= 0) return '';
    try {
        return ` (saved ${new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(ts))})`;
    } catch { return ''; }
}

export default function MalConnectionStatus() {
    const status = useSettingsStore(s => s.malStatus);
    const savedAt = useSettingsStore(s => s.malSavedAt);
    const loading = useSettingsStore(s => s.malLoading);
    const username = useSettingsStore(s => s.malUsername);
    const refresh = useSettingsStore(s => s.refreshMal);
    if (!username?.trim()) return null;

    const message = loading ? 'Connecting to MyAnimeList… This may take a few moments.' : {
        stale: `Showing your saved watching list${formatSavedTime(savedAt)}. MyAnimeList’s full list could not be refreshed.`,
        rate_limited: 'Too many requests right now. Please wait a moment before retrying.',
        unavailable: 'MyAnimeList is temporarily unavailable or timed out. Please retry in a moment.',
        error: 'Could not load your list. Check your username and that your MAL anime list is public, then retry.',
        fresh: 'Connected · Full watching list synced',
    }[status];

    return <div className="sp-mal-connection">
        {message && <p role="status" className={`sp-mal-message ${status === 'fresh' && !loading ? 'verified' : ''}`}>{message}</p>}
        {['stale', 'rate_limited', 'unavailable', 'error', 'fresh'].includes(status) && !loading &&
            <button type="button" className="pill" onClick={refresh}>{status === 'fresh' ? 'Refresh watching list' : 'Retry full list'}</button>}
    </div>;
}
