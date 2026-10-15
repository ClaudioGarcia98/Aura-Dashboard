import './AnimeSchedule.css';
import { memo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useShallow } from 'zustand/react/shallow';
import { useAnimeSchedule } from '../../hooks/useAnimeSchedule';
import Sidebar from './Sidebar';
import TodayLaunch from './TodayLaunch';
import TrailerPreview from './TrailerPreview';

export default memo(function AnimeSchedule() {
    const { showTop5Anime, showAnimeSidebar } = useSettingsStore(useShallow(s => ({ showTop5Anime: s.showTop5Anime, showAnimeSidebar: s.showAnimeSidebar })));
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => { setIsMounted(true); }, []);

    const {
        isSidebarOpen, setIsSidebarOpen,
        activeDay, setActiveDay,
        sidebarData, sidebarLoading, sidebarError,
        sidebarRef, toggleRef,
        todayLoading, todayError,
        displayList,
        userWatchingIds,
        expandedAnime, setExpandedAnime,
        previewTrailer, previewPos,
        trailerMuted,
        trailerIframeRef,
        handleMouseEnter, handleMouseLeave,
        handleTrailerMouseEnter, handleTrailerMouseLeave,
        handleUnmute, handleMute,
    } = useAnimeSchedule();

    const sidebarPortal = isMounted ? document.getElementById('mainUi') : null;
    const trailerPortal = isMounted ? document.body : null;

    return (
        <>
            {showTop5Anime && (
                <TodayLaunch
                    displayList={displayList}
                    todayLoading={todayLoading}
                    todayError={todayError}
                    expandedAnime={expandedAnime}
                    setExpandedAnime={setExpandedAnime}
                    userWatchingIds={userWatchingIds}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                />
            )}

            {showAnimeSidebar && sidebarPortal && createPortal(
                <Sidebar
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                    activeDay={activeDay}
                    setActiveDay={setActiveDay}
                    sidebarData={sidebarData}
                    sidebarLoading={sidebarLoading}
                    sidebarError={sidebarError}
                    expandedAnime={expandedAnime}
                    setExpandedAnime={setExpandedAnime}
                    userWatchingIds={userWatchingIds}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    sidebarRef={sidebarRef}
                    toggleRef={toggleRef}
                />,
                sidebarPortal
            )}

            {trailerPortal && previewTrailer && createPortal(
                <TrailerPreview
                    youtubeId={previewTrailer}
                    pos={previewPos}
                    muted={trailerMuted}
                    onMute={handleMute}
                    onUnmute={handleUnmute}
                    onMouseEnter={handleTrailerMouseEnter}
                    onMouseLeave={handleTrailerMouseLeave}
                    iframeRef={trailerIframeRef}
                />,
                trailerPortal
            )}
        </>
    );
});
