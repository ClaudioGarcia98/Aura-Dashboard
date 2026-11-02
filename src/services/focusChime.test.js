import { beforeEach, afterEach, expect, it, vi } from 'vitest';

beforeEach(() => { vi.resetModules(); localStorage.clear(); });
afterEach(() => vi.unstubAllGlobals());

it('only enables audio through the user gesture and honors mute', async () => {
    const oscillator = { frequency: {}, connect: vi.fn(), start: vi.fn(), stop: vi.fn(), disconnect: vi.fn() };
    const gain = { gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn(), disconnect: vi.fn() };
    const audio = { state: 'running', currentTime: 0, destination: {}, createOscillator: vi.fn(() => oscillator), createGain: vi.fn(() => gain) };
    const Constructor = vi.fn(function () { return audio; });
    vi.stubGlobal('AudioContext', Constructor);
    const { prepareFocusChime, playFocusChime } = await import('./focusChime');
    playFocusChime(0.3);
    expect(Constructor).not.toHaveBeenCalled();
    prepareFocusChime();
    playFocusChime(0);
    expect(audio.createOscillator).not.toHaveBeenCalled();
    playFocusChime(0.3);
    expect(audio.createOscillator).toHaveBeenCalledTimes(2);
    expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.036, expect.any(Number));
    expect(oscillator.start).toHaveBeenCalled();
    expect(oscillator.stop).toHaveBeenCalled();
});

it('handles denied audio access without interrupting focus sessions', async () => {
    vi.stubGlobal('AudioContext', vi.fn(function () { throw new Error('Audio denied'); }));
    const { prepareFocusChime, playFocusChime } = await import('./focusChime');
    expect(() => { prepareFocusChime(); playFocusChime(); }).not.toThrow();
});

it('serializes two audio-enabled tabs so a shared session chimes once', async () => {
    const oscillator = { frequency: {}, connect: vi.fn(), start: vi.fn(), stop: vi.fn() };
    const gain = { gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn() };
    const audio = { state: 'running', currentTime: 0, destination: {}, createOscillator: vi.fn(() => oscillator), createGain: vi.fn(() => gain) };
    vi.stubGlobal('AudioContext', vi.fn(function () { return audio; }));
    let queue = Promise.resolve();
    const request = vi.fn((name, callback) => { queue = queue.then(callback); return queue; });
    vi.stubGlobal('navigator', { locks: { request } });
    const firstTab = await import('./focusChime');
    vi.resetModules();
    const secondTab = await import('./focusChime');
    // A tab without a user gesture cannot claim a completion it cannot play.
    firstTab.playFocusChime(0.3, 'focus:123');
    expect(localStorage.getItem('dash_focus_chime_v1')).toBeNull();
    firstTab.prepareFocusChime();
    secondTab.prepareFocusChime();
    await Promise.all([firstTab.playFocusChime(0.3, 'focus:123'), secondTab.playFocusChime(0.3, 'focus:123')]);
    expect(audio.createOscillator).toHaveBeenCalledTimes(2);
    expect(request).toHaveBeenCalledTimes(2);
    await secondTab.playFocusChime(0.3, 'break:456');
    expect(audio.createOscillator).toHaveBeenCalledTimes(4);
});
