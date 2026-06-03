import { useState } from 'react';
import { AxiosError } from 'axios';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { SpritePet } from './SpritePet';
import { StatIcon, type StatIconName } from './StatIcon';
import { useToastContext } from '../../context/ToastContext';
import type { PetFullState } from '../../hooks/usePet';
import snowflake from '../../assets/sprites/snowflake.svg';

// стат <= этого порога считаем "пора покормить"
export const LOW_STAT_THRESHOLD = 15;

const CARE_STATS: Array<{ key: 'happiness' | 'hunger' | 'energy' | 'cleanliness'; label: string; icon: StatIconName }> = [
  { key: 'hunger', label: 'Hunger', icon: 'hunger' },
  { key: 'energy', label: 'Energy', icon: 'energy' },
  { key: 'happiness', label: 'Happiness', icon: 'happiness' },
  { key: 'cleanliness', label: 'Cleanliness', icon: 'cleanliness' },
];

export function petNeedsCare(pet: Pick<PetFullState, 'happiness' | 'hunger' | 'energy' | 'cleanliness'>): boolean {
  return CARE_STATS.some((stat) => pet[stat.key] <= LOW_STAT_THRESHOLD);
}

interface PetCarePromptModalProps {
  pet: PetFullState;
  freezeCount: number;
  onFeed: () => void;
  onRevive: () => Promise<void>;
  onClose: () => void;
}

export function PetCarePromptModal({ pet, freezeCount, onFeed, onRevive, onClose }: PetCarePromptModalProps) {
  const { showToast } = useToastContext();
  const [reviving, setReviving] = useState(false);
  const fainted = pet.is_fainted;
  const lowStats = CARE_STATS.filter((stat) => pet[stat.key] <= LOW_STAT_THRESHOLD);

  async function handleRevive() {
    if (reviving) return;
    setReviving(true);
    try {
      await onRevive();
      // после успеха питомец не fainted -> родитель сам нас размонтирует
    } catch (err) {
      showToast(extractMessage(err), 'error');
      setReviving(false);
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={fainted ? `${pet.name} has fainted` : `${pet.name} needs some care`}>
      <div className="pet-care-prompt">
        <div className={`pet-care-prompt__art ${fainted ? 'is-fainted' : ''}`}>
          <SpritePet species={pet.species} mood="sad" size={150} equipped={pet.equipped} />
        </div>

        {fainted ? (
          <p className="pet-care-prompt__lead">
            Their health ran all the way down. Revive them to pick the routine back up — no
            progress is lost.
          </p>
        ) : (
          <p className="pet-care-prompt__lead">
            A few stats are running low. A quick feed (or finishing a habit) keeps {pet.name}{' '}
            in good shape.
          </p>
        )}

        {lowStats.length > 0 && (
          <ul className="pet-care-prompt__stats" role="list">
            {lowStats.map((stat) => (
              <li key={stat.key} className="pet-care-prompt__stat">
                <StatIcon name={stat.icon} size={16} />
                <span>{stat.label}</span>
                <strong>{Math.round(pet[stat.key])}</strong>
              </li>
            ))}
          </ul>
        )}

        <div className="pet-care-prompt__actions">
          {fainted && (
            <Button variant="primary" onClick={handleRevive} disabled={freezeCount < 1 || reviving}>
              <span
                className="pet-care-prompt__freeze-icon"
                aria-hidden="true"
                style={{ backgroundImage: `url("${snowflake}")` }}
              />
              {reviving
                ? 'Reviving…'
                : freezeCount < 1
                  ? 'No streak freezes'
                  : `Revive with a freeze (${freezeCount})`}
            </Button>
          )}
          <Button variant={fainted ? 'secondary' : 'primary'} onClick={onFeed} disabled={reviving}>
            {fainted ? 'Feed instead' : 'Feed now'}
          </Button>
          <Button variant="ghost" onClick={onClose} disabled={reviving}>
            {fainted ? 'Maybe later' : 'Not now'}
          </Button>
        </div>

        {fainted && (
          <p className="pet-care-prompt__hint text-muted">
            Completing a habit today will also bring them back.
          </p>
        )}
      </div>
    </Modal>
  );
}

function extractMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { error?: { message?: string } } | undefined;
    return data?.error?.message ?? 'Could not revive your companion.';
  }
  return 'Could not revive your companion.';
}
