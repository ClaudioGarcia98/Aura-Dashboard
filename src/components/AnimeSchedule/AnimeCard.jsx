import { memo, useState, useEffect } from 'react';
import { formatBroadcastTime, extractTrailerId } from '../../services/animeService';
import { useMediaQuery } from '../../hooks/useMediaQuery';

const calculateTimeLeft = (broadcast, airingAt) => {
    if (airingAt && typeof airingAt === 'number') {
        const diff = (airingAt * 1000) - Date.now();
        if (diff <= 0) {
            const hoursSince = (Date.now() - (airingAt * 1000)) / (1000 * 60 * 60);
            if (hoursSince < 24) return 'Out Now!';
            return null;
        }
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / 1000 / 60) % 60);
        const parts = [];
        if (d > 0) parts.push(`${d}d`);
        if (h > 0) parts.push(`${h}h`);
        if (m > 0 || (d === 0 && h === 0)) parts.push(`${m}m`);
        return parts.join(' ');
    }

    if (!broadcast || !broadcast.time || !broadcast.day) return null;
    const dayMap = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0 };
    const cleanDay = broadcast.day.toLowerCase().replace(/s$/, '');
    const targetDay = dayMap[cleanDay];
    if (targetDay === undefined) return null;

    const [hours, minutes] = broadcast.time.split(':').map(Number);
    const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);

    let broadcastTime = new Date(jstNow.getTime());
    broadcastTime.setUTCHours(hours, minutes, 0, 0);
    const daysUntil = (targetDay - broadcastTime.getUTCDay() + 7) % 7;
    broadcastTime.setUTCDate(broadcastTime.getUTCDate() + daysUntil);

    let target = new Date(broadcastTime.getTime());

    let pastRelease = new Date(target.getTime());
    while (pastRelease.getTime() > jstNow.getTime()) {
        pastRelease.setUTCDate(pastRelease.getUTCDate() - 7);
    }
    let nextRelease = new Date(pastRelease.getTime());
    nextRelease.setUTCDate(nextRelease.getUTCDate() + 7);

    const hoursSinceRelease = (jstNow.getTime() - pastRelease.getTime()) / (1000 * 60 * 60);
    if (hoursSinceRelease < 24) return 'Out Now!';

    const diff = nextRelease.getTime() - jstNow.getTime();
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / 1000 / 60) % 60);
    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0 || (d === 0 && h === 0)) parts.push(`${m}m`);
    return parts.join(' ');
};

const CountdownBadge = memo(function CountdownBadge({ broadcast, airingAt }) {
    const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(broadcast, airingAt));
    useEffect(() => {
        if (!broadcast && !airingAt) return;
        const timer = setInterval(() => setTimeLeft(calculateTimeLeft(broadcast, airingAt)), 60000);
        return () => clearInterval(timer);
    }, [broadcast, airingAt]);
    if (!timeLeft) return null;
    return (
        <div className="anime-countdown">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
            </svg>
            <span>{timeLeft}</span>
        </div>
    );
});

