import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { api } from '../lib/api';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { useAuthContext } from '../context/AuthContext';
import { useToastContext } from '../context/ToastContext';
import { extractMessage } from '../hooks/useSocial';
import { trackEvent } from '../lib/analytics';

const PRESETS = [
  { key: 'pomodoro', label: 'Pomodoro', minutes: 25 },
  { key: 'short', label: 'Short', minutes: 15 },
  { key: 'long', label: 'Long', minutes: 50 },
  { key: 'custom', label: 'Custom', minutes: 25 },
] as const;

type PresetKey = (typeof PRESETS)[number]['key'];

const AMBIENT_OPTIONS = [
  { key: 'rain', label: 'Rain', src: '/ambient/rain.mp3' },
  { key: 'forest', label: 'Forest', src: '/ambient/forest.mp3' },
  { key: 'night', label: 'Night', src: '/ambient/night.mp3' },
  { key: 'brown', label: 'Brown noise', src: '/ambient/brown_noise.mp3' },
  { key: 'off', label: 'Off', src: null },
] as const;

type Ambient = (typeof AMBIENT_OPTIONS)[number]['key'];

export function FocusPage() {
  const [preset, setPreset] = useState<PresetKey>('pomodoro');
  const [customMinutes, setCustomMinutes] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [ambient, setAmbient] = useState<Ambient>('off');
  const [volume, setVolume] = useState(0.45);
  const [complete, setComplete] = useState<{ sessionId: string; coins: number; minutes: number } | null>(null);
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);
  const completionAudioRef = useRef<AudioContext | null>(null);
  const audioErrorShownRef = useRef(false);
  const completedRef = useRef(false);
  const { mergeUser, user } = useAuthContext();
  const { showToast } = useToastContext();

  const totalSeconds = useMemo(() => getMinutes(preset, customMinutes) * 60, [preset, customMinutes]);
  const progress = totalSeconds === 0 ? 0 : ((totalSeconds - remaining) / totalSeconds) * 100;

  useEffect(() => {
    setRemaining(totalSeconds);
    setRunning(false);
    completedRef.current = false;
  }, [totalSeconds]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          void finishSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!running || ambient === 'off') {
      stopAmbientAudio(ambientAudioRef);
      return;
    }
    void playAmbientAudio(ambient, volume, ambientAudioRef).catch(() => {
      if (audioErrorShownRef.current) return;
      audioErrorShownRef.current = true;
      showToast('Browser blocked ambient audio. Press Start again after choosing a sound.', 'error');
    });
  }, [ambient, running, showToast, volume]);

  useEffect(() => {
    return () => {
      stopAmbientAudio(ambientAudioRef);
      void completionAudioRef.current?.close();
    };
  }, []);

  async function finishSession(rating?: number) {
    if (completedRef.current) return;
    completedRef.current = true;
    setRunning(false);
    stopAmbientAudio(ambientAudioRef);
    if (ambient === 'off') {
      void playCompletionChime(completionAudioRef, volume);
    }
    try {
      const minutes = Math.max(1, Math.round(totalSeconds / 60));
      const { data } = await api.post<{ session_id: string; coins_earned: number; total_focus_time: number }>('/api/focus/complete', {
        duration_minutes: minutes,
        rating,
      });
      mergeUser({ coins: (user?.coins ?? 0) + data.coins_earned });
      setComplete({ sessionId: data.session_id, coins: data.coins_earned, minutes });
      trackEvent('focus_session_finished', {
        preset,
        duration_minutes: minutes,
        ambient,
        rating: rating ?? null,
        coins_earned: data.coins_earned,
      });
    } catch (err) {
      completedRef.current = false;
      showToast(extractMessage(err, 'Could not save focus session.'), 'error');
    }
  }

  function toggleRunning() {
    setRunning((prev) => {
      const next = !prev;
      if (next) {
        primeCompletionAudio(completionAudioRef);
        audioErrorShownRef.current = false;
        trackEvent('focus_session_started', {
          preset,
          target_minutes: getMinutes(preset, customMinutes),
          ambient,
        });
      } else {
        stopAmbientAudio(ambientAudioRef);
        trackEvent('focus_session_paused', { remaining_seconds: remaining });
      }
      return next;
    });
  }

  function resetTimer() {
    setRunning(false);
    stopAmbientAudio(ambientAudioRef);
    setRemaining(totalSeconds);
    completedRef.current = false;
  }

  return (
    <section className="page focus-page">
      <div className="focus-shell">
        <header className="focus-header">
          <p className="page__eyebrow">Focus</p>
          <h1>Focus session</h1>
        </header>
        <div className="focus-presets">
          {PRESETS.map((item) => (
            <button key={item.key} type="button" className={preset === item.key ? 'is-active' : ''} onClick={() => setPreset(item.key)}>
              {item.label} {item.key !== 'custom' && `(${item.minutes}m)`}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <input className="input focus-custom" type="number" min={1} max={90} value={customMinutes} onChange={(event) => setCustomMinutes(clamp(Number(event.target.value), 1, 90))} />
        )}
        <div className="focus-timer-wrap">
          <svg className="focus-ring" viewBox="0 0 220 220" aria-hidden="true">
            <circle cx="110" cy="110" r="98" />
            <circle cx="110" cy="110" r="98" style={{ strokeDashoffset: 616 - (616 * progress) / 100 }} />
          </svg>
          <div className="focus-timer">{formatTime(remaining)}</div>
        </div>
        <div className="focus-actions">
          <Button variant="primary" onClick={toggleRunning}>{running ? 'Pause' : 'Start'}</Button>
          <Button variant="secondary" onClick={resetTimer}>Reset</Button>
        </div>
        <section className="focus-audio" aria-label="Focus audio">
          <div className="ambient-controls" aria-label="Ambient sound">
            {AMBIENT_OPTIONS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={ambient === item.key ? 'is-active' : ''}
                onClick={() => setAmbient(item.key)}
                title={item.label}
                aria-pressed={ambient === item.key}
              >
                <AmbientIcon type={item.key} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
          <label className="focus-volume">
            <span>Volume</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(volume * 100)}
              onChange={(event) => setVolume(Number(event.target.value) / 100)}
            />
            <strong>{Math.round(volume * 100)}%</strong>
          </label>
        </section>
      </div>

      {complete && (
        <CompletionModal
          coins={complete.coins}
          minutes={complete.minutes}
          onClose={() => setComplete(null)}
          onRate={async (rating) => {
            try {
              await api.patch(`/api/focus/${complete.sessionId}/rating`, { rating });
              trackEvent('focus_session_rated', { session_id: complete.sessionId, rating });
              showToast('Rating saved.', 'success');
            } catch (err) {
              showToast(extractMessage(err, 'Could not save rating.'), 'error');
            }
          }}
        />
      )}
    </section>
  );
}

