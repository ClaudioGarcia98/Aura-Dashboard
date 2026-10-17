import { useState, useRef } from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useShallow } from 'zustand/react/shallow';
import { saveBackgroundBlob, deleteBackgroundBlob } from '../../services/db';
import { DEFAULT_BACKGROUND } from '../../constants/background';

export default function BackgroundSettings() {
    const { gifName, setGifName, setBackgroundUrl, setBackgroundIsVideo } = useSettingsStore(useShallow(s => ({
        gifName: s.gifName, setGifName: s.setGifName, setBackgroundUrl: s.setBackgroundUrl, setBackgroundIsVideo: s.setBackgroundIsVideo,
    })));
    const [bgError, setBgError] = useState('');
    const bgFileInputRef = useRef(null);
    const handleFileChange = async (e) => {
        const f = e.target.files[0];
        if (!f) return;

        setBgError('');

        // 50MB maximum ceiling
        if (f.size > 50 * 1024 * 1024) {
            setBgError('File exceeds 50MB maximum limit');
            e.target.value = '';
            return;
        }

        // Validate MIME type
        const isImage = f.type && f.type.startsWith('image/');
        const isVideo = f.type && f.type.startsWith('video/');
        if (!isImage && !isVideo) {
            setBgError('Unsupported file type. Please choose an image or MP4 video.');
            e.target.value = '';
            return;
        }

        try {
            await saveBackgroundBlob(f);
            setBackgroundUrl(URL.createObjectURL(f));
            setBackgroundIsVideo(isVideo);
            setGifName(f.name);
        } catch (err) {
            console.error('Failed to save background blob:', err);
            setBgError('Failed to store media in local database');
        }
    };

    const handleRestoreDefaultBackground = async () => {
        try {
            await deleteBackgroundBlob();
        } catch (err) {
            console.error('Failed to delete background blob:', err);
            setBgError('Could not remove the saved background. Please try again.');
            return;
        }
        setGifName('');
        setBackgroundUrl(DEFAULT_BACKGROUND.url);
        setBackgroundIsVideo(true);
        if (bgFileInputRef.current) bgFileInputRef.current.value = '';
    };

    return (<>
            <div className="sp-section">
                <div className="sp-label">Background</div>
                <div
                    className="gif-btn"
                    onClick={() => bgFileInputRef.current?.click()}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); bgFileInputRef.current?.click(); } }}
                    role="button"
                    tabIndex={0}
                >
                    <span>🎞</span><span>{gifName ? 'Change GIF…' : 'Choose local GIF…'}</span>
                </div>
                <div className="gif-name" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {gifName || 'Default (animated_gif.mp4)'}
                    </span>
                    {gifName && (
                        <button
                            type="button"
                            className="pill"
                            style={{ fontSize: '0.72rem', padding: '3px 8px', flexShrink: 0 }}
                            onClick={handleRestoreDefaultBackground}
                            title="Restore default animation"
                        >
                            ↺ Restore
                        </button>
                    )}
                </div>
                {bgError && (
                    <div style={{ color: '#ff6b6b', fontSize: '0.75rem', marginTop: '6px' }} role="alert">
                        {bgError}
                    </div>
                )}
                <input
                    type="file"
                    ref={bgFileInputRef}
                    style={{ display: 'none' }}
                    accept="image/gif,image/webp,image/png,image/jpeg,video/mp4"
                    onChange={handleFileChange}
                />
            </div>

    </>);
}
