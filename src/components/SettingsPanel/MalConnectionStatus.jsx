import { useSettingsStore } from '../../stores/useSettingsStore';

export default function MalConnectionStatus() {
    const status = useSettingsStore(s => s.malStatus);
    const loading = useSettingsStore(s => s.malLoading);
    const username = useSettingsStore(s => s.malUsername);
    const refresh = useSettingsStore(s => s.refreshMal);
    if (!username?.trim()) return null;

    const message = loading ? 'Connecting to MyAnimeList… This may take a few moments.' : {
        partial: 'MyAnimeList’s full list could not be reached. Showing recent activity, which may miss some watching titles.',
        stale: 'Showing your saved watching list. MyAnimeList’s full list could not be refreshed.',
        error: 'Could not load your list. Check your username and that your MAL anime list is public, then retry.',
        fresh: 'Connected · Full watching list synced',
    }[status];

    return <div className="sp-mal-connection">
        {message && <p role="status" className={`sp-mal-message ${status === 'fresh' && !loading ? 'verified' : ''}`}>{message}</p>}
        {['partial', 'stale', 'error', 'fresh'].includes(status) && !loading &&
            <button type="button" className="pill" onClick={refresh}>{status === 'fresh' ? 'Refresh watching list' : 'Retry full list'}</button>}
    </div>;
}
