import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AnimeCard from '../AnimeCard.jsx';
import { formatBroadcastTime } from '../../../services/animeService';

vi.mock('../AnimeCard.jsx', async (importOriginal) => importOriginal());

const baseAnime = {
    mal_id: 1,
    title: 'Attack on Titan',
    score: 9.1,
    synopsis: 'Humans fight titans.',
    url: 'https://myanimelist.net/anime/1',
    images: {
        jpg: {
            image_url: 'https://cdn.example.com/large.jpg',
            large_image_url: 'https://cdn.example.com/large.jpg',
            small_image_url: 'https://cdn.example.com/small.jpg',
        },
    },
    broadcast: { time: '23:00', day: 'sunday' },
    genres: [
        { mal_id: 1, name: 'Action' },
        { mal_id: 2, name: 'Drama' },
        { mal_id: 3, name: 'Fantasy' },
        { mal_id: 4, name: 'Horror' },
    ],
};

const defaultProps = {
    anime: baseAnime,
    variant: 'sidebar',
    isExpanded: false,
    isWatching: false,
    onToggleExpand: vi.fn(),
    onMouseEnter: vi.fn(),
    onMouseLeave: vi.fn(),
};

beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T10:00:00Z'));
});

afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
});

describe('AnimeCard — sidebar variant rendering', () => {
    it('renders the anime title', () => {
        render(<AnimeCard {...defaultProps} />);
        expect(screen.getByText('Attack on Titan')).toBeTruthy();
    });

    it('renders the score', () => {
        render(<AnimeCard {...defaultProps} />);
        expect(screen.getByText(/9\.1/)).toBeTruthy();
    });

    it('renders the broadcast time', () => {
        render(<AnimeCard {...defaultProps} />);
        expect(screen.getByText(/23:00/)).toBeTruthy();
    });

    it('renders the synopsis', () => {
        render(<AnimeCard {...defaultProps} />);
        expect(screen.getByText('Humans fight titans.')).toBeTruthy();
    });

    it('renders the MAL link with correct href', () => {
        render(<AnimeCard {...defaultProps} />);
        const link = screen.getByRole('link', { name: /myanimelist/i, hidden: true });
        expect(link.getAttribute('href')).toBe('https://myanimelist.net/anime/1');
    });

    it('renders the MAL link with target _blank and rel noopener', () => {
        render(<AnimeCard {...defaultProps} />);
        const link = screen.getByRole('link', { name: /myanimelist/i, hidden: true });
        expect(link.getAttribute('target')).toBe('_blank');
        expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    });

    it('renders the cover image with correct src and alt', () => {
        render(<AnimeCard {...defaultProps} />);
        const img = screen.getByAltText('Attack on Titan');
        expect(img.getAttribute('src')).toBe('https://cdn.example.com/large.jpg');
    });

    it('renders up to 3 genre tags, not 4', () => {
        render(<AnimeCard {...defaultProps} />);
        expect(screen.getByText('Action')).toBeTruthy();
        expect(screen.getByText('Drama')).toBeTruthy();
        expect(screen.getByText('Fantasy')).toBeTruthy();
        expect(screen.queryByText('Horror')).toBeNull();
    });

    it('falls back to "No synopsis available." when synopsis is absent', () => {
        const anime = { ...baseAnime, synopsis: undefined };
        render(<AnimeCard {...defaultProps} anime={anime} />);
        expect(screen.getByText('No synopsis available.')).toBeTruthy();
    });

    it('falls back to "?" for broadcast time when absent', () => {
        const anime = { ...baseAnime, broadcast: {} };
        render(<AnimeCard {...defaultProps} anime={anime} />);
        expect(screen.getByText(/\?/)).toBeTruthy();
    });

    it('does not show score separator when score is absent', () => {
        const anime = { ...baseAnime, score: null };
        render(<AnimeCard {...defaultProps} anime={anime} />);
        expect(screen.queryByText(/⭐/)).toBeNull();
    });

    it('renders correct element id', () => {
        const { container } = render(<AnimeCard {...defaultProps} />);
        expect(container.querySelector('#sidebar-anime-1')).toBeTruthy();
    });

    it('applies watched-highlight class when isWatching=true', () => {
        const { container } = render(<AnimeCard {...defaultProps} isWatching={true} />);
        expect(container.firstChild.classList.contains('watched-highlight')).toBe(true);
    });

    it('does not apply watched-highlight when isWatching=false', () => {
        const { container } = render(<AnimeCard {...defaultProps} />);
        expect(container.firstChild.classList.contains('watched-highlight')).toBe(false);
    });

    it('applies expanded class when isExpanded=true', () => {
        const { container } = render(<AnimeCard {...defaultProps} isExpanded={true} />);
        expect(container.firstChild.classList.contains('expanded')).toBe(true);
    });

    it('does not apply expanded class when isExpanded=false', () => {
        const { container } = render(<AnimeCard {...defaultProps} />);
        expect(container.firstChild.classList.contains('expanded')).toBe(false);
    });

    it('has role=button and tabIndex=0', () => {
        const { container } = render(<AnimeCard {...defaultProps} />);
        const card = container.firstChild;
        expect(card.getAttribute('role')).toBe('button');
        expect(card.getAttribute('tabindex')).toBe('0');
    });

    it('renders no genres gracefully when genres is empty', () => {
        const anime = { ...baseAnime, genres: [] };
        const { container } = render(<AnimeCard {...defaultProps} anime={anime} />);
        expect(container.querySelectorAll('.anime-tag')).toHaveLength(0);
    });

    it('renders no genres gracefully when genres is absent', () => {
        const anime = { ...baseAnime, genres: undefined };
        const { container } = render(<AnimeCard {...defaultProps} anime={anime} />);
        expect(container.querySelectorAll('.anime-tag')).toHaveLength(0);
    });
});

