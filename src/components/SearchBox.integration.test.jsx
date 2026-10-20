import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import SearchBox from './SearchBox';
import SpeedDial from './SpeedDial';
import SettingsPanel from './SettingsPanel/index';
import { useSettingsStore } from '../stores/useSettingsStore';
import { DEFAULT_SETTINGS } from '../stores/settingsSchema';
import searchStyles from './SearchBox.css?raw';
import speedDialStyles from './SpeedDial.css?raw';

beforeEach(() => {
    localStorage.clear();
    useSettingsStore.setState({ ...structuredClone(DEFAULT_SETTINGS), language: 'en' });
});

afterEach(() => {
    cleanup();
    useSettingsStore.setState(structuredClone(DEFAULT_SETTINGS));
    document.querySelectorAll('style[data-keyboard-test]').forEach(style => style.remove());
});

const focusSearch = () => fireEvent.keyDown(document, { key: ' ', code: 'Space', ctrlKey: true });

describe('search keyboard integration', () => {
    it.each(['settings', 'reset', 'import'])('keeps focus in the %s dialog during the search shortcut and restores it after closing', async kind => {
        const { container } = render(<><SearchBox /><SettingsPanel /></>);
        fireEvent.click(screen.getByRole('button', { name: 'Toggle Settings Panel' }));
        let dialog = screen.getByRole('dialog', { name: 'Aura Settings' });
        if (kind === 'reset') {
            fireEvent.click(screen.getByRole('button', { name: /Reset All Settings/ }));
            dialog = screen.getByRole('dialog', { name: 'Reset settings' });
        } else if (kind === 'import') {
            const file = new File(['invalid json'], 'invalid.json', { type: 'application/json' });
            fireEvent.change(container.querySelector('input[type="file"][accept=".json"]'), { target: { files: [file] } });
            dialog = await screen.findByRole('dialog', { name: 'Import Failed' });
        }
        focusSearch();
        expect(dialog.contains(document.activeElement)).toBe(true);
        expect(document.activeElement).not.toBe(screen.getByRole('combobox', { name: 'Search' }));

        fireEvent.keyDown(document, { key: 'Escape' });
        if (kind !== 'settings') fireEvent.keyDown(document, { key: 'Escape' });
        focusSearch();
        expect(document.activeElement).toBe(screen.getByRole('combobox', { name: 'Search' }));
    });

    it('ignores hidden modals and honors a shortcut already handled by another control', () => {
        const { container } = render(<><button>Elsewhere</button><div role="dialog" aria-modal="true" hidden /><SearchBox /></>);
        focusSearch();
        expect(document.activeElement).toBe(screen.getByRole('combobox', { name: 'Search' }));
        const outside = screen.getByRole('button', { name: 'Elsewhere' });
        outside.focus();
        const event = new KeyboardEvent('keydown', { key: ' ', code: 'Space', ctrlKey: true, cancelable: true, bubbles: true });
        event.preventDefault();
        fireEvent(container, event);
        expect(document.activeElement).toBe(outside);
    });
});

describe('focused action visibility', () => {
    function applyStyles(styles) {
        const element = document.createElement('style');
        element.dataset.keyboardTest = '';
        element.textContent = styles;
        document.head.append(element);
    }

    it('reveals the speed-dial delete action when keyboard-focused', () => {
        useSettingsStore.getState().setSpeedDials([{ id: 'test', name: 'Example', url: 'https://example.com/' }]);
        render(<SpeedDial />);
        const remove = screen.getByRole('button', { name: 'Remove Speed Dial' });
        remove.focus();
        // Attach the stylesheet after focus so JSDOM evaluates the current pseudo-class state.
        applyStyles(speedDialStyles);
        expect(getComputedStyle(remove).opacity).toBe('1');
    });

    it('reveals recent-search removal when keyboard-focused without arrow selection', () => {
        localStorage.setItem('dash_recent', JSON.stringify([{ query: 'docs', engineName: 'Google', url: 'https://example.com/' }]));
        render(<SearchBox />);
        fireEvent.focus(screen.getByRole('combobox', { name: 'Search' }));
        const remove = screen.getByRole('button', { name: 'Remove docs from history' });
        act(() => remove.focus());
        applyStyles(searchStyles);
        expect(getComputedStyle(remove).opacity).toBe('1');
        expect(screen.getByRole('option').getAttribute('aria-selected')).toBe('false');
    });
});
