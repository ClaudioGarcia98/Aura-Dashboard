import './SettingsPanel.css';
import { memo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useShallow } from 'zustand/react/shallow';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import logoUrl from '../../assets/logo.png';
import ThemeSettings from './ThemeSettings';
import WidgetToggles from './WidgetToggles';
import MediaSettings from './MediaSettings';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { createSettingsBackup, restoreSettingsBackup, resetAuraData } from '../../services/settingsBackup';
import WeatherSettings from './WeatherSettings';
import SpeedDialSettings from './SpeedDialSettings';
import PrivacySettings from './PrivacySettings';
import MalConnectionStatus from './MalConnectionStatus';
import { useDialog } from '../../hooks/useDialog';
import { useCallback } from 'react';

export default memo(function SettingsPanel({ embedded = false } = {}) {
    const {
        username, setUsername,
        malUsername, setMalUsername,
        malError, malLoading, malSuccess,
    } = useSettingsStore(useShallow(s => ({
        username: s.username, setUsername: s.setUsername,
        malUsername: s.malUsername, setMalUsername: s.setMalUsername,
        malError: s.malError, malLoading: s.malLoading, malSuccess: s.malSuccess,
    })));

    const isTouchOrMobile = useMediaQuery('(hover: none), (pointer: coarse), (max-width: 1024px)');
    const showShortcuts = !embedded && !isTouchOrMobile;

    const [isOpen, setIsOpen] = useState(false);
    const [confirmReset, setConfirmReset] = useState(0);
    const [popupMessage, setPopupMessage] = useState(null);

    const panelRef = useRef(null);
    const modalRef = useRef(null);
    const closePanel = useCallback(() => setIsOpen(false), []);
    const closeModal = useCallback(() => { setConfirmReset(0); setPopupMessage(null); }, []);
    useDialog(panelRef, !embedded && isOpen && !confirmReset && !popupMessage, closePanel);
    useDialog(modalRef, !!confirmReset || !!popupMessage, closeModal);
    const toggleRef = useRef(null);
    const importFileInputRef = useRef(null);

    // Lock background scroll while the settings sheet is open (phones)
    useBodyScrollLock(!embedded && isOpen);

    // Panel close-on-click-outside, idle, and open-dials scroll
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target) &&
                toggleRef.current && !toggleRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        const closeOnIdle = () => setIsOpen(false);
        const openDials = () => {
            setIsOpen(true);
            setTimeout(() => {
                if (panelRef.current) {
                    const section = panelRef.current.querySelector('#dials-settings-section');
                    if (section) {
                        section.scrollIntoView({ behavior: 'smooth' });
                        const input = section.querySelector('input');
                        if (input) input.focus();
                    }
                }
            }, 150);
        };
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('app-idle', closeOnIdle);
        window.addEventListener('open-settings-dials', openDials);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('app-idle', closeOnIdle);
            window.removeEventListener('open-settings-dials', openDials);
        };
    }, []);

    const handleExportSettings = () => {
        const blob = new Blob([createSettingsBackup(useSettingsStore.getState())], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aura_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImportSettings = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 1024 * 1024) { setPopupMessage({ title: 'Import Failed', message: 'Backup exceeds the 1 MB limit.', type: 'error' }); e.target.value = ''; return; }
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                restoreSettingsBackup(evt.target.result);
                setPopupMessage({
                    title: 'Success!',
                    message: 'Your settings and customization have been successfully restored. The dashboard needs to reload to apply the changes.',
                    type: 'success',
                    onAction: () => window.location.reload(),
                });
            } catch (error) {
                setPopupMessage({ title: 'Import Failed', message: error.message || 'Could not restore settings.', type: 'error' });
            }
        };
        reader.onerror = () => setPopupMessage({ title: 'Import Failed', message: 'Could not read the backup file.', type: 'error' });
        reader.readAsText(file);
        e.target.value = '';
    };

    return (
        <>
            {!embedded && (
                <button
                    type="button"
                    className={`settings-toggle ${isOpen ? 'open' : ''}`}
                    id="settingsToggle"
                    title="Settings"
                    ref={toggleRef}
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Toggle Settings Panel"
                    aria-expanded={isOpen}
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.81,11.69,4.81,12s0.02,0.64,0.07,0.94l-2.03,1.58c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94zM12,15.6c-1.98,0-3.6-1.62-3.6-3.6s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>
                </button>
            )}

            {!embedded && isOpen && <div className="drawer-scrim show" onClick={() => setIsOpen(false)} aria-hidden="true" />}

            <section role={embedded ? undefined : "dialog"} aria-label="Aura Settings" aria-modal={!embedded && isOpen ? true : undefined} inert={!embedded && !isOpen} tabIndex={-1} className={`settings-panel ${embedded ? 'embedded' : ''} ${(embedded || isOpen) ? 'open' : ''}`} id="settingsPanel" ref={panelRef}>
                <div className="sp-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={logoUrl} alt="Aura Logo" style={{ width: '28px', height: '28px', filter: 'drop-shadow(0 0 8px var(--accent-color))' }} />
                    Aura Settings
                    {!embedded && (
                        <button className="sp-close" onClick={() => setIsOpen(false)} aria-label="Close settings">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    )}
                </div>

                {/* Profile */}
                <div className="sp-section">
                    <div className="sp-label">Profile</div>
                    <div className="sp-group">
                        <label htmlFor="usernameInput">Display Name</label>
                        <input type="text" id="usernameInput" placeholder="Your name" value={username} onChange={(e) => setUsername(e.target.value)} />
                    </div>
                    <div className="sp-group" style={{ marginTop: '10px' }}>
                        <label htmlFor="malUsernameInput">MyAnimeList Username</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                id="malUsernameInput"
                                className={malError ? 'mal-error' : (malSuccess ? 'mal-success' : '')}
                                placeholder="Your MAL username"
                                value={malUsername}
                                onChange={(e) => setMalUsername(e.target.value)}
                                spellCheck={false}
                                autoCapitalize="none"
                                autoCorrect="off"
                                style={{ paddingRight: '30px' }}
                            />
                            <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                                {malLoading && !malError && !malSuccess && (
                                    <div className="spinner" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '14px', height: '14px' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                                        </svg>
                                    </div>
                                )}
                                {malError && !malLoading && (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--status-danger)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                )}
                                {malSuccess && !malLoading && !malError && (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--status-success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                )}
                            </div>
                        </div>
                        <MalConnectionStatus />
                    </div>
                </div>

                <WidgetToggles />

                <WeatherSettings key={embedded || isOpen ? 'active' : 'closed'} active={embedded || isOpen} />
                <ThemeSettings />

                <MediaSettings />

                <SpeedDialSettings />
                <PrivacySettings />
                {/* Search & Shortcuts */}
                <div className="sp-section">
                    {showShortcuts && (
                        <div className="sp-shortcuts-subsection" style={{ marginBottom: '15px' }}>
                            <div className="sp-label">Keyboard Shortcuts</div>
                            <div className="shortcut-list">
                                <div className="shortcut-item"><span>Focus Search</span><kbd>Ctrl + Space</kbd></div>
                                <div className="shortcut-item"><span>Close Suggestions</span><kbd>Esc</kbd></div>
                                <div className="shortcut-item"><span>Navigate List</span><kbd>↑ / ↓</kbd></div>
                                <div className="shortcut-item"><span>Clear Engine Prefix</span><kbd>Backspace</kbd></div>
                            </div>
                        </div>
                    )}
                    <div className="sp-label">Search Prefixes</div>
                    <div className="prefix-grid">
                        <div className="prefix-item"><code>g </code><span>Google</span></div>
                        <div className="prefix-item"><code>yt </code><span>YouTube</span></div>
                        <div className="prefix-item"><code>r </code><span>Reddit</span></div>
                        <div className="prefix-item"><code>gh </code><span>GitHub</span></div>
                        <div className="prefix-item"><code>ddg </code><span>DuckDuckGo</span></div>
                        <div className="prefix-item"><code>wiki </code><span>Wikipedia</span></div>
                        <div className="prefix-item"><code>mdn </code><span>MDN</span></div>
                        <div className="prefix-item"><code>tw </code><span>Twitter/X</span></div>
                        <div className="prefix-item"><code>a </code><span>Amazon</span></div>
                        <div className="prefix-item"><code>mal </code><span>MyAnimeList</span></div>
                    </div>
                </div>

                {/* Backup & Restore */}
                <div className="sp-section">
                    <div className="sp-label">Backup & Restore</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" className="pill" style={{ flex: 1, justifyContent: 'center' }} onClick={handleExportSettings}>⬇ Export Settings</button>
                        <button type="button" className="pill" style={{ flex: 1, justifyContent: 'center' }} onClick={() => importFileInputRef.current?.click()}>⬆ Import Settings</button>
                        <input type="file" accept=".json" ref={importFileInputRef} style={{ display: 'none' }} onChange={handleImportSettings} />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '8px', lineHeight: 1.4 }}>
                        Save your configuration, speed dials, and layout preferences to a file.
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="sp-section">
                    <div className="sp-label">Danger Zone</div>
                    <button type="button" className="reset-btn" onClick={() => setConfirmReset(1)}>🗑 Reset All Settings</button>
                </div>

                {/* Support Footer */}
                <div className="sp-section" style={{ textAlign: 'center', paddingTop: '4px', paddingBottom: '4px' }}>
                    <a
                        href="https://buymeacoffee.com/claudio091s"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pill"
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', textDecoration: 'none', fontSize: '0.82rem' }}
                    >
                        <span>☕</span>
                        <span>Support Aura on Buy Me a Coffee</span>
                    </a>
                </div>
            </section>

            {/* Reset confirm modal */}
            {confirmReset > 0 && createPortal(
                <div className="reset-overlay" onClick={() => setConfirmReset(0)}>
                    <div ref={modalRef} role="dialog" aria-modal="true" aria-label="Reset settings" tabIndex={-1} className="reset-modal" onClick={e => e.stopPropagation()}>
                        {confirmReset === 1 ? (
                            <>
                                <p>Are you sure you want to reset all settings?</p>
                                <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>This will clear all your preferences, speed dials, and saved data.</span>
                                <div className="reset-modal-actions">
                                    <button type="button" className="pill" onClick={() => setConfirmReset(0)}>Cancel</button>
                                    <button type="button" className="reset-confirm-btn" onClick={() => setConfirmReset(2)}>Yes, Reset</button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p>⚠️ This cannot be undone</p>
                                <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>All settings, cached location, background, and stored data will be permanently erased. The page will reload.</span>
                                <div className="reset-modal-actions">
                                    <button type="button" className="pill" onClick={() => setConfirmReset(0)}>Go Back</button>
                                    <button type="button" className="reset-confirm-btn" onClick={async () => {
                                        try { await resetAuraData(); }
                                        catch { setConfirmReset(0); setPopupMessage({ title: 'Reset Failed', message: 'Could not erase saved data. Please try again.', type: 'error' }); return; }
                                        window.location.reload();
                                    }}>Yes, Erase Everything</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>,
                document.body
            )}

            {/* Import/Export popup modal */}
            {popupMessage && createPortal(
                <div className="reset-overlay" style={{ zIndex: 1000000, animation: 'fadeSlideIn 0.2s ease-out' }}>
                    <div ref={modalRef} role="dialog" aria-modal="true" aria-label={popupMessage.title} tabIndex={-1} className="reset-modal" style={{ textAlign: 'center', maxWidth: '350px', padding: '30px 24px', animation: 'pulseGlow 2s infinite' }}>
                        <div style={{ fontSize: '3.5rem', marginBottom: '15px', lineHeight: 1, display: 'flex', justifyContent: 'center' }}>
                            {popupMessage.type === 'success' ? (
                                <img src={logoUrl} alt="Success" style={{ width: '64px', height: '64px', filter: 'drop-shadow(0 0 15px var(--accent-color))' }} />
                            ) : '❌'}
                        </div>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '1.4rem', color: popupMessage.type === 'error' ? '#ff6b6b' : 'var(--accent-color)' }}>{popupMessage.title}</h3>
                        <p style={{ fontSize: '0.95rem', opacity: 0.85, marginBottom: '25px', lineHeight: 1.5 }}>{popupMessage.message}</p>
                        <button
                            type="button"
                            className="pill"
                            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '1rem', background: popupMessage.type === 'error' ? 'rgba(255, 107, 107, 0.15)' : 'var(--accent-glow)', color: popupMessage.type === 'error' ? '#ff6b6b' : 'var(--accent-color)', border: `1px solid ${popupMessage.type === 'error' ? '#ff6b6b' : 'var(--accent-color)'}` }}
                            onClick={() => { if (popupMessage.onAction) popupMessage.onAction(); else setPopupMessage(null); }}
                        >
                            {popupMessage.onAction ? 'Reload Dashboard' : 'Dismiss'}
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
});
