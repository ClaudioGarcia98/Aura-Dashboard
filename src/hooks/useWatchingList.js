import { useEffect, useState } from 'react';
import { fetchUserWatchingList } from '../services/animeService';
import { safeJsonParse, safeStorage } from '../utils/storage';
import { WATCHING_CACHE_KEY } from '../services/api';

export function useWatchingList(username, enabled, { setMalLoading, setMalError, setMalSuccess, setMalStatus, refreshKey = 0 }) {
    const [watching, setWatching] = useState({ username: '', data: [] });
    useEffect(() => {
        let active = true;
        const controller = new AbortController();
        const user = (username || '').trim().toLowerCase();
        const cached = safeJsonParse(safeStorage.getItem(WATCHING_CACHE_KEY), null);
        const valid = cached?.username === user && Array.isArray(cached.data)
            && cached.data.every(item => item && typeof item.title === 'string' && item.mal_id);
        queueMicrotask(() => {
            if (!active) return;
            setWatching({ username: user, data: enabled && valid ? cached.data : [] });
            setMalLoading(!!(enabled && user)); setMalError(false); setMalSuccess(false); setMalStatus?.(enabled && user ? 'loading' : 'idle');
        });
        if (!enabled || !user) return () => { active = false; controller.abort(); };
        const timer = setTimeout(async () => {
            setMalLoading(true); setMalStatus?.('loading');
            try {
                const data = await fetchUserWatchingList(username, { signal: controller.signal, force: refreshKey > 0 });
                if (!active) return;
                // A recent-activity feed must not replace an older, complete saved list.
                if (data.partial && valid && cached.partial === false) {
                    setMalSuccess(false); setMalError(false); setMalStatus?.('stale');
                    return;
                }
                setWatching({ username: user, data });
                setMalSuccess(!data.partial); setMalError(false); setMalStatus?.(data.partial ? 'partial' : 'fresh');
                safeStorage.setItem(WATCHING_CACHE_KEY, JSON.stringify({ username: user, data, partial: !!data.partial, ts: Date.now() }));
            } catch {
                if (!active) return;
                setMalError(!valid); setMalSuccess(false); setMalStatus?.(valid ? 'stale' : 'error');
            } finally { if (active) setMalLoading(false); }
        }, 500);
        return () => { active = false; controller.abort(); clearTimeout(timer); };
    }, [username, enabled, refreshKey, setMalLoading, setMalError, setMalSuccess, setMalStatus]);
    return enabled && watching.username === (username || '').trim().toLowerCase() ? watching.data : [];
}
