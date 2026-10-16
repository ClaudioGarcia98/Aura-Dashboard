import { useEffect, useRef, useState } from 'react';
import { fetchUserWatchingList } from '../services/animeService';
import { safeJsonParse, safeStorage } from '../utils/storage';
import { WATCHING_CACHE_KEY } from '../services/api';

function readValidSavedEntry(raw, user) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.partial === true) return null;
    const candidate = raw.username === user ? raw : raw.byUser?.[user];
    if (!candidate || candidate.partial === true || !Array.isArray(candidate.data)) return null;
    if (candidate.ts !== undefined && !Number.isFinite(candidate.ts)) return null;
    const seen = new Set();
    const deduped = [];
    for (const item of candidate.data) {
        const id = Number(item?.mal_id);
        if (!item || typeof item.title !== 'string' || !item.title.trim() || !Number.isSafeInteger(id) || id <= 0) return null;
        if (seen.has(id)) continue;
        seen.add(id);
        deduped.push({ ...item, mal_id: id });
    }
    return { data: deduped, ts: Number.isFinite(candidate.ts) ? candidate.ts : null };
}

export function useWatchingList(username, enabled, { setMalLoading, setMalError, setMalSuccess, setMalStatus, setMalSavedAt, refreshKey = 0 }) {
    const [watching, setWatching] = useState({ username: '', data: [] });
    const prevRefreshRef = useRef(refreshKey);
    useEffect(() => {
        let active = true;
        const controller = new AbortController();
        const isForcedRefresh = refreshKey !== prevRefreshRef.current;
        prevRefreshRef.current = refreshKey;
        const user = (username || '').trim().toLowerCase();
        safeStorage.removeItem('dash_mal_proxy');
        const rawCache = safeJsonParse(safeStorage.getItem(WATCHING_CACHE_KEY), null);
        if (rawCache?.partial === true) safeStorage.removeItem(WATCHING_CACHE_KEY);
        const saved = user ? readValidSavedEntry(rawCache, user) : null;
        const valid = !!saved;
        queueMicrotask(() => {
            if (!active) return;
            setWatching({ username: user, data: enabled && valid ? saved.data : [] });
            setMalSavedAt?.(enabled && valid ? saved.ts : null);
            setMalLoading(!!(enabled && user)); setMalError(false); setMalSuccess(false); setMalStatus?.(enabled && user ? 'loading' : 'idle');
        });
        if (!enabled || !user) return () => { active = false; controller.abort(); };
        const timer = setTimeout(async () => {
            setMalLoading(true); setMalStatus?.('loading');
            try {
                const data = await fetchUserWatchingList(username, { signal: controller.signal, force: isForcedRefresh });
                if (!active) return;
                const ts = Date.now();
                setWatching({ username: user, data });
                setMalSavedAt?.(ts);
                setMalSuccess(true); setMalError(false); setMalStatus?.('fresh');
                const existingByUser = rawCache && typeof rawCache.byUser === 'object' && !Array.isArray(rawCache.byUser) ? { ...rawCache.byUser } : {};
                if (rawCache?.username && rawCache.partial !== true && Array.isArray(rawCache.data)) {
                    existingByUser[rawCache.username] = { data: rawCache.data, ts: rawCache.ts ?? ts };
                }
                delete existingByUser[user];
                existingByUser[user] = { data, ts };
                const boundedByUser = Object.fromEntries(Object.entries(existingByUser).slice(-5));
                safeStorage.setItem(WATCHING_CACHE_KEY, JSON.stringify({ version: 2, username: user, data, ts, byUser: boundedByUser }));
            } catch (error) {
                if (!active) return;
                const failStatus = error?.status === 429 ? 'rate_limited'
                    : (error?.status === 502 || /timed out/i.test(error?.message || '')) ? 'unavailable'
                    : 'error';
                setMalError(!valid); setMalSuccess(false); setMalStatus?.(valid ? 'stale' : failStatus);
            } finally { if (active) setMalLoading(false); }
        }, 500);
        return () => { active = false; controller.abort(); clearTimeout(timer); };
    }, [username, enabled, refreshKey, setMalLoading, setMalError, setMalSuccess, setMalStatus, setMalSavedAt]);
    return enabled && watching.username === (username || '').trim().toLowerCase() ? watching.data : [];
}
