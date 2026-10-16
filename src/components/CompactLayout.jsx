import './CompactLayout.css';
import ErrorBoundary from './ErrorBoundary';
import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useShallow } from 'zustand/react/shallow';
import { useAnimeSchedule } from '../hooks/useAnimeSchedule';

import TopNav from './TopNav';
import Greeting from './Greeting';
import Clock from './Clock';
import Quote from './Quote';
import SearchBox from './SearchBox';
import SpeedDial from './SpeedDial';
import WeatherWidget from './WeatherWidget';
import LofiPlayer from './LofiPlayer';
import SettingsPanel from './SettingsPanel/index.jsx';
import TodayLaunch from './AnimeSchedule/TodayLaunch';
import EmbeddedAnimeList from './AnimeSchedule/EmbeddedAnimeList';
import TrailerPreview from './AnimeSchedule/TrailerPreview';

/**
 * Phones + tablets (<=1024px): a top-nav-driven, tabbed app shell. Replaces the
 * desktop floating-overlay layout. The page never scrolls — each tab is exactly
 * one screen with its own internal scroll, over a fixed background.
 */
export default function CompactLayout({ tab: controlledTab, onTabChange, lofiPlaying: externalPlaying = false, externalPlayer = false } = {}) {
    const {
        showWeatherWidget, showQuote, showSearchBox, showSpeedDial,
        showTop5Anime, showAnimeSidebar, showLofiPlayer, lofiStations,
    } = useSettingsStore(useShallow(s => ({
        showWeatherWidget: s.showWeatherWidget,
        showQuote: s.showQuote,
        showSearchBox: s.showSearchBox,
        showSpeedDial: s.showSpeedDial,
        showTop5Anime: s.showTop5Anime,
        showAnimeSidebar: s.showAnimeSidebar,
        showLofiPlayer: s.showLofiPlayer,
        lofiStations: s.lofiStations,
    })));

    const [localTab, setLocalTab] = useState('home');
    const tab = controlledTab ?? localTab;
    const setTab = onTabChange || setLocalTab;
    const [localPlaying, setLofiPlaying] = useState(false);
    const lofiPlaying = externalPlayer ? externalPlaying : localPlaying;

    const lofiAvailable = showLofiPlayer && lofiStations.length > 0;

    const tabs = useMemo(() => {
        const t = [{ id: 'home', label: 'Home' }];
        if (showAnimeSidebar) t.push({ id: 'anime', label: 'Anime' });
        if (lofiAvailable) t.push({ id: 'lofi', label: 'Lofi' });
        t.push({ id: 'settings', label: 'Settings' });
        return t;
    }, [showAnimeSidebar, lofiAvailable]);

    // If the active tab's widget was just disabled, fall back to Home.
    const activeTab = tabs.some(t => t.id === tab) ? tab : 'home';

    // The empty SpeedDial "+" asks to open the dial settings — jump to the tab.
    useEffect(() => {
        const goSettings = () => setTab('settings');
        window.addEventListener('open-settings-dials', goSettings);
        return () => window.removeEventListener('open-settings-dials', goSettings);
    }, [setTab]);

    // One anime data instance shared by the Home top-5 and the Anime tab.
    // Only force the full day-schedule load when the Anime tab actually exists.
    const anime = useAnimeSchedule({ alwaysOpen: showAnimeSidebar && activeTab === 'anime', enabled: showTop5Anime || showAnimeSidebar });

    return (
        <div className="compact-root" id="mainUi">
            <TopNav tabs={tabs} activeTab={activeTab} onTabChange={setTab} lofiPlaying={lofiPlaying} />

            {/* HOME */}
            <div className={`tab-panel ${activeTab === 'home' ? 'active' : ''}`} role="tabpanel" id="panel-home" aria-labelledby="tab-home" aria-label="Home">
                <div className="compact-home">
                    <Greeting />
                    <Clock />
                    {showQuote && <ErrorBoundary><Quote /></ErrorBoundary>}
                    {showSearchBox && <ErrorBoundary><SearchBox /></ErrorBoundary>}
                    {showWeatherWidget && <ErrorBoundary><WeatherWidget inline /></ErrorBoundary>}
                    {showSpeedDial && <ErrorBoundary><SpeedDial /></ErrorBoundary>}
                    {showTop5Anime && (
                        <ErrorBoundary><TodayLaunch
                            displayList={anime.displayList}
                            todayLoading={anime.todayLoading}
                            todayError={anime.todayError}
                            todayStale={anime.todayStale}
                            expandedAnime={anime.expandedAnime}
                            setExpandedAnime={anime.setExpandedAnime}
                            userWatchingIds={anime.userWatchingIds}
                            onMouseEnter={anime.handleMouseEnter}
                            onMouseLeave={anime.handleMouseLeave}
                        /></ErrorBoundary>
                    )}
                </div>
            </div>

            {/* ANIME */}
            {showAnimeSidebar && (
                <div className={`tab-panel tab-panel--fill ${activeTab === 'anime' ? 'active' : ''}`} role="tabpanel" id="panel-anime" aria-labelledby="tab-anime" aria-label="Anime">
                    <ErrorBoundary><EmbeddedAnimeList
                        activeDay={anime.activeDay}
                        setActiveDay={anime.setActiveDay}
                        sidebarData={anime.sidebarData}
                        sidebarLoading={anime.sidebarLoading}
                        sidebarError={anime.sidebarError}
                        sidebarStale={anime.sidebarStale}
                        expandedAnime={anime.expandedAnime}
                        setExpandedAnime={anime.setExpandedAnime}
                        userWatchingIds={anime.userWatchingIds}
                        onMouseEnter={anime.handleMouseEnter}
                        onMouseLeave={anime.handleMouseLeave}
                    /></ErrorBoundary>
                </div>
            )}

            {/* SETTINGS */}
            <div className={`tab-panel ${activeTab === 'settings' ? 'active' : ''}`} role="tabpanel" id="panel-settings" aria-labelledby="tab-settings" aria-label="Settings">
                <div className="compact-settings">
                    <ErrorBoundary><SettingsPanel embedded /></ErrorBoundary>
                </div>
            </div>

            {/* LOFI — mounted at root so audio never stops when switching tabs.
                Renders only the hidden iframe unless the Lofi tab is active. */}
            {lofiAvailable && !externalPlayer && (
                <LofiPlayer compact expanded={activeTab === 'lofi'} onPlayingChange={setLofiPlaying} />
            )}

            {/* Trailer preview (hover-driven; harmless on touch) */}
            {anime.previewTrailer && createPortal(
                <TrailerPreview
                    youtubeId={anime.previewTrailer}
                    pos={anime.previewPos}
                    muted={anime.trailerMuted}
                    onMute={anime.handleMute}
                    onUnmute={anime.handleUnmute}
                    onMouseEnter={anime.handleTrailerMouseEnter}
                    onMouseLeave={anime.handleTrailerMouseLeave}
                    iframeRef={anime.trailerIframeRef}
                />,
                document.body
            )}
        </div>
    );
}
