import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { safeStorage } from '../utils/storage';

export const FOCUS_DURATIONS = { focus: 25 * 60 * 1000, break: 5 * 60 * 1000 };
export const getFocusDay = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const initialFocusState = () => ({
    day: getFocusDay(), tasks: [], mode: 'focus', remainingMs: FOCUS_DURATIONS.focus,
    endsAt: null, chimeEnabled: true, notice: '',
});

export function sanitizeFocusState(raw) {
    const defaults = initialFocusState();
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return defaults;
    const mode = raw.mode === 'break' ? 'break' : 'focus';
    const remainingMs = Number.isFinite(raw.remainingMs) && raw.remainingMs > 0
        ? Math.min(raw.remainingMs, FOCUS_DURATIONS[mode]) : FOCUS_DURATIONS[mode];
    const ids = new Set();
    const tasks = raw.day === defaults.day && Array.isArray(raw.tasks) ? raw.tasks.filter(task => {
        if (!task || typeof task.id !== 'string' || !task.id || task.id.length > 100 || ids.has(task.id)
            || typeof task.text !== 'string' || !task.text.trim() || task.text.length > 120 || typeof task.done !== 'boolean') return false;
        ids.add(task.id);
        return true;
    }).slice(0, 3).map(({ id, text, done }) => ({ id, text: text.trim(), done })) : [];
    return {
        ...defaults, mode, remainingMs, tasks,
        endsAt: Number.isFinite(raw.endsAt) && raw.endsAt > 0 && raw.endsAt <= Date.now() + FOCUS_DURATIONS[mode] ? raw.endsAt : null,
        chimeEnabled: typeof raw.chimeEnabled === 'boolean' ? raw.chimeEnabled : true,
    };
}

export const useFocusStore = create(persist((set, get) => ({
    ...initialFocusState(),
    refreshDay: () => {
        if (get().day !== getFocusDay()) set({ day: getFocusDay(), tasks: [] });
    },
    addTask: text => {
        get().refreshDay();
        const trimmed = typeof text === 'string' ? text.trim() : '';
        if (!trimmed || trimmed.length > 120 || get().tasks.length >= 3) return false;
        set(state => ({ tasks: [...state.tasks, { id: crypto.randomUUID(), text: trimmed, done: false }] }));
        return true;
    },
    toggleTask: id => {
        get().refreshDay();
        set(state => ({ tasks: state.tasks.map(task => task.id === id ? { ...task, done: !task.done } : task) }));
    },
    removeTask: id => {
        get().refreshDay();
        set(state => ({ tasks: state.tasks.filter(task => task.id !== id) }));
    },
    start: () => {
        get().refreshDay();
        const state = get();
        if (!state.endsAt) set({ endsAt: Date.now() + state.remainingMs, notice: '' });
    },
    pause: () => {
        const { endsAt } = get();
        if (!endsAt) return;
        if (endsAt <= Date.now()) { get().completeSession(); return; }
        set({ remainingMs: endsAt - Date.now(), endsAt: null });
    },
    resetTimer: () => set(state => ({ endsAt: null, remainingMs: FOCUS_DURATIONS[state.mode], notice: '' })),
    setMode: mode => {
        if (!Object.hasOwn(FOCUS_DURATIONS, mode) || mode === get().mode) return;
        set({ mode, endsAt: null, remainingMs: FOCUS_DURATIONS[mode], notice: '' });
    },
    completeSession: () => {
        const { endsAt, mode } = get();
        if (!endsAt || endsAt > Date.now()) return false;
        const nextMode = mode === 'focus' ? 'break' : 'focus';
        set({
            mode: nextMode, endsAt: null, remainingMs: FOCUS_DURATIONS[nextMode],
            notice: mode === 'focus' ? 'Focus complete. Take a five-minute break.' : 'Break complete. Ready for another focus session?',
        });
        return true;
    },
    toggleChime: () => set(state => ({ chimeEnabled: !state.chimeEnabled })),
}), {
    name: 'dash_focus_v1', version: 1,
    storage: createJSONStorage(() => safeStorage),
    partialize: ({ day, tasks, mode, remainingMs, endsAt, chimeEnabled }) => ({ day, tasks, mode, remainingMs, endsAt, chimeEnabled }),
    merge: (saved, current) => ({ ...current, ...sanitizeFocusState(saved) }),
}));
