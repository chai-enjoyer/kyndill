import { useEffect, useState, type FormEvent } from 'react';
import { AxiosError } from 'axios';
import { Button } from '../components/common/Button';
import { CosmeticPreview } from '../components/common/CosmeticPreview';
import { InfoTip } from '../components/common/InfoTip';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { Modal } from '../components/common/Modal';
import { SpritePet } from '../components/common/SpritePet';
import { StatIcon, type StatIconName } from '../components/common/StatIcon';
import { useAuthContext } from '../context/AuthContext';
import { useToastContext } from '../context/ToastContext';
import { useInventory, type InventoryEntry } from '../hooks/useInventory';
import { usePet, type EquipSlot, type PetFullState } from '../hooks/usePet';
import { getItemPlaceholder } from '../lib/utils';
import { trackEvent } from '../lib/analytics';
import { deriveHealthBreakdown } from '../lib/petHealth';

const STATS: Array<{
  key: 'health' | 'happiness' | 'hunger' | 'energy' | 'cleanliness';
  label: string;
  icon: StatIconName;
  info: string;
}> = [
  {
    key: 'health',
    label: 'Health',
    icon: 'health',
    info: 'Health = care-stat average × 55% + streak score × 35% + a consistency bonus capped at 12. See the breakdown below.',
  },
  {
    key: 'happiness',
    label: 'Happiness',
    icon: 'happiness',
    info: 'Rises by 6–12 with each completion (Social and Wellness give the most) and drifts down ~3/day between visits.',
  },
  {
    key: 'hunger',
    label: 'Hunger',
    icon: 'hunger',
    info: 'Drops ~6/day between visits and ~5 per completion. Food consumables restore it.',
  },
  {
    key: 'energy',
    label: 'Energy',
    icon: 'energy',
    info: 'Drops ~5/day between visits and 4–6 per completion (Productivity costs the most). Energy consumables restore it.',
  },
  {
    key: 'cleanliness',
    label: 'Cleanliness',
    icon: 'cleanliness',
    info: 'Drifts down ~4/day between visits and ~3 per completion. Health habits add a small bump; Wellness leaves it alone.',
  },
];

const SLOTS: { slot: EquipSlot; label: string }[] = [
  { slot: 'hat', label: 'Hat' },
  { slot: 'accessory', label: 'Accessory' },
  { slot: 'glasses', label: 'Glasses' },
  { slot: 'scarf', label: 'Bow tie' },
  { slot: 'badge', label: 'Badge' },
  { slot: 'charm', label: 'Charm' },
];