describe('AnimeCard — today variant rendering', () => {
    const todayProps = { ...defaultProps, variant: 'today' };

    it('renders the title', () => {
        render(<AnimeCard {...todayProps} />);
        expect(screen.getByText('Attack on Titan')).toBeTruthy();
    });

    it('renders score and broadcast time', () => {
        render(<AnimeCard {...todayProps} />);
        expect(screen.getByText(/9\.1/)).toBeTruthy();
        expect(screen.getByText(/23:00/)).toBeTruthy();
    });

    it('shows N/A when score is absent', () => {
        const anime = { ...baseAnime, score: null };
        render(<AnimeCard {...todayProps} anime={anime} />);
        expect(screen.getByText(/N\/A/)).toBeTruthy();
    });

    it('renders small image', () => {
        render(<AnimeCard {...todayProps} />);
        const img = screen.getByAltText('Attack on Titan');
        expect(img.getAttribute('src')).toBe('https://cdn.example.com/small.jpg');
    });

    it('renders correct element id with tab- prefix', () => {
        const { container } = render(<AnimeCard {...todayProps} />);
        expect(container.querySelector('#tab-anime-1')).toBeTruthy();
    });

    it('applies watched-highlight class', () => {
        const { container } = render(<AnimeCard {...todayProps} isWatching={true} />);
        expect(container.firstChild.classList.contains('watched-highlight')).toBe(true);
    });

    it('applies expanded class', () => {
        const { container } = render(<AnimeCard {...todayProps} isExpanded={true} />);
        expect(container.firstChild.classList.contains('expanded')).toBe(true);
    });
});

