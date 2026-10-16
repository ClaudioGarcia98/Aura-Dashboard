import { afterEach, beforeEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import PrivacySettings from './PrivacySettings';
import MalConnectionStatus from './MalConnectionStatus';
import { useSettingsStore } from '../../stores/useSettingsStore';

beforeEach(() => useSettingsStore.setState({ remoteSuggestions: false, pauseBackground: false, malUsername: 'test', malStatus: 'partial', malLoading: false, malRefreshKey: 0 }));
afterEach(cleanup);

it('exposes named switches and updates their descriptions and actual preferences', () => {
    render(<PrivacySettings />);
    const suggestions = screen.getByRole('switch', { name: 'Online search suggestions' });
    expect(suggestions.checked).toBe(false);
    expect(screen.getByText('Off · Local history only')).toBeTruthy();
    fireEvent.click(suggestions);
    expect(useSettingsStore.getState().remoteSuggestions).toBe(true);
    expect(suggestions.checked).toBe(true);
    expect(screen.getByText('On · Google suggestions')).toBeTruthy();

    const motion = screen.getByRole('switch', { name: 'Pause background video' });
    fireEvent.click(motion);
    expect(useSettingsStore.getState().pauseBackground).toBe(true);
    expect(screen.getByText('On · Video paused')).toBeTruthy();
    fireEvent.click(motion);
    expect(useSettingsStore.getState().pauseBackground).toBe(false);
});

it('offers a real full-list retry for a partial result', () => {
    render(<MalConnectionStatus />);
    expect(screen.getByRole('status').textContent).toContain('may miss some watching titles');
    fireEvent.click(screen.getByRole('button', { name: 'Retry full list' }));
    expect(useSettingsStore.getState().malRefreshKey).toBe(1);
});

it('hides retry while loading and identifies complete successful syncs', () => {
    useSettingsStore.setState({ malLoading: true });
    const { rerender } = render(<MalConnectionStatus />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('status').textContent).toContain('Connecting');
    useSettingsStore.setState({ malLoading: false, malStatus: 'fresh' });
    rerender(<MalConnectionStatus />);
    expect(screen.getByRole('status').textContent).toContain('Full watching list synced');
    expect(screen.getByRole('button', { name: 'Refresh watching list' })).toBeTruthy();
});
