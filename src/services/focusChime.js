let context;

// Unlock audio from the Start button's user gesture, before the timer finishes.
export async function prepareFocusChime() {
    try {
        const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!AudioContext) return false;
        if (!context || context.state === 'closed') context = new AudioContext();
        if (context.state === 'suspended' || context.state === 'interrupted') await context.resume();
        return context.state === 'running';
    } catch { /* Audio is optional when a browser denies access. */ }
    return false;
}

export async function playFocusChime(volume = 0.6) {
    if (!context || volume <= 0) return;
    try {
        if (context.state === 'suspended' || context.state === 'interrupted') await context.resume();
        if (context.state !== 'running') return;
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
    } catch { /* Completion still appears visually when audio is unavailable. */ }
}