describe('AnimeCard — click and keyboard interactions', () => {
    it('calls onToggleExpand with expand payload on click when collapsed', () => {
        const onToggleExpand = vi.fn();
        render(<AnimeCard {...defaultProps} onToggleExpand={onToggleExpand} isExpanded={false} />);
        fireEvent.click(screen.getByRole('button'));
        expect(onToggleExpand).toHaveBeenCalledOnce();
        expect(onToggleExpand).toHaveBeenCalledWith({ id: 1, source: 'sidebar' });
    });

    it('calls onToggleExpand with null on click when already expanded', () => {
        const onToggleExpand = vi.fn();
        render(<AnimeCard {...defaultProps} onToggleExpand={onToggleExpand} isExpanded={true} />);
        fireEvent.click(screen.getByRole('button'));
        expect(onToggleExpand).toHaveBeenCalledWith(null);
    });

    it('calls onToggleExpand on Enter key', () => {
        const onToggleExpand = vi.fn();
        render(<AnimeCard {...defaultProps} onToggleExpand={onToggleExpand} isExpanded={false} />);
        fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
        expect(onToggleExpand).toHaveBeenCalledOnce();
    });

    it('calls onToggleExpand on Space key', () => {
        const onToggleExpand = vi.fn();
        render(<AnimeCard {...defaultProps} onToggleExpand={onToggleExpand} isExpanded={false} />);
        fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
        expect(onToggleExpand).toHaveBeenCalledOnce();
    });

    it('does not call onToggleExpand on other keys', () => {
        const onToggleExpand = vi.fn();
        render(<AnimeCard {...defaultProps} onToggleExpand={onToggleExpand} />);
        fireEvent.keyDown(screen.getByRole('button'), { key: 'Tab' });
        expect(onToggleExpand).not.toHaveBeenCalled();
    });

    it('calls onMouseEnter with event and anime on hover', () => {
        const onMouseEnter = vi.fn();
        render(<AnimeCard {...defaultProps} onMouseEnter={onMouseEnter} />);
        fireEvent.mouseEnter(screen.getByRole('button'));
        expect(onMouseEnter).toHaveBeenCalledOnce();
        expect(onMouseEnter.mock.calls[0][1]).toBe(baseAnime);
    });

    it('calls onMouseLeave on mouse leave', () => {
        const onMouseLeave = vi.fn();
        render(<AnimeCard {...defaultProps} onMouseLeave={onMouseLeave} />);
        fireEvent.mouseLeave(screen.getByRole('button'));
        expect(onMouseLeave).toHaveBeenCalledOnce();
    });

    it('today variant calls onToggleExpand with source=today', () => {
        const onToggleExpand = vi.fn();
        render(<AnimeCard {...defaultProps} variant="today" onToggleExpand={onToggleExpand} isExpanded={false} />);
        fireEvent.click(screen.getByRole('button'));
        expect(onToggleExpand).toHaveBeenCalledWith({ id: 1, source: 'today' });
    });
});

describe('AnimeCard — image fallback chain (sidebar)', () => {
    it('uses large_image_url when image_url is absent', () => {
        const anime = {
            ...baseAnime,
            images: { jpg: { large_image_url: 'https://cdn.example.com/large.jpg', small_image_url: 'small.jpg' } },
        };
        render(<AnimeCard {...defaultProps} anime={anime} />);
        expect(screen.getByAltText('Attack on Titan').getAttribute('src')).toBe('https://cdn.example.com/large.jpg');
    });

    it('uses small_image_url as last resort', () => {
        const anime = {
            ...baseAnime,
            images: { jpg: { small_image_url: 'https://cdn.example.com/small.jpg' } },
        };
        render(<AnimeCard {...defaultProps} anime={anime} />);
        expect(screen.getByAltText('Attack on Titan').getAttribute('src')).toBe('https://cdn.example.com/small.jpg');
    });
});

