import { render, screen, fireEvent, act } from '@testing-library/react';
import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import FocusWidget from './FocusWidget';
import { initialFocusState, useFocusStore } from '../stores/useFocusStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useFocusSession } from '../hooks/useFocusSession';
import { prepareFocusChime, playFocusChime } from '../services/focusChime';

vi.mock('../services/focusChime', () => ({ prepareFocusChime: vi.fn(), playFocusChime: vi.fn() }));

function FocusHarness({ enabled = true }) {
    useFocusSession(enabled);
    return enabled ? <FocusWidget /> : null;
}
beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 17, 12));
    localStorage.clear();
    useFocusStore.setState(initialFocusState());
    useSettingsStore.setState({ volume: 0.3 });
    vi.clearAllMocks();
});
afterEach(() => vi.useRealTimers());

it('adds, completes and removes tasks with keyboard-accessible form controls', () => {
    render(<FocusWidget />);
    fireEvent.change(screen.getByLabelText('New focus task'), { target: { value: 'Study Japanese' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add focus task' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Study Japanese' }));
    expect(screen.getByText('1/1 done')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Remove task: Study Japanese' }));
    expect(screen.queryByRole('checkbox')).toBeNull();
});

it('enforces three tasks in the UI', () => {
    for (const text of ['One', 'Two', 'Three']) useFocusStore.getState().addTask(text);
    render(<FocusWidget />);
    expect(screen.queryByLabelText('New focus task')).toBeNull();
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    fireEvent.click(screen.getByRole('button', { name: 'Remove task: Two' }));
    expect(screen.getByLabelText('New focus task')).toBeTruthy();
});

it('dims only an active focus session and keeps pause, resume, break and reset in sync', async () => {
    render(<FocusHarness />);
    expect(screen.getByRole('timer').textContent).toBe('25:00');
    fireEvent.click(screen.getByRole('button', { name: 'Start focus' }));
    expect(prepareFocusChime).toHaveBeenCalled();
    expect(document.body.classList.contains('focus-session-active')).toBe(true);
    await act(async () => { await vi.advanceTimersByTimeAsync(10000); });
    expect(screen.getByRole('timer').textContent).toBe('24:50');
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(document.body.classList.contains('focus-session-active')).toBe(false);
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(screen.getByRole('timer').textContent).toBe('24:50');
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
    expect(document.body.classList.contains('focus-session-active')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Break 5 min' }));
    expect(screen.getByRole('timer').textContent).toBe('05:00');
    fireEvent.click(screen.getByRole('button', { name: 'Start break' }));
    expect(document.body.classList.contains('focus-session-active')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Reset timer' }));
    expect(screen.getByRole('button', { name: 'Start break' })).toBeTruthy();
});

it('catches up on window focus, chimes once and waits for an explicit break start', async () => {
    render(<FocusHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'Start focus' }));
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    vi.setSystemTime(new Date(Date.now() + 26 * 60000));
    fireEvent.focus(window);
    expect(screen.getByRole('timer').textContent).toBe('05:00');
    expect(screen.getByRole('status').textContent).toContain('Focus complete');
    expect(screen.getByRole('button', { name: 'Start break' })).toBeTruthy();
    expect(document.body.classList.contains('focus-session-active')).toBe(false);
    expect(playFocusChime).toHaveBeenCalledExactlyOnceWith(0.3);
    fireEvent.focus(window);
    await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
    expect(playFocusChime).toHaveBeenCalledTimes(1);
});

it('respects the completion chime toggle and pauses if the widget is hidden', async () => {
    const { rerender } = render(<FocusHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'Completion chime' }));
    fireEvent.click(screen.getByRole('button', { name: 'Start focus' }));
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    rerender(<FocusHarness enabled={false} />);
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(useFocusStore.getState().endsAt).toBeNull();
    expect(useFocusStore.getState().remainingMs).toBe(1499000);
    expect(document.body.classList.contains('focus-session-active')).toBe(false);
    expect(playFocusChime).not.toHaveBeenCalled();
});

it('refreshes the daily list at midnight and keeps the timer running', async () => {
    vi.setSystemTime(new Date(2026, 9, 17, 23, 59, 59));
    useFocusStore.getState().addTask('Yesterday');
    render(<FocusHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'Start focus' }));
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(useFocusStore.getState().endsAt).not.toBeNull();
});

it('completes and chimes even if Pause is pressed just after the deadline', async () => {
    render(<FocusHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'Start focus' }));
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    vi.setSystemTime(new Date(Date.now() + 1500001));
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(screen.getByRole('button', { name: 'Start break' })).toBeTruthy();
    expect(playFocusChime).toHaveBeenCalledTimes(1);
});

it('finishes a muted focus session and its break without a chime or automatic restart', async () => {
    render(<FocusHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'Completion chime' }));
    fireEvent.click(screen.getByRole('button', { name: 'Start focus' }));
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    vi.setSystemTime(new Date(Date.now() + 1500000));
    fireEvent.focus(window);
    expect(screen.getByRole('button', { name: 'Start break' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Start break' }));
    vi.setSystemTime(new Date(Date.now() + 300000));
    fireEvent.focus(window);
    expect(screen.getByRole('timer').textContent).toBe('25:00');
    expect(screen.getByRole('status').textContent).toContain('Break complete');
    expect(screen.getByRole('button', { name: 'Start focus' })).toBeTruthy();
    expect(playFocusChime).not.toHaveBeenCalled();
});
