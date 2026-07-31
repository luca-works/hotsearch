'use client';

import { CalendarDays, Clock3, Coffee, PartyPopper, RotateCcw, Settings, X } from 'lucide-react';
import Image from 'next/image';
import { type CSSProperties, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import afternoonScene from '../../../public/images/countdown/afternoon-scene.jpg';
import morningScene from '../../../public/images/countdown/morning-scene.jpg';
import nightScene from '../../../public/images/countdown/night-scene.jpg';
import sunsetScene from '../../../public/images/countdown/sunset-scene.jpg';
import type { ThemeMode } from './types';
import {
  type DayScene,
  DEFAULT_WORKDAY_CONFIG,
  getWorkdayCountdownState,
  readWorkdayConfig,
  validateWorkdayConfig,
  WORKDAY_CONFIG_KEY,
  type WorkdayConfig,
  type WorkdayCountdownState,
} from './workday-utils';
import styles from './WorkoffCountdown.module.css';

const SCENE_IMAGES = {
  morning: morningScene,
  afternoon: afternoonScene,
  sunset: sunsetScene,
  night: nightScene,
} satisfies Record<DayScene, typeof morningScene>;

interface WorkoffCountdownProps {
  theme: ThemeMode;
  variant?: 'pill' | 'card';
}

export function WorkoffCountdown({ theme, variant = 'pill' }: WorkoffCountdownProps) {
  const [config, setConfig] = useState<WorkdayConfig>(DEFAULT_WORKDAY_CONFIG);
  const [now, setNow] = useState<Date | null>(null);
  const [draftConfig, setDraftConfig] = useState<WorkdayConfig>(DEFAULT_WORKDAY_CONFIG);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsError, setSettingsError] = useState('');

  useEffect(() => {
    const update = () => setNow(new Date());
    const hydrationFrame = window.requestAnimationFrame(() => {
      setConfig(readWorkdayConfig(window.localStorage));
      update();
    });
    const timer = window.setInterval(update, 1000);
    document.addEventListener('visibilitychange', update);
    return () => {
      window.cancelAnimationFrame(hydrationFrame);
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);

  useEffect(() => {
    if (!settingsOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSettingsOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [settingsOpen]);

  if (!now) {
    return variant === 'pill' ? null : <CountdownShell />;
  }

  const state = getWorkdayCountdownState(now, config);
  if (variant === 'pill') return <CountdownPill state={state} theme={theme} />;

  const openSettings = () => {
    setDraftConfig(config);
    setSettingsError('');
    setSettingsOpen(true);
  };

  const saveSettings = () => {
    const error = validateWorkdayConfig(draftConfig);
    if (error) {
      setSettingsError(error);
      return;
    }

    setConfig(draftConfig);
    window.localStorage.setItem(WORKDAY_CONFIG_KEY, JSON.stringify(draftConfig));
    setSettingsOpen(false);
  };

  const resetSettings = () => {
    setDraftConfig(DEFAULT_WORKDAY_CONFIG);
    setConfig(DEFAULT_WORKDAY_CONFIG);
    window.localStorage.removeItem(WORKDAY_CONFIG_KEY);
    window.localStorage.removeItem('hot-dashboard-off-work-time');
    setSettingsError('');
  };

  const settingsPortal = settingsOpen && typeof document !== 'undefined'
    ? createPortal(
        <div
          className={styles.settingsBackdrop}
          onMouseDown={event => {
            if (event.target === event.currentTarget) setSettingsOpen(false);
          }}
        >
          <SettingsPanel
            config={draftConfig}
            error={settingsError}
            onChange={setDraftConfig}
            onClose={() => setSettingsOpen(false)}
            onReset={resetSettings}
            onSave={saveSettings}
          />
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <section
        aria-label="下班倒计时"
        className={`${styles.card} ${styles[state.scene]}`}
        data-phase={state.phase}
      >
        <div className={styles.illustration} aria-hidden="true">
          <Image
            key={state.scene}
            src={SCENE_IMAGES[state.scene]}
            alt=""
            fill
            priority
            placeholder="blur"
            sizes="(min-width: 1024px) 310px, 52vw"
            className={styles.illustrationImage}
          />
        </div>
        <div className={styles.illustrationFade} aria-hidden="true" />

        <div className={styles.content}>
          <div className={styles.topline}>
            <div className={styles.titleGroup}>
              <span className={styles.titleIcon} aria-hidden="true"><Coffee size={20} strokeWidth={2.2} /></span>
              <span>{getHeadlineLabel(state)}</span>
            </div>
            <div className={styles.topActions}>
              <span className={styles.clock}>
                <Clock3 size={19} strokeWidth={2.1} aria-hidden="true" />
                <time dateTime={now.toISOString()}>{formatClock(now)}</time>
              </span>
              <button
                type="button"
                aria-label="打开下班倒计时设置"
                title="设置工作时间"
                onClick={openSettings}
                className={styles.settingsButton}
              >
                <Settings size={20} strokeWidth={2.1} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className={styles.heroCopy}>
            <CountdownTime state={state} showSeconds={config.showSeconds} />
            <p className={styles.message}>{state.statusText}</p>
          </div>

          <div className={styles.progressBlock}>
            <div className={styles.progressMeta}>
              <span>{config.workStart} 上班</span>
              <strong>{Math.round(state.progress)}%</strong>
              <span>{config.workEnd} 下班</span>
            </div>
            <div
              className={styles.progressTrack}
              role="progressbar"
              aria-label="今日工作进度"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(state.progress)}
              style={{ '--progress': `${state.progress}%` } as CSSProperties}
            >
              <div className={styles.progressFill} />
              <div className={styles.progressThumb} />
            </div>
          </div>

          <div className={styles.footerPill}>
            <CalendarDays size={18} strokeWidth={2} aria-hidden="true" />
            <span>{state.footerText}</span>
          </div>
        </div>
      </section>
      {settingsPortal}
    </>
  );
}

function CountdownShell() {
  return (
    <section aria-label="下班倒计时加载中" aria-busy="true" className={`${styles.card} ${styles.skeleton}`} />
  );
}

function CountdownPill({ state, theme }: { state: WorkdayCountdownState; theme: ThemeMode }) {
  const completed = state.phase === 'off-work' || state.phase === 'weekend';
  return (
    <div
      className={`${styles.pill} ${completed ? styles.pillDone : theme === 'dark' ? styles.pillDark : styles.pillLight}`}
      aria-label={state.statusText}
    >
      {completed ? <PartyPopper size={14} aria-hidden="true" /> : <Coffee size={14} aria-hidden="true" />}
      <span>{state.headline === '距离下班还有' ? formatShortDuration(state.remainingMs) : state.headline}</span>
    </div>
  );
}

function CountdownTime({ state, showSeconds }: { state: WorkdayCountdownState; showSeconds: boolean }) {
  if (state.phase === 'off-work') {
    return <p className={styles.specialTime}>{state.headline}</p>;
  }

  const totalSeconds = Math.max(0, Math.ceil(state.remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    <p className={styles.countdownTime} aria-live="polite" aria-label={`${hours}小时${minutes}分${seconds}秒`}>
      <span className={styles.majorNumber}>{hours}</span>
      <span className={styles.majorUnit}>小时</span>
      <span className={styles.majorNumber}>{String(minutes).padStart(2, '0')}</span>
      <span className={styles.majorUnit}>分</span>
      {showSeconds ? (
        <>
          <span className={styles.secondsNumber}>{String(seconds).padStart(2, '0')}</span>
          <span className={styles.secondsUnit}>秒</span>
        </>
      ) : null}
    </p>
  );
}

function SettingsPanel({
  config,
  error,
  onChange,
  onClose,
  onReset,
  onSave,
}: {
  config: WorkdayConfig;
  error: string;
  onChange: (config: WorkdayConfig) => void;
  onClose: () => void;
  onReset: () => void;
  onSave: () => void;
}) {
  const updateTime = (key: 'workStart' | 'workEnd' | 'lunchStart' | 'lunchEnd', value: string) => {
    onChange({ ...config, [key]: value });
  };

  const toggleWorkday = (day: number) => {
    const workdays = config.workdays.includes(day)
      ? config.workdays.filter(value => value !== day)
      : [...config.workdays, day].sort((left, right) => left - right);
    onChange({ ...config, workdays });
  };

  return (
    <div className={styles.settingsPanel} role="dialog" aria-modal="true" aria-labelledby="workday-settings-title">
      <div className={styles.settingsHeader}>
        <div>
          <h2 id="workday-settings-title">个性化工作时间</h2>
          <p>配置会保存在当前浏览器中</p>
        </div>
        <button type="button" onClick={onClose} aria-label="关闭设置" className={styles.closeButton}>
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <div className={styles.timeGrid}>
        <TimeField label="上班时间" value={config.workStart} onChange={value => updateTime('workStart', value)} />
        <TimeField label="下班时间" value={config.workEnd} onChange={value => updateTime('workEnd', value)} />
        <TimeField label="午休开始" value={config.lunchStart} onChange={value => updateTime('lunchStart', value)} />
        <TimeField label="午休结束" value={config.lunchEnd} onChange={value => updateTime('lunchEnd', value)} />
      </div>

      <div className={styles.settingsRow}>
        <span className={styles.fieldLabel}>工作日</span>
        <div className={styles.weekdayList}>
          {['日', '一', '二', '三', '四', '五', '六'].map((label, day) => (
            <button
              key={label}
              type="button"
              aria-pressed={config.workdays.includes(day)}
              onClick={() => toggleWorkday(day)}
              className={`${styles.weekdayButton} ${config.workdays.includes(day) ? styles.weekdayActive : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <label className={styles.switchRow}>
        <span>
          <strong>显示秒数</strong>
          <small>秒数每秒更新一次</small>
        </span>
        <input
          type="checkbox"
          checked={config.showSeconds}
          onChange={event => onChange({ ...config, showSeconds: event.target.checked })}
        />
        <span className={styles.switchVisual} aria-hidden="true" />
      </label>

      {error ? <p className={styles.settingsError} role="alert">{error}</p> : null}

      <div className={styles.settingsActions}>
        <button type="button" onClick={onReset} className={styles.resetButton}>
          <RotateCcw size={13} aria-hidden="true" />
          恢复默认
        </button>
        <button type="button" onClick={onSave} className={styles.saveButton}>保存设置</button>
      </div>
    </div>
  );
}

function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className={styles.timeField}>
      <span>{label}</span>
      <input type="time" value={value} onChange={event => onChange(event.target.value)} />
    </label>
  );
}

function getHeadlineLabel(state: WorkdayCountdownState): string {
  if (state.phase === 'weekend') return '周末进行中';
  if (state.phase === 'off-work') return '下班时间到啦';
  return state.headline;
}

function formatClock(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatShortDuration(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}
