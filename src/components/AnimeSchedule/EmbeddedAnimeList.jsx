import { useTranslation } from '../../i18n/useTranslation';
import { memo } from 'react';
import AnimeCard from './AnimeCard';
import { weekday } from '../../i18n/core';
import { useTimeZone } from '../../hooks/useTimeZone';

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
    sidebarStale = false,
    expandedAnime,
    setExpandedAnime,
    userWatchingIds,
    onMouseEnter,
    onMouseLeave,
}) {
    const { t, locale } = useTranslation();
    const timeZone = useTimeZone();
    return (
        <div className="anime-embedded">
            <header className="as-header">
                <div className="as-header-titles">
                    <h2>{t("Anime Schedule")}</h2>
                    <span className="as-subtitle">{t("Daily Airing Episodes")}</span>
                    <span className="as-time-zone">{t('Schedule time zone: {zone}', { zone: timeZone.replaceAll('_', ' ') })}</span>
                </div>
            </header>

            <div className="as-days">
                {DAY_FILTERS.map(df => {
                    const dayName = weekday(locale, df);
                    return (
                        <div
                            key={df}
                            className={`as-day-btn ${activeDay === df ? 'active' : ''}`}
                            onClick={() => setActiveDay(df)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveDay(df); } }}
                            role="button"
                            aria-label={weekday(locale, df, 'long')}
                            aria-pressed={activeDay === df}
                            tabIndex={0}
                        >
                            {dayName}
                        </div>
                    );
                })}
            </div>

            {sidebarStale && !sidebarLoading && !sidebarError && (
                <div className="stale-state" role="status" style={{ fontSize: '0.75rem', opacity: 0.7, padding: '4px 16px 8px', textAlign: 'center' }}> {t("Showing saved schedule · Live update unavailable")} </div>
            )}

            <div className="as-content">
                {sidebarError ? (
                    <div className="error-state">{t("Couldn't connect to AniList right now.")}</div>
                ) : sidebarLoading ? (
                    <SkeletonList />
                ) : sidebarData.length === 0 ? (
                    <div style={{ opacity: 0.5, padding: '20px', textAlign: 'center', fontSize: '0.8rem' }}>{t("No anime scheduled.")}</div>
                ) : (
                    sidebarData.map(anime => (
                        <AnimeCard
                            key={anime.mal_id}
                            anime={anime}
                            variant="sidebar"
                            isExpanded={expandedAnime?.id === anime.mal_id && expandedAnime?.source === 'sidebar'}
                            isWatching={userWatchingIds.includes(Number(anime.mal_id))}
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
