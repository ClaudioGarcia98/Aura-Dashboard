import './SpeedDial.css';
import { memo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useShallow } from 'zustand/react/shallow';

export default memo(function SpeedDial() {
    const { speedDials, setSpeedDials } = useSettingsStore(useShallow(s => ({ speedDials: s.speedDials, setSpeedDials: s.setSpeedDials })));
    const safeSpeedDials = Array.isArray(speedDials) ? speedDials : [];
    const [draggedId, setDraggedId] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const getFavicon = (url) => {
        try {
            if (!url) return '';
            const dom = new URL(url).hostname;
            return `https://www.google.com/s2/favicons?domain=${dom}&sz=64`;
        } catch {
            return '';
        }
    };

    // Track mouse globally during drag for the custom ghost
    useEffect(() => {
        if (!draggedId) return;
        
        const handleDrag = (e) => {
            if (e.clientX > 0 || e.clientY > 0) {
                setMousePos({ x: e.clientX, y: e.clientY });
            }
        };
        
        window.addEventListener('dragover', handleDrag);
        return () => window.removeEventListener('dragover', handleDrag);
    }, [draggedId]);

    const handleDragStart = (e, id) => {
        if (e.dataTransfer) {
            e.dataTransfer.setData('text/plain', String(id));
            e.dataTransfer.effectAllowed = 'move';
            
            // Create an invisible image to hide the native browser drag ghost
            const dragImg = new Image(0, 0);
            dragImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            e.dataTransfer.setDragImage(dragImg, 0, 0);
        }
        
        // Initial mouse pos
        setMousePos({ x: e.clientX, y: e.clientY });
        
        setTimeout(() => setDraggedId(id), 0);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'move';
        }
    };

    const handleDragEnter = (e, targetId) => {
        e.preventDefault();
        if (!draggedId || targetId === draggedId) return;

        const oldIndex = safeSpeedDials.findIndex(s => s.id === draggedId);
        const newIndex = safeSpeedDials.findIndex(s => s.id === targetId);

        if (oldIndex !== -1 && newIndex !== -1) {
            const newSpeedDials = [...safeSpeedDials];
            const [draggedItem] = newSpeedDials.splice(oldIndex, 1);
            newSpeedDials.splice(newIndex, 0, draggedItem);
            
            if (document.startViewTransition) {
                document.startViewTransition(() => setSpeedDials(newSpeedDials));
            } else {
                setSpeedDials(newSpeedDials);
            }
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDraggedId(null);
    };

    const handleDragEnd = () => {
        setDraggedId(null);
    };

    const draggedItem = safeSpeedDials.find(s => s.id === draggedId);

    return (
        <>
            <nav className="speed-dial" aria-label="Quick Links">
                {safeSpeedDials.length === 0 ? (
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
                    <>
                        {safeSpeedDials.map((link) => {
                            const isDragged = draggedId === link.id;
                            const favicon = getFavicon(link.url);

                            return (
                                <div 
                                    key={link.id}
                                    className="speed-dial-wrapper"
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, link.id)}
                                    onDragOver={handleDragOver}
                                    onDragEnter={(e) => handleDragEnter(e, link.id)}
                                    onDrop={handleDrop}
                                    onDragEnd={handleDragEnd}
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
                                            className="speed-dial-delete"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setSpeedDials(safeSpeedDials.filter(d => d.id !== link.id));
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
                        })}
                        <button 
                            className="speed-dial-add-btn"
                            onClick={() => window.dispatchEvent(new Event('open-settings-dials'))}
                            title="Add Speed Dial"
                            aria-label="Add Speed Dial"
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
            {draggedId && draggedItem && createPortal(
                <div 
                    className="custom-drag-ghost"
                    style={{ left: mousePos.x, top: mousePos.y }}
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
