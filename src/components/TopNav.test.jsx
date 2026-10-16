import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TopNav from './TopNav';

describe('TopNav', () => {
    const tabs = [
        { id: 'home', label: 'Home' },
        { id: 'anime', label: 'Anime' },
        { id: 'lofi', label: 'Lofi' },
        { id: 'settings', label: 'Settings' },
    ];

    it('renders the brand title Aura and logo', () => {
        render(<TopNav tabs={tabs} activeTab="home" onTabChange={vi.fn()} lofiPlaying={false} />);
        expect(screen.getByText('Aura')).toBeTruthy();
        const logo = screen.getByAltText('Aura');
        expect(logo).toBeTruthy();
    });

    it('renders all tab buttons with correct aria-selected attribute', () => {
        render(<TopNav tabs={tabs} activeTab="anime" onTabChange={vi.fn()} lofiPlaying={false} />);
        const homeTab = screen.getByRole('tab', { name: 'Home' });
        const animeTab = screen.getByRole('tab', { name: 'Anime' });
        const lofiTab = screen.getByRole('tab', { name: 'Lofi' });
        const settingsTab = screen.getByRole('tab', { name: 'Settings' });

        expect(homeTab.getAttribute('aria-selected')).toBe('false');
        expect(animeTab.getAttribute('aria-selected')).toBe('true');
        expect(lofiTab.getAttribute('aria-selected')).toBe('false');
        expect(settingsTab.getAttribute('aria-selected')).toBe('false');
    });

    it('triggers onTabChange with the correct tab id when a tab is clicked', () => {
        const handleTabChange = vi.fn();
        render(<TopNav tabs={tabs} activeTab="home" onTabChange={handleTabChange} lofiPlaying={false} />);
        
        fireEvent.click(screen.getByRole('tab', { name: 'Lofi' }));
        expect(handleTabChange).toHaveBeenCalledWith('lofi');

        fireEvent.click(screen.getByRole('tab', { name: 'Settings' }));
        expect(handleTabChange).toHaveBeenCalledWith('settings');
    });

    it('moves selection and focus with the arrow keys and links tabs to panels', () => {
        const change = vi.fn();
        render(<TopNav tabs={tabs} activeTab="home" onTabChange={change} />);
        const home = screen.getByRole('tab', { name: 'Home' });
        fireEvent.keyDown(home, { key: 'ArrowRight' });
        expect(change).toHaveBeenCalledWith('anime');
        expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Anime' }));
        expect(home.getAttribute('aria-controls')).toBe('panel-home');
    });

    it('renders the lofi pulse indicator when lofiPlaying is true', () => {
        const { rerender } = render(
            <TopNav tabs={tabs} activeTab="home" onTabChange={vi.fn()} lofiPlaying={false} />
        );
        expect(document.querySelector('.top-nav-pulse')).toBeNull();

        rerender(
            <TopNav tabs={tabs} activeTab="home" onTabChange={vi.fn()} lofiPlaying={true} />
        );
        expect(document.querySelector('.top-nav-pulse')).toBeTruthy();
    });
});
