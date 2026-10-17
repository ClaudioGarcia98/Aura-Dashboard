import { it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import TimeZoneSettings from './TimeZoneSettings';
import LanguageSettings from './LanguageSettings';
import Clock from '../Clock';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { DEFAULT_SETTINGS, sanitizeSettings } from '../../stores/settingsSchema';
import { createSettingsBackup, restoreSettingsBackup } from '../../services/settingsBackup';

beforeEach(() => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-17T23:30:00Z'));
    localStorage.clear(); useSettingsStore.setState({ ...DEFAULT_SETTINGS, language: 'en', timeZone: 'UTC' });
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

it('lists Automatic separately and each manual language and canonical time zone only once', () => {
    render(<><LanguageSettings /><TimeZoneSettings /></>);
    const languages = [...screen.getByLabelText('Language').options];
    expect(languages.find(option => option.value === 'auto').textContent).toBe('Automatic (browser language)');
    expect(languages.filter(option => option.textContent.includes('English'))).toHaveLength(1);
    const zones = [...screen.getByLabelText('Time zone').options];
    expect(zones.find(option => option.value === 'auto').textContent).toBe('Automatic — device time zone');
    const canonical = zones.filter(option => option.value !== 'auto').map(option => new Intl.DateTimeFormat('en', { timeZone: option.value }).resolvedOptions().timeZone);
    expect(new Set(canonical).size).toBe(canonical.length);
    expect(zones.filter(option => option.value === 'UTC')).toHaveLength(1);
});

it('updates clock and date immediately without changing the language, and persists the Japan toggle', async () => {
    const { container } = render(<><TimeZoneSettings /><Clock /></>);
    expect(container.querySelector('#time').textContent).toBe('23:30');
    expect(container.querySelector('#date').textContent).toContain('Saturday');
    fireEvent.change(screen.getByLabelText('Time zone'), { target: { value: 'Asia/Tokyo' } });
    expect(container.querySelector('#time').textContent).toBe('08:30');
    expect(container.querySelector('#date').textContent).toContain('Sunday');
    expect(useSettingsStore.getState().language).toBe('en');
    fireEvent.click(screen.getByLabelText('Also show Japan time (JST) for anime'));
    const saved = JSON.parse(localStorage.getItem('dash_settings')).state;
    expect(saved).toMatchObject({ timeZone: 'Asia/Tokyo', showJapanTime: false });
});

it('round-trips the time preferences in backups and rejects invalid zones', async () => {
    useSettingsStore.getState().setTimeZone('Asia/Kathmandu');
    useSettingsStore.getState().setShowJapanTime(false);
    const backup = createSettingsBackup(useSettingsStore.getState());
    useSettingsStore.getState().setTimeZone('UTC');
    restoreSettingsBackup(backup);
    await useSettingsStore.persist.rehydrate();
    expect(useSettingsStore.getState()).toMatchObject({ timeZone: 'Asia/Kathmandu', showJapanTime: false });
    expect(sanitizeSettings({ timeZone: 'invalid/zone' })).not.toHaveProperty('timeZone');
    expect(() => sanitizeSettings({ timeZone: 'invalid/zone' }, { strict: true })).toThrow();
});
