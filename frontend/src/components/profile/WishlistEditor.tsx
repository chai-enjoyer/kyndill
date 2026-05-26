import { useEffect, useMemo, useState } from 'react';
import { Button } from '../common/Button';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { useToastContext } from '../../context/ToastContext';
import { extractMessage } from '../../hooks/useSocial';
import { useShop } from '../../hooks/useShop';
import { useWishlist, type WishlistEntry } from '../../hooks/useWishlist';
import { getItemPlaceholder } from '../../lib/utils';

// Small editor for the user's giftable-wishlist (≤3 items). Lists every
// consumable + streak_freeze from the shop; user picks priorities. Saving
// replaces the whole list atomically server-side.

const MAX_ITEMS = 3;

interface ChoosableItem {
  id: string;
  name: string;
  type: 'consumable' | 'streak_freeze';
}

export function WishlistEditor() {
  const { wishlist, isLoading: wishlistLoading, save } = useWishlist();
  const { consumables, streakFreezes, isLoading: shopLoading } = useShop();
  const { showToast } = useToastContext();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelected(wishlist.map((entry) => entry.item_id));
  }, [wishlist]);

  const choosable: ChoosableItem[] = useMemo(() => {
    const items: ChoosableItem[] = [
      ...streakFreezes.map((item) => ({ id: item.id, name: item.name, type: 'streak_freeze' as const })),
      ...consumables.map((item) => ({ id: item.id, name: item.name, type: 'consumable' as const })),
    ];
    return items;
  }, [consumables, streakFreezes]);

  const isLoading = wishlistLoading || shopLoading;
  const isDirty = !sameOrder(selected, wishlist.map((entry) => entry.item_id));

  function toggle(itemId: string) {
    setSelected((prev) => {
      if (prev.includes(itemId)) return prev.filter((id) => id !== itemId);
      if (prev.length >= MAX_ITEMS) return prev;
      return [...prev, itemId];
    });
  }

  function move(itemId: string, direction: -1 | 1) {
    setSelected((prev) => {
      const idx = prev.indexOf(itemId);
      const target = idx + direction;
      if (idx === -1 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await save(selected);
      showToast('Wishlist saved.', 'success');
    } catch (err) {
      showToast(extractMessage(err, 'Could not save wishlist.'), 'error');
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return <LoadingSkeleton width="100%" height={140} />;
  }

  return (
    <section className="wishlist-editor">
      <header className="wishlist-editor__head">
        <div>
          <h2>Wishlist</h2>
          <p className="text-muted">
            Pick up to {MAX_ITEMS} giftable items. Friends can see this on your profile and send
            them through the gift menu.
          </p>
        </div>
      </header>

      {selected.length > 0 && (
        <ol className="wishlist-editor__ordered">
          {selected.map((itemId, index) => {
            const item = choosable.find((entry) => entry.id === itemId);
            if (!item) return null;
            return (
              <li key={itemId}>
                <span className="wishlist-editor__position">{index + 1}</span>
                <span
                  className="wishlist-editor__image"
                  style={{ backgroundImage: `url("${getItemPlaceholder(item.name)}")` }}
                />
                <span className="wishlist-editor__name">{item.name}</span>
                <span className="wishlist-editor__controls">
                  <button
                    type="button"
                    aria-label="Move up"
                    disabled={index === 0}
                    onClick={() => move(itemId, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label="Move down"
                    disabled={index === selected.length - 1}
                    onClick={() => move(itemId, 1)}
                  >
                    ↓
                  </button>
                  <button type="button" aria-label="Remove" onClick={() => toggle(itemId)}>
                    ✕
                  </button>
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <div className="wishlist-editor__catalog">
        <h3>Add items</h3>
        <div className="wishlist-editor__grid">
          {choosable.map((item) => {
            const isPicked = selected.includes(item.id);
            const atCap = !isPicked && selected.length >= MAX_ITEMS;
            return (
              <label
                key={item.id}
                className={`wishlist-editor__option${isPicked ? ' is-picked' : ''}${atCap ? ' is-disabled' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isPicked}
                  disabled={atCap}
                  onChange={() => toggle(item.id)}
                />
                <span
                  className="wishlist-editor__image wishlist-editor__image--small"
                  style={{ backgroundImage: `url("${getItemPlaceholder(item.name)}")` }}
                />
                <span>
                  {item.name}
                  {item.type === 'streak_freeze' && (
                    <small className="text-muted"> Streak freeze</small>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="wishlist-editor__actions">
        <Button variant="primary" type="button" disabled={!isDirty || saving} onClick={handleSave}>
          {saving ? 'Saving…' : 'Save wishlist'}
        </Button>
      </div>
    </section>
  );
}

export function WishlistView({ items }: { items: WishlistEntry[] }) {
  if (items.length === 0) {
    return <p className="text-muted">No wishlist yet.</p>;
  }
  return (
    <ol className="wishlist-view">
      {items.map((item) => (
        <li key={item.item_id}>
          <span
            className="wishlist-view__image"
            style={{ backgroundImage: `url("${getItemPlaceholder(item.name)}")` }}
          />
          <span>{item.name}</span>
        </li>
      ))}
    </ol>
  );
}

function sameOrder(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
