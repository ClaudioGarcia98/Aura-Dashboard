import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TodayLaunch from '../TodayLaunch';

vi.mock('../AnimeCard', () => ({
    default: ({ anime, variant }) => (
        <div data-testid="anime-card" data-id={anime.mal_id} data-variant={variant}>
            {anime.title}
        </div>
    ),
}));

describe('TodayLaunch', () => {
    const baseProps = {
        displayList: [],
        todayLoading: false,
        todayError: false,
        expandedAnime: null,
        setExpandedAnime: vi.fn(),
        userWatchingIds: [],
        onMouseEnter: vi.fn(),
        onMouseLeave: vi.fn(),
    };

    it('renders the header title and info badge hint', () => {
        render(<TodayLaunch {...baseProps} />);
        expect(screen.getByText("Today's Launch")).toBeTruthy();
        expect(screen.getByText(/We automatically prioritize the shows you are currently watching/)).toBeTruthy();
    });

    it('renders error state when todayError is truthy', () => {
        render(<TodayLaunch {...baseProps} todayError={true} />);
        expect(screen.getByText("Couldn't connect to MyAnimeList right now.")).toBeTruthy();
    });

    it('renders skeletons when todayLoading is true', () => {
        const { container } = render(<TodayLaunch {...baseProps} todayLoading={true} />);
        const skeletons = container.querySelectorAll('.skeleton-card');
        expect(skeletons.length).toBe(5);
    });

    it('renders empty message when displayList is empty and not loading or error', () => {
        render(<TodayLaunch {...baseProps} displayList={[]} />);
        expect(screen.getByText('No anime airing today.')).toBeTruthy();
    });

    it('renders AnimeCard items when displayList has items', () => {
        const sampleAnime = [
            { mal_id: 101, title: 'Frieren: Beyond Journey\'s End' },
            { mal_id: 102, title: 'Jujutsu Kaisen' },
        ];
        render(<TodayLaunch {...baseProps} displayList={sampleAnime} userWatchingIds={[101]} />);
        
        const cards = screen.getAllByTestId('anime-card');
        expect(cards.length).toBe(2);
        expect(screen.getByText('Frieren: Beyond Journey\'s End')).toBeTruthy();
        expect(screen.getByText('Jujutsu Kaisen')).toBeTruthy();
        expect(cards[0].getAttribute('data-variant')).toBe('today');
    });
});
