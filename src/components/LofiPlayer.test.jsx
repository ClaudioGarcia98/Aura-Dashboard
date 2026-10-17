import { render, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LofiPlayer from './LofiPlayer';

let mockState;

vi.mock('../stores/useSettingsStore', () => ({
    useSettingsStore: (selector) => {
        return typeof selector === 'function' ? selector(mockState) : mockState;
    },
}));

// Prevent noembed fetch in tests where title is not known
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ title: 'Fetched Title' }),
}));

beforeEach(() => {
    vi.useFakeTimers();
    mockState = {
        volume: 0.5,
        lofiId: 'testVideoId',
        lofiStations: [{ id: 1, videoId: 'testVideoId', name: 'Test Station' }],
        setLofiId: vi.fn(id => { mockState.lofiId = id; }),
    };
});

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

const message = (iframe, event, info) => act(() => window.dispatchEvent(new MessageEvent('message', {
    origin: 'https://www.youtube.com', source: iframe.contentWindow,
    data: JSON.stringify({ event, info }),
})));
const commands = spy => spy.mock.calls.map(([data]) => JSON.parse(data)).filter(data => data.event === 'command');
const setupStations = () => {
    mockState.lofiId = 'aaa';
    mockState.lofiStations = [
        { id: 1, videoId: 'aaa', name: 'Station A' },
        { id: 2, videoId: 'bbb', name: 'Station B' },
        { id: 3, videoId: 'ccc', name: 'Station C' },
    ];
};

