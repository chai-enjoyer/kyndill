import { useState } from 'react';
import { AxiosError } from 'axios';
import { Button } from '../components/common/Button';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { Modal } from '../components/common/Modal';
import { useAuthContext } from '../context/AuthContext';
import { useToastContext } from '../context/ToastContext';
import { useShop, type ShopCosmetic, type ShopItem } from '../hooks/useShop';
import { getItemPlaceholder } from '../lib/utils';

type ShopTab = 'cosmetics' | 'consumables';

export function ShopPage() {
  const {
    coins,
    freezeCount,
    cosmetics,
    consumables,
    isLoading,
    purchase,
    buyStreakFreeze,
  } = useShop();
  const { mergeUser } = useAuthContext();
  const { showToast } = useToastContext();
  const [tab, setTab] = useState<ShopTab>('cosmetics');
  const [confirming, setConfirming] = useState<ShopItem | ShopCosmetic | null>(null);
  const [busy, setBusy] = useState(false);

  const items = tab === 'cosmetics' ? cosmetics : consumables;

  async function handlePurchase(item: ShopItem | ShopCosmetic) {
    setBusy(true);
    try {
      await purchase(item.id);
      mergeUser({ coins: coins - item.price });
      showToast(`${item.name} purchased.`, 'success');
      setConfirming(null);
    } catch (err) {
      showToast(extractMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleBuyFreeze() {
    setBusy(true);
    try {
      await buyStreakFreeze();
      mergeUser({ coins: coins - 50 });
      showToast('Streak freeze added.', 'success');
    } catch (err) {
      showToast(extractMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="page shop-page">
      <header className="page__header shop-page__header">
        <div>
          <p className="page__eyebrow">Catalogue</p>
          <h1>Kyndill Shop</h1>
        </div>
        <div className="shop-page__coins">
          <span>{coins}</span>
          <small>coins</small>
        </div>
      </header>

      <div className="shop-tabs" role="tablist" aria-label="Shop categories">
        <button type="button" role="tab" aria-selected={tab === 'cosmetics'} className={tab === 'cosmetics' ? 'is-active' : ''} onClick={() => setTab('cosmetics')}>
          Cosmetics
        </button>
        <button type="button" role="tab" aria-selected={tab === 'consumables'} className={tab === 'consumables' ? 'is-active' : ''} onClick={() => setTab('consumables')}>
          Consumables
        </button>
      </div>

      {isLoading ? (
        <div className="shop-grid" aria-busy="true">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <LoadingSkeleton key={i} width="100%" height={260} />
          ))}
        </div>
      ) : (
        <div className="shop-grid">
          {items.map((item) => (
            <ShopItemCard
              key={item.id}
              item={item}
              coins={coins}
              onPurchase={() => setConfirming(item)}
            />
          ))}
        </div>
      )}

      <section className="freeze-card" aria-label="Streak Freeze">
        <div>
          <p className="page__eyebrow">Safety net</p>
          <h2>Streak Freeze</h2>
          <p className="text-muted">Current freeze count: {freezeCount}/3</p>
        </div>
        <Button
          variant="primary"
          disabled={busy || freezeCount >= 3 || coins < 50}
          title={coins < 50 ? 'Not enough coins' : freezeCount >= 3 ? 'Freeze limit reached' : undefined}
          onClick={handleBuyFreeze}
        >
          Buy for 50
        </Button>
      </section>

      {confirming && (
        <Modal isOpen onClose={() => setConfirming(null)} title="Confirm purchase">
          <p className="confirm-copy">
            Buy <strong>{confirming.name}</strong> for <strong>{confirming.price}</strong> coins?
          </p>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setConfirming(null)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => handlePurchase(confirming)} disabled={busy}>
              Purchase
            </Button>
          </div>
        </Modal>
      )}
    </section>
  );
}

function ShopItemCard({
  item,
  coins,
  onPurchase,
}: {
  item: ShopItem | ShopCosmetic;
  coins: number;
  onPurchase: () => void;
}) {
  const owned = 'owned' in item && item.owned;
  const insufficient = coins < item.price;
  return (
    <article className="shop-item-card">
      <div className="shop-item-card__image">
        {/* PLACEHOLDER */}
        <span style={{ backgroundImage: `url("${getItemPlaceholder(item.name)}")` }} />
      </div>
      <div className="shop-item-card__body">
        <div className="shop-item-card__title-row">
          <h2>{item.name}</h2>
          <span className={`rarity-badge rarity-badge--${item.rarity}`}>{item.rarity}</span>
        </div>
        <p className="shop-item-card__price">{item.price} coins</p>
        {item.effect_stat && item.effect_amount !== null && (
          <p className="text-muted">+{item.effect_amount} {item.effect_stat}</p>
        )}
      </div>
      {owned ? (
        <span className="owned-badge">Owned</span>
      ) : (
        <Button
          variant="primary"
          disabled={insufficient}
          title={insufficient ? 'Insufficient coins' : undefined}
          onClick={onPurchase}
        >
          Purchase
        </Button>
      )}
    </article>
  );
}

function extractMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { error?: { message?: string } } | undefined;
    return data?.error?.message ?? 'Purchase failed.';
  }
  return 'Purchase failed.';
}
