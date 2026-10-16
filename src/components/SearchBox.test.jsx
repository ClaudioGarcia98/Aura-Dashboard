import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SearchBox from './SearchBox';

let mockSettings;

vi.mock('../stores/useSettingsStore', () => ({
    useSettingsStore: vi.fn((selector) => {
        return typeof selector === 'function' ? selector(mockSettings) : mockSettings;
    }),
}));

describe('SearchBox', () => {
    beforeEach(() => {
        localStorage.clear();
        mockSettings = {
            customEngines: [],
            speedDials: [],
            setSpeedDials: vi.fn(),
        };
        vi.stubGlobal('open', vi.fn());
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    it('updates query on input', () => {
        render(<SearchBox />);
        const input = screen.getByPlaceholderText(/Let's search something/i);
        fireEvent.change(input, { target: { value: 'test query' } });
        expect(input.value).toBe('test query');
    });

    it('detects engine prefix and switches active engine', () => {
        render(<SearchBox />);
        const input = screen.getByPlaceholderText(/Let's search something/i);
        fireEvent.change(input, { target: { value: 'yt something' } });

        expect(input.value).toBe('something');
        expect(screen.getByText('YouTube')).toBeTruthy();
    });

    it('removes active engine badge on Backspace when query is empty', () => {
        render(<SearchBox />);
        const input = screen.getByPlaceholderText(/Let's search something/i);

        // Switch to GitHub engine prefix
        fireEvent.change(input, { target: { value: 'gh ' } });
        expect(screen.getByText('GitHub')).toBeTruthy();

        // Hit backspace on empty query
        fireEvent.keyDown(input, { key: 'Backspace' });
        expect(screen.queryByText('GitHub')).toBeNull();
    });

    it('submits search on form submit and records in recent searches', () => {
        const { container } = render(<SearchBox />);
        const input = screen.getByPlaceholderText(/Let's search something/i);
        const form = container.querySelector('#searchForm');

        fireEvent.change(input, { target: { value: 'react testing' } });
        fireEvent.submit(form);

        expect(window.open).toHaveBeenCalledWith(
            expect.stringContaining('google.com/search?q=react%20testing'),
            '_blank', 'noopener,noreferrer'
        );

        // Check recent searches in localStorage
        const stored = JSON.parse(localStorage.getItem('dash_recent'));
        expect(stored[0].query).toBe('react testing');
    });

    it('closes suggestions when Escape is pressed', () => {
        const { container } = render(<SearchBox />);
        const input = screen.getByPlaceholderText(/Let's search something/i);
        fireEvent.change(input, { target: { value: 'abc' } });

        const suggestionsList = container.querySelector('.suggestions-list');
        expect(suggestionsList).toBeTruthy();

        fireEvent.keyDown(input, { key: 'Escape' });
        expect(suggestionsList.style.display).toBe('none');
    });

    it('adds a data-only remote suggestion to speed dials when suggestions are enabled', async () => {
        const existingDials = [{ id: 1, name: 'Google', url: 'https://google.com' }];
        const setSpeedDials = vi.fn();

        mockSettings = { customEngines: [], speedDials: existingDials, setSpeedDials, remoteSuggestions: true };
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ['git', ['github.com', 'gitlab.com']] }));

        render(<SearchBox />);
        const input = screen.getByPlaceholderText(/Let's search something/i);
        fireEvent.change(input, { target: { value: 'git' } });

        const addBtns = await screen.findAllByTitle('Add to Speed Dial');
        fireEvent.click(addBtns[0]);

        expect(setSpeedDials).toHaveBeenCalledOnce();
        const arg = setSpeedDials.mock.calls[0][0];
        expect(Array.isArray(arg)).toBe(true);
        expect(arg).toHaveLength(existingDials.length + 1);
        expect(typeof arg[arg.length - 1].url).toBe('string');
    });

    it('navigates multiple recent items by keyboard and replays the saved URL', () => {
        localStorage.setItem('dash_recent', JSON.stringify([
            { query: 'github.com', url: 'https://github.com/', engineName: 'Google' },
            { query: 'docs', url: 'https://react.dev/', engineName: 'Google' },
        ]));
        const { container } = render(<SearchBox />);
        const input = screen.getByRole('combobox');
        fireEvent.focus(input);
        fireEvent.keyDown(input, { key: 'ArrowDown' });
        fireEvent.keyDown(input, { key: 'ArrowDown' });
        expect(input.value).toBe('');
        expect(container.querySelectorAll('[aria-selected="true"]')[0].textContent).toContain('docs');
        fireEvent.submit(container.querySelector('form'));
        expect(window.open).toHaveBeenCalledWith('https://react.dev/', '_blank', 'noopener,noreferrer');
    });

    it('replays direct-address history clicks without converting them to searches', () => {
        localStorage.setItem('dash_recent', JSON.stringify([{ query: 'github.com', url: 'https://github.com/', engineName: 'Google' }]));
        render(<SearchBox />);
        fireEvent.focus(screen.getByRole('combobox'));
        fireEvent.click(screen.getByText('Google: github.com'));
        expect(window.open).toHaveBeenCalledWith('https://github.com/', '_blank', 'noopener,noreferrer');
    });

    it('keeps typed text local by default and never injects executable suggestion scripts', async () => {
        vi.useFakeTimers();
        vi.stubGlobal('fetch', vi.fn());
        render(<SearchBox />);
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'private draft' } });
        await act(async () => { await vi.advanceTimersByTimeAsync(500); });
        expect(fetch).not.toHaveBeenCalled();
        expect(document.querySelector('#gss')).toBeNull();
    });
});
