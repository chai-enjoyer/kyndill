import { useEffect } from 'react';
import type { DroppedItem } from '../../hooks/useHabits';
import { getItemPlaceholder } from '../../lib/utils';

interface ItemDropToastProps {
  item: DroppedItem;
  onClose: () => void;
}

export function ItemDropToast({ item, onClose }: ItemDropToastProps) {
  useEffect(() => {
    const id = window.setTimeout(onClose, 5200);
    return () => window.clearTimeout(id);
  }, [onClose]);

  return (
    <aside className="item-drop-toast" role="status" aria-live="polite">
      <span className="item-drop-toast__image" style={{ backgroundImage: `url("${getItemPlaceholder(item.name)}")` }} />
      <span className="item-drop-toast__copy">
        <span className="item-drop-toast__eyebrow">Item found</span>
        <strong>{item.name}</strong>
        <span className={`rarity-badge rarity-badge--${item.rarity}`}>{item.rarity}</span>
      </span>
      <button type="button" aria-label="Dismiss item drop" onClick={onClose}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </aside>
  );
}
