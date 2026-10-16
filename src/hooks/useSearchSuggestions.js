import { useEffect, useRef, useState } from 'react';
import { fetchJson } from '../services/http';

export function useSearchSuggestions(query, engine, enabled) {
    const key = `${engine?.name || 'Google'}:${query}`;
    const [result, setResult] = useState({ key: '', items: [] });
    const generation = useRef(0);
    const name = engine?.name || 'Google';
    useEffect(() => {
        const request = ++generation.current;
        if (!enabled || !query.trim() || !['Google', 'YouTube'].includes(name)) return;
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                // Fetch inert JSON instead of executing a JSONP script in the page.
                const data = await fetchJson(`https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}${name === 'YouTube' ? '&ds=yt' : ''}`, { signal: controller.signal }, 3000);
                if (request !== generation.current || controller.signal.aborted) return;
                const items = Array.isArray(data?.[1]) ? data[1].filter(value => typeof value === 'string').slice(0, 5) : [];
                setResult({ key, items });
            } catch { if (!controller.signal.aborted && request === generation.current) setResult({ key, items: [] }); }
        }, 250);
        return () => { controller.abort(); clearTimeout(timer); };
    }, [query, name, key, enabled]);
    return enabled && query.trim() && result.key === key ? result.items : [];
}
