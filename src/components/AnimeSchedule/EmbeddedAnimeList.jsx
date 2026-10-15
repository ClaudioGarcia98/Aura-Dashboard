import { memo } from 'react';
import AnimeCard from './AnimeCard';

const DAY_FILTERS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const SkeletonList = () => (
    <>
        {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton-card">
                <div className="skeleton-img"></div>
                <div className="skeleton-lines">
                    <div className="skeleton-line medium"></div>
                    <div className="skeleton-line short"></div>
                </div>
            </div>
        ))}
    </>
);

/**
 * Static, full-screen anime schedule for the compact Anime tab.
 * Reuses the sidebar's day-pills (.as-days) and list (.as-content) styling
 * but without the slide-over chrome (no aside, scrim, toggle, or close button).
 */
export default memo(function EmbeddedAnimeList({
    activeDay,
    setActiveDay,
    sidebarData,
    sidebarLoading,
    sidebarError,
    expandedAnime,
    setExpandedAnime,
    userWatchingIds,
    onMouseEnter,
    onMouseLeave,
}) {
    return (
        <div className="anime-embedded">
            <header className="as-header">
                <div className="as-header-titles">
                    <h2>Anime Schedule</h2>
                    <span className="as-subtitle">Daily Airing Episodes</span>
                </div>
            </header>

            <div className="as-days">
                {DAY_FILTERS.map(df => {
                    const dayName = df.charAt(0).toUpperCase() + df.substring(1, 3);
                    return (
                        <div
                            key={df}
                            className={`as-day-btn ${activeDay === df ? 'active' : ''}`}
                            onClick={() => setActiveDay(df)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveDay(df); } }}
                            role="button"
                            tabIndex={0}
                        >
                            {dayName}
                        </div>
                    );
                })}
            </div>

            <div className="as-content">
                {sidebarError ? (
                    <div className="error-state">Couldn't connect to MyAnimeList right now.</div>
                ) : sidebarLoading ? (
                    <SkeletonList />
                ) : sidebarData.length === 0 ? (
                    <div style={{ opacity: 0.5, padding: '20px', textAlign: 'center', fontSize: '0.8rem' }}>No anime scheduled.</div>
                ) : (
                    sidebarData.map(anime => (
                        <AnimeCard
                            key={anime.mal_id}
                            anime={anime}
                            variant="sidebar"
                            isExpanded={expandedAnime?.id === anime.mal_id && expandedAnime?.source === 'sidebar'}
                            isWatching={userWatchingIds.includes(anime.mal_id)}
                            onToggleExpand={setExpandedAnime}
                            onMouseEnter={onMouseEnter}
                            onMouseLeave={onMouseLeave}
                        />
                    ))
                )}
            </div>
        </div>
    );
});
