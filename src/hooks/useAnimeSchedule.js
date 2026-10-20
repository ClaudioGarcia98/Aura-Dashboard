import { useState, useEffect, useRef, useCallback } from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useShallow } from 'zustand/react/shallow';
import { useWatchingList } from './useWatchingList';
import { useTimeZone } from './useTimeZone';
import { getScheduleDayFilter } from '../services/anime/time';
import { zonedDateKey } from '../utils/timeZone';
import { useDaySchedule } from './useDaySchedule';
import { useTrailerPreview } from './useTrailerPreview';

export function useAnimeSchedule({ alwaysOpen = false, enabled = true } = {}) {
    const timeZone = useTimeZone();
    const { malUsername, setMalError, setMalLoading, setMalSuccess, setMalStatus, setMalSavedAt } = useSettingsStore(useShallow(s => ({ malUsername: s.malUsername, setMalError: s.setMalError, setMalLoading: s.setMalLoading, setMalSuccess: s.setMalSuccess, setMalStatus: s.setMalStatus, setMalSavedAt: s.setMalSavedAt })));

    const [calendarNow, setCalendarNow] = useState(Date.now);
    const todayDay = getScheduleDayFilter(timeZone, new Date(calendarNow));
    const todayDate = zonedDateKey(new Date(calendarNow), timeZone);
    const [isSidebarOpen, setIsSidebarOpen] = useState(alwaysOpen);
    const [expandedAnime, setExpandedAnime] = useState(null);
    const [selection, setSelection] = useState(() => ({ day: todayDay, date: todayDate, timeZone }));
    const activeDay = selection.timeZone === timeZone && selection.date === todayDate ? selection.day : todayDay;
    const setActiveDay = useCallback(day => setSelection({ day, date: todayDate, timeZone }), [todayDate, timeZone]);

    const today = useDaySchedule({ day: todayDay, date: todayDate, timeZone, enabled });
    const sidebar = useDaySchedule({ day: activeDay, date: todayDate, timeZone, enabled: enabled && (isSidebarOpen || alwaysOpen) });
    const todayData = today.data;
    const sidebarData = sidebar.data.filter(item => item.broadcast?.time).sort((a, b) => (a.airingAt || 0) - (b.airingAt || 0));
    const trailer = useTrailerPreview();

    const refreshKey = useSettingsStore(s => s.malRefreshKey);
    const userWatching = useWatchingList(malUsername, enabled, { setMalLoading, setMalError, setMalSuccess, setMalStatus, setMalSavedAt, refreshKey });

    const sidebarRef = useRef(null);
    const toggleRef = useRef(null);

    // Idle / Escape → close sidebar (disabled in always-open / embedded mode)
    useEffect(() => {
        if (alwaysOpen) return;
        const closeSidebar = () => setIsSidebarOpen(false);
        const handleKeyDown = (e) => { if (e.key === 'Escape') closeSidebar(); };
        window.addEventListener('app-idle', closeSidebar);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('app-idle', closeSidebar);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [alwaysOpen]);

    // Click-outside collapse for expanded card
    useEffect(() => {
        const handleCollapseClick = (e) => {
            if (expandedAnime &&
                !e.target.closest('.anime-card') &&
                !e.target.closest('.tab-item') &&
                !e.target.closest('.trailer-portal-container')) {
                setExpandedAnime(null);
            }
        };
        document.addEventListener('mousedown', handleCollapseClick);
        return () => document.removeEventListener('mousedown', handleCollapseClick);
    }, [expandedAnime]);

    // Refresh the calendar on minute boundaries and after travel/system changes.
    useEffect(() => {
        let mounted = true;
        let timer;
        const checkDay = () => { if (mounted) setCalendarNow(Date.now()); };
        const tick = () => {
            if (!mounted) return;
            checkDay();
            timer = setTimeout(tick, 60000 - Date.now() % 60000);
        };
        queueMicrotask(tick);
        window.addEventListener('focus', checkDay);
        document.addEventListener('visibilitychange', checkDay);
        return () => {
            mounted = false;
            clearTimeout(timer);
            window.removeEventListener('focus', checkDay);
            document.removeEventListener('visibilitychange', checkDay);
        };
    }, [timeZone]);

    useEffect(() => {
        const handleClickOutside = e => {
            if (!alwaysOpen && document.contains(e.target) && sidebarRef.current && !sidebarRef.current.contains(e.target)
                && toggleRef.current && !toggleRef.current.contains(e.target) && !e.target.closest('.trailer-portal-container')) setIsSidebarOpen(false);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [alwaysOpen]);

    // Derived: today display list (watching-prioritized top-5)
    const userWatchingIds = (() => {
        const ids = new Set(userWatching.map(u => Number(u.mal_id)).filter(id => !isNaN(id) && id > 0));
        return Array.from(ids);
    })();
    const displayList = (() => {
        if (!todayData || todayData.length === 0) return [];
        const watchedToday = todayData
            .filter(a => userWatchingIds.includes(Number(a.mal_id)))
            .sort((a, b) => (b.score || 0) - (a.score || 0));
        if (watchedToday.length >= 5) return watchedToday.slice(0, 5);
        const othersToday = todayData
            .filter(a => !userWatchingIds.includes(Number(a.mal_id)))
            .sort((a, b) => (b.score || 0) - (a.score || 0));
        return [...watchedToday, ...othersToday.slice(0, 5 - watchedToday.length)];
    })();

    return {
        // sidebar
        isSidebarOpen, setIsSidebarOpen,
        activeDay, setActiveDay,
        sidebarData, sidebarLoading: sidebar.loading, sidebarError: sidebar.error, sidebarStale: sidebar.stale,
        refreshSidebar: sidebar.refresh,
        sidebarRef, toggleRef,
        // today list
        todayLoading: today.loading, todayError: today.error, todayStale: today.stale,
        refreshToday: today.refresh,
        displayList,
        userWatchingIds,
        // expand
        expandedAnime, setExpandedAnime,
        ...trailer,
    };
}
