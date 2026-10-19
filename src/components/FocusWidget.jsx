import { useTranslation } from '../i18n/useTranslation';
import { useEffect, useRef, useState } from 'react';
import { FOCUS_DURATIONS, useFocusStore } from '../stores/useFocusStore';
import { prepareFocusChime } from '../services/focusChime';
import './FocusWidget.css';

export default function FocusWidget() {
    const { t } = useTranslation();
    const { tasks, mode, remainingMs, endsAt, chimeEnabled, notice, addTask, toggleTask, removeTask, start, pause, resetTimer, setMode, toggleChime } = useFocusStore();
    const [draft, setDraft] = useState('');
    const taskInput = useRef(null);
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        if (!endsAt) return;
        let mounted = true;
        queueMicrotask(() => { if (mounted) setNow(Date.now()); });
        const timer = setInterval(() => setNow(Date.now()), 250);
        return () => { mounted = false; clearInterval(timer); };
    }, [endsAt]);
    const seconds = Math.ceil(Math.max(0, endsAt ? endsAt - now : remainingMs) / 1000);
    const time = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    const progress = Math.max(0, Math.min(100, (1 - seconds * 1000 / FOCUS_DURATIONS[mode]) * 100));
    const completed = tasks.filter(task => task.done).length;
    const submitTask = event => {
        event.preventDefault();
        if (addTask(draft)) {
            setDraft('');
            taskInput.current?.focus();
        }
    };
    const toggleTimer = () => {
        if (endsAt) pause();
        else { if (chimeEnabled) prepareFocusChime(); start(); }
    };

    return <section className={`focus-widget${endsAt ? ' focus-widget--running' : ''}`} aria-labelledby="focus-title">
        <header className="focus-heading">
            <div><span className="focus-eyebrow">{t("A little space to get things done")}</span><h2 id="focus-title">{t("Today's Focus")}</h2></div>
            <button type="button" className="focus-icon-button" onClick={() => { if (!chimeEnabled) prepareFocusChime(); toggleChime(); }} aria-label={t("Completion chime")} aria-pressed={chimeEnabled} title={chimeEnabled ? t("Completion chime on") : t("Completion chime off")}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />{!chimeEnabled && <path d="m3 3 18 18" />}</svg>
            </button>
        </header>
        <div className="focus-modes" role="group" aria-label={t("Timer mode")}>
            <button type="button" aria-pressed={mode === 'focus'} onClick={() => setMode('focus')}>{t("Focus")} <span>{t("25 min")}</span></button>
            <button type="button" aria-pressed={mode === 'break'} onClick={() => setMode('break')}>{t("Break")} <span>{t("5 min")}</span></button>
        </div>
        <div className="focus-timer-row">
            <div className="focus-clock"><span role="timer" aria-label={t('{mode} time remaining', { mode: mode === 'focus' ? t("Focus") : t("Break") })} aria-live="off">{time}</span><span className="focus-timer-hint">{endsAt ? (mode === 'focus' ? t("One thing at a time.") : t("Breathe. Stretch. Reset.")) : remainingMs < FOCUS_DURATIONS[mode] ? t("Paused · Pick up where you left off") : mode === 'focus' ? t("Make room for what matters.") : t("A moment to recharge.")}</span></div>
            <div className="focus-controls">
                <button type="button" className="focus-start" onClick={toggleTimer}>{endsAt ? t("Pause") : remainingMs < FOCUS_DURATIONS[mode] ? t("Resume") : mode === 'focus' ? t("Start focus") : t("Start break")}</button>
                <button type="button" className="focus-icon-button" aria-label={t("Reset timer")} title={t("Reset timer")} onClick={resetTimer}><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 10a9 9 0 1 1 2 8M3 4v6h6" /></svg></button>
            </div>
        </div>
        <div className="focus-progress" aria-hidden="true"><div style={{ width: `${progress}%` }} /></div>
        <p className="focus-notice" role="status">{t(notice)}</p>
        <section className="focus-priorities" aria-labelledby="focus-priorities-title">
            <header className="focus-tasks-heading">
                <span className="focus-priorities-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m4 6 1.5 1.5L8 5M11 6h9M4 12h3m4 0h9M4 18h3m4 0h9" /></svg></span>
                <div className="focus-priorities-title">
                    <h3 id="focus-priorities-title">{t("Today's priorities")}</h3>
                    <span className="focus-task-count">{tasks.length ? t('{completed}/{total} done', { completed, total: tasks.length }) : t("Up to 3 tasks")}</span>
                </div>
                <div className="focus-task-slots" aria-hidden="true">{[0, 1, 2].map(index => <span key={index} className={index < completed ? 'complete' : index < tasks.length ? 'occupied' : ''} />)}</div>
            </header>
        {tasks.length > 0 && <ul className="focus-tasks" aria-label={t("Today's focus tasks")}>{tasks.map(task => <li key={task.id} className={task.done ? 'focus-task--done' : ''}>
            <label>
                <span className="focus-task-toggle">
                    <input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id)} />
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>
                </span>
                <span className="focus-task-text">{task.text}</span>
            </label>
            <button type="button" className="focus-icon-button focus-delete" aria-label={t('Remove task: {task}', { task: task.text })} title={t("Remove task")} onClick={() => removeTask(task.id)}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6m4-6v6" /></svg>
            </button>
        </li>)}</ul>}
        {tasks.length < 3 ? <form className="focus-task-form" onSubmit={submitTask}>
            <input ref={taskInput} aria-label={t("New focus task")} placeholder={t("New priority…")} value={draft} onChange={event => setDraft(event.target.value)} maxLength={120} autoComplete="off" />
            <button type="submit" className="focus-icon-button focus-add" aria-label={t("Add focus task")} title={t("Add focus task")} disabled={!draft.trim()}><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg></button>
        </form> : <p className="focus-task-limit">{t("Your three priorities are set. You've got this.")}</p>}
        </section>
    </section>;
}
