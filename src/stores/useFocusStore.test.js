import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { FOCUS_DURATIONS, getFocusDay, initialFocusState, sanitizeFocusState, useFocusStore } from './useFocusStore';

beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 17, 12));
    localStorage.clear();
    useFocusStore.setState(initialFocusState());
});
afterEach(() => vi.useRealTimers());

it('saves a maximum of three daily priorities and persists completion and deletion', async () => {
    const state = useFocusStore.getState();
    expect(state.addTask('  Finish the chapter  ')).toBe(true);
    expect(state.addTask('')).toBe(false);
    state.addTask('Review notes');
    state.addTask('Go for a walk');
    expect(state.addTask('Fourth task')).toBe(false);
    const id = useFocusStore.getState().tasks[0].id;
    state.toggleTask(id);
    await useFocusStore.persist.rehydrate();
    expect(useFocusStore.getState().tasks[0]).toMatchObject({ text: 'Finish the chapter', done: true });
    state.removeTask(id);
    expect(useFocusStore.getState().tasks).toHaveLength(2);
});

it('uses a deadline, pauses precisely and resumes without resetting the session', () => {
    const state = useFocusStore.getState();
    state.start();
    const deadline = useFocusStore.getState().endsAt;
    vi.setSystemTime(new Date(Date.now() + 123456));
    state.pause();
    expect(useFocusStore.getState().endsAt).toBeNull();
    expect(useFocusStore.getState().remainingMs).toBe(FOCUS_DURATIONS.focus - 123456);
    vi.setSystemTime(new Date(Date.now() + 60000));
    state.start();
    expect(useFocusStore.getState().endsAt).toBe(deadline + 60000);
});

it('restores a running session after reload and completes it only once after a suspended tab wakes', async () => {
    useFocusStore.getState().start();
    const deadline = useFocusStore.getState().endsAt;
    await useFocusStore.persist.rehydrate();
    expect(useFocusStore.getState().endsAt).toBe(deadline);
    vi.setSystemTime(new Date(deadline + 120000));
    expect(useFocusStore.getState().completeSession()).toBe(true);
    expect(useFocusStore.getState()).toMatchObject({ mode: 'break', remainingMs: 300000, endsAt: null });
    expect(useFocusStore.getState().completeSession()).toBe(false);
    useFocusStore.getState().start();
    vi.setSystemTime(new Date(Date.now() + 300000));
    useFocusStore.getState().completeSession();
    expect(useFocusStore.getState()).toMatchObject({ mode: 'focus', endsAt: null, remainingMs: 1500000 });
});

it('resets mode and timer without touching tasks', () => {
    const state = useFocusStore.getState();
    state.addTask('Study');
    state.start();
    state.setMode('break');
    expect(useFocusStore.getState()).toMatchObject({ endsAt: null, remainingMs: 300000, mode: 'break' });
    state.start();
    state.resetTimer();
    expect(useFocusStore.getState()).toMatchObject({ endsAt: null, remainingMs: 300000 });
    expect(useFocusStore.getState().tasks[0].text).toBe('Study');
});

it('clears tasks at local midnight while allowing an ongoing session to finish', () => {
    vi.setSystemTime(new Date(2026, 9, 17, 23, 59));
    const state = useFocusStore.getState();
    state.addTask('Yesterday');
    state.start();
    const deadline = useFocusStore.getState().endsAt;
    vi.setSystemTime(new Date(2026, 9, 18, 0, 1));
    state.refreshDay();
    expect(useFocusStore.getState().day).toBe(getFocusDay());
    expect(useFocusStore.getState().tasks).toEqual([]);
    expect(useFocusStore.getState().endsAt).toBe(deadline);
    state.addTask('Today');
    expect(useFocusStore.getState().tasks.map(task => task.text)).toEqual(['Today']);
});

it('rejects corrupt saved fields, stale tasks and injected action names', () => {
    expect(sanitizeFocusState(null)).toEqual(initialFocusState());
    expect(sanitizeFocusState({ day: 'old', tasks: [{ id: 'a', text: 'Old', done: false }], mode: 'invalid', remainingMs: -1, endsAt: 'bad', start: 'replace action' })).toEqual(initialFocusState());
    const saved = sanitizeFocusState({ day: getFocusDay(), tasks: [null, { id: 'a', text: 'Valid', done: false }, { id: 'a', text: 'Duplicate', done: true }], endsAt: Date.now() + 99999999 });
    expect(saved.tasks).toHaveLength(1);
    expect(saved.endsAt).toBeNull();
});
