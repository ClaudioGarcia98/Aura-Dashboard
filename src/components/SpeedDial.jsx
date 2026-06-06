import './SpeedDial.css';
import { memo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useShallow } from 'zustand/react/shallow';
import { usePointerReorder } from '../hooks/usePointerReorder';

export default memo(function SpeedDial() {
    const { speedDials, setSpeedDials } = useSettingsStore(useShallow(s => ({ speedDials: s.speedDials, setSpeedDials: s.setSpeedDials })));

    const getFavicon = (url) => {
        try {
            const dom = new URL(url).hostname;
            return `https://www.google.com/s2/favicons?domain=${dom}&sz=64`;
        } catch {
            return '';
        }
    };

    // Pointer-based reorder (works for mouse + touch + pen)
    const handleReorder = useCallback((fromId, toId) => {
        setSpeedDials(prev => {
            const oldIndex = prev.findIndex(s => String(s.id) === String(fromId));
            const newIndex = prev.findIndex(s => String(s.id) === String(toId));
            if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev;
            const next = [...prev];
            const [moved] = next.splice(oldIndex, 1);
            next.splice(newIndex, 0, moved);
            return next;
        });
    }, [setSpeedDials]);

    const { draggingId, pointer, startDrag } = usePointerReorder({ onReorder: handleReorder });
    const draggedItem = speedDials.find(s => String(s.id) === draggingId);

    return (
        <>
            <nav className="speed-dial" aria-label="Quick Links">
                {speedDials.length === 0 ? (
                    <button
                        className="add-dial-empty-btn"
                        onClick={() => window.dispatchEvent(new Event('open-settings-dials'))}
                        title="Add Speed Dial"
                        aria-label="Add Speed Dial"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </button>
                ) : (
                    speedDials.map((link) => {
                        const isDragged = draggingId === String(link.id);

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
                                    <img
                                        src={getFavicon(link.url)}
                                        alt={link.name}
                                        style={{
                                            width: '26px',
                                            height: '26px',
                                            borderRadius: '4px',
                                            pointerEvents: 'none',
                                            opacity: isDragged ? 0 : 1,
                                            transition: 'opacity 0.2s ease'
                                        }}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                </a>
                                {!isDragged && (
                                    <button
                                        className="speed-dial-delete"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setSpeedDials(speedDials.filter(d => d.id !== link.id));
                                        }}
                                        title="Remove Speed Dial"
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                )}
                            </div>
                        );
                    })
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
