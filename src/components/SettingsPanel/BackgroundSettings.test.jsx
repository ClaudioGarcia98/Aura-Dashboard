import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import BackgroundSettings from './BackgroundSettings';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { DEFAULT_SETTINGS } from '../../stores/settingsSchema';
import { DEFAULT_BACKGROUND } from '../../constants/background';
import { saveBackgroundBlob, deleteBackgroundBlob } from '../../services/db';
import { gifBlob, mockMediaDecoder } from '../../testSupport/backgroundMedia';

vi.mock('../../services/db', () => ({ saveBackgroundBlob: vi.fn(), deleteBackgroundBlob: vi.fn() }));
let decoder;
beforeEach(() => {
    vi.clearAllMocks(); localStorage.clear();
    useSettingsStore.setState({ ...structuredClone(DEFAULT_SETTINGS), language: 'en', backgroundUrl: DEFAULT_BACKGROUND.url, backgroundIsVideo: true });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:new');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    saveBackgroundBlob.mockResolvedValue(); deleteBackgroundBlob.mockResolvedValue();
    decoder = mockMediaDecoder({ automatic: false });
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const upload = (container, file) => fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [file] } });

it('shows the default filename and accepts the same media types as presets', () => {
    const { container } = render(<BackgroundSettings />);
    expect(screen.getByText('Default (animated_gif.mp4)')).toBeTruthy();
    expect(container.querySelector('input[type="file"]').accept).toContain('video/webm');
});

it('shows validation progress and saves a decoded uploaded file', async () => {
    const { container } = render(<BackgroundSettings />);
    const file = new File([gifBlob()], 'cozy.gif', { type: 'image/gif' });
    upload(container, file);
    expect(screen.getByRole('status').textContent).toContain('Checking');
    expect(saveBackgroundBlob).not.toHaveBeenCalled();
    act(() => decoder.images[0].onload());
    await waitFor(() => expect(screen.getByText('cozy.gif')).toBeTruthy());
    expect(saveBackgroundBlob).toHaveBeenCalledWith(file);
    expect(screen.queryByRole('status')).toBeNull();
    expect(container.querySelector('input[type="file"]').value).toBe('');
});

it('retains the working background and presents a useful decode error', async () => {
    useSettingsStore.setState({ gifName: 'working.gif', backgroundUrl: 'blob:working' });
    const { container } = render(<BackgroundSettings />);
    upload(container, new File(['corrupt'], 'broken.mp4', { type: 'video/mp4' }));
    act(() => decoder.videos[0].onerror());
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('could not be played'));
    expect(useSettingsStore.getState().backgroundUrl).toBe('blob:working');
    expect(screen.getByText('working.gif')).toBeTruthy();
    expect(saveBackgroundBlob).not.toHaveBeenCalled();
});

it('allows restore to cancel a pending upload without reporting a cancellation error', async () => {
    useSettingsStore.setState({ gifName: 'working.gif', backgroundUrl: 'blob:working' });
    const { container } = render(<BackgroundSettings />);
    upload(container, new File([gifBlob()], 'slow.gif', { type: 'image/gif' }));
    fireEvent.click(screen.getByRole('button', { name: '↺ Restore' }));
    await waitFor(() => expect(screen.getByText('Default (animated_gif.mp4)')).toBeTruthy());
    expect(saveBackgroundBlob).not.toHaveBeenCalled();
    expect(deleteBackgroundBlob).toHaveBeenCalledOnce();
    expect(screen.queryByRole('alert')).toBeNull();
});

it('preserves the selected file if restoring the default fails', async () => {
    useSettingsStore.setState({ gifName: 'working.gif', backgroundUrl: 'blob:working' });
    deleteBackgroundBlob.mockRejectedValueOnce(new Error('Denied'));
    render(<BackgroundSettings />);
    fireEvent.click(screen.getByRole('button', { name: '↺ Restore' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Could not remove'));
    expect(useSettingsStore.getState().backgroundUrl).toBe('blob:working');
});
