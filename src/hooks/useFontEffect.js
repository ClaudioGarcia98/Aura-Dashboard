import { useEffect } from 'react';
import { FONTS } from '../constants/settingsConstants';
import { useSettingsStore } from '../stores/useSettingsStore';

export function useFontEffect() {
    const font = useSettingsStore(s => s.font);

    useEffect(() => {
        const f = FONTS[font] || FONTS.default;
        const url = f.url && (import.meta.env.MODE.startsWith('extension-') ? `./fonts/${font}.css` : f.url);
        if (f.url && !document.getElementById('gf-' + font)) {
            const l = document.createElement('link');
            l.id = 'gf-' + font; l.rel = 'stylesheet'; l.href = url;
            document.head.appendChild(l);
        }
        document.documentElement.style.setProperty('--font-family', f.family);
    }, [font]);
}