describe('AnimeCard — CountdownBadge', () => {
    it('renders countdown badge when broadcast is valid', () => {
        const { container } = render(<AnimeCard {...defaultProps} />);
        expect(container.querySelector('.anime-countdown')).toBeTruthy();
    });

    it('does not render countdown when broadcast is absent', () => {
        const anime = { ...baseAnime, broadcast: null };
        const { container } = render(<AnimeCard {...defaultProps} anime={anime} />);
        expect(container.querySelector('.anime-countdown')).toBeNull();
    });

    it('does not render countdown when broadcast has no time', () => {
        const anime = { ...baseAnime, broadcast: { day: 'monday' } };
        const { container } = render(<AnimeCard {...defaultProps} anime={anime} />);
        expect(container.querySelector('.anime-countdown')).toBeNull();
    });

    it('does not render countdown when broadcast has no day', () => {
        const anime = { ...baseAnime, broadcast: { time: '12:00' } };
        const { container } = render(<AnimeCard {...defaultProps} anime={anime} />);
        expect(container.querySelector('.anime-countdown')).toBeNull();
    });

    it('shows "Out Now!" when episode released within last 24 JST hours', () => {
        const now = new Date('2026-06-01T10:00:00Z');
        vi.setSystemTime(now);
        const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const day = dayNames[jstNow.getUTCDay()];
        const broadcastTime = new Date(jstNow.getTime() - 2 * 60 * 60 * 1000);
        const h = String(broadcastTime.getUTCHours()).padStart(2, '0');
        const m = String(broadcastTime.getUTCMinutes()).padStart(2, '0');
        const anime = { ...baseAnime, broadcast: { time: `${h}:${m}`, day } };
        render(<AnimeCard {...defaultProps} anime={anime} />);
        expect(screen.getByText('Out Now!')).toBeTruthy();
    });

    it('shows exact countdown without artificial 90-minute delay', () => {
        const now = new Date('2026-06-01T10:00:00Z'); // 19:00 JST Monday
        vi.setSystemTime(now);
        // Airing at 23:30 JST Monday (4h 30m away)
        const anime = { ...baseAnime, broadcast: { time: '23:30', day: 'monday' } };
        render(<AnimeCard {...defaultProps} anime={anime} />);
        expect(screen.getByText('4h 30m')).toBeTruthy();
    });

    it('uses exact airingAt timestamp for countdown when provided', () => {
        const now = new Date('2026-06-01T10:00:00Z');
        vi.setSystemTime(now);
        // Airing in 3 hours 15 minutes
        const airEpoch = Math.floor((now.getTime() + (3 * 3600 + 15 * 60) * 1000) / 1000);
        const anime = { ...baseAnime, airingAt: airEpoch };
        render(<AnimeCard {...defaultProps} anime={anime} />);
        expect(screen.getByText('3h 15m')).toBeTruthy();
    });
});

describe('formatBroadcastTime helper', () => {
    it('returns "?" for null or empty string', () => {
        expect(formatBroadcastTime(null)).toBe('?');
        expect(formatBroadcastTime('')).toBe('?');
        expect(formatBroadcastTime(undefined)).toBe('?');
    });

    it('returns original string if format is invalid', () => {
        expect(formatBroadcastTime('invalid')).toBe('invalid');
        expect(formatBroadcastTime('abc:def')).toBe('abc:def');
    });

    it('formats valid JST time with the selected zone offset and JST reference', () => {
        const result = formatBroadcastTime('23:30', undefined, 'en-GB', 'Europe/Lisbon');
        expect(result).toContain('23:30 JST');
        expect(result).toMatch(/\d{2}:\d{2} GMT(?:\+1)? \/ 23:30 JST/);
    });

    it('identifies the Japan weekday when the local day differs', () => {
        const result = formatBroadcastTime(null, Date.UTC(2026, 9, 15, 15, 45) / 1000, 'en-GB', 'Europe/Lisbon');
        expect(result).toContain('00:45 JST');
        expect(result).toContain('16:45 GMT+1');
        expect(result).toContain('(Fri)');
    });

    it('formats exact local and JST times from airingAt epoch timestamp when provided', () => {
        const airEpoch = Math.floor(Date.UTC(2026, 9, 15, 14, 30) / 1000);
        const result = formatBroadcastTime(null, airEpoch, 'en-GB', 'Europe/Lisbon');
        expect(result).toBe('15:30 GMT+1 / 23:30 JST');
    });
});

