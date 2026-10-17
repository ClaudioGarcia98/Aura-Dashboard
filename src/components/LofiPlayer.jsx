import { useTranslation } from '../i18n/useTranslation';
import './LofiPlayer.css';
import { memo, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useShallow } from 'zustand/react/shallow';
import { fetchJson } from '../services/http';

export default memo(function LofiPlayer({ compact = false, expanded = false, onPlayingChange } = {}) {
    const { t } = useTranslation();
    const { volume, lofiId, setLofiId, lofiStations } = useSettingsStore(useShallow(s => ({ volume: s.volume, lofiId: s.lofiId, setLofiId: s.setLofiId, lofiStations: s.lofiStations })));
    const [isPlaying, setIsPlaying] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [stationRevision, setStationRevision] = useState(0);
    const [playbackError, setPlaybackError] = useState('');
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);
    const [title, setTitle] = useState('Loading...');
    const iframeRef = useRef(null);
    const playIntentRef = useRef(false);
    const awaitingPlayRef = useRef(false);
    const stopRequestedRef = useRef(false);
    const readyRef = useRef(false);
    const restartRef = useRef(false);
    const listeningIntervalRef = useRef(null);
    const listeningTimeoutRef = useRef(null);
    const playTimeoutRef = useRef(null);

    const attachIframe = useCallback(node => {
        iframeRef.current = node;
        readyRef.current = false;
        clearInterval(listeningIntervalRef.current);
        clearTimeout(listeningTimeoutRef.current);
    }, []);

    const sendCommand = useCallback((func, args = []) => {
        iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), 'https://www.youtube.com');
    }, []);

    const syncVolume = useCallback(() => {
        sendCommand(volume === 0 ? 'mute' : 'unMute');
        sendCommand('setVolume', [Math.round(volume * 100)]);
    }, [volume, sendCommand]);

    const listenForPlayer = () => {
        clearInterval(listeningIntervalRef.current);
        clearTimeout(listeningTimeoutRef.current);
        const listen = () => iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening' }), 'https://www.youtube.com');
        listen();
        if (!readyRef.current) {
            listeningIntervalRef.current = setInterval(listen, 250);
            listeningTimeoutRef.current = setTimeout(() => clearInterval(listeningIntervalRef.current), 10000);
        }
    };

    const startPlaybackTimeout = useCallback(() => {
        clearTimeout(playTimeoutRef.current);
        playTimeoutRef.current = setTimeout(() => {
            playIntentRef.current = false;
            awaitingPlayRef.current = false;
            stopRequestedRef.current = true;
            clearInterval(listeningIntervalRef.current);
            clearTimeout(listeningTimeoutRef.current);
            setIsStarting(false);
            setIsPlaying(false);
            setPlaybackError('Playback did not start. Try again or choose another station.');
        }, 5000);
    }, []);

    const stationsList = useMemo(() =>
        lofiStations.map(s => ({ id: s.videoId, name: s.name || null })),
    [lofiStations]);

    const hasStations = stationsList.length > 0;
    const knownStation = stationsList.find(s => s.id === lofiId);
    const displayTitle = knownStation?.name ? knownStation.name : title === 'Lofi Music' ? t('Lofi Music') : title;

    // Cleanup play timeout on unmount
    useEffect(() => {
        return () => {
            if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
            clearInterval(listeningIntervalRef.current);
            clearTimeout(listeningTimeoutRef.current);
        };
    }, []);

    // Close menu if all stations are deleted while it's open
    useEffect(() => {
        if (!hasStations) setShowMenu(false);
    }, [hasStations]);

    // Surface play state to parent (e.g. the compact top-nav "playing" pulse)
    useEffect(() => {
        if (onPlayingChange) onPlayingChange(isPlaying);
    }, [isPlaying, onPlayingChange]);

    // Listen for YouTube IFrame state changes
    useEffect(() => {
        const handleMessage = (e) => {
            if (e.origin !== "https://www.youtube.com" || e.source !== iframeRef.current?.contentWindow) return;
            try {
                const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
                if (!data || typeof data !== 'object') return;
                if (data.event === 'onError' || data.event === 'onAutoplayBlocked') {
                    playIntentRef.current = false;
                    awaitingPlayRef.current = false;
                    stopRequestedRef.current = true;
                    setIsStarting(false);
                    setIsPlaying(false);
                    setPlaybackError(data.event === 'onAutoplayBlocked'
                        ? 'Your browser blocked playback. Press Play to start this station.'
                        : 'This station is unavailable. Try another station.');
                    clearTimeout(playTimeoutRef.current);
                    clearInterval(listeningIntervalRef.current);
                    clearTimeout(listeningTimeoutRef.current);
                    return;
                }
                if (!readyRef.current && (data.event === 'onReady' || data.event === 'initialDelivery' || data.event === 'infoDelivery')) {
                    readyRef.current = true;
                    clearInterval(listeningIntervalRef.current);
                    clearTimeout(listeningTimeoutRef.current);
                    for (const event of ['onStateChange', 'onError', 'onAutoplayBlocked']) sendCommand('addEventListener', [event]);
                    syncVolume();
                    if (playIntentRef.current) {
                        if (restartRef.current) {
                            sendCommand('seekTo', [0, true]);
                            restartRef.current = false;
                        }
                        sendCommand('playVideo');
                    }
                }
                const playerState = data.event === 'onStateChange' ? data.info : data.info?.playerState;
                if (typeof playerState === 'number') {
                    // YouTube states: 1 = Playing, 2 = Paused, 0 = Ended, 3 = Buffering
                    if (playerState === 1) {
                        if (stopRequestedRef.current) { sendCommand('pauseVideo'); return; }
                        playIntentRef.current = true;
                        awaitingPlayRef.current = false;
                        setIsStarting(false); setIsPlaying(true); setPlaybackError(''); clearTimeout(playTimeoutRef.current);
                    } else if (playerState === 2 || playerState === 0) {
                        setIsPlaying(false);
                        if (playerState === 2 && !awaitingPlayRef.current) playIntentRef.current = false;
                        if (playerState === 0) {
                            playIntentRef.current = false;
                            awaitingPlayRef.current = false;
                            setIsStarting(false);
                            clearTimeout(playTimeoutRef.current);
                        }
                    }
                }
            } catch (err) {
                console.error("YouTube message parse error:", err);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [sendCommand, syncVolume]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Sync volume whenever it changes (YouTube expects 0-100)
    useEffect(() => {
        if (readyRef.current) syncVolume();
    }, [syncVolume]);

    // Handle Play/Pause
    const togglePlay = () => {
        if (!iframeRef.current || !iframeRef.current.contentWindow) return;
        const shouldPlay = !playIntentRef.current;
        playIntentRef.current = shouldPlay;
        awaitingPlayRef.current = shouldPlay;
        stopRequestedRef.current = !shouldPlay;
        setPlaybackError('');
        setIsStarting(shouldPlay);
        if (shouldPlay) {
            startPlaybackTimeout();
            if (readyRef.current) {
                syncVolume();
                sendCommand('playVideo');
            } else listenForPlayer();
        } else {
            clearTimeout(playTimeoutRef.current);
            sendCommand('pauseVideo');
            setIsPlaying(false);
        }
    };

    const selectStation = stationId => {
        // Each selection creates a fresh player, including reselecting this station.
        clearTimeout(playTimeoutRef.current);
        clearInterval(listeningIntervalRef.current);
        readyRef.current = false;
        playIntentRef.current = true;
        awaitingPlayRef.current = true;
        stopRequestedRef.current = false;
        restartRef.current = true;
        setIsPlaying(false);
        setIsStarting(true);
        setPlaybackError('');
        setShowMenu(false);
        setLofiId(stationId);
        setStationRevision(revision => revision + 1);
        startPlaybackTimeout();
    };

    // Fetch custom title when lofiId changes (if unknown)
    useEffect(() => {
        if (knownStation?.name) {
            return;
        }

        setTitle('Loading...');
        
        let isMounted = true;
        let isResolved = false;
        const controller = new AbortController();

        // Fallback to "Lofi Music" after 15 seconds if still loading
        const timeoutId = setTimeout(() => {
            if (isMounted && !isResolved) {
                setTitle('Lofi Music');
            }
        }, 15000);

        // Fetch title via noembed (CORS supported natively, much more reliable)
        // Note: this will fail for live_stream?channel= URLs, but we catch those above now!
        fetchJson(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${lofiId}`, { signal: controller.signal })
            .then(data => {
                if (!isMounted) return;
                isResolved = true;
                if (data && data.title) {
                    setTitle(data.title);
                } else {
                    setTitle('Lofi Music');
                }
            })
            .catch(() => {
                if (!isMounted) return;
                isResolved = true;
                setTitle('Lofi Music');
            });

        return () => {
            isMounted = false;
            controller.abort();
            clearTimeout(timeoutId);
        };
    }, [lofiId, knownStation]);

    const handleIframeLoad = () => {
        // iframe load does not mean YouTube's player API is ready for commands.
        listenForPlayer();
    };

    const originParam = typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null'
        ? `&origin=${encodeURIComponent(window.location.origin)}`
        : '';

    // Hidden iframe that actually plays the music. Kept mounted across tab
    // switches in compact mode so audio never stops.
    const iframeEl = (
        <iframe
            key={`${lofiId}:${stationRevision}`}
            ref={attachIframe}
            width="0"
            height="0"
            src={`https://www.youtube.com/embed/${lofiId}?enablejsapi=1&autoplay=0&start=0&playsinline=1&controls=0&showinfo=0&rel=0${originParam}`}
            allow="autoplay; encrypted-media"
            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', border: 'none' }}
            title={t("Lofi Background Stream")}
            onLoad={handleIframeLoad}
        />
    );

    // ── Compact (phones/tablets): full-screen expanded player in the Lofi tab ──
    if (compact) {
        return (
            <div className={`lofi-player lofi-compact ${expanded ? 'expanded' : 'collapsed'}`}>
                {iframeEl}
                {expanded && (
                    <div className="lofi-expanded" role="tabpanel" id="panel-lofi" aria-labelledby="tab-lofi">
                        <div className="lofi-expanded-now">
                            <span className="lofi-expanded-eyebrow">{t("Now Playing")}</span>
                            <span className="lofi-expanded-title" title={displayTitle}>{displayTitle}</span>
                            {playbackError && <p role="status">{t(playbackError)}</p>}
                        </div>

                        <div className="lofi-expanded-visual">
                            {isPlaying ? (
                                <div className="lofi-visualizer lofi-visualizer-lg" aria-hidden="true">
                                    {Array.from({ length: 7 }).map((_, i) => <div key={i} className="bar" />)}
                                </div>
                            ) : (
                                <span className="lofi-expanded-paused">{isStarting ? t("Starting...") : t("Paused")}</span>
                            )}
                        </div>

                        <button className="lofi-expanded-play" onClick={togglePlay} aria-label={isPlaying || isStarting ? t("Pause") : t("Play")}>
                            {isPlaying || isStarting ? (
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                            ) : (
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                            )}
                        </button>

                        {hasStations && (
                            <div className="lofi-expanded-stations">
                                <div className="lofi-station-header">{t('Stations')}</div>
                                <div className="lofi-station-list">
                                    {stationsList.map(station => (
                                        <button
                                            key={station.id}
                                            className={`lofi-station-btn ${lofiId === station.id ? 'active' : ''}`}
                                            onClick={() => selectStation(station.id)}
                                        >
                                            <div className="lofi-station-icon" style={{ flexShrink: 0 }}>
                                                {lofiId === station.id ? (
                                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                                                ) : (
                                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" /></svg>
                                                )}
                                            </div>
                                            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {station.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="lofi-player">
            {/* Hidden iframe that actually plays the music */}
            {iframeEl}
            {/* Minimal UI Pill */}
            <div className="lofi-ui-container" ref={menuRef} style={{ position: 'relative' }}>
                {/* Station Menu Popover */}
                {showMenu && (
                    <div className="lofi-station-menu">
                        <div className="lofi-station-header">{t('Stations')}</div>
                        <div className="lofi-station-list">
                            {stationsList.map(station => (
                                <button 
                                    type="button"
                                    key={station.id}
                                    className={`lofi-station-btn ${lofiId === station.id ? 'active' : ''}`}
                                    onClick={() => selectStation(station.id)}
                                >
                                    <div className="lofi-station-icon" style={{ flexShrink: 0 }}>
                                        {lofiId === station.id ? (
                                            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                            </svg>
                                        ) : (
                                            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                                            </svg>
                                        )}
                                    </div>
                                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {station.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="lofi-ui">
                    <button type="button" className={`lofi-play-btn ${isPlaying ? 'playing' : ''}`} onClick={togglePlay} aria-label={isPlaying || isStarting ? t("Pause") : t("Play")}>
                        {isPlaying || isStarting ? (
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                        )}
                    </button>
                    
                    <div 
                        className="lofi-info" 
                        onClick={() => hasStations && setShowMenu(!showMenu)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                if (hasStations) setShowMenu(!showMenu);
                            }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label={t("Change station")}
                        title={t("Click to change station")}
                    >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="lofi-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: '155px' }} title={displayTitle}>{displayTitle}</span>
                        {hasStations && (
                            <svg className={`lofi-chevron ${showMenu ? 'open' : ''}`} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6, flexShrink: 0, transition: 'transform 0.2s ease' }}>
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        )}
                    </div>
                    <span className="lofi-status">
                        {playbackError && <span role="status">{t(playbackError)}</span>}
                        {isPlaying ? (
                            <div className="lofi-visualizer">
                                <div className="bar"></div>
                                <div className="bar"></div>
                                <div className="bar"></div>
                                <div className="bar"></div>
                                <div className="bar"></div>
                            </div>
                        ) : (
                            <span style={{ fontSize: '0.75rem', opacity: 0.8, display: 'inline-block', marginTop: '4px' }}>{isStarting ? t("Starting...") : t("Paused")}</span>
                        )}
                    </span>
                </div>
            </div>
            </div>
        </div>
    );
});
