import { safeStorage } from '../utils/storage';

let context;
const CHIME_KEY = 'dash_focus_chime_v1';

// Unlock audio from the Start button's user gesture, before the timer finishes.
export function prepareFocusChime() {
    try {
        const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!AudioContext) return;
        if (!context || context.state === 'closed') context = new AudioContext();
        if (context.state === 'suspended') context.resume()?.catch(() => {});
    } catch { /* Audio is optional when a browser denies access. */ }
}

export function playFocusChime(volume = 0.2, completionId) {
    if (!context || context.state !== 'running' || volume <= 0) return;
    const play = () => {
        if (completionId && safeStorage.getItem(CHIME_KEY) === completionId) return;
        // Claim only from an audio-enabled tab; a newly opened tab must not
        // suppress the chime in the tab where the user started the session.
        if (playNotes(volume) && completionId) safeStorage.setItem(CHIME_KEY, completionId);
    };
    if (completionId && globalThis.navigator?.locks?.request) {
        // Web Locks serialize simultaneous completion notices across tabs.
        return navigator.locks.request('aura-focus-chime', play).catch(() => {});
    }
    play();
}

function playNotes(volume) {
    try {
        for (const [index, frequency] of [660, 880].entries()) {
            const start = context.currentTime + index * 0.18;
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.value = frequency;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(Math.min(volume, 1) * 0.12, start + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.8);
            oscillator.connect(gain);
            gain.connect(context.destination);
            oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
            oscillator.start(start);
            oscillator.stop(start + 0.85);
        }
        return true;
    } catch { /* Completion still appears visually when audio is unavailable. */ }
    return false;
}