// Shared expand/scroll helper
function useExpandToggle(anime, variant, isExpanded, onToggleExpand) {
    const idPrefix = variant === 'sidebar' ? 'sidebar-anime-' : 'tab-anime-';
    const handleToggle = () => {
        const expand = !isExpanded;
        onToggleExpand(expand ? { id: anime.mal_id, source: variant === 'sidebar' ? 'sidebar' : 'today' } : null);
        if (expand) {
            setTimeout(() => {
                const el = document.getElementById(idPrefix + anime.mal_id);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 310);
        }
    };
    return { idPrefix, handleToggle };
}

export default memo(function AnimeCard({
    anime,
    variant,
    isExpanded,
    isWatching,
    isMobile: isMobileProp,
    onToggleExpand,
    onMouseEnter,
    onMouseLeave,
}) {
    const isTouchOrMobileMedia = useMediaQuery('(hover: none), (pointer: coarse), (max-width: 1024px)');
    const isTouchOrMobile = isMobileProp !== undefined ? isMobileProp : isTouchOrMobileMedia;
    const { idPrefix, handleToggle } = useExpandToggle(anime, variant, isExpanded, onToggleExpand);
    const trailerId = extractTrailerId(anime);

    const sharedInteraction = {
        onClick: handleToggle,
        onKeyDown: (e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); handleToggle(); } },
        role: 'button',
        'aria-label': anime.title,
        'aria-expanded': !!isExpanded,
        tabIndex: 0,
        onMouseEnter: (e) => {
            if (!isTouchOrMobile && !isExpanded && onMouseEnter) {
                onMouseEnter(e, anime);
            }
        },
        onMouseLeave: (e) => {
            if (!isTouchOrMobile && onMouseLeave) {
                onMouseLeave(e);
            }
        },
    };

    if (variant === 'sidebar') {
        return (
            <div
                id={idPrefix + anime.mal_id}
                className={`anime-card ${isWatching ? 'watched-highlight' : ''} ${isExpanded ? 'expanded' : ''}`}
                {...sharedInteraction}
            >
                <div className="anime-card-main">
                    <div className="anime-img-container">
                        <img
                            src={anime.images?.jpg?.image_url || anime.images?.jpg?.large_image_url || anime.images?.jpg?.small_image_url}
                            alt={anime.title}
                            loading="lazy"
                            decoding="async"
                        />
                    </div>
                    <div className="anime-info">
                        <div className="anime-title">{anime.title}</div>
                        <div className="anime-time">
                            <span>🕒 {formatBroadcastTime(anime.broadcast?.time, anime.airingAt)}{anime.score ? ` • ⭐ ${anime.score}` : ''}</span>
                        </div>
                        <CountdownBadge broadcast={anime.broadcast} airingAt={anime.airingAt} />
                    </div>
                </div>
                <div className="synopsis-wrapper" aria-hidden={!isExpanded} inert={!isExpanded}>
                    <div className="anime-synopsis-panel">
                        <div className="synopsis-inner">
                            <div className="anime-genres">
                                {(anime.genres || []).slice(0, 3).map(g => (
                                    <span key={g.mal_id} className="anime-tag">{g.name}</span>
                                ))}
                            </div>
                            {isTouchOrMobile && trailerId && isExpanded && (
                                <div className="anime-card-trailer" onClick={(e) => e.stopPropagation()}>
                                    <iframe
                                        title={`${anime.title} Trailer`}
                                        src={`https://www.youtube.com/embed/${trailerId}?enablejsapi=1&modestbranding=1&rel=0&playsinline=1`}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        loading="lazy"
                                    />
                                </div>
                            )}
                            <p className="anime-synopsis-text">{anime.synopsis || 'No synopsis available.'}</p>
                            <a href={anime.url} target="_blank" rel="noopener noreferrer" className="anime-mal-link" onClick={(e) => e.stopPropagation()}>
                                View on MyAnimeList ↗
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // variant === 'today'
    return (
        <div
            id={idPrefix + anime.mal_id}
            className={`tab-item ${isWatching ? 'watched-highlight' : ''} ${isExpanded ? 'expanded' : ''}`}
            {...sharedInteraction}
        >
            <div className="tab-item-main">
                <div className="tab-img-container">
                    <img src={anime.images?.jpg?.small_image_url} alt={anime.title} loading="lazy" decoding="async" />
                </div>
                <div className="tab-item-info">
                    <div className="tab-item-title">{anime.title}</div>
                    <div className="tab-item-meta">
                        <span>⭐ {anime.score || 'N/A'} • 🕒 {formatBroadcastTime(anime.broadcast?.time, anime.airingAt)}</span>
                    </div>
                </div>
                <div className="tab-item-timer">
                    <CountdownBadge broadcast={anime.broadcast} airingAt={anime.airingAt} />
                </div>
            </div>
            <div className="tab-synopsis-wrapper" aria-hidden={!isExpanded} inert={!isExpanded}>
                <div className="tab-synopsis-panel">
                    <div className="tab-synopsis-inner">
                        {isTouchOrMobile && trailerId && isExpanded && (
                            <div className="anime-card-trailer" onClick={(e) => e.stopPropagation()}>
                                <iframe
                                    title={`${anime.title} Trailer`}
                                    src={`https://www.youtube.com/embed/${trailerId}?enablejsapi=1&modestbranding=1&rel=0&playsinline=1`}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    loading="lazy"
                                />
                            </div>
                        )}
                        <p className="anime-synopsis-text">{anime.synopsis || 'No synopsis available.'}</p>
                        <a href={anime.url} target="_blank" rel="noopener noreferrer" className="anime-mal-link" onClick={(e) => e.stopPropagation()}>
                            View on MyAnimeList ↗
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
});
