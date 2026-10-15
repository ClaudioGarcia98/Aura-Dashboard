import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

function BuggyComponent({ shouldThrow }) {
    if (shouldThrow) {
        throw new Error('Test exploding error');
    }
    return <div>Normal Content</div>;
}

describe('ErrorBoundary', () => {
    let consoleErrorSpy;

    beforeEach(() => {
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    it('renders children when no error is thrown', () => {
        render(
            <ErrorBoundary>
                <div>Safe Child</div>
            </ErrorBoundary>
        );
        expect(screen.getByText('Safe Child')).toBeTruthy();
    });

    it('renders default error UI and logs error when child throws', () => {
        render(
            <ErrorBoundary>
                <BuggyComponent shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText('Something went wrong with this component.')).toBeTruthy();
        expect(screen.getByRole('button', { name: /retry/i })).toBeTruthy();
        expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('renders custom fallback when fallback prop is provided', () => {
        render(
            <ErrorBoundary fallback={<div>Custom Error View</div>}>
                <BuggyComponent shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText('Custom Error View')).toBeTruthy();
        expect(screen.queryByText('Something went wrong with this component.')).toBeNull();
    });

    it('resets error state when Retry button is clicked', () => {
        let shouldThrow = true;

        function DynamicBuggyComponent() {
            if (shouldThrow) {
                throw new Error('Temporary failure');
            }
            return <div>Recovered Content</div>;
        }

        render(
            <ErrorBoundary>
                <DynamicBuggyComponent />
            </ErrorBoundary>
        );

        expect(screen.getByText('Something went wrong with this component.')).toBeTruthy();

        // Change condition so next render won't throw
        shouldThrow = false;

        const retryBtn = screen.getByRole('button', { name: /retry/i });
        fireEvent.click(retryBtn);

        expect(screen.getByText('Recovered Content')).toBeTruthy();
        expect(screen.queryByText('Something went wrong with this component.')).toBeNull();
    });
});
