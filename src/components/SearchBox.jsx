import { useTranslation } from '../i18n/useTranslation';
import { ENGINES } from '../constants/searchEngines';
import { useSearchSuggestions } from '../hooks/useSearchSuggestions';
import { openUrl, httpUrl, normalizeUrl, faviconUrl } from '../utils/urls';
import './SearchBox.css';
import { memo, useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useShallow } from 'zustand/react/shallow';
import { safeStorage, safeJsonParse, safeJsonStringify } from '../utils/storage';

export default memo(function SearchBox() {
    const { t } = useTranslation();
    const { customEngines, speedDials, setSpeedDials, remoteSuggestions } = useSettingsStore(useShallow(s => ({ customEngines: s.customEngines, speedDials: s.speedDials, setSpeedDials: s.setSpeedDials, remoteSuggestions: s.remoteSuggestions })));
    const [query, setQuery] = useState('');
    const [activeEngine, setActiveEngine] = useState(null);
    const suggestions = useSearchSuggestions(query, activeEngine, remoteSuggestions);
    const [recent, setRecent] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [focusIdx, setFocusIdx] = useState(-1);
    const [badgeWidth, setBadgeWidth] = useState(0);

    // Combine default engines with custom engines
    const combinedEngines = { ...ENGINES };
    if (Array.isArray(customEngines)) {
        customEngines.filter(e => e && typeof e.prefix === 'string' && typeof e.name === 'string' && typeof e.url === 'string' && httpUrl(e.url.replace('%s', 'query'))).forEach(e => {
            combinedEngines[e.prefix] = {
                name: e.name,
                bg: '#333',
                fg: '#fff',
                url: q => e.url.replace('%s', encodeURIComponent(q))
            };
        });
    }

    const inputRef = useRef(null);
    const formRef = useRef(null);
    const badgeRef = useRef(null);

    useLayoutEffect(() => {
        if (activeEngine && badgeRef.current) {
            setBadgeWidth(badgeRef.current.offsetWidth);
        } else {
            setBadgeWidth(0);
        }
    }, [activeEngine, query]);


    const loadRecent = () => {
        let rawH = safeJsonParse(safeStorage.getItem('dash_recent'), []);
        if (!Array.isArray(rawH)) rawH = [];
        let needsSave = false;
        const h = rawH.map(item => {
            if (!item || typeof item !== 'object') return { query: String(item || ''), engineName: 'Google' };
            if (!item.engineName) {
                needsSave = true;
                if (item.query && item.query.includes(': ')) {
                    const parts = item.query.split(': ');
                    item.engineName = parts[0];
                    item.query = parts.slice(1).join(': ');
                } else {
                    item.engineName = 'Google';
                }
            }
            return item;
        }).filter(item => item && item.query);
        if (needsSave) safeStorage.setItem('dash_recent', safeJsonStringify(h));
        setRecent(h);
    };

    useEffect(() => {
        const handleCtrlSpace = (e) => {
            if (e.ctrlKey && e.code === 'Space') {
                e.preventDefault();
                inputRef.current?.focus();
                inputRef.current?.select();
            }
        };

        const handleClickOutside = (e) => {
            if (formRef.current && !formRef.current.contains(e.target)) {
                setShowSuggestions(false);
                setFocusIdx(-1);
            }
        };

        document.addEventListener('keydown', handleCtrlSpace);
        document.addEventListener('click', handleClickOutside);

        loadRecent();

        // Only auto-focus (and pop the keyboard) on devices with a fine pointer —
        // avoids the keyboard springing up on every phone/tablet tab open.
        if (window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
            inputRef.current?.focus();
        }

        return () => {
            document.removeEventListener('keydown', handleCtrlSpace);
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    const saveHistory = (q, url, engineName = 'Google') => {
        let rawH = safeJsonParse(safeStorage.getItem('dash_recent'), []);
        let h = Array.isArray(rawH) ? rawH : [];
        h = h.filter(x => x && x.query !== q);
        h.unshift({ query: q, url, engineName });
        const newH = h.slice(0, 8);
        safeStorage.setItem('dash_recent', safeJsonStringify(newH));
        setRecent(newH);
    };

    const removeHistory = (e, q) => {
        e.stopPropagation();
        let rawH = safeJsonParse(safeStorage.getItem('dash_recent'), []);
        let h = Array.isArray(rawH) ? rawH : [];
        h = h.filter(x => x && x.query !== q);
        safeStorage.setItem('dash_recent', safeJsonStringify(h));
        setRecent(h);
        if (h.length === 0) setShowSuggestions(false);
    };

    const processQuery = (q) => {
        const trimmed = q.trim();
        if (!trimmed) return;

        if (activeEngine) {
            const url = activeEngine.url(trimmed);
            if (!httpUrl(url)) return;
            saveHistory(trimmed, url, activeEngine.name);
            openUrl(url);
        } else {
            const looksLikeUrl = /^https?:\/\//i.test(trimmed) || (!/\s/.test(trimmed) && /^(?:localhost|[\w-]+(?:\.[\w-]+)+)(?::\d+)?(?:[/?#]|$)/i.test(trimmed));
            const url = looksLikeUrl ? normalizeUrl(trimmed) : `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
            if (!url) return;
            saveHistory(trimmed, url, 'Google');
            openUrl(url);
        }

        setActiveEngine(null);
        setQuery('');
        setShowSuggestions(false);
    };

    const addToSpeedDial = (e, item) => {
        e.stopPropagation();
        e.preventDefault();

        const trimmed = item.trim();
        let url;
        let finalName = trimmed;

        if (activeEngine) {
            url = activeEngine.url(trimmed);
        } else {
            const looksLikeUrl = !/\s/.test(trimmed) && /^(?:https?:\/\/|localhost|[\w-]+(?:\.[\w-]+)+)/i.test(trimmed);
            url = looksLikeUrl ? normalizeUrl(trimmed) : `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
            if (!url) return;
            finalName = looksLikeUrl ? new URL(url).hostname.replace(/^www\./, '').split('.')[0] : trimmed;
        }

        if (!httpUrl(url)) return;
        const newDial = {
            id: crypto.randomUUID(),
            name: finalName,
            url: url
        };
        const currentList = Array.isArray(speedDials) ? speedDials : [];
        setSpeedDials([...currentList, newDial]);
        setActiveEngine(null);
        setQuery('');
        setShowSuggestions(false);
        inputRef.current?.focus();
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        setFocusIdx(-1);

        if (activeEngine) {

            if (val === '') {
                setActiveEngine(null);

                if (recent.length > 0) setShowSuggestions(true);
            } else {

                setShowSuggestions(true);
            }
            return;
        }

        const low = val.toLowerCase();
        for (const [pfx, eng] of Object.entries(combinedEngines)) {
            if (low.startsWith(pfx)) {
                setActiveEngine({ ...eng, pfx });
                const rest = val.slice(pfx.length);
                setQuery(rest);


                setShowSuggestions(true);
                return;
            }
        }


        if (!val.trim()) {

            if (recent.length > 0) setShowSuggestions(true);
            else setShowSuggestions(false);
            return;
        }


        setShowSuggestions(true);
    };

    const selectHistory = item => {
        if (httpUrl(item.url)) openUrl(item.url);
        else {
            const engine = Object.values(combinedEngines).find(e => e.name === item.engineName);
            openUrl(engine ? engine.url(item.query) : `https://www.google.com/search?q=${encodeURIComponent(item.query)}`);
        }
        setQuery(''); setActiveEngine(null); setShowSuggestions(false); setFocusIdx(-1);
    };

    const submitSelection = () => {
        if (showSuggestions && focusIdx >= 0) {
            if (!query.trim() && recent[focusIdx]) { selectHistory(recent[focusIdx]); return; }
            if (query.trim() && suggestions[focusIdx]) { processQuery(suggestions[focusIdx]); return; }
        }
        processQuery(query);
    };

    const handleKeyDown = e => {
        if (e.key === 'Escape') { setShowSuggestions(false); setFocusIdx(-1); return; }
        if (e.key === 'Backspace' && activeEngine && query === '') { setActiveEngine(null); return; }
        const count = query.trim() ? suggestions.length : recent.length;
        if (!count || !showSuggestions) return;
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            setFocusIdx(index => e.key === 'ArrowDown' ? (index + 1) % count : index <= 0 ? count - 1 : index - 1);
        }
    };

    const handleFocus = () => {
        if (!query.trim() && recent.length > 0) {
            setShowSuggestions(true);
        } else if (query.trim() && suggestions.length > 0) {
            setShowSuggestions(true);
        }
    };

    const getFavicon = value => faviconUrl(value, 16);

    const isTyping = query.length > 0;

    return (
        <form
            id="searchForm"
            className={`search-container ${isTyping ? 'typing' : ''}`}
            onSubmit={(e) => { e.preventDefault(); submitSelection(); }}
            ref={formRef}
        >
            <div className="search-icon"></div>

            <div
                ref={badgeRef}
                className={`engine-badge ${activeEngine ? 'show' : ''}`}
                style={activeEngine ? { background: activeEngine.bg, color: activeEngine.fg } : {}}
            >
                {activeEngine?.name}
            </div>

            <input
                type="text"
                id="searchInput"
                ref={inputRef}
                placeholder={t("Let's search something")}
                autoComplete="off"
                role="combobox"
                aria-label={t("Search")}
                aria-autocomplete="list"
                aria-expanded={showSuggestions && (query.trim() ? suggestions.length > 0 : recent.length > 0)}
                aria-controls="searchOptions"
                aria-activedescendant={showSuggestions && focusIdx >= 0 ? `search-option-${focusIdx}` : undefined}
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                style={{ paddingLeft: activeEngine ? `${badgeWidth + 60}px` : '52px' }}
            />

            <ul
                className="suggestions-list" id="searchOptions" role="listbox"
                style={{ display: showSuggestions && (suggestions.length > 0 || (!query.trim() && recent.length > 0)) ? 'block' : 'none' }}
            >
                {query.trim() ? (
                    suggestions.map((item, idx) => (
                        <li
                            key={item} id={`search-option-${idx}`} role="option" aria-selected={focusIdx === idx}
                            className={idx === focusIdx ? 'selected' : ''}
                            onClick={() => processQuery(item)}
                        >
                            <span className="sug-icon">🔍</span>
                            <span className="sug-text" style={{ flex: 1 }}>{item}</span>
                            <button
                                type="button"
                                className="sug-add"
                                title={t("Add to Speed Dial")}
                                aria-label={t("Add to Speed Dial")}
                                onClick={(e) => addToSpeedDial(e, item)}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                            </button>
                        </li>
                    ))
                ) : (
                    <>
                        {recent.length > 0 && <li className="sug-group">{t("Recent")}</li>}
                        {recent.map((item, idx) => (
                            <li
                                key={item.query} id={`search-option-${idx}`} role="option" aria-selected={focusIdx === idx}
                                className={idx === focusIdx ? 'selected' : ''}
                                onClick={() => selectHistory(item)}
                            >
                                {item.url ? (
                                    <img src={getFavicon(item.url)} className="sug-favicon" onError={(e) => e.target.style.display='none'} alt=""/>
                                ) : (
                                    <span className="sug-icon">🕒</span>
                                )}
                                <span className="sug-text">{item.engineName}: {item.query}</span>
                                <button
                                    type="button"
                                    className="sug-remove"
                                    title={t("Remove")}
                                    aria-label={t('Remove {query} from history', { query: item.query })}
                                    onClick={(e) => removeHistory(e, item.query)}
                                >
                                    ×
                                </button>
                            </li>
                        ))}
                    </>
                )}
            </ul>
        </form>
    );
});
