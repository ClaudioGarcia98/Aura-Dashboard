import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LANGUAGES, resolveLocale, translate, weekday, formatDuration, plural, errorMessage } from './core';
import { catalogs } from './messages';
import { quoteTranslations } from './quotes';
import { useDocumentLanguage } from './useTranslation';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useFocusStore, initialFocusState } from '../stores/useFocusStore';
import { sanitizeSettings } from '../stores/settingsSchema';
import { createSettingsBackup, parseSettingsBackup } from '../services/settingsBackup';
import LanguageSettings from '../components/SettingsPanel/LanguageSettings';
import ThemeSettings from '../components/SettingsPanel/ThemeSettings';
import FocusWidget from '../components/FocusWidget';
import Clock from '../components/Clock';
import Greeting from '../components/Greeting';
import WeatherWidget from '../components/WeatherWidget';
import EmbeddedAnimeList from '../components/AnimeSchedule/EmbeddedAnimeList';
import Quote from '../components/Quote';

vi.mock('../hooks/useWeather', () => ({ useWeather: () => ({ weather: {
    temp: '18°C', feelsLike: '17°C', humidity: '65%', wind: '12 km/h', weatherCode: 3, iconType: 'cloud', sunrise: '07:00', sunset: '18:30',
    timestamp: Date.now(), locationSource: 'gps',
    forecast: [{ day: 'Mon', date: '2026-10-19', max: 20, min: 12, iconType: 'sun' }],
} }) }));

