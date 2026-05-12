import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { api } from '../lib/api';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { PlaceholderPet } from '../components/common/PlaceholderPet';
import { useAuthContext } from '../context/AuthContext';
import { useToastContext } from '../context/ToastContext';
import { extractMessage } from '../hooks/useSocial';

const PRESETS = [
  { key: 'pomodoro', label: 'Pomodoro', minutes: 25 },
  { key: 'short', label: 'Short', minutes: 15 },
  { key: 'long', label: 'Long', minutes: 50 },
  { key: 'custom', label: 'Custom', minutes: 25 },
] as const;

type PresetKey = (typeof PRESETS)[number]['key'];
type Ambient = 'rain' | 'forest' | 'cafe' | 'white' | 'off';

export function FocusPage() {
  const [preset, setPreset] = useState<PresetKey>('pomodoro');
  const [customMinutes, setCustomMinutes] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [ambient, setAmbient] = useState<Ambient>('off');
  const [complete, setComplete] = useState<{ sessionId: string; coins: number; minutes: number } | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const noiseRef = useRef<AudioScheduledSourceNode | OscillatorNode | null>(null);
  const { mergeUser, user } = useAuthContext();
  const { showToast } = useToastContext();

  const totalSeconds = useMemo(() => getMinutes(preset, customMinutes) * 60, [preset, customMinutes]);
  const progress = totalSeconds === 0 ? 0 : ((totalSeconds - remaining) / totalSeconds) * 100;

  useEffect(() => {
    setRemaining(totalSeconds);
    setRunning(false);
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
    startAmbient(ambient, audioRef, noiseRef);
    return () => stopAmbient(noiseRef);
  }, [ambient]);

  async function finishSession(rating?: number) {
    setRunning(false);
    try {
      const minutes = Math.max(1, Math.round(totalSeconds / 60));
      const { data } = await api.post<{ session_id: string; coins_earned: number; total_focus_time: number }>('/api/focus/complete', {
        duration_minutes: minutes,
        rating,
      });
      mergeUser({ coins: (user?.coins ?? 0) + data.coins_earned });
      setComplete({ sessionId: data.session_id, coins: data.coins_earned, minutes });
    } catch (err) {
      showToast(extractMessage(err, 'Could not save focus session.'), 'error');
    }
  }

  return (
    <section className="page focus-page">
      <div className="focus-shell">
        <div className="focus-pet">
          {/* PLACEHOLDER */}
          <PlaceholderPet species="blob" mood="neutral" size={92} />
        </div>
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
          <Button variant="primary" onClick={() => setRunning((prev) => !prev)}>{running ? 'Pause' : 'Start'}</Button>
          <Button variant="secondary" onClick={() => { setRunning(false); setRemaining(totalSeconds); }}>Reset</Button>
        </div>
        <div className="ambient-controls" aria-label="Ambient sound">
          {(['rain', 'forest', 'cafe', 'white', 'off'] as Ambient[]).map((item) => (
            <button key={item} type="button" className={ambient === item ? 'is-active' : ''} onClick={() => setAmbient(item)} title={item}>
              {ambientIcon(item)}
            </button>
          ))}
        </div>
      </div>

      {complete && (
        <CompletionModal
          coins={complete.coins}
          minutes={complete.minutes}
          onClose={() => setComplete(null)}
          onRate={async (rating) => {
            try {
              await api.patch(`/api/focus/${complete.sessionId}/rating`, { rating });
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

function CompletionModal({ coins, minutes, onClose, onRate }: { coins: number; minutes: number; onClose: () => void; onRate: (rating: number) => void }) {
  const [rated, setRated] = useState(false);
  return (
    <Modal isOpen onClose={onClose} title="Focus complete">
      <div className="focus-complete">
        <p>{minutes} minutes banked. You earned <strong>{coins}</strong> coins.</p>
        <div className="rating-row" aria-label="Rate focus session">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button key={rating} type="button" disabled={rated} onClick={() => { setRated(true); onRate(rating); }}>
              {rating}
            </button>
          ))}
        </div>
        <div className="modal-actions"><Button variant="primary" onClick={onClose}>Done</Button></div>
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

function ambientIcon(item: Ambient): string {
  return { rain: 'Rain', forest: 'Forest', cafe: 'Cafe', white: 'Noise', off: 'Off' }[item];
}

function stopAmbient(sourceRef: MutableRefObject<AudioScheduledSourceNode | OscillatorNode | null>) {
  try { sourceRef.current?.stop(); } catch { /* already stopped */ }
  sourceRef.current = null;
}

function startAmbient(
  ambient: Ambient,
  contextRef: MutableRefObject<AudioContext | null>,
  sourceRef: MutableRefObject<AudioScheduledSourceNode | OscillatorNode | null>,
) {
  stopAmbient(sourceRef);
  if (ambient === 'off' || typeof window === 'undefined') return;
  const Ctor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;
  const ctx = contextRef.current ?? new Ctor();
  contextRef.current = ctx;
  const gain = ctx.createGain();
  gain.gain.value = ambient === 'white' ? 0.015 : 0.02;
  gain.connect(ctx.destination);
  const osc = ctx.createOscillator();
  osc.type = ambient === 'rain' ? 'sine' : ambient === 'forest' ? 'triangle' : 'sawtooth';
  osc.frequency.value = ambient === 'cafe' ? 140 : ambient === 'forest' ? 220 : 90;
  osc.connect(gain);
  osc.start();
  sourceRef.current = osc;
}
