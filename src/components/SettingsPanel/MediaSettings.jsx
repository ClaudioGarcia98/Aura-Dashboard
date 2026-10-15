import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useShallow } from 'zustand/react/shallow';
import { usePointerReorder } from '../../hooks/usePointerReorder';
import { saveBackgroundBlob, deleteBackgroundBlob } from '../../services/db';
import defaultVideo from '../../assets/animated_gif.mp4';

const extractVideoId = (val) => {
    const match = val.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]+)/);
    return match ? match[1] : val.trim();
};

export default memo(function MediaSettings() {
    const {
        volume, setVolume,
        gifName, setGifName,
        setBackgroundUrl, setBackgroundIsVideo,
        lofiStations, setLofiStations,
        lofiId, setLofiId,
    } = useSettingsStore(useShallow(s => ({
        volume: s.volume, setVolume: s.setVolume,
        gifName: s.gifName, setGifName: s.setGifName,
        setBackgroundUrl: s.setBackgroundUrl, setBackgroundIsVideo: s.setBackgroundIsVideo,
        lofiStations: s.lofiStations, setLofiStations: s.setLofiStations,
        lofiId: s.lofiId, setLofiId: s.setLofiId,
    })));

    const [newStationVideoId, setNewStationVideoId] = useState('');
    const [newStationName, setNewStationName] = useState('');
    const [editingStationId, setEditingStationId] = useState(null);
    const [editStationVideoId, setEditStationVideoId] = useState('');
    const [editStationName, setEditStationName] = useState('');
    const [bgError, setBgError] = useState('');
    const bgFileInputRef = useRef(null);
    const lastNonZeroVolumeRef = useRef(volume > 0 ? volume : 0.2);

    useEffect(() => {
        if (volume > 0) {
            lastNonZeroVolumeRef.current = volume;
            localStorage.setItem('dash_prev_volume', String(volume));
        }
    }, [volume]);

    const handleToggleMute = () => {
        if (volume > 0) {
            lastNonZeroVolumeRef.current = volume;
            localStorage.setItem('dash_prev_volume', String(volume));
            setVolume(0);
        } else {
            const restored = parseFloat(localStorage.getItem('dash_prev_volume')) || lastNonZeroVolumeRef.current || 0.2;
            setVolume(restored > 0 ? restored : 0.2);
        }
    };

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
        }
        setGifName('');
        setBackgroundUrl(defaultVideo);
        setBackgroundIsVideo(true);
        if (bgFileInputRef.current) bgFileInputRef.current.value = '';
    };

    const handleAddStation = async () => {
        const videoId = extractVideoId(newStationVideoId);
        if (!videoId) return;
        let name = newStationName.trim();
        if (!name) {
            try {
                const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
                const data = await res.json();
                name = data?.title || '';
            } catch { name = ''; }
        }
        setLofiStations([...lofiStations, { id: Date.now(), videoId, name }]);
        setNewStationVideoId('');
        setNewStationName('');
    };

    const handleSaveEdit = (stationId) => {
        setLofiStations(lofiStations.map(s =>
            s.id === stationId
                ? { ...s, videoId: extractVideoId(editStationVideoId), name: editStationName.trim() }
                : s
        ));
        setEditingStationId(null);
    };

    const handleDelete = (stationId) => {
        const remaining = lofiStations.filter(s => s.id !== stationId);
        const deleted = lofiStations.find(s => s.id === stationId);
        if (deleted && lofiId === deleted.videoId) {
            const fallback = remaining[0]?.videoId ?? 'Gu-g8FRG4Zs';
            setLofiId(fallback);
        }
        setLofiStations(remaining);
    };

    // Pointer-based reorder (works for mouse + touch + pen)
    const handleReorder = useCallback((fromId, toId) => {
        const { lofiStations: current, setLofiStations: setter } = useSettingsStore.getState();
        const oldIndex = current.findIndex(s => String(s.id) === String(fromId));
        const newIndex = current.findIndex(s => String(s.id) === String(toId));
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
        const updated = [...current];
        const [item] = updated.splice(oldIndex, 1);
        updated.splice(newIndex, 0, item);
        setter(updated);
    }, []);

    const { draggingId, startDrag } = usePointerReorder({ onReorder: handleReorder });

    // One-time fix: replace any "My Saved Station" placeholder names with real YouTube titles
    useEffect(() => {
        const { lofiStations: current, setLofiStations: setter } = useSettingsStore.getState();
        const stale = current.filter(s => s.name === 'My Saved Station');
        if (stale.length === 0) return;
        Promise.all(stale.map(async s => {
            try {
                const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${s.videoId}`);
                const data = await res.json();
                return data?.title ? { id: s.id, name: data.title } : null;
            } catch { return null; }
        })).then(updates => {
            const map = new Map(updates.filter(Boolean).map(u => [u.id, u.name]));
            if (map.size === 0) return;
            const { lofiStations: fresh } = useSettingsStore.getState();
            setter(fresh.map(s => map.has(s.id) ? { ...s, name: map.get(s.id) } : s));
        });
    }, []);

    return (
        <>
            <div className="sp-section">
                <div className="sp-label">Media Volume</div>
                <div className="sp-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                        type="button"
                        className={`sp-volume-mute-btn ${volume === 0 ? 'muted' : ''}`}
                        onClick={handleToggleMute}
                        aria-label={volume === 0 ? 'Unmute media volume' : 'Mute media volume'}
                        title={volume === 0 ? 'Unmute' : 'Mute'}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                            {volume === 0 ? (
                                <>
                                    <line x1="23" y1="9" x2="17" y2="15"></line>
                                    <line x1="17" y1="9" x2="23" y2="15"></line>
                                </>
                            ) : (
                                <>
                                    {volume > 0 && <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>}
                                    {volume > 0.5 && <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>}
                                </>
                            )}
                        </svg>
                    </button>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        style={{ flex: 1, height: '4px', accentColor: 'var(--accent-color, #00ffcc)', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.75rem', opacity: 0.7, width: '32px', textAlign: 'right' }}>
                        {Math.round(volume * 100)}%
                    </span>
                </div>
            </div>

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

            <div className="sp-section">
                <div className="sp-label">Lofi Stations</div>
                <div className="sp-group">
                    {editingStationId === null && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                            <input
                                type="text"
                                placeholder="YouTube ID or URL"
                                value={newStationVideoId}
                                onChange={e => setNewStationVideoId(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddStation()}
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    placeholder="Name (optional)"
                                    value={newStationName}
                                    onChange={e => setNewStationName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddStation()}
                                    style={{ flex: 1 }}
                                />
                                <button type="button" className="pill" onClick={handleAddStation} aria-label="Add radio station">Add</button>
                            </div>
                        </div>
                    )}
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {lofiStations.map((station) => (
                            <li
                                key={station.id}
                                className="sp-list-item"
                                data-reorder-id={station.id}
                                style={{ flexDirection: editingStationId === station.id ? 'column' : 'row', gap: '8px', fontSize: '0.8rem', opacity: draggingId === String(station.id) ? 0.5 : 1 }}
                            >
                                {editingStationId === station.id ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                                        <input
                                            type="text"
                                            value={editStationName}
                                            onChange={e => setEditStationName(e.target.value)}
                                            placeholder="Name"
                                        />
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input
                                                type="text"
                                                value={editStationVideoId}
                                                onChange={e => setEditStationVideoId(e.target.value)}
                                                placeholder="YouTube ID or URL"
                                                style={{ flex: 1 }}
                                                onKeyDown={e => e.key === 'Enter' && handleSaveEdit(station.id)}
                                            />
                                            <button type="button" className="pill" onClick={() => handleSaveEdit(station.id)}>Save</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', flex: 1 }}>
                                            <span
                                                className="station-drag-handle"
                                                onPointerDown={(e) => startDrag(e, station.id)}
                                                aria-label="Drag to reorder"
                                                title="Drag to reorder"
                                                style={{ display: 'flex', flexShrink: 0, cursor: 'grab', touchAction: 'none' }}
                                            >
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.3 }}>
                                                    <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
                                                    <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                                                    <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
                                                </svg>
                                            </span>
                                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {station.name || station.videoId}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
                                            <a
                                                href={`https://www.youtube.com/watch?v=${station.videoId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="sp-action-btn"
                                                title="Open on YouTube"
                                                aria-label="Open on YouTube"
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                                    <polyline points="15 3 21 3 21 9"></polyline>
                                                    <line x1="10" y1="14" x2="21" y2="3"></line>
                                                </svg>
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => { setEditingStationId(station.id); setEditStationName(station.name); setEditStationVideoId(station.videoId); }}
                                                className="sp-action-btn"
                                                title="Edit"
                                                aria-label="Edit station"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(station.id)}
                                                className="sp-action-btn delete"
                                                title="Delete"
                                                aria-label="Delete station"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                                                </svg>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </>
    );
});
