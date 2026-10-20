import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchDaySchedule } from '../services/animeService';
import { SCHEDULE_CACHE_TTL_MS } from '../services/api';

const RETRY_DELAYS = [5000, 30000];
const RESUME_THROTTLE_MS = 30000;
const emptyState = () => ({ data: [], loading: true, error: false, stale: false });

// Owns one calendar day's request lifetime. Retries stop after two attempts;
// online/resume or an explicit refresh can start a new bounded recovery cycle.
export function useDaySchedule({ day, date, timeZone, enabled }) {
    const [state, setState] = useState(emptyState);
    const refreshRef = useRef(null);
    const refresh = useCallback(() => refreshRef.current?.(), []);

    useEffect(() => {
        if (!enabled) return;
        let disposed = false;
        let pending = false;
        let controller;
        let timer;
        let resumeTimer;
        let hasData = false;
        let needsRefresh = true;
        let savedAt = 0;
        let attempts = 0;
        let lastAttempt = -Infinity;

        const run = async (force = false, newCycle = false) => {
            if (disposed || pending) return;
            clearTimeout(timer);
            clearTimeout(resumeTimer);
            resumeTimer = undefined;
            if (newCycle) attempts = 0;
            pending = true;
            lastAttempt = Date.now();
            controller = new AbortController();
            setState(previous => ({ ...previous, loading: !hasData, error: false }));
            try {
                const items = await fetchDaySchedule(day, { timeZone, signal: controller.signal, force });
                if (disposed) return;
                hasData = true;
                needsRefresh = !!items.stale;
                if (!needsRefresh) savedAt = Number.isFinite(items.savedAt) && items.savedAt <= Date.now() ? items.savedAt : Date.now();
                setState({ data: [...new Map(items.filter(Boolean).map(item => [item.mal_id, item])).values()], loading: false, error: false, stale: needsRefresh });
            } catch {
                if (disposed) return;
                needsRefresh = true;
                setState(previous => ({ ...previous, loading: false, error: !hasData, stale: hasData }));
            } finally {
                pending = false;
                if (!disposed) {
                    if (needsRefresh && attempts < RETRY_DELAYS.length) {
                        timer = setTimeout(() => run(), RETRY_DELAYS[attempts++]);
                    } else if (!needsRefresh) {
                        attempts = 0;
                        timer = setTimeout(() => run(), Math.max(1, SCHEDULE_CACHE_TTL_MS - (Date.now() - savedAt)));
                    }
                }
            }
        };
        const resume = () => {
            if (disposed || pending || document.visibilityState === 'hidden') return;
            if (!needsRefresh && Date.now() - savedAt < SCHEDULE_CACHE_TTL_MS) return;
            const remaining = RESUME_THROTTLE_MS - (Date.now() - lastAttempt);
            if (remaining > 0) {
                if (!resumeTimer) resumeTimer = setTimeout(() => { resumeTimer = undefined; resume(); }, remaining);
                return;
            }
            void run(false, true);
        };
        refreshRef.current = () => run(true, true);
        queueMicrotask(() => {
            if (disposed) return;
            setState(emptyState());
            void run();
        });
        window.addEventListener('online', resume);
        window.addEventListener('focus', resume);
        document.addEventListener('visibilitychange', resume);
        return () => {
            disposed = true;
            clearTimeout(timer);
            clearTimeout(resumeTimer);
            controller?.abort();
            refreshRef.current = null;
            window.removeEventListener('online', resume);
            window.removeEventListener('focus', resume);
            document.removeEventListener('visibilitychange', resume);
        };
    }, [day, date, timeZone, enabled]);

    return { ...state, refresh };
}
