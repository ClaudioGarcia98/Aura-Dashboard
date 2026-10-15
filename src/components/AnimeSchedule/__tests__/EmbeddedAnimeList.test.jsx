import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmbeddedAnimeList from '../EmbeddedAnimeList';

vi.mock('../AnimeCard', () => ({
    default: ({ anime, variant }) => (
        <div data-testid="anime-card" data-id={anime.mal_id} data-variant={variant}>
            {anime.title}
        </div>
    ),
}));

describe('EmbeddedAnimeList', () => {
    const baseProps = {
        activeDay: 'monday',
        setActiveDay: vi.fn(),
        sidebarData: [],
        sidebarLoading: false,
        sidebarError: false,
        expandedAnime: null,
        setExpandedAnime: vi.fn(),
        userWatchingIds: [],
        onMouseEnter: vi.fn(),
        onMouseLeave: vi.fn(),
    };

    it('renders the header and all 7 day filter buttons', () => {
        render(<EmbeddedAnimeList {...baseProps} />);
        expect(screen.getByText('Anime Schedule')).toBeTruthy();
        expect(screen.getByText('Daily Airing Episodes')).toBeTruthy();

        expect(screen.getByText('Mon').classList.contains('active')).toBe(true);
        expect(screen.getByText('Tue').classList.contains('active')).toBe(false);
        expect(screen.getByText('Sun')).toBeTruthy();
    });

    it('calls setActiveDay on day button click and keyboard interaction', () => {
        const handleSetActiveDay = vi.fn();
        render(<EmbeddedAnimeList {...baseProps} setActiveDay={handleSetActiveDay} />);

        const wedBtn = screen.getByText('Wed');
        fireEvent.click(wedBtn);
        expect(handleSetActiveDay).toHaveBeenCalledWith('wednesday');

        const friBtn = screen.getByText('Fri');
        fireEvent.keyDown(friBtn, { key: 'Enter' });
        expect(handleSetActiveDay).toHaveBeenCalledWith('friday');
    });

    it('renders error state when sidebarError is truthy', () => {
        render(<EmbeddedAnimeList {...baseProps} sidebarError={true} />);
        expect(screen.getByText("Couldn't connect to MyAnimeList right now.")).toBeTruthy();
    });

    it('renders skeletons when sidebarLoading is true', () => {
        const { container } = render(<EmbeddedAnimeList {...baseProps} sidebarLoading={true} />);
        expect(container.querySelectorAll('.skeleton-card').length).toBe(5);
    });

    it('renders empty message when sidebarData is empty', () => {
        render(<EmbeddedAnimeList {...baseProps} sidebarData={[]} />);
        expect(screen.getByText('No anime scheduled.')).toBeTruthy();
    });

    it('renders AnimeCard items with variant="sidebar" when sidebarData has items', () => {
        const animeList = [
            { mal_id: 201, title: 'Spy x Family' },
            { mal_id: 202, title: 'Chainsaw Man' },
        ];
        render(<EmbeddedAnimeList {...baseProps} sidebarData={animeList} />);

        const cards = screen.getAllByTestId('anime-card');
        expect(cards.length).toBe(2);
        expect(screen.getByText('Spy x Family')).toBeTruthy();
        expect(cards[0].getAttribute('data-variant')).toBe('sidebar');
    });
});
