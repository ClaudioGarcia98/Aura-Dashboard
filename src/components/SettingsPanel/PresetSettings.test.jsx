import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import PresetSettings from './PresetSettings';
import { applyAppearancePreset, createAppearancePreset } from '../../services/appearancePresets';

vi.mock('../../services/appearancePresets', async importOriginal => ({
    ...await importOriginal(), applyAppearancePreset: vi.fn(), createAppearancePreset: vi.fn(),
}));
const preset = JSON.stringify({ format: 'aura-preset', version: 1, name: 'Quiet evening', appearance: { theme: 'rose-pine', font: 'default' }, wallpaper: { kind: 'keep' }, music: { stations: [], selectedVideoId: null } });
beforeEach(() => { vi.clearAllMocks(); applyAppearancePreset.mockResolvedValue({}); });
afterEach(() => vi.restoreAllMocks());
function importFile(raw = preset) {
    const file = new File([raw], 'setup.aura-preset.json', { type: 'application/json' });
    Object.defineProperty(file, 'text', { value: async () => raw });
    fireEvent.change(screen.getByLabelText('Import appearance preset file'), { target: { files: [file] } });
}

it('previews theme, wallpaper and stations before applying an imported preset', async () => {
    render(<PresetSettings />);
    importFile();
    await screen.findByText('Quiet evening');
    expect(screen.getByText('Rosé Pine')).toBeTruthy();
    expect(screen.getByText('Keep your current wallpaper')).toBeTruthy();
    expect(applyAppearancePreset).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Apply preset' }));
    await waitFor(() => expect(applyAppearancePreset).toHaveBeenCalledWith(preset));
    expect(await screen.findByText('Preset applied. Enjoy your new setup.')).toBeTruthy();
});

it('cancels an imported preset without applying it', async () => {
    render(<PresetSettings />);
    importFile();
    await screen.findByText('Quiet evening');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Quiet evening')).toBeNull();
    expect(applyAppearancePreset).not.toHaveBeenCalled();
});

it('rejects an unrelated settings file without showing an Apply button', async () => {
    render(<PresetSettings />);
    importFile('{"format":"aura-settings","version":1}');
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Apply preset' })).toBeNull();
    expect(applyAppearancePreset).not.toHaveBeenCalled();
});

it('reports export failures and forwards the wallpaper opt-out', async () => {
    createAppearancePreset.mockRejectedValue(new Error('Could not read your wallpaper.'));
    render(<PresetSettings />);
    fireEvent.click(screen.getByRole('checkbox', { name: /Include wallpaper/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Export preset' }));
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Could not read your wallpaper.');
    expect(createAppearancePreset).toHaveBeenCalledWith(expect.any(Object), { includeWallpaper: false });
});
