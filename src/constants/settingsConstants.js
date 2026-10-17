export const THEMES = {
    aurora: { description: 'Accents follow the time of day', timeBased: true, overlayA: 'rgba(0,0,0,0.6)', overlayB: 'rgba(0,0,0,0.2)' },
    nord:   { description: 'Arctic blue · charcoal glass', accent: '#88C0D0', glow: 'rgba(136,192,208,0.25)', overlayA: 'rgba(0,0,0,0.6)', overlayB: 'rgba(0,0,0,0.2)' },
    tokyo:  { description: 'Periwinkle · charcoal glass', accent: '#7aa2f7', glow: 'rgba(122,162,247,0.25)', overlayA: 'rgba(0,0,0,0.6)', overlayB: 'rgba(0,0,0,0.2)' },
    sunset: { description: 'Coral pink · charcoal glass', accent: '#f7768e', glow: 'rgba(247,118,142,0.25)', overlayA: 'rgba(0,0,0,0.6)', overlayB: 'rgba(0,0,0,0.2)' },
    forest: { description: 'Fresh green · charcoal glass', accent: '#9ece6a', glow: 'rgba(158,206,106,0.25)', overlayA: 'rgba(0,0,0,0.6)', overlayB: 'rgba(0,0,0,0.2)' },
    mocha: { name: 'Catppuccin Mocha', description: 'Soft lavender · warm charcoal', curated: true, accent: '#cba6f7', glow: 'rgba(203,166,247,0.22)', base: '#181825', panel: '#1e1e2e', primary: '#cdd6f4', secondary: '#bac2de', overlayA: 'rgba(17,17,27,0.62)', overlayB: 'rgba(24,24,37,0.26)' },
    'tokyo-night': { name: 'Tokyo Night', description: 'Neon blue · midnight ink', curated: true, accent: '#82aaff', glow: 'rgba(130,170,255,0.22)', base: '#16161e', panel: '#1a1b26', primary: '#c0caf5', secondary: '#a9b7df', overlayA: 'rgba(15,15,23,0.64)', overlayB: 'rgba(22,22,30,0.28)' },
    'rose-pine': { name: 'Rosé Pine', description: 'Muted rose · deep plum', curated: true, accent: '#ebbcba', glow: 'rgba(235,188,186,0.22)', base: '#191724', panel: '#1f1d2e', primary: '#e0def4', secondary: '#c0bcd4', overlayA: 'rgba(20,18,30,0.62)', overlayB: 'rgba(25,23,36,0.28)' },
    matcha: { name: 'Matcha Forest', description: 'Sage green · woodland glass', curated: true, accent: '#b8d49a', glow: 'rgba(184,212,154,0.22)', base: '#121b17', panel: '#18251e', primary: '#e3ece1', secondary: '#b9cbbb', overlayA: 'rgba(10,19,14,0.62)', overlayB: 'rgba(18,27,23,0.28)' },
};

export const themeLabel = key => THEMES[key]?.name || (typeof key === 'string' ? key.charAt(0).toUpperCase() + key.slice(1) : 'Aurora');

export const FONTS = {
    default:   { family: "'Segoe UI',Tahoma,Geneva,Verdana,sans-serif", url: null },
    raleway:   { family: "'Raleway',sans-serif",         url: 'https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;600;700&display=swap' },
    outfit:    { family: "'Outfit',sans-serif",           url: 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap' },
    nunito:    { family: "'Nunito',sans-serif",           url: 'https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700&display=swap' },
    jetbrains: { family: "'JetBrains Mono',monospace",    url: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;700&display=swap' },
    playfair:  { family: "'Playfair Display',serif",      url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap' },
};
