import { useRef } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getActiveModal, useDialog } from './useDialog';

function Dialog({ active = true, onClose }) {
    const ref = useRef(null);
    useDialog(ref, active, onClose);
    return <><button>Outside</button><section ref={ref} role="dialog" aria-modal={active ? 'true' : undefined} tabIndex={-1}>
        <div style={{ display: 'none' }}><button>Hidden child</button></div>
        <input type="hidden" />
        <button tabIndex={-1}>Skipped</button>
        <select aria-label="Language"><option>English</option></select>
        <input type="file" />
        <fieldset disabled><button>Disabled fieldset child</button></fieldset>
        <textarea aria-label="Notes" />
    </section></>;
}

afterEach(cleanup);

describe('useDialog', () => {
    it('includes selects and textareas, skips hidden/disabled/negative-tabindex controls, and wraps focus', () => {
        render(<Dialog onClose={vi.fn()} />);
        const first = screen.getByRole('combobox', { name: 'Language' });
        const last = screen.getByRole('textbox', { name: 'Notes' });
        expect(document.activeElement).toBe(first);
        fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
        expect(document.activeElement).toBe(last);
        fireEvent.keyDown(last, { key: 'Tab' });
        expect(document.activeElement).toBe(first);
    });

    it('contains programmatic focus, closes on Escape and restores the previous focus', () => {
        const previous = document.createElement('button');
        document.body.append(previous);
        previous.focus();
        const close = vi.fn();
        const { unmount } = render(<Dialog onClose={close} />);
        screen.getByRole('button', { name: 'Outside' }).focus();
        expect(document.activeElement).toBe(screen.getByRole('combobox'));
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(close).toHaveBeenCalledOnce();
        unmount();
        expect(document.activeElement).toBe(previous);
        previous.remove();
    });

    it('returns the last visible modal and ignores hidden or inert ancestors', () => {
        render(<><section role="dialog" aria-modal="true" aria-label="Active" /><div hidden><section role="dialog" aria-modal="true" /></div><div inert><section role="dialog" aria-modal="true" /></div></>);
        expect(getActiveModal()).toBe(screen.getByRole('dialog', { name: 'Active' }));
    });
});
