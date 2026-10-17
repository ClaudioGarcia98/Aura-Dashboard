import { useEffect } from 'react';
import { THEMES } from '../constants/settingsConstants';
import { useSettingsStore } from '../stores/useSettingsStore';

export function useThemeEffect() {
    const theme = useSettingsStore(s => s.theme);

    useEffect(() => {
        let intervalId;
        const t = THEMES[theme] || THEMES.aurora;
        const root = document.documentElement;
        root.dataset.theme = Object.hasOwn(THEMES, theme) ? theme : 'aurora';
        root.dataset.curatedTheme = String(!!t.curated);
        // Always reset the whole palette when switching back to a classic theme.
        const tokens = {
            '--bg-base': t.base || '#0b0c10',
            '--text-primary': t.primary || '#F8FAFC',
            '--text-secondary': t.secondary || '#94A3B8',
            '--glass-panel': t.panel ? `linear-gradient(145deg, color-mix(in srgb, ${t.panel} 95%, transparent), color-mix(in srgb, ${t.base} 98%, transparent))` : 'linear-gradient(180deg, rgba(16,18,26,0.96), rgba(10,11,16,0.98))',
            '--glass-card': t.panel ? `color-mix(in srgb, ${t.panel} 92%, transparent)` : 'rgba(16,18,26,0.76)',
            '--glass-card-hover': t.panel ? `color-mix(in srgb, ${t.panel} 94%, ${t.accent})` : 'rgba(22,25,36,0.90)',
            '--glass-border': t.accent ? `color-mix(in srgb, ${t.accent} ${t.curated ? 20 : 12}%, transparent)` : 'rgba(255,255,255,0.10)',
        };
        for (const [name, value] of Object.entries(tokens)) root.style.setProperty(name, value);

        const updateTimeAccent = () => {
            const hr = new Date().getHours();
            let a = '#FFD26A', g = 'rgba(255,210,106,0.2)';
            if (hr >= 12 && hr < 18) { a = '#FF9F43'; g = 'rgba(255,159,67,0.2)'; }
            else if (hr >= 18 && hr < 22) { a = '#54a0ff'; g = 'rgba(84,160,255,0.2)'; }
            else if (hr >= 22 || hr < 5)  { a = '#c482fb'; g = 'rgba(196,130,251,0.25)'; }
            document.documentElement.style.setProperty('--accent-color', a);
            document.documentElement.style.setProperty('--accent-glow', g);
        };

        if (!t.timeBased) {
            document.documentElement.style.setProperty('--accent-color', t.accent);
            document.documentElement.style.setProperty('--accent-glow', t.glow);
        } else {
            updateTimeAccent();
            intervalId = setInterval(updateTimeAccent, 60000);
        }

        const overlay = document.getElementById('overlay');
        if (overlay) {
            overlay.style.background = `linear-gradient(90deg, ${t.overlayA} 0%, ${t.overlayB} 50%, rgba(0,0,0,0) 100%)`;
        }

        return () => { if (intervalId) clearInterval(intervalId); };
    }, [theme]);
}
