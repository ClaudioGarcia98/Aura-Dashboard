import { useTranslation } from '../../i18n/useTranslation';
import { memo } from 'react';
import AnimeCard from './AnimeCard';

/**
 * "Today's Launch" box — the watching-prioritized top-5 list.
 * Shared by the desktop AnimeSchedule and the compact Home tab.
 */
export default memo(function TodayLaunch({
    displayList,
    todayLoading,
    todayError,
    todayStale = false,
    expandedAnime,
    setExpandedAnime,
    userWatchingIds,
    onMouseEnter,
    onMouseLeave,
}) {
    const { t } = useTranslation();
    return (
        <div className="today-anime-box" id="todayAnimeBox">
            <div className="tab-header">
                <span className="tab-title" style={{ display: 'flex', alignItems: 'center' }}> {t("Today's Launch")} <div className="info-badge-container" tabIndex={0} aria-label={t("Sorting Info")}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="info-icon">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                        <div className="custom-hint-card">
                            <div className="hint-card-text">
                                <p>{t("We automatically prioritize the shows you are currently watching on MyAnimeList, then fill the remaining spots with today's top-rated premieres.")}</p>
                            </div>
                        </div>
                    </div>
                </span>
            </div>
            {todayStale && !todayLoading && !todayError && (
                <div className="stale-state" role="status" style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '6px' }}> {t("Showing saved schedule · Live update unavailable")} </div>
            )}
            <div className="tab-list" id="tabList">
                {todayError ? (
                    <div className="error-state">{t("Couldn't connect to AniList right now.")}</div>
                ) : todayLoading ? (
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
                ) : displayList.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>{t("No anime airing today.")}</div>
                ) : (
                    displayList.map(anime => (
                        <AnimeCard
                            key={anime.mal_id}
                            anime={anime}
                            variant="today"
                            isExpanded={expandedAnime?.id === anime.mal_id && expandedAnime?.source === 'today'}
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
