import { useEffect } from 'react';
import { useFocusStore } from '../stores/useFocusStore';
import { playFocusChime, prepareFocusChime } from '../services/focusChime';
import { useTimeZone } from './useTimeZone';

// Mounted once by App, independent of the current layout or mobile tab.
export function useFocusSession(enabled = true) {
    const timeZone = useTimeZone();
    const active = useFocusStore(state => !!state.endsAt && state.mode === 'focus');
    useEffect(() => {
        document.body.classList.toggle('focus-session-active', enabled && active);
        return () => document.body.classList.remove('focus-session-active');
    }, [active, enabled]);

    useEffect(() => {
        let mounted = true;
        const unsubscribe = useFocusStore.subscribe((state, previous) => {
            if (state.notice && state.notice !== previous.notice && state.chimeEnabled) playFocusChime();
        });
        const update = () => {
            if (!mounted) return;
            const state = useFocusStore.getState();
            state.refreshDay(timeZone);
            const expired = state.endsAt && state.endsAt <= Date.now();
            if (expired) state.completeSession();
            if (!enabled) useFocusStore.getState().pause();
        };
        // A saved deadline may have elapsed while the dashboard was closed.
        queueMicrotask(update);
        const timer = setInterval(update, 1000);
        window.addEventListener('focus', update);
        document.addEventListener('visibilitychange', update);
        const syncSaved = event => {
            if (event.key === 'dash_focus_v1') { useFocusStore.persist.rehydrate(); update(); }
        };
        window.addEventListener('storage', syncSaved);
        // A running timer can survive a reload, but its audio context cannot.
        const unlockAudio = () => {
            const state = useFocusStore.getState();
            if (enabled && state.endsAt && state.chimeEnabled) prepareFocusChime();
        };
        window.addEventListener('pointerdown', unlockAudio);
        window.addEventListener('keydown', unlockAudio);
        return () => {
            mounted = false;
            unsubscribe();
            clearInterval(timer);
            window.removeEventListener('focus', update);
            document.removeEventListener('visibilitychange', update);
            window.removeEventListener('storage', syncSaved);
            window.removeEventListener('pointerdown', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
        };
    }, [enabled, timeZone]);
}
