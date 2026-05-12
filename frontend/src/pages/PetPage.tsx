import { useState } from 'react';
import { AxiosError } from 'axios';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { Modal } from '../components/common/Modal';
import { PlaceholderPet } from '../components/common/PlaceholderPet';
import { useToastContext } from '../context/ToastContext';
import { useInventory, type InventoryEntry } from '../hooks/useInventory';
import { usePet, type EquipSlot } from '../hooks/usePet';
import { getItemPlaceholder } from '../lib/utils';

const STATS = [
  { key: 'health', label: 'Health', icon: 'M12 21s-7-4.5-7-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.5-7 10-7 10z' },
  { key: 'happiness', label: 'Happiness', icon: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zM8.5 14.5a4 4 0 0 0 7 0' },
  { key: 'hunger', label: 'Hunger', icon: 'M7 4v8a3 3 0 0 0 3 3 3 3 0 0 0 0-6V4M17 4c-1 1-1 5 0 8 .8 1.6 3 1.6 3-1V4' },
  { key: 'energy', label: 'Energy', icon: 'M13 2 4 14h6l-1 8 11-12h-7l0-8z' },
  { key: 'cleanliness', label: 'Cleanliness', icon: 'M12 3c-3 4-5 7-5 10a5 5 0 0 0 10 0c0-3-2-6-5-10z' },
] as const;

const SLOTS: { slot: EquipSlot; label: string }[] = [
  { slot: 'hat', label: 'Hat' },
  { slot: 'accessory', label: 'Accessory' },
  { slot: 'background', label: 'Background' },
  { slot: 'glasses', label: 'Glasses' },
  { slot: 'scarf', label: 'Scarf' },
  { slot: 'badge', label: 'Badge' },
  { slot: 'charm', label: 'Charm' },
];

export function PetPage() {
  const { pet, isLoading, equip, refetch } = usePet();
  const { cosmetics, refetch: refetchInventory } = useInventory();
  const { showToast } = useToastContext();
  const [slot, setSlot] = useState<EquipSlot | null>(null);
  const [equippingId, setEquippingId] = useState<string | null>(null);

  async function handleEquip(item: InventoryEntry) {
    setEquippingId(item.id);
    try {
      await equip(item.id);
      await Promise.all([refetch(), refetchInventory()]);
      showToast(`${item.name} equipped.`, 'success');
      setSlot(null);
    } catch (err) {
      showToast(extractMessage(err), 'error');
    } finally {
      setEquippingId(null);
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
          <h1>{pet.name}</h1>
        </div>
      </header>

      <div className="pet-page__layout">
        <section className="pet-page__hero" aria-label="Pet overview">
          <div className="pet-page__pet-art">
            {/* PLACEHOLDER: Replace with final pet display art when delivered. */}
            <PlaceholderPet species={pet.species} mood={pet.health > 60 ? 'happy' : pet.health > 30 ? 'neutral' : 'sad'} size={300} className="pet-breathing" />
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

        <section className="pet-page__panel" aria-label="Pet stats">
          <h2>Stats</h2>
          <div className="pet-page__stats">
            {STATS.map((stat) => (
              <PetStat key={stat.key} label={stat.label} value={pet[stat.key]} icon={stat.icon} />
            ))}
          </div>
        </section>

        <section className="pet-page__panel pet-page__cosmetics" aria-label="Equipped cosmetics">
          <h2>Equipped cosmetics</h2>
          <div className="slot-grid">
            {SLOTS.map((item) => {
              const equipped = pet.equipped[item.slot];
              return (
                <button key={item.slot} type="button" className="slot-card" onClick={() => setSlot(item.slot)}>
                  <span className="slot-card__circle">
                    {equipped ? (
                      <span className="slot-card__image" style={{ backgroundImage: `url("${getItemPlaceholder(equipped.name)}")` }} />
                    ) : (
                      <span className="slot-card__empty" />
                    )}
                  </span>
                  <span className="slot-card__label">{item.label}</span>
                  <span className="slot-card__item">{equipped?.name ?? 'Empty'}</span>
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
          items={cosmetics.filter((item) => item.category === slot)}
          onClose={() => setSlot(null)}
          onEquip={handleEquip}
          equippingId={equippingId}
        />
      )}
    </section>
  );
}

function PetStat({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="pet-stat">
      <div className="pet-stat__head">
        <span aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d={icon} />
          </svg>
        </span>
        <span>{label}</span>
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
  items,
  onClose,
  onEquip,
  equippingId,
}: {
  slot: EquipSlot;
  items: InventoryEntry[];
  onClose: () => void;
  onEquip: (item: InventoryEntry) => void;
  equippingId: string | null;
}) {
  const title = `Equip ${slot}`;
  return (
    <Modal isOpen onClose={onClose} title={title}>
      {items.length === 0 ? (
        <p className="pet-page__empty">No owned cosmetics for this slot.</p>
      ) : (
        <ul className="equip-list" role="list">
          {items.map((item) => (
            <li key={item.id}>
              <button type="button" className="equip-item" disabled={equippingId !== null} onClick={() => onEquip(item)}>
                <span className="equip-item__image" style={{ backgroundImage: `url("${getItemPlaceholder(item.name)}")` }} />
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

function extractMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { error?: { message?: string } } | undefined;
    return data?.error?.message ?? 'Could not equip that item.';
  }
  return 'Could not equip that item.';
}
