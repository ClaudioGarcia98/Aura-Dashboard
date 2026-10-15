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
            '_blank'
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

    it('calls setSpeedDials with an array (not a function) when adding a suggestion', async () => {
        const existingDials = [{ id: 1, name: 'Google', url: 'https://google.com' }];
        const setSpeedDials = vi.fn();

        mockSettings = { customEngines: [], speedDials: existingDials, setSpeedDials };

        render(<SearchBox />);
        const input = screen.getByPlaceholderText(/Let's search something/i);
        fireEvent.change(input, { target: { value: 'git' } });

        // fetchSuggestions registers a JSONP callback in window — invoke it manually
        const cbKey = Object.keys(window).find(
            k => k.startsWith('gsCb_') && typeof window[k] === 'function'
        );
        expect(cbKey).toBeDefined();
        act(() => window[cbKey]([null, ['github.com', 'gitlab.com']]));

        const addBtns = await screen.findAllByTitle('Add to Speed Dial');
        fireEvent.click(addBtns[0]);

        expect(setSpeedDials).toHaveBeenCalledOnce();
        const arg = setSpeedDials.mock.calls[0][0];
        expect(Array.isArray(arg)).toBe(true);
        expect(arg).toHaveLength(existingDials.length + 1);
        expect(typeof arg[arg.length - 1].url).toBe('string');
    });
});
