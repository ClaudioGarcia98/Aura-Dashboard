import { useTranslation } from '../../i18n/useTranslation';
import { safeStorage } from '../../utils/storage';
import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useShallow } from 'zustand/react/shallow';
import { usePointerReorder } from '../../hooks/usePointerReorder';

import { fetchJson } from '../../services/http';
import { videoId as extractVideoId } from '../../utils/urls';


export default memo(function MediaSettings() {
    const { t } = useTranslation();
    const {
        volume, setVolume,
        lofiStations, addLofiStation, updateLofiStation, removeLofiStation,
    } = useSettingsStore(useShallow(s => ({
        volume: s.volume, setVolume: s.setVolume,
        lofiStations: s.lofiStations, addLofiStation: s.addLofiStation,
        updateLofiStation: s.updateLofiStation, removeLofiStation: s.removeLofiStation,
    })));

    const [newStationVideoId, setNewStationVideoId] = useState('');
    const [newStationName, setNewStationName] = useState('');
    const [editingStationId, setEditingStationId] = useState(null);
    const [editStationVideoId, setEditStationVideoId] = useState('');
    const [editStationName, setEditStationName] = useState('');
    const [stationError, setStationError] = useState('');
    const lastNonZeroVolumeRef = useRef(volume > 0 ? volume : 0.2);

    useEffect(() => {
        if (volume > 0) {
            lastNonZeroVolumeRef.current = volume;
            safeStorage.setItem('dash_prev_volume', String(volume));
        }
    }, [volume]);

    const handleToggleMute = () => {
        if (volume > 0) {
            lastNonZeroVolumeRef.current = volume;
            safeStorage.setItem('dash_prev_volume', String(volume));
            setVolume(0);
        } else {
            const restored = parseFloat(safeStorage.getItem('dash_prev_volume')) || lastNonZeroVolumeRef.current || 0.2;
            setVolume(restored > 0 ? restored : 0.2);
        }
    };

    const handleAddStation = async () => {
        const videoId = extractVideoId(newStationVideoId);
        if (!videoId) { setStationError('Enter a valid YouTube ID or URL.'); return; }
        if (useSettingsStore.getState().lofiStations.some(station => station.videoId === videoId)) {
            setStationError('This station is already in your list.'); return;
        }
        setStationError('');
        let name = newStationName.trim();
        if (!name) {
            try {
                const data = await fetchJson(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
                name = typeof data?.title === 'string' ? data.title.slice(0, 500) : '';
            } catch { name = ''; }
        }
        if (!addLofiStation({ id: crypto.randomUUID(), videoId, name })) {
            setStationError(useSettingsStore.getState().lofiStations.some(station => station.videoId === videoId)
                ? 'This station is already in your list.' : 'Could not save this station. Please try again.');
            return;
        }
        setNewStationVideoId('');
        setNewStationName('');
    };

    const handleSaveEdit = (stationId) => {
        const videoId = extractVideoId(editStationVideoId);
        if (!videoId) { setStationError('Enter a valid YouTube ID or URL.'); return; }
        if (!updateLofiStation(stationId, { videoId, name: editStationName.trim() })) {
            setStationError(useSettingsStore.getState().lofiStations.some(station => station.id !== stationId && station.videoId === videoId)
                ? 'This station is already in your list.' : 'Could not save this station. Please try again.');
            return;
        }
        setStationError('');
        setEditingStationId(null);
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

    return (
        <>
            <div className="sp-section">
                <div className="sp-label">{t("Media Volume")}</div>
                <div className="sp-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                        type="button"
                        className={`sp-volume-mute-btn ${volume === 0 ? 'muted' : ''}`}
                        onClick={handleToggleMute}
                        aria-label={volume === 0 ? t("Unmute media volume") : t("Mute media volume")}
                        title={volume === 0 ? t("Unmute") : t("Mute")}
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
                        aria-label={t("Media Volume")}
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
                <div className="sp-label">{t("Lofi Stations")}</div>
                <div className="sp-group">
                    {stationError && <p role="alert">{t(stationError)}</p>}
                    {editingStationId === null && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                            <input
                                type="text"
                                placeholder={t("YouTube ID or URL")}
                                value={newStationVideoId}
                                onChange={e => setNewStationVideoId(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddStation()}
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    placeholder={t("Name (optional)")}
                                    maxLength={500}
                                    value={newStationName}
                                    onChange={e => setNewStationName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddStation()}
                                    style={{ flex: 1 }}
                                />
                                <button type="button" className="pill" onClick={handleAddStation} aria-label={t("Add radio station")}>{t("Add")}</button>
                            </div>
                        </div>
                    )}
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {lofiStations.map((station, index) => (
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
                                            placeholder={t("Name")}
                                            maxLength={500}
                                        />
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input
                                                type="text"
                                                value={editStationVideoId}
                                                onChange={e => setEditStationVideoId(e.target.value)}
                                                placeholder={t("YouTube ID or URL")}
                                                style={{ flex: 1 }}
                                                onKeyDown={e => e.key === 'Enter' && handleSaveEdit(station.id)}
                                            />
                                            <button type="button" className="pill" onClick={() => handleSaveEdit(station.id)}>{t("Save")}</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', flex: 1 }}>
                                            <span
                                                className="station-drag-handle"
                                                onPointerDown={(e) => startDrag(e, station.id)}
                                                aria-label={t("Drag to reorder")}
                                                title={t("Drag to reorder")}
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
                                            <button type="button" className="sp-action-btn" aria-label={t('Move {name} up', { name: station.name || station.videoId })} disabled={index === 0} onClick={() => handleReorder(station.id, lofiStations[index - 1].id)}>↑</button>
                                            <button type="button" className="sp-action-btn" aria-label={t('Move {name} down', { name: station.name || station.videoId })} disabled={index === lofiStations.length - 1} onClick={() => handleReorder(station.id, lofiStations[index + 1].id)}>↓</button>
                                            <a
                                                href={`https://www.youtube.com/watch?v=${station.videoId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="sp-action-btn"
                                                title={t("Open on YouTube")}
                                                aria-label={t("Open on YouTube")}
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
                                                onClick={() => { setStationError(''); setEditingStationId(station.id); setEditStationName(station.name); setEditStationVideoId(station.videoId); }}
                                                className="sp-action-btn"
                                                title={t("Edit")}
                                                aria-label={t("Edit station")}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setStationError(''); removeLofiStation(station.id); }}
                                                className="sp-action-btn delete"
                                                title={t("Delete")}
                                                aria-label={t("Delete station")}
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
