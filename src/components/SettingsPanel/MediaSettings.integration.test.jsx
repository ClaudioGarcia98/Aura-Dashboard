import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MediaSettings from './MediaSettings';
import LofiPlayer from '../LofiPlayer';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { DEFAULT_SETTINGS } from '../../stores/settingsSchema';

const stations = [
    { id: 'first', videoId: 'lTRiuFIWV54', name: 'First station' },
    { id: 'second', videoId: '4xDzrJKXOOY', name: 'Second station' },
];

beforeEach(() => {
    localStorage.clear();
    useSettingsStore.setState({ ...structuredClone(DEFAULT_SETTINGS), language: 'en', lofiId: stations[0].videoId, lofiStations: structuredClone(stations) });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ title: 'Fetched station' }) }));
});

afterEach(() => {
    cleanup();
    useSettingsStore.setState(structuredClone(DEFAULT_SETTINGS));
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

function playerEvent(iframe, event, info) {
    act(() => window.dispatchEvent(new MessageEvent('message', {
        origin: 'https://www.youtube.com', source: iframe.contentWindow,
        data: JSON.stringify({ event, info }),
    })));
}

describe('station edits with the real settings store and player', () => {
    it.each([false, true])('changes the selected stream atomically, preserving play intent=%s', playing => {
        const { container } = render(<><MediaSettings /><LofiPlayer /></>);
        const oldIframe = container.querySelector('iframe');
        playerEvent(oldIframe, 'onReady');
        if (playing) {
            fireEvent.click(screen.getByRole('button', { name: 'Play' }));
            playerEvent(oldIframe, 'onStateChange', 1);
        }
        const selections = [];
        const unsubscribe = useSettingsStore.subscribe(state => selections.push({
            selected: state.lofiId, listed: state.lofiStations.some(station => station.videoId === state.lofiId),
        }));
        fireEvent.click(screen.getAllByRole('button', { name: 'Edit station' })[0]);
        fireEvent.change(screen.getByPlaceholderText('YouTube ID or URL'), { target: { value: 'https://www.youtube.com/watch?v=Gu-g8FRG4Zs' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        unsubscribe();

        expect(useSettingsStore.getState().lofiId).toBe('Gu-g8FRG4Zs');
        expect(selections).toEqual([{ selected: 'Gu-g8FRG4Zs', listed: true }]);
        const iframe = container.querySelector('iframe');
        expect(iframe).not.toBe(oldIframe);
        expect(iframe.src).toContain('/Gu-g8FRG4Zs?');
        const commands = vi.spyOn(iframe.contentWindow, 'postMessage');
        playerEvent(iframe, 'onReady');
        const started = commands.mock.calls.map(([data]) => JSON.parse(data)).some(command => command.func === 'playVideo');
        expect(started).toBe(playing);
    });

    it('rejects duplicate edits visibly and preserves both stations through hydration', async () => {
        render(<MediaSettings />);
        const before = structuredClone(useSettingsStore.getState().lofiStations);
        fireEvent.click(screen.getAllByRole('button', { name: 'Edit station' })[0]);
        fireEvent.change(screen.getByPlaceholderText('YouTube ID or URL'), { target: { value: stations[1].videoId } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        expect(screen.getByRole('alert').textContent).toBe('This station is already in your list.');
        expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
        expect(useSettingsStore.getState().lofiStations).toEqual(before);
        expect(useSettingsStore.getState().lofiId).toBe(stations[0].videoId);
        await act(() => useSettingsStore.persist.rehydrate());
        expect(useSettingsStore.getState().lofiStations).toEqual(before);
        expect(JSON.parse(localStorage.getItem('dash_settings')).state.lofiStations).toEqual(before);
    });

    it('keeps the playing iframe for a name-only edit and keeps selection when editing an inactive station', () => {
        const { container } = render(<><MediaSettings /><LofiPlayer /></>);
        const iframe = container.querySelector('iframe');
        playerEvent(iframe, 'onReady');
        fireEvent.click(screen.getByRole('button', { name: 'Play' }));
        playerEvent(iframe, 'onStateChange', 1);
        fireEvent.click(screen.getAllByRole('button', { name: 'Edit station' })[0]);
        fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: 'Renamed station' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        expect(container.querySelector('iframe')).toBe(iframe);
        expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy();
        fireEvent.click(screen.getAllByRole('button', { name: 'Edit station' })[1]);
        fireEvent.change(screen.getByPlaceholderText('YouTube ID or URL'), { target: { value: 'Gu-g8FRG4Zs' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        expect(useSettingsStore.getState().lofiId).toBe(stations[0].videoId);
        expect(container.querySelector('iframe')).toBe(iframe);
    });

    it('rejects duplicate additions before fetching and explains invalid video input', () => {
        render(<MediaSettings />);
        fireEvent.change(screen.getByPlaceholderText('YouTube ID or URL'), { target: { value: stations[0].videoId } });
        fireEvent.click(screen.getByRole('button', { name: 'Add radio station' }));
        expect(screen.getByRole('alert').textContent).toBe('This station is already in your list.');
        expect(fetch).not.toHaveBeenCalled();
        fireEvent.change(screen.getByPlaceholderText('YouTube ID or URL'), { target: { value: 'invalid' } });
        fireEvent.click(screen.getByRole('button', { name: 'Add radio station' }));
        expect(screen.getByRole('alert').textContent).toBe('Enter a valid YouTube ID or URL.');
        expect(useSettingsStore.getState().lofiStations).toEqual(stations);
    });
});
