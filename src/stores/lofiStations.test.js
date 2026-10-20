import { beforeEach, expect, it } from 'vitest';
import { useSettingsStore } from './useSettingsStore';
import { DEFAULT_SETTINGS } from './settingsSchema';

beforeEach(() => { localStorage.clear(); useSettingsStore.setState(structuredClone(DEFAULT_SETTINGS)); });

it('updates the active station video and selected ID together, preserving volume and playback-independent preferences', () => {
    const { lofiStations, setLofiId, updateLofiStation } = useSettingsStore.getState();
    setLofiId(lofiStations[0].videoId);
    const changes = [];
    const unsubscribe = useSettingsStore.subscribe(state => changes.push({ selected: state.lofiId, videos: state.lofiStations.map(s => s.videoId) }));
    expect(updateLofiStation(lofiStations[0].id, { videoId: 'dQw4w9WgXcQ', name: 'New stream' })).toBe(true);
    unsubscribe();
    expect(changes).toEqual([{ selected: 'dQw4w9WgXcQ', videos: ['dQw4w9WgXcQ', ...lofiStations.slice(1).map(s => s.videoId)] }]);
    expect(useSettingsStore.getState().volume).toBe(DEFAULT_SETTINGS.volume);
});

it('rejects duplicate edits/additions without losing station names or changing state after hydration', async () => {
    const original = useSettingsStore.getState();
    expect(original.updateLofiStation(original.lofiStations[0].id, { videoId: original.lofiStations[1].videoId, name: 'Duplicate' })).toBe(false);
    expect(original.addLofiStation({ id: 'new', videoId: original.lofiStations[0].videoId, name: 'Duplicate' })).toBe(false);
    expect(useSettingsStore.getState()).toBe(original);
    await useSettingsStore.persist.rehydrate();
    expect(useSettingsStore.getState().lofiStations).toEqual(original.lofiStations);
});

it('keeps selection during inactive or name-only edits and rejects invalid or missing entries', () => {
    const state = useSettingsStore.getState();
    expect(state.updateLofiStation(state.lofiStations[0].id, { videoId: 'dQw4w9WgXcQ', name: 'Inactive' })).toBe(true);
    expect(useSettingsStore.getState().lofiId).toBe(state.lofiId);
    expect(state.updateLofiStation(state.lofiStations.at(-1).id, { name: 'New name' })).toBe(true);
    expect(useSettingsStore.getState().lofiId).toBe(state.lofiId);
    for (const patch of [{ videoId: 'invalid' }, { name: 'x'.repeat(501) }, { name: null }]) {
        expect(state.updateLofiStation(state.lofiStations[0].id, patch)).toBe(false);
    }
    expect(state.updateLofiStation('missing', { name: 'Nothing' })).toBe(false);
});

it('validates new IDs, normalizes video URLs, and chooses a valid fallback on deletion', () => {
    const state = useSettingsStore.getState();
    expect(state.addLofiStation({ id: 'new', videoId: 'https://youtu.be/dQw4w9WgXcQ', name: '' })).toBe(true);
    expect(useSettingsStore.getState().lofiStations.at(-1).videoId).toBe('dQw4w9WgXcQ');
    expect(state.addLofiStation({ id: 'new', videoId: 'a1b2c3d4e5f', name: 'Duplicate ID' })).toBe(false);
    expect(state.addLofiStation({ id: {}, videoId: 'a1b2c3d4e5f', name: 'Bad ID' })).toBe(false);
    state.setLofiId('dQw4w9WgXcQ');
    expect(state.removeLofiStation('new')).toBe(true);
    expect(useSettingsStore.getState().lofiId).toBe(state.lofiStations[0].videoId);
    expect(state.removeLofiStation('missing')).toBe(false);
});
