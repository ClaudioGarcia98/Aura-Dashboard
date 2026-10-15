import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Quote from './Quote';

describe('Quote Component', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders a default quote initially with text, author, and anime', () => {
        const { container } = render(<Quote />);
        expect(container.querySelector('.quote-content')).toBeTruthy();
        expect(container.querySelector('.quote-text')).toBeTruthy();
        expect(container.querySelector('.quote-author')).toBeTruthy();
        expect(container.querySelector('.quote-anime')).toBeTruthy();
    });

    it('fetches a new quote on click when network is available', async () => {
        globalThis.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ quote: 'Test Network Quote', character: 'Test Author', anime: 'Test Anime' }),
        });

        render(<Quote />);
        const quoteBtn = screen.getByRole('button', { name: /click for a new quote/i });

        await act(async () => {
            fireEvent.click(quoteBtn);
        });

        // Wait for internal transition timeout (250ms)
        await act(async () => {
            await new Promise((r) => setTimeout(r, 350));
        });

        expect(screen.getByText(/"Test Network Quote"/i)).toBeTruthy();
        expect(screen.getByText(/Test Author/i)).toBeTruthy();
    });

    it('falls back to local curated quote bank when network fails', async () => {
        globalThis.fetch.mockRejectedValueOnce(new Error('Network offline'));

        render(<Quote />);
        const quoteBtn = screen.getByRole('button', { name: /click for a new quote/i });

        await act(async () => {
            fireEvent.click(quoteBtn);
        });

        await act(async () => {
            await new Promise((r) => setTimeout(r, 350));
        });

        const textEl = document.querySelector('.quote-text');
        expect(textEl?.textContent.length).toBeGreaterThan(5);
    });

    it('triggers new quote on Enter keydown', async () => {
        globalThis.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ quote: 'Keyboard Quote', character: 'Key Author', anime: 'Key Anime' }),
        });

        render(<Quote />);
        const quoteBtn = screen.getByRole('button', { name: /click for a new quote/i });

        await act(async () => {
            fireEvent.keyDown(quoteBtn, { key: 'Enter', code: 'Enter' });
        });

        await act(async () => {
            await new Promise((r) => setTimeout(r, 350));
        });

        expect(screen.getByText(/"Keyboard Quote"/i)).toBeTruthy();
    });
});
