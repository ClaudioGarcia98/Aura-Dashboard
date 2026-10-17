import { useTranslation } from '../i18n/useTranslation';
import './SpeedDial.css';
import { memo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useShallow } from 'zustand/react/shallow';
import { usePointerReorder } from '../hooks/usePointerReorder';

export default memo(function SpeedDial() {
    const { t } = useTranslation();
    const { speedDials, setSpeedDials } = useSettingsStore(useShallow(s => ({ speedDials: s.speedDials, setSpeedDials: s.setSpeedDials })));
    const safeSpeedDials = Array.isArray(speedDials) ? speedDials : [];

    const getFavicon = (url) => {
        try {
            if (!url) return '';
            const dom = new URL(url).hostname;
            return `https://www.google.com/s2/favicons?domain=${dom}&sz=64`;
        } catch {
            return '';
        }
    };

    // Pointer-based reorder (works for mouse + touch + pen)
    const handleReorder = useCallback((fromId, toId) => {
        setSpeedDials(prev => {
            const current = Array.isArray(prev) ? prev : [];
            const oldIndex = current.findIndex(s => String(s.id) === String(fromId));
            const newIndex = current.findIndex(s => String(s.id) === String(toId));
            if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return current;
            const next = [...current];
            const [moved] = next.splice(oldIndex, 1);
            next.splice(newIndex, 0, moved);
            return next;
        });
    }, [setSpeedDials]);

    const { draggingId, pointer, startDrag } = usePointerReorder({ onReorder: handleReorder });
    const draggedItem = safeSpeedDials.find(s => String(s.id) === draggingId);

    return (
        <>
            <nav className="speed-dial" aria-label={t("Quick Links")}>
                {safeSpeedDials.length === 0 ? (
                    <button 
                        type="button"
                        className="add-dial-empty-btn"
                        onClick={() => window.dispatchEvent(new Event('open-settings-dials'))}
                        title={t("Add Speed Dial")}
                        aria-label={t("Add Speed Dial")}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </button>
                ) : (
                    <>
                        {safeSpeedDials.map((link) => {
                            const isDragged = draggingId === String(link.id);
                            const favicon = getFavicon(link.url);

                            return (
                                <div 
                                    key={link.id}
                                    className="speed-dial-wrapper"
                                    data-reorder-id={link.id}
                                    onPointerDown={(e) => startDrag(e, link.id)}
                                    style={{
                                        position: 'relative',
                                        viewTransitionName: `speed-dial-${link.id}`
                                    }}
                                >
                                    <a 
                                        href={link.url} 
                                        className="speed-dial-item"
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        aria-label={link.name}
                                        draggable={false}
                                        style={{
                                            background: isDragged ? 'transparent' : '',
                                            border: isDragged ? '2px dashed rgba(255, 255, 255, 0.4)' : '',
                                            backdropFilter: isDragged ? 'none' : '',
                                            WebkitBackdropFilter: isDragged ? 'none' : '',
                                        }}
                                    >
                                        {favicon ? (
                                            <>
                                                <img 
                                                    src={favicon} 
                                                    alt={link.name} 
                                                    style={{ 
                                                        width: '26px', 
                                                        height: '26px', 
                                                        borderRadius: '4px', 
                                                        pointerEvents: 'none', 
                                                        opacity: isDragged ? 0 : 1,
                                                        transition: 'opacity 0.2s ease'
                                                    }}
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        if (e.target.nextElementSibling) {
                                                            e.target.nextElementSibling.style.display = 'flex';
                                                        }
                                                    }}
                                                />
                                                <span className="speed-dial-fallback" style={{ display: 'none' }}>
                                                    {(link.name || 'S').charAt(0).toUpperCase()}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="speed-dial-fallback" style={{ display: 'flex' }}>
                                                {(link.name || 'S').charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </a>
                                    {!isDragged && (
                                        <button 
                                            type="button"
                                            className="speed-dial-delete"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setSpeedDials(safeSpeedDials.filter(d => d.id !== link.id));
                                            }}
                                            title={t("Remove Speed Dial")}
                                            aria-label={t("Remove Speed Dial")}
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                        <button 
                            type="button"
                            className="speed-dial-add-btn"
                            onClick={() => window.dispatchEvent(new Event('open-settings-dials'))}
                            title={t("Add Speed Dial")}
                            aria-label={t("Add Speed Dial")}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </button>
                    </>
                )}
            </nav>

            {/* Custom Drag Ghost */}
            {draggingId && draggedItem && createPortal(
                <div
                    className="custom-drag-ghost"
                    style={{ left: pointer.x, top: pointer.y }}
                >
                    <img
                        src={getFavicon(draggedItem.url)}
                        alt={draggedItem.name}
                        style={{ width: '26px', height: '26px', borderRadius: '4px' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                </div>,
                document.body
            )}
        </>
    );
});