describe('AnimeCard — in-card embedded trailer', () => {
    const animeWithTrailer = {
        ...baseAnime,
        trailer: {
            youtube_id: 'sampleYt123',
            embed_url: 'https://www.youtube.com/embed/sampleYt123',
            url: 'https://www.youtube.com/watch?v=sampleYt123'
        }
    };

    it.each([
        [390, 844, false], [820, 1180, false], [1180, 820, false],
        [1200, 800, false], [1366, 1024, true], [1600, 1000, true],
    ])('uses in-card trailers at %ix%i with touch=%s in both lists', (width, _height, touch) => {
        vi.stubGlobal('matchMedia', vi.fn(query => ({
            matches: width <= Number(query.match(/max-width: (\d+)px/)?.[1]) || touch,
            addEventListener: vi.fn(), removeEventListener: vi.fn(),
        })));
        for (const variant of ['today', 'sidebar']) {
            const onMouseEnter = vi.fn();
            const onToggleExpand = vi.fn();
            const { container, rerender, unmount } = render(
                <AnimeCard {...defaultProps} anime={animeWithTrailer} variant={variant} onMouseEnter={onMouseEnter} onToggleExpand={onToggleExpand} />
            );
            fireEvent.mouseEnter(container.firstChild);
            expect(onMouseEnter).not.toHaveBeenCalled();
            expect(container.querySelector('iframe')).toBeNull();
            fireEvent.click(container.firstChild);
            expect(onToggleExpand).toHaveBeenCalledWith({ id: 1, source: variant });
            rerender(<AnimeCard {...defaultProps} anime={animeWithTrailer} variant={variant} isExpanded />);
            expect(container.querySelector('.anime-card-trailer iframe').src).toContain('sampleYt123');
            unmount();
        }
    });

    it('renders iframe trailer inside card when isExpanded is true on mobile (sidebar variant)', () => {
        const { container } = render(
            <AnimeCard {...defaultProps} anime={animeWithTrailer} variant="sidebar" isExpanded={true} isMobile={true} />
        );
        const trailerBox = container.querySelector('.anime-card-trailer');
        expect(trailerBox).toBeTruthy();
        const iframe = trailerBox.querySelector('iframe');
        expect(iframe).toBeTruthy();
        expect(iframe.src).toContain('sampleYt123');
    });

    it('renders iframe trailer inside card when isExpanded is true on mobile (today variant)', () => {
        const { container } = render(
            <AnimeCard {...defaultProps} anime={animeWithTrailer} variant="today" isExpanded={true} isMobile={true} />
        );
        const trailerBox = container.querySelector('.anime-card-trailer');
        expect(trailerBox).toBeTruthy();
        const iframe = trailerBox.querySelector('iframe');
        expect(iframe).toBeTruthy();
        expect(iframe.src).toContain('sampleYt123');
    });

    it('does not render iframe trailer on desktop even when isExpanded is true', () => {
        const { container } = render(
            <AnimeCard {...defaultProps} anime={animeWithTrailer} variant="sidebar" isExpanded={true} isMobile={false} />
        );
        expect(container.querySelector('.anime-card-trailer')).toBeNull();
    });

    it('does not render iframe trailer when isExpanded is false on mobile', () => {
        const { container } = render(
            <AnimeCard {...defaultProps} anime={animeWithTrailer} variant="sidebar" isExpanded={false} isMobile={true} />
        );
        expect(container.querySelector('.anime-card-trailer')).toBeNull();
    });

    it('clicking on trailer container stops propagation and does not toggle expand', () => {
        const onToggleExpand = vi.fn();
        const { container } = render(
            <AnimeCard {...defaultProps} anime={animeWithTrailer} variant="sidebar" isExpanded={true} isMobile={true} onToggleExpand={onToggleExpand} />
        );
        const trailerBox = container.querySelector('.anime-card-trailer');
        expect(trailerBox).toBeTruthy();
        fireEvent.click(trailerBox);
        expect(onToggleExpand).not.toHaveBeenCalled();
    });

    it('does not call onMouseEnter on mobile devices', () => {
        const onMouseEnter = vi.fn();
        const { container } = render(
            <AnimeCard {...defaultProps} anime={animeWithTrailer} variant="sidebar" isExpanded={false} isMobile={true} onMouseEnter={onMouseEnter} />
        );
        fireEvent.mouseEnter(container.firstChild);
        expect(onMouseEnter).not.toHaveBeenCalled();
    });

    it('calls onMouseEnter on desktop when not expanded', () => {
        const onMouseEnter = vi.fn();
        const { container } = render(
            <AnimeCard {...defaultProps} anime={animeWithTrailer} variant="sidebar" isExpanded={false} isMobile={false} onMouseEnter={onMouseEnter} />
        );
        fireEvent.mouseEnter(container.firstChild);
        expect(onMouseEnter).toHaveBeenCalledWith(expect.anything(), animeWithTrailer);
    });

    it('does not call onMouseEnter when card is already expanded on desktop', () => {
        const onMouseEnter = vi.fn();
        const { container } = render(
            <AnimeCard {...defaultProps} anime={animeWithTrailer} variant="sidebar" isExpanded={true} isMobile={false} onMouseEnter={onMouseEnter} />
        );
        fireEvent.mouseEnter(container.firstChild);
        expect(onMouseEnter).not.toHaveBeenCalled();
    });
});
