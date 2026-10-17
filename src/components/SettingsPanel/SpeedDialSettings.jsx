import { useTranslation } from '../../i18n/useTranslation';
import { useState } from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useShallow } from 'zustand/react/shallow';
import { normalizeUrl } from '../../utils/urls';
const getFaviconUrl = (url) => {
    try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=16`; }
    catch { return ''; }
};

export default function SpeedDialSettings() {
    const { t } = useTranslation();
    const { speedDials, setSpeedDials } = useSettingsStore(useShallow(s => ({ speedDials: s.speedDials, setSpeedDials: s.setSpeedDials })));
    const [newDialUrl, setNewDialUrl] = useState('');
    const [editingDialId, setEditingDialId] = useState(null);
    const [editDialName, setEditDialName] = useState('');
    const [editDialUrl, setEditDialUrl] = useState('');

    const moveDial = (index, delta) => {
        const next = [...speedDials];
        [next[index], next[index + delta]] = [next[index + delta], next[index]];
        setSpeedDials(next);
    };
    const handleAddDial = () => {
        if (!newDialUrl.trim()) return;
        const url = normalizeUrl(newDialUrl);
        if (!url) return;
        let finalName = 'Speed Dial';
        try {
            const host = new URL(url).hostname.replace(/^www\./, '').split('.')[0];
            if (host) finalName = host.charAt(0).toUpperCase() + host.slice(1);
        } catch { finalName = 'Speed Dial'; }
        const currentList = Array.isArray(speedDials) ? speedDials : [];
        setSpeedDials([...currentList, { id: crypto.randomUUID(), name: finalName, url }]);
        setNewDialUrl('');
    };

    const handleRemoveDial = (id) => {
        const currentList = Array.isArray(speedDials) ? speedDials : [];
        setSpeedDials(currentList.filter(d => d.id !== id));
    };

    const handleSaveEdit = (dialId) => {
        const currentList = Array.isArray(speedDials) ? speedDials : [];
        const url = normalizeUrl(editDialUrl);
        if (!url) return;
        const name = editDialName.trim() || 'Speed Dial';
        setSpeedDials(currentList.map(d => d.id === dialId ? { ...d, name, url } : d));
        setEditingDialId(null);
    };

    return (<>
                {/* Speed Dials */}
                <div className="sp-section" id="dials-settings-section">
                    <div className="sp-label">{t("Speed Dials")}</div>
                    <div className="sp-group">
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                            <input
                                type="text"
                                placeholder={t('Paste URL here...')}
                                value={newDialUrl}
                                onChange={e => setNewDialUrl(e.target.value)}
                                style={{ flex: 1 }}
                                onKeyDown={e => e.key === 'Enter' && handleAddDial()}
                            />
                            <button type="button" className="pill" onClick={handleAddDial} aria-label={t("Add speed dial")}>{t("Add")}</button>
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {(!Array.isArray(speedDials) || speedDials.length === 0) ? (
                                <li style={{ opacity: 0.5, padding: '12px 0', textAlign: 'center', fontSize: '0.8rem' }}>{t('No speed dials added yet.')}</li>
                            ) : (
                                speedDials.map((dial, index) => (
                                    <li key={dial.id} className="sp-list-item" style={{ flexDirection: editingDialId === dial.id ? 'column' : 'row', gap: '8px', fontSize: '0.8rem' }}>
                                        {editingDialId === dial.id ? (
                                            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                                <input type="text" value={editDialName} onChange={e => setEditDialName(e.target.value)} style={{ flex: 1 }} />
                                                <input
                                                    type="text"
                                                    value={editDialUrl}
                                                    onChange={e => setEditDialUrl(e.target.value)}
                                                    style={{ flex: 2 }}
                                                    onKeyDown={e => e.key === 'Enter' && handleSaveEdit(dial.id)}
                                                />
                                                <button type="button" className="pill" onClick={() => handleSaveEdit(dial.id)}>{t("Save")}</button>
                                            </div>
                                        ) : (
                                            <>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', overflow: 'hidden' }}>
                                                    <img src={getFaviconUrl(dial.url)} style={{ width: 16, height: 16, borderRadius: 3 }} onError={e => e.target.style.display = 'none'} alt="" />
                                                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>{dial.name}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                    <button type="button" className="sp-action-btn" aria-label={t('Move {name} up', { name: dial.name })} disabled={index === 0} onClick={() => moveDial(index, -1)}>↑</button>
                                                    <button type="button" className="sp-action-btn" aria-label={t('Move {name} down', { name: dial.name })} disabled={index === speedDials.length - 1} onClick={() => moveDial(index, 1)}>↓</button>
                                                    <button type="button" onClick={() => { setEditingDialId(dial.id); setEditDialName(dial.name); setEditDialUrl(dial.url); }} className="sp-action-btn" title={t("Edit")} aria-label={t("Edit speed dial")}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                                        </svg>
                                                    </button>
                                                    <button type="button" onClick={() => handleRemoveDial(dial.id)} className="sp-action-btn delete" title={t("Delete")} aria-label={t("Delete speed dial")}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                                                        </svg>
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>

                </div>

    </>);
}
