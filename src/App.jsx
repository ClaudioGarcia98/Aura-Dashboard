import { useState, useEffect, useRef } from 'react';
import Greeting from './components/Greeting';
import Clock from './components/Clock';
import SearchBox from './components/SearchBox';
import SpeedDial from './components/SpeedDial';
import Quote from './components/Quote';
import WeatherWidget from './components/WeatherWidget';
import SettingsPanel from './components/SettingsPanel/index.jsx';
import AnimeSchedule from './components/AnimeSchedule/index.jsx';
import LofiPlayer from './components/LofiPlayer';
import CompactLayout from './components/CompactLayout';
import { useSettingsStore } from './stores/useSettingsStore';
import { useBackgroundLoader } from './hooks/useBackgroundLoader';
import { useThemeEffect } from './hooks/useThemeEffect';
import { useFontEffect } from './hooks/useFontEffect';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useShallow } from 'zustand/react/shallow';
import logoUrl from './assets/logo.png';

import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
    useBackgroundLoader();
    useThemeEffect();
    useFontEffect();

    const {
        backgroundUrl,
        backgroundIsVideo,
        username,
        showWeatherWidget,
        showQuote,
        showSearchBox,
        showSpeedDial,
        showTop5Anime,
        showAnimeSidebar,
        showLofiPlayer,
        lofiStations,
    } = useSettingsStore(useShallow(s => ({
        backgroundUrl: s.backgroundUrl,
        backgroundIsVideo: s.backgroundIsVideo,
        username: s.username,
        showWeatherWidget: s.showWeatherWidget,
        showQuote: s.showQuote,
        showSearchBox: s.showSearchBox,
        showSpeedDial: s.showSpeedDial,
        showTop5Anime: s.showTop5Anime,
        showAnimeSidebar: s.showAnimeSidebar,
        showLofiPlayer: s.showLofiPlayer,
        lofiStations: s.lofiStations,
    })));
    const [booting, setBooting] = useState(true);
    const [compactTab, setCompactTab] = useState('home');
    const [lofiPlaying, setLofiPlaying] = useState(false);
    const pauseBackground = useSettingsStore(s => s.pauseBackground);
    const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
    const videoRef = useRef(null);
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        if (pauseBackground || reducedMotion) video.pause();
        else video.play()?.catch(() => {});
    }, [pauseBackground, reducedMotion, backgroundUrl]);
    const isCompact = useMediaQuery('(max-width: 1024px)');

    const hasBottomContent = showSearchBox || showSpeedDial || showTop5Anime;
    const isTotallyEmptyBelowClock = !showQuote && !hasBottomContent;

    // Lock the page (no scroll) and drop desktop body padding while in the
    // compact tab layout, so the fixed background stays full-screen.
    useEffect(() => {
        document.body.classList.toggle('compact-mode', isCompact);
        return () => document.body.classList.remove('compact-mode');
    }, [isCompact]);

    useEffect(() => {
        const bootT = setTimeout(() => setBooting(false), 2800);
        let idleT;
        const mainUi = document.getElementById('mainUi');
        
        const resetIdle = () => {
            document.documentElement.style.setProperty('--ui-opacity', '1');
            if (mainUi) mainUi.style.pointerEvents = 'auto';
            clearTimeout(idleT);
            idleT = setTimeout(() => {
                if (document.activeElement !== document.getElementById('searchInput')) {
                    document.documentElement.style.setProperty('--ui-opacity', '0.2');
                    window.dispatchEvent(new Event('app-idle'));
                }
            }, 120000); // 2 minutes
        };

        const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'click'];
        events.forEach(ev => window.addEventListener(ev, resetIdle));
        resetIdle();

        return () => {
            events.forEach(ev => window.removeEventListener(ev, resetIdle));
            clearTimeout(idleT);
            clearTimeout(bootT);
        };
    }, []);

    useEffect(() => {
        if (backgroundUrl && !backgroundIsVideo) {
            Object.assign(document.body.style, {
                backgroundImage: `url('${backgroundUrl}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed',
            });
        } else {
            document.body.style.backgroundImage = 'none';
        }
    }, [backgroundUrl, backgroundIsVideo]);

    return (
        <>
            {backgroundIsVideo && backgroundUrl && (
                <video
                    ref={videoRef}
                    src={backgroundUrl}
                    autoPlay={!pauseBackground && !reducedMotion}
                    loop
                    muted
                    playsInline
                    style={{
                        position: 'fixed',
                        top: 0, left: 0,
                        width: '100%', height: '100%',
                        objectFit: 'cover',
                        zIndex: 0
                    }}
                />
            )}
            <div className="overlay" id="overlay"></div>
            {booting && (
                <div id="bootScreen" className="boot-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={logoUrl} alt="Aura" style={{ width: '80px', height: '80px', marginBottom: '24px', animation: 'pulseGlow 2s infinite', filter: 'drop-shadow(0 0 20px var(--accent-color))' }} />
                    <div className="boot-logo">Hello, {username || 'Guest'}</div>
                </div>
            )}
            
            {isCompact ? (
                <CompactLayout tab={compactTab} onTabChange={setCompactTab} lofiPlaying={lofiPlaying} externalPlayer />
            ) : (
            <main className={`interactive-ui ${booting ? 'boot-hidden' : ''}`} id="mainUi">
                <section style={{ opacity: 'var(--ui-opacity)', transition: 'opacity 0.8s ease-in-out' }}>
                    {showWeatherWidget && (
                        <ErrorBoundary>
                            <WeatherWidget />
                        </ErrorBoundary>
                    )}
                </section>
                <div className="container" style={{ paddingBottom: isTotallyEmptyBelowClock ? '32px' : undefined }}>
                    <header className="center-content" style={{ marginBottom: isTotallyEmptyBelowClock ? '-32px' : undefined }}>
                        <Greeting />
                        <Clock />
                        {showQuote && (
                            <div style={{ opacity: 'var(--ui-opacity)', transition: 'opacity 0.8s ease-in-out', marginBottom: hasBottomContent ? '35px' : '0' }}>
                                <ErrorBoundary>
                                    <Quote />
                                </ErrorBoundary>
                            </div>
                        )}
                    </header>
                    {hasBottomContent && (
                        <section style={{ opacity: 'var(--ui-opacity)', transition: 'opacity 0.8s ease-in-out', display: 'flex', flexDirection: 'column' }}>
                            {showSearchBox && (
                                <ErrorBoundary>
                                    <SearchBox />
                                </ErrorBoundary>
                            )}
                            {showSpeedDial && (
                                <ErrorBoundary>
                                    <SpeedDial />
                                </ErrorBoundary>
                            )}
                            {showTop5Anime && (
                                <div className="scrollable-section">
                                    <ErrorBoundary>
                                        <AnimeSchedule />
                                    </ErrorBoundary>
                                </div>
                            )}
                        </section>
                    )}
                    {(!showTop5Anime && showAnimeSidebar) && (
                        <ErrorBoundary>
                            <AnimeSchedule />
                        </ErrorBoundary>
                    )}
                </div>
                <aside style={{ opacity: 'var(--ui-opacity)', transition: 'opacity 0.8s ease-in-out' }}>
                    <SettingsPanel />

                </aside>
            </main>
            )}
            {showLofiPlayer && lofiStations.length > 0 && (
                <ErrorBoundary><LofiPlayer compact={isCompact} expanded={isCompact && compactTab === 'lofi'} onPlayingChange={setLofiPlaying} /></ErrorBoundary>
            )}
        </>
    );
}
