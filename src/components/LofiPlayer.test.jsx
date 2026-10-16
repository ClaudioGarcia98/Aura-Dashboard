import { render, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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
    mockState = {
        volume: 0.5,
        lofiId: 'testVideoId',
        lofiStations: [{ id: 1, videoId: 'testVideoId', name: 'Test Station' }],
        setLofiId: vi.fn(),
    };
});

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
            const { getByLabelText, getByRole } = render(<LofiPlayer />);
            fireEvent.click(getByLabelText('Play'));
            expect(getByLabelText('Play')).toBeTruthy();
            await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
            expect(getByRole('status').textContent).toContain('Playback did not start');
        } finally { vi.useRealTimers(); }
    });
});
