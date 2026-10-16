import './TopNav.css';
import { memo } from 'react';
import logoUrl from '../assets/logo.png';

const HomeIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5" /><path d="M5 10v10h14V10" />
    </svg>
);

const AnimeIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="13" rx="2" /><path d="M8 3l4 3 4-3" />
    </svg>
);

const LofiIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l10-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="16" cy="16" r="3" />
    </svg>
);

const SettingsIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.81,11.69,4.81,12s0.02,0.64,0.07,0.94l-2.03,1.58c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94zM12,15.6c-1.98,0-3.6-1.62-3.6-3.6s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
    </svg>
);

const ICONS = {
    home: HomeIcon,
    anime: AnimeIcon,
    lofi: LofiIcon,
    settings: SettingsIcon,
};

export default memo(function TopNav({ tabs, activeTab, onTabChange, lofiPlaying, onFocus }) {
    return (
        <nav className="top-nav" aria-label="Primary" onFocusCapture={onFocus}>
            <div className="top-nav-brand">
                <img src={logoUrl} alt="Aura" className="top-nav-logo" />
                <span className="top-nav-title">Aura</span>
            </div>
            <div className="top-nav-tabs" role="tablist">
                {tabs.map(tab => {
                    const Icon = ICONS[tab.id] || HomeIcon;
                    const active = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            className={`top-nav-tab ${active ? 'active' : ''}`}
                            role="tab"
                            id={`tab-${tab.id}`}
                            aria-controls={`panel-${tab.id}`}
                            tabIndex={active ? 0 : -1}
                            aria-selected={active}
                            aria-label={tab.label}
                            title={tab.label}
                            onClick={() => onTabChange(tab.id)}
                            onKeyDown={event => {
                                const index = tabs.findIndex(item => item.id === tab.id);
                                const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length
                                    : event.key === 'ArrowLeft' ? (index - 1 + tabs.length) % tabs.length
                                        : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1;
                                if (next < 0) return;
                                event.preventDefault(); onTabChange(tabs[next].id);
                                document.getElementById(`tab-${tabs[next].id}`)?.focus();
                            }}
                        >
                            <span className="top-nav-icon">
                                <Icon />
                                {tab.id === 'lofi' && lofiPlaying && <span className="top-nav-pulse" aria-hidden="true" />}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
});