describe('LofiPlayer', () => {
    it('renders the iframe with correct video id', () => {
        const { container } = render(<LofiPlayer />);
        const iframe = container.querySelector('iframe');
        expect(iframe.src).toContain('testVideoId');
    });

    it('displays the station name when it matches lofiId', () => {
        const { container } = render(<LofiPlayer />);
        const title = container.querySelector('.lofi-title');
        expect(title.textContent).toBe('Test Station');
    });

    it('shows Loading... initially when no station name matches lofiId', async () => {
        mockState.lofiStations = [{ id: 1, videoId: 'other', name: 'Other' }];
        let rendered;
        await act(async () => {
            rendered = render(<LofiPlayer />);
        });
        const title = rendered.container.querySelector('.lofi-title');
        expect(title.textContent).toBe('Fetched Title');
    });

    it('station menu opens when info area is clicked and stations exist', () => {
        const { container } = render(<LofiPlayer />);
        fireEvent.click(container.querySelector('.lofi-info'));
        expect(container.querySelector('.lofi-station-menu')).toBeTruthy();
    });

    it('station menu does not open when lofiStations is empty', async () => {
        mockState.lofiStations = [];
        let rendered;
        await act(async () => {
            rendered = render(<LofiPlayer />);
        });
        fireEvent.click(rendered.container.querySelector('.lofi-info'));
        expect(rendered.container.querySelector('.lofi-station-menu')).toBeNull();
    });

    it('station menu lists all stations', () => {
        mockState.lofiStations = [
            { id: 1, videoId: 'aaa', name: 'Station A' },
            { id: 2, videoId: 'bbb', name: 'Station B' },
        ];
        mockState.lofiId = 'aaa';
        const { container } = render(<LofiPlayer />);
        fireEvent.click(container.querySelector('.lofi-info'));
        expect(container.querySelectorAll('.lofi-station-btn')).toHaveLength(2);
    });

    it('active station button has the active class', () => {
        const { container } = render(<LofiPlayer />);
        fireEvent.click(container.querySelector('.lofi-info'));
        const activeBtn = container.querySelector('.lofi-station-btn.active');
        expect(activeBtn).toBeTruthy();
        expect(activeBtn.textContent).toContain('Test Station');
    });

    it('clicking a station button calls setLofiId with the station videoId', () => {
        mockState.lofiStations = [
            { id: 1, videoId: 'aaa', name: 'Station A' },
            { id: 2, videoId: 'bbb', name: 'Station B' },
        ];
        mockState.lofiId = 'aaa';
        const { container } = render(<LofiPlayer />);
        fireEvent.click(container.querySelector('.lofi-info'));
        const buttons = container.querySelectorAll('.lofi-station-btn');
        fireEvent.click(buttons[1]);
        expect(mockState.setLofiId).toHaveBeenCalledWith('bbb');
    });

    it('station menu closes after selecting a station', () => {
        const { container } = render(<LofiPlayer />);
        fireEvent.click(container.querySelector('.lofi-info'));
        expect(container.querySelector('.lofi-station-menu')).toBeTruthy();
        fireEvent.click(container.querySelector('.lofi-station-btn'));
        expect(container.querySelector('.lofi-station-menu')).toBeNull();
    });

    it('renders a play button', () => {
        const { container } = render(<LofiPlayer />);
        expect(container.querySelector('.lofi-play-btn')).toBeTruthy();
    });

    it('ignores another YouTube iframe and accepts only its own player state', () => {
        const { container, getByLabelText } = render(<LofiPlayer />);
        const iframe = container.querySelector('iframe');
        const data = JSON.stringify({ event: 'onStateChange', info: 1 });
        act(() => window.dispatchEvent(new MessageEvent('message', { origin: 'https://www.youtube.com', source: window, data })));
        expect(getByLabelText('Play')).toBeTruthy();
        act(() => window.dispatchEvent(new MessageEvent('message', { origin: 'https://www.youtube.com', source: iframe.contentWindow, data })));
        expect(getByLabelText('Pause')).toBeTruthy();
    });

    it('does not claim to be playing until the iframe confirms playback', async () => {
        vi.useFakeTimers();
        try {
            const onPlayingChange = vi.fn();
            const { getByLabelText, getByRole } = render(<LofiPlayer onPlayingChange={onPlayingChange} />);
            fireEvent.click(getByLabelText('Play'));
            expect(getByLabelText('Pause')).toBeTruthy();
            expect(onPlayingChange).toHaveBeenLastCalledWith(false);
            await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
            expect(getByRole('status').textContent).toContain('Playback did not start');
        } finally { vi.useRealTimers(); }
    });

    it('queues an early Play until YouTube is ready and reapplies volume', () => {
        const { container, getByLabelText } = render(<LofiPlayer />);
        const iframe = container.querySelector('iframe');
        const post = vi.spyOn(iframe.contentWindow, 'postMessage');
        fireEvent.click(getByLabelText('Play'));
        fireEvent.load(iframe);
        expect(commands(post).some(c => c.func === 'playVideo')).toBe(false);
        message(iframe, 'onReady');
        expect(commands(post)).toContainEqual({ event: 'command', func: 'setVolume', args: [50] });
        expect(commands(post).filter(c => c.func === 'playVideo')).toHaveLength(1);
        message(iframe, 'onStateChange', 1);
        expect(getByLabelText('Pause')).toBeTruthy();
    });

    it('cancels pending playback on a second click and ignores a late playing acknowledgement', async () => {
        const { container, getByLabelText, queryByRole } = render(<LofiPlayer />);
        const iframe = container.querySelector('iframe');
        const post = vi.spyOn(iframe.contentWindow, 'postMessage');
        fireEvent.click(getByLabelText('Play'));
        fireEvent.click(getByLabelText('Pause'));
        message(iframe, 'onReady');
        message(iframe, 'onStateChange', 1);
        expect(getByLabelText('Play')).toBeTruthy();
        expect(commands(post).some(c => c.func === 'playVideo')).toBe(false);
        expect(commands(post).some(c => c.func === 'pauseVideo')).toBe(true);
        await act(async () => { await vi.advanceTimersByTimeAsync(6000); });
        expect(queryByRole('status')).toBeNull();
    });

    it('pauses and resumes the same iframe without seeking back to the beginning', () => {
        const { container, getByLabelText } = render(<LofiPlayer />);
        const iframe = container.querySelector('iframe');
        const post = vi.spyOn(iframe.contentWindow, 'postMessage');
        message(iframe, 'onReady');
        fireEvent.click(getByLabelText('Play'));
        message(iframe, 'onStateChange', 1);
        fireEvent.click(getByLabelText('Pause'));
        message(iframe, 'onStateChange', 2);
        fireEvent.click(getByLabelText('Play'));
        expect(container.querySelector('iframe')).toBe(iframe);
        expect(commands(post).filter(c => c.func === 'playVideo')).toHaveLength(2);
        expect(commands(post).some(c => c.func === 'seekTo')).toBe(false);
    });

    it('reconnects to player readiness when retrying a timed-out start', async () => {
        const { container, getByLabelText, getByRole, queryByRole } = render(<LofiPlayer />);
        const iframe = container.querySelector('iframe');
        const post = vi.spyOn(iframe.contentWindow, 'postMessage');
        fireEvent.click(getByLabelText('Play'));
        await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
        expect(getByRole('status').textContent).toContain('Playback did not start');
        post.mockClear();
        fireEvent.click(getByLabelText('Play'));
        expect(post.mock.calls.map(([data]) => JSON.parse(data))).toContainEqual({ event: 'listening' });
        message(iframe, 'onReady');
        message(iframe, 'onStateChange', 1);
        expect(commands(post).some(c => c.func === 'playVideo')).toBe(true);
        expect(queryByRole('status')).toBeNull();
        expect(getByLabelText('Pause')).toBeTruthy();
    });

    it.each([false, true])('starts a new station from zero in compact=%s even when previously paused', compact => {
        setupStations();
        const { container, getByText } = render(<LofiPlayer compact={compact} expanded />);
        const oldIframe = container.querySelector('iframe');
        if (!compact) fireEvent.click(container.querySelector('.lofi-info'));
        fireEvent.click(getByText('Station B'));
        const iframe = container.querySelector('iframe');
        const post = vi.spyOn(iframe.contentWindow, 'postMessage');
        expect(iframe).not.toBe(oldIframe);
        expect(iframe.src).toContain('/bbb?');
        expect(iframe.src).toContain('start=0');
        fireEvent.load(iframe);
        message(iframe, 'onReady');
        expect(commands(post).filter(c => ['seekTo', 'playVideo'].includes(c.func))).toEqual([
            { event: 'command', func: 'seekTo', args: [0, true] },
            { event: 'command', func: 'playVideo', args: [] },
        ]);
    });

    it('keeps play intent through rapid station switches and rejects old iframe events', () => {
        setupStations();
        const { container, getByText, getByLabelText } = render(<LofiPlayer compact expanded />);
        const oldIframe = container.querySelector('iframe');
        message(oldIframe, 'onStateChange', 1);
        fireEvent.click(getByText('Station B'));
        fireEvent.click(getByText('Station C'));
        const iframe = container.querySelector('iframe');
        const post = vi.spyOn(iframe.contentWindow, 'postMessage');
        message(oldIframe, 'onError', 100);
        message(iframe, 'onReady');
        message(iframe, 'onStateChange', 1);
        expect(iframe.src).toContain('/ccc?');
        expect(getByLabelText('Pause')).toBeTruthy();
        expect(commands(post).some(c => c.func === 'playVideo')).toBe(true);
    });

    it('restarts the active station when selected again', () => {
        const { container, getByText } = render(<LofiPlayer compact expanded />);
        const oldIframe = container.querySelector('iframe');
        message(oldIframe, 'onStateChange', 1);
        fireEvent.click(getByText('Test Station', { selector: '.lofi-station-btn span' }));
        const iframe = container.querySelector('iframe');
        const post = vi.spyOn(iframe.contentWindow, 'postMessage');
        expect(iframe).not.toBe(oldIframe);
        message(iframe, 'onReady');
        expect(commands(post).some(c => c.func === 'seekTo' && c.args[0] === 0)).toBe(true);
    });

    it('clears a failed station error on selection and reports autoplay blocking', () => {
        setupStations();
        const { container, getByText, getByRole, queryByRole, getByLabelText } = render(<LofiPlayer compact expanded />);
        message(container.querySelector('iframe'), 'onError', 100);
        expect(getByRole('status').textContent).toContain('unavailable');
        fireEvent.click(getByText('Station B'));
        expect(queryByRole('status')).toBeNull();
        message(container.querySelector('iframe'), 'onAutoplayBlocked');
        expect(getByRole('status').textContent).toContain('Press Play');
        expect(getByLabelText('Play')).toBeTruthy();
    });

    it('keeps music mounted when switching compact tabs and clears timers on unmount', async () => {
        const { container, rerender, unmount } = render(<LofiPlayer compact expanded />);
        const iframe = container.querySelector('iframe');
        fireEvent.load(iframe);
        rerender(<LofiPlayer compact expanded={false} />);
        expect(container.querySelector('iframe')).toBe(iframe);
        expect(vi.getTimerCount()).toBeGreaterThan(0);
        unmount();
        await act(async () => { await vi.advanceTimersByTimeAsync(0); });
        expect(vi.getTimerCount()).toBe(0);
    });
});