export function PetPage() {
  const { pet, isLoading, equip, unequip, rename, refetch } = usePet();
  const { cosmetics, refetch: refetchInventory } = useInventory();
  const { showToast } = useToastContext();
  const { user } = useAuthContext();
  const [slot, setSlot] = useState<EquipSlot | null>(null);
  const [equippingId, setEquippingId] = useState<string | null>(null);
  const [unequippingSlot, setUnequippingSlot] = useState<EquipSlot | null>(null);
  const [petName, setPetName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [renaming, setRenaming] = useState(false);

  useEffect(() => {
    if (!pet) return;
    setPetName(pet.name);
  }, [pet]);

  async function handleEquip(item: InventoryEntry) {
    setEquippingId(item.id);
    try {
      await equip(item.id);
      await Promise.all([refetch(), refetchInventory()]);
      trackEvent('pet_item_equipped', { item_id: item.id });
      showToast(`${item.name} equipped.`, 'success');
      setSlot(null);
    } catch (err) {
      showToast(extractMessage(err), 'error');
    } finally {
      setEquippingId(null);
    }
  }

  async function handleUnequip(slotToClear: EquipSlot) {
    setUnequippingSlot(slotToClear);
    try {
      await unequip(slotToClear);
      await refetchInventory();
      trackEvent('pet_item_unequipped', { slot: slotToClear });
      showToast('Removed.', 'success');
      setSlot(null);
    } catch (err) {
      showToast(extractMessage(err, 'Could not unequip that item.'), 'error');
    } finally {
      setUnequippingSlot(null);
    }
  }

  async function handleRename(event: FormEvent) {
    event.preventDefault();
    const trimmed = petName.trim();
    if (!trimmed || trimmed === pet?.name || renaming) {
      setEditingName(false);
      return;
    }
    setRenaming(true);
    try {
      await rename(trimmed);
      // Length is the only thing we record. The chosen name itself is
      // self-identifying and we don't want it in the research export.
      trackEvent('pet_renamed', { name_length: trimmed.length });
      showToast(`Say hi to ${trimmed}.`, 'success');
      setEditingName(false);
    } catch (err) {
      showToast(extractMessage(err, 'Could not rename your companion.'), 'error');
    } finally {
      setRenaming(false);
    }
  }

  if (isLoading) {
    return (
      <section className="page pet-page">
        <LoadingSkeleton width="100%" height={520} />
      </section>
    );
  }

  if (!pet) {
    return (
      <section className="page pet-page">
        <div className="pet-page__empty">No companion found.</div>
      </section>
    );
  }

  const stage = getStage(pet.stage, pet.total_habits_completed);
  const daysAlive = getDaysAlive(pet.created_at);

  return (
    <section className="page pet-page">
      <header className="page__header pet-page__header">
        <div>
          <p className="page__eyebrow">Companion</p>
          {editingName ? (
            <form className="pet-page__rename" onSubmit={handleRename}>
              <input
                className="input"
                value={petName}
                onChange={(event) => setPetName(event.target.value.slice(0, 20))}
                maxLength={20}
                autoFocus
                aria-label="Pet name"
              />
              <Button variant="primary" type="submit" disabled={renaming || !petName.trim()}>
                {renaming ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  setPetName(pet.name);
                  setEditingName(false);
                }}
              >
                Cancel
              </Button>
            </form>
          ) : (
            <div className="pet-page__title-row">
              <h1>{pet.name}</h1>
              <Button variant="secondary" type="button" onClick={() => setEditingName(true)}>
                Rename
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="pet-page__layout">
        <section className="pet-page__hero" aria-label="Pet overview">
          <div className="pet-page__pet-art">
            {/* PLACEHOLDER: Replace with final pet display artist asset when delivered. */}
            <SpritePet
              species={pet.species}
              mood={pet.health > 60 ? 'happy' : pet.health > 30 ? 'neutral' : 'sad'}
              size={430}
              equipped={pet.equipped}
              className="pet-breathing"
              style={{ width: '100%', height: '100%' }}
            />
          </div>
          <div className="pet-page__stage">
            <div className="pet-page__stage-head">
              <span>{stage.label}</span>
              <span>{stage.progressLabel}</span>
            </div>
            <div className="pet-page__stage-track" role="progressbar" aria-valuenow={stage.progress} aria-valuemin={0} aria-valuemax={100}>
              <span style={{ width: `${stage.progress}%` }} />
            </div>
          </div>
        </section>

        <section className="pet-page__panel pet-page__stats-panel" aria-label="Pet stats">
          <h2>Stats</h2>
          <div className="pet-page__stats">
            {STATS.map((stat) => (
              <PetStat key={stat.key} label={stat.label} value={pet[stat.key]} icon={stat.icon} info={stat.info} />
            ))}
          </div>
          <HealthBreakdown
            pet={pet}
            streak={user?.streak_current ?? 0}
          />
        </section>

        <section className="pet-page__panel pet-page__cosmetics" aria-label="Equipped cosmetics">
          <h2>Equipped cosmetics</h2>
          <div className="slot-grid">
            {SLOTS.map((item) => {
              const equipped = pet.equipped[item.slot];
              return (
                <button
                  key={item.slot}
                  type="button"
                  className="slot-card"
                  aria-label={`${item.label} slot${equipped ? ', equipped' : ', empty'}`}
                  onClick={() => setSlot(item.slot)}
                >
                  <span className={`slot-card__circle ${equipped ? 'slot-card__circle--filled' : ''}`}>
                    {equipped ? (
                      <span
                        className="slot-card__item"
                        aria-hidden="true"
                        style={{ backgroundImage: `url("${getItemPlaceholder(equipped.name)}")` }}
                      />
                    ) : (
                      <span className="slot-card__empty" />
                    )}
                  </span>
                  <span className="slot-card__label">{item.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="pet-page__panel pet-page__history" aria-label="Pet history">
          <h2>History</h2>
          <dl>
            <div>
              <dt>Total habits completed</dt>
              <dd>{pet.total_habits_completed}</dd>
            </div>
            <div>
              <dt>Days alive</dt>
              <dd>{daysAlive}</dd>
            </div>
          </dl>
        </section>
      </div>

      {slot && (
        <EquipModal
          slot={slot}
          slotLabel={SLOTS.find((item) => item.slot === slot)?.label ?? slot}
          items={cosmetics.filter((item) => item.category === slot)}
          pet={pet}
          onClose={() => setSlot(null)}
          onEquip={handleEquip}
          onUnequip={handleUnequip}
          equippingId={equippingId}
          unequippingSlot={unequippingSlot}
        />
      )}
    </section>
  );
}

function HealthBreakdown({ pet, streak }: { pet: PetFullState; streak: number }) {
  const breakdown = deriveHealthBreakdown(streak, pet);
  const carePoints = Math.round(breakdown.careAverage * breakdown.weights.care);
  const streakPoints = Math.round(breakdown.streakScore * breakdown.weights.streak);
  return (
    <details className="health-breakdown" open>
      <summary>
        <span>How health adds up</span>
        <strong>{breakdown.health}/100</strong>
      </summary>
      <ul className="health-breakdown__rows">
        <li>
          <span>Care average</span>
          <span className="health-breakdown__sub">
            ({pet.happiness}+{pet.hunger}+{pet.energy}+{pet.cleanliness}) ÷ 4 ={' '}
            {breakdown.careAverage}
          </span>
          <strong>+{carePoints}</strong>
        </li>
        <li>
          <span>Streak momentum</span>
          <span className="health-breakdown__sub">
            {streak} day{streak === 1 ? '' : 's'} × 12, capped at 100
          </span>
          <strong>+{streakPoints}</strong>
        </li>
        <li>
          <span>Consistency bonus</span>
          <span className="health-breakdown__sub">2 per streak day, capped at 12</span>
          <strong>+{breakdown.consistencyBonus}</strong>
        </li>
        <li className="health-breakdown__total">
          <span>Health</span>
          <span className="health-breakdown__sub">capped at 100</span>
          <strong>{breakdown.health}</strong>
        </li>
      </ul>
      <p className="health-breakdown__note text-muted">
        Care stats drift down between visits (hunger and energy fastest, cleanliness and
        happiness slower). Completing habits and feeding consumables push them back up.
      </p>
    </details>
  );
}

function PetStat({ label, value, icon, info }: { label: string; value: number; icon: StatIconName; info: string }) {
  return (
    <div className="pet-stat">
      <div className="pet-stat__head">
        <span className="pet-stat__icon" aria-hidden="true">
          <StatIcon name={icon} size={20} />
        </span>
        <span>{label}</span>
        <InfoTip label={`${label} info`} text={info} />
        <strong>{Math.round(value)}</strong>
      </div>
      <div className="pet-stat__track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)}>
        <span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  );
}

function EquipModal({
  slot,
  slotLabel,
  items,
  pet,
  onClose,
  onEquip,
  onUnequip,
  equippingId,
  unequippingSlot,
}: {
  slot: EquipSlot;
  slotLabel: string;
  items: InventoryEntry[];
  pet: PetFullState;
  onClose: () => void;
  onEquip: (item: InventoryEntry) => void;
  onUnequip: (slot: EquipSlot) => void;
  equippingId: string | null;
  unequippingSlot: EquipSlot | null;
}) {
  const title = `Equip ${slotLabel}`;
  const mood = getMood(pet.health, pet.is_fainted);
  const equipped = pet.equipped[slot];
  const isBusy = equippingId !== null || unequippingSlot !== null;
  return (
    <Modal isOpen onClose={onClose} title={title}>
      {equipped && (
        <div className="equip-current">
          <div>
            <span className="text-muted">Currently equipped</span>
            <strong>{equipped.name}</strong>
          </div>
          <Button
            variant="secondary"
            type="button"
            disabled={isBusy}
            onClick={() => onUnequip(slot)}
          >
            {unequippingSlot === slot ? 'Unequipping...' : 'Unequip'}
          </Button>
        </div>
      )}
      {items.length === 0 ? (
        <p className="pet-page__empty">No owned cosmetics for this slot.</p>
      ) : (
        <ul className="equip-list" role="list">
          {items.map((item) => (
            <li key={item.id}>
              <button type="button" className="equip-item" disabled={isBusy} onClick={() => onEquip(item)}>
                <CosmeticPreview
                  name={item.name}
                  category={item.category}
                  size={72}
                  compact
                  species={pet.species}
                  mood={mood}
                  equipped={pet.equipped}
                />
                <span className="equip-item__name">{item.name}</span>
                <span className={`rarity-badge rarity-badge--${item.rarity}`}>
                  {equippingId === item.id ? 'Equipping' : item.rarity}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

function getMood(health: number, isFainted: boolean) {
  if (isFainted) return 'sad';
  if (health > 60) return 'happy';
  if (health > 30) return 'neutral';
  return 'sad';
}

function getStage(stage: number, totalCompleted = 0) {
  if (stage >= 3) return { label: 'Adult', progress: 100, progressLabel: 'Fully grown' };
  if (stage === 2) {
    const progress = Math.round(((Math.max(totalCompleted, 51) - 51) / 150) * 100);
    return {
      label: 'Teen',
      progress: Math.min(100, progress),
      progressLabel: `${Math.max(0, 201 - totalCompleted)} to Adult`,
    };
  }
  const progress = Math.round((Math.max(0, totalCompleted) / 51) * 100);
  return {
    label: 'Baby',
    progress: Math.min(100, progress),
    progressLabel: `${Math.max(0, 51 - totalCompleted)} to Teen`,
  };
}

function getDaysAlive(createdAt: string): number {
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return 0;
  return Math.max(1, Math.floor((Date.now() - created) / 86_400_000) + 1);
}

function extractMessage(err: unknown, fallback = 'Could not equip that item.'): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { error?: { message?: string } } | undefined;
    return data?.error?.message ?? fallback;
  }
  return fallback;
}