const RATING_LABELS = ['Distracted', 'Scattered', 'Steady', 'Focused', 'In the zone'] as const;

function CompletionModal({ coins, minutes, onClose, onRate }: { coins: number; minutes: number; onClose: () => void; onRate: (rating: number) => Promise<void> }) {
  const [rating, setRating] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const previewed = hover ?? rating;
  const promptLabel = previewed ? RATING_LABELS[previewed - 1] : 'How did this session feel?';

  async function handleDone() {
    if (saving) return;
    if (rating !== null) {
      setSaving(true);
      try {
        await onRate(rating);
      } finally {
        setSaving(false);
      }
    }
    onClose();
  }

  return (
    <Modal isOpen onClose={onClose} title="Focus complete">
      <div className="focus-complete">
        <p>{minutes} minutes banked. You earned <strong>{coins}</strong> coins.</p>
        <div className="rating-row" role="radiogroup" aria-label="Rate focus session">
          <span className="rating-row__prompt" aria-live="polite">{promptLabel}</span>
          <div className="rating-row__stars" onMouseLeave={() => setHover(null)}>
            {[1, 2, 3, 4, 5].map((value) => {
              const filled = previewed !== null && value <= previewed;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={rating === value}
                  aria-label={`${value} of 5 – ${RATING_LABELS[value - 1]}`}
                  className={`rating-star${filled ? ' is-filled' : ''}${rating === value ? ' is-selected' : ''}`}
                  onMouseEnter={() => setHover(value)}
                  onFocus={() => setHover(value)}
                  onBlur={() => setHover(null)}
                  onClick={() => setRating((current) => (current === value ? null : value))}
                  disabled={saving}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2.6l2.9 6.1 6.7.8-4.9 4.5 1.4 6.6L12 17.4l-6.1 3.2 1.4-6.6-4.9-4.5 6.7-.8z" />
                  </svg>
                </button>
              );
            })}
          </div>
        </div>
        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Skip</Button>
          <Button variant="primary" onClick={handleDone} disabled={saving}>
            {saving ? 'Saving…' : rating === null ? 'Done' : 'Save rating'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function getMinutes(preset: PresetKey, custom: number): number {
  if (preset === 'custom') return clamp(custom, 1, 90);
  return PRESETS.find((item) => item.key === preset)?.minutes ?? 25;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function getAmbientSource(ambient: Ambient): string | null {
  return AMBIENT_OPTIONS.find((item) => item.key === ambient)?.src ?? null;
}

function stopAmbientAudio(audioRef: MutableRefObject<HTMLAudioElement | null>) {
  if (!audioRef.current) return;
  audioRef.current.pause();
  audioRef.current.currentTime = 0;
}

async function playAmbientAudio(
  ambient: Ambient,
  volume: number,
  audioRef: MutableRefObject<HTMLAudioElement | null>,
): Promise<void> {
  const src = getAmbientSource(ambient);
  if (!src) {
    stopAmbientAudio(audioRef);
    return;
  }
  const current = audioRef.current;
  const needsNewAudio = !current || current.dataset.src !== src;
  const audio = needsNewAudio ? new Audio(src) : current;
  if (needsNewAudio) {
    stopAmbientAudio(audioRef);
    audio.loop = true;
    audio.preload = 'auto';
    audio.dataset.src = src;
    audioRef.current = audio;
  }
  audio.volume = clamp(volume, 0, 1);
  await audio.play();
}

function getAudioContext(ref: MutableRefObject<AudioContext | null>): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ref.current ??= new Ctor();
  return ref.current;
}

function primeCompletionAudio(ref: MutableRefObject<AudioContext | null>) {
  const ctx = getAudioContext(ref);
  if (ctx?.state === 'suspended') void ctx.resume();
}

async function playCompletionChime(ref: MutableRefObject<AudioContext | null>, volume: number) {
  const ctx = getAudioContext(ref);
  if (!ctx) return;
  if (ctx.state === 'suspended') await ctx.resume();
  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.16 * clamp(volume, 0.15, 1), now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
  gain.connect(ctx.destination);
  [523.25, 659.25, 783.99].forEach((frequency, index) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    osc.connect(gain);
    osc.start(now + index * 0.09);
    osc.stop(now + 0.72 + index * 0.05);
  });
}

function AmbientIcon({ type }: { type: Ambient }) {
  if (type === 'off') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 4l16 16M8 9v6h3l4 3V6l-3.2 2.4" />
      </svg>
    );
  }
  if (type === 'rain') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7.5 17.5l-1 2M12 17.5l-1 2M16.5 17.5l-1 2M7 14h9.5a3.5 3.5 0 0 0 .7-6.9A5.1 5.1 0 0 0 7.1 8.2 3 3 0 0 0 7 14z" />
      </svg>
    );
  }
  if (type === 'forest') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 19V9M4.5 14.5L7 11l2.5 3.5M12 20V6M8.8 14.4L12 9l3.2 5.4M17 19v-8M14.8 15.2L17 12l2.2 3.2" />
      </svg>
    );
  }
  if (type === 'night') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M17.8 15.3A7.1 7.1 0 0 1 8.7 6.2 7.2 7.2 0 1 0 17.8 15.3zM17 5.5h.01M20 9h.01" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 12h2M8 12h2M12 12h2M16 12h2M20 12h.01M6 8h2M10 8h2M14 8h2M18 8h.01M6 16h2M10 16h2M14 16h2M18 16h.01" />
    </svg>
  );
}