beforeEach(() => {
    useSettingsStore.setState({ language: 'en', username: 'ユーザー', clockMode: 'digital', use24hClock: true, theme: 'aurora' });
    useFocusStore.setState(initialFocusState());
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe('language detection and catalog integrity', () => {
    it('detects supported regional languages and tries later browser preferences', () => {
        expect(resolveLocale('auto', ['zh-CN', 'fr-CA'])).toBe('fr');
        expect(resolveLocale('auto', ['pt-BR', 'en'])).toBe('pt-BR');
        expect(resolveLocale('auto', ['pt-BR-u-nu-latn'])).toBe('pt-BR');
        expect(resolveLocale('auto', ['pt-AO'])).toBe('pt-PT');
        expect(resolveLocale('auto', ['ko-KR'])).toBe('ko');
        expect(resolveLocale('pt-PT', ['pt-BR'])).toBe('pt-PT');
        expect(resolveLocale('invalid', [null, 'unknown'])).toBe('en');
        expect(resolveLocale('auto', [])).toBe('en');
    });
    it.each(Object.keys(catalogs))('has complete text and preserved placeholders for %s', locale => {
        expect(Object.keys(catalogs[locale]).sort()).toEqual(Object.keys(catalogs.de).sort());
        for (const [key, text] of Object.entries(catalogs[locale])) {
            expect(text.trim(), key).not.toBe('');
            const placeholders = value => [...value.matchAll(/\{\w+\}/g)].map(match => match[0]).sort();
            expect(placeholders(text), key).toEqual(key.startsWith('stations.') ? ['{count}'] : placeholders(key));
        }
        expect(quoteTranslations[locale]).toHaveLength(30);
        expect(quoteTranslations[locale].every(text => text.trim().length > 10)).toBe(true);
    });
    it('falls back to English without interpreting interpolation as HTML or replacement syntax', () => {
        expect(translate('ja', 'An untranslated future message')).toBe('An untranslated future message');
        expect(translate('ja', 'constructor')).toBe('constructor');
        expect(translate('unsupported', 'Weather')).toBe('Weather');
        expect(translate('de', 'Hello, {name}', { name: '<img src=x>$&' })).toBe('Hallo, <img src=x>$&');
        expect(errorMessage('ja', 'Invalid setting: language')).toBe(catalogs.ja['The backup contains invalid or unsupported settings.']);
        expect(errorMessage('ko', 'Unknown backend exception')).toBe(catalogs.ko['Something went wrong. Please try again.']);
    });
    it('formats plurals, durations and weekdays for the selected locale', () => {
        expect(plural('en', 'stations', 1)).toBe('1 Lofi station');
        expect(plural('en', 'stations', 2)).toBe('2 Lofi stations');
        expect(plural('ja', 'stations', 2)).toBe('Lofiステーション 2件');
        expect(formatDuration('ja', '1d 2h 3m')).toBe('1 日 2 時間 3 分');
        expect(weekday('ja', 'monday')).toBe('月');
        expect(weekday('de', 'sunday', 'long')).toBe('Sonntag');
    });
});

function DashboardSample() {
    useDocumentLanguage();
    return <><LanguageSettings /><Greeting /><Clock /><FocusWidget /><ThemeSettings /><WeatherWidget inline />
        <EmbeddedAnimeList activeDay="monday" setActiveDay={() => {}} sidebarData={[]} sidebarLoading={false} userWatchingIds={[]} />
    </>;
}

describe('language selection across the dashboard', () => {
    it.each(Object.keys(LANGUAGES))('switches the interface, dates, accessibility labels and persisted choice to %s', locale => {
        useFocusStore.getState().addTask('Keep my task: 日本語, ação, café');
        const { container } = render(<DashboardSample />);
        fireEvent.change(screen.getByRole('combobox', { name: 'Language' }), { target: { value: locale } });
        expect(document.documentElement.lang).toBe(locale);
        expect(screen.getByRole('combobox', { name: translate(locale, 'Language') }).value).toBe(locale);
        expect(screen.getByRole('heading', { name: translate(locale, "Today's Focus") })).toBeTruthy();
        expect(screen.getByRole('button', { name: translate(locale, 'Start focus') })).toBeTruthy();
        expect(screen.getByText(translate(locale, 'Cloudy'))).toBeTruthy();
        expect(screen.getByRole('button', { name: weekday(locale, 'monday', 'long') })).toBeTruthy();
        expect(within(screen.getByRole('group', { name: translate(locale, 'Themes') })).getAllByRole('button')).toHaveLength(9);
        expect(screen.getByText('Keep my task: 日本語, ação, café')).toBeTruthy();
        expect(container.querySelector('#date').textContent).toBe(new Date().toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
        expect(container.querySelector('#greeting').textContent).toContain('ユーザー');
        expect(JSON.parse(localStorage.getItem('dash_settings')).state.language).toBe(locale);
    });
    it('updates automatic mode when the browser language changes, but preserves explicit choices', () => {
        const languages = vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['de-DE']);
        useSettingsStore.setState({ language: 'auto' });
        render(<DashboardSample />);
        expect(document.documentElement.lang).toBe('de');
        languages.mockReturnValue(['ja-JP']);
        act(() => window.dispatchEvent(new Event('languagechange')));
        expect(document.documentElement.lang).toBe('ja');
        act(() => useSettingsStore.getState().setLanguage('pt-BR'));
        languages.mockReturnValue(['ko-KR']);
        act(() => window.dispatchEvent(new Event('languagechange')));
        expect(document.documentElement.lang).toBe('pt-BR');
    });
    it('accepts only supported preferences and includes language in full settings backups', () => {
        expect(sanitizeSettings({ language: 'unsupported' })).toEqual({});
        expect(() => sanitizeSettings({ language: 'unsupported' }, { strict: true })).toThrow();
        expect(parseSettingsBackup(createSettingsBackup({ language: 'pt-BR' })).language).toBe('pt-BR');
        expect(parseSettingsBackup('{"format":"aura-settings","version":1,"settings":{}}').language).toBe('auto');
    });
    it('restores the language preference from persisted settings after hydration', async () => {
        useSettingsStore.getState().setLanguage('ja');
        const saved = localStorage.getItem('dash_settings');
        useSettingsStore.setState({ language: 'en' });
        localStorage.setItem('dash_settings', saved);
        await useSettingsStore.persist.rehydrate();
        expect(useSettingsStore.getState().language).toBe('ja');
    });
    it('localizes quotes without remote translation and keeps working when language changes during a transition', async () => {
        vi.useFakeTimers();
        vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValue(0.1);
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('No network'));
        useSettingsStore.setState({ language: 'ja' });
        const { container } = render(<Quote />);
        expect(container.querySelector('.quote-text').textContent).toContain(quoteTranslations.ja[0]);
        fireEvent.click(screen.getByRole('button', { name: catalogs.ja['Click for a new quote'] }));
        act(() => useSettingsStore.getState().setLanguage('ko'));
        await act(async () => { await vi.advanceTimersByTimeAsync(250); });
        expect(container.querySelector('.quote-text').textContent).toContain(quoteTranslations.ko[3]);
        expect(container.querySelector('#quote-container').style.opacity).toBe('1');
        expect(fetchSpy).not.toHaveBeenCalled();
    });
});
