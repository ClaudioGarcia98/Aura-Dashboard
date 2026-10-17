import { useRef, useState } from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { createAppearancePreset, parseAppearancePreset, applyAppearancePreset, MAX_PRESET_BYTES } from '../../services/appearancePresets';
import { themeLabel } from '../../constants/settingsConstants';
import './ThemeSettings.css';

export default function PresetSettings() {
    const [includeWallpaper, setIncludeWallpaper] = useState(true);
    const [busy, setBusy] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [preview, setPreview] = useState(null);
    const fileInput = useRef(null);
    const exportPreset = async () => {
        setBusy(true); setFeedback(null);
        try {
            const raw = await createAppearancePreset(useSettingsStore.getState(), { includeWallpaper });
            const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
            const link = document.createElement('a');
            link.href = url;
            link.download = 'aura-appearance.aura-preset.json';
            link.click();
            // Leave the URL alive long enough for mobile browsers to start saving.
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            setFeedback({ text: 'Preset exported. Share the file with a friend.', error: false });
        } catch (error) { setFeedback({ text: error.message, error: true }); }
        finally { setBusy(false); }
    };
    const importPreset = async event => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        setPreview(null); setFeedback(null);
        if (file.size > MAX_PRESET_BYTES) { setFeedback({ text: 'Preset is too large (50 MB wallpaper limit).', error: true }); return; }
        setBusy(true);
        try {
            const raw = await file.text();
            setPreview({ raw, preset: parseAppearancePreset(raw) });
        } catch (error) { setFeedback({ text: error.message || 'Could not read this preset file.', error: true }); }
        finally { setBusy(false); }
    };
    const applyPreset = async () => {
        setBusy(true); setFeedback(null);
        try {
            await applyAppearancePreset(preview.raw);
            setPreview(null);
            setFeedback({ text: 'Preset applied. Enjoy your new setup.', error: false });
        } catch (error) { setFeedback({ text: error.message, error: true }); }
        finally { setBusy(false); }
    };
    return <section className="sp-section preset-settings" aria-labelledby="preset-title">
        <div className="sp-label" id="preset-title">Share your setup</div>
        <p className="preset-description">A small preset for your theme, font and Lofi stations. Add your wallpaper to share the whole look.</p>
        <label className="preset-wallpaper-option"><input type="checkbox" checked={includeWallpaper} onChange={event => setIncludeWallpaper(event.target.checked)} disabled={busy} /><span>Include wallpaper <small>Uploaded images and videos make a larger file.</small></span></label>
        <div className="preset-actions">
            <button type="button" className="pill" disabled={busy} onClick={exportPreset}>Export preset</button>
            <button type="button" className="pill" disabled={busy} onClick={() => fileInput.current?.click()}>Import preset</button>
        </div>
        <input type="file" ref={fileInput} hidden accept="application/json,.json" aria-label="Import appearance preset file" onChange={importPreset} />
        {busy && <p className="preset-feedback" role="status">Preparing your preset…</p>}
        {feedback && <p className={`preset-feedback${feedback.error ? ' preset-feedback--error' : ''}`} role={feedback.error ? 'alert' : 'status'}>{feedback.text}</p>}
        {preview && <div className="preset-preview">
            <h3>{preview.preset.name}</h3>
            <dl><div><dt>Theme</dt><dd>{themeLabel(preview.preset.appearance.theme)}</dd></div>
                <div><dt>Wallpaper</dt><dd>{preview.preset.wallpaper.kind === 'embedded' ? preview.preset.wallpaper.name : preview.preset.wallpaper.kind === 'default' ? 'Aura default animation' : 'Keep your current wallpaper'}</dd></div>
                <div><dt>Music</dt><dd>{preview.preset.music.stations.length} Lofi stations</dd></div></dl>
            <p>Your profile, daily tasks and dashboard layout stay as they are.</p>
            <div className="preset-actions"><button type="button" className="pill active" disabled={busy} onClick={applyPreset}>Apply preset</button><button type="button" className="pill" disabled={busy} onClick={() => setPreview(null)}>Cancel</button></div>
        </div>}
    </section>;
}
