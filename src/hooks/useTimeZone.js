import { useSyncExternalStore } from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { deviceTimeZone, isTimeZone } from '../utils/timeZone';

// Share one detector across the clock, settings and all anime cards.
const listeners = new Set();
let detected = deviceTimeZone();
let timer;
const check = () => {
    const zone = deviceTimeZone();
    if (zone !== detected) {
        detected = zone;
        listeners.forEach(listener => listener());
    }
};
const subscribe = listener => {
    listeners.add(listener);
    if (listeners.size === 1) {
        check();
        timer = setInterval(check, 60000);
        window.addEventListener('focus', check);
        document.addEventListener('visibilitychange', check);
    }
    return () => {
        listeners.delete(listener);
        if (!listeners.size) {
            clearInterval(timer);
            window.removeEventListener('focus', check);
            document.removeEventListener('visibilitychange', check);
        }
    };
};
const snapshot = () => detected;
const noSubscription = () => () => {};

export function useTimeZone() {
    const preference = useSettingsStore(state => state.timeZone) || 'auto';
    const manual = preference !== 'auto' && isTimeZone(preference);
    const device = useSyncExternalStore(manual ? noSubscription : subscribe, snapshot, snapshot);
    return manual ? preference : device;
}
