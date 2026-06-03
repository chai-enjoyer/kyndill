import { AxiosError } from 'axios';
import { Modal } from '../ui/Modal';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { useInventory } from '../../hooks/useInventory';
import { useToastContext } from '../../context/ToastContext';
import { getItemPlaceholder } from '../../lib/utils';
import { api } from '../../lib/api';
import { trackEvent } from '../../lib/analytics';

interface FeedModalProps {
  onClose: () => void;
  onFed?: () => void;
}

export function FeedModal({ onClose, onFed }: FeedModalProps) {
  const { consumables, isLoading, refetch } = useInventory();
  const { showToast } = useToastContext();

  async function handleFeed(itemId: string, itemName: string) {
    try {
      await api.post('/api/pet/feed', { item_id: itemId });
      trackEvent('pet_fed', { item_id: itemId });
      showToast(`Fed ${itemName} — your pet looks happier.`, 'success');
      await refetch();
      onFed?.();
    } catch (err) {
      showToast(extractMessage(err), 'error');
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="Feed your companion">
      {isLoading ? (
        <div className="feed-modal__loading">
          {[0, 1].map((i) => (
            <LoadingSkeleton key={i} width="100%" height={56} />
          ))}
        </div>
      ) : consumables.length === 0 ? (
        <div className="feed-modal__empty">
          <p>No food items. Visit the shop!</p>
        </div>
      ) : (
        <ul className="feed-modal__list" role="list">
          {consumables.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="feed-modal__item"
                onClick={() => handleFeed(item.id, item.name)}
              >
                <span
                  className="feed-modal__item-icon"
                  aria-hidden="true"
                  style={{ backgroundImage: `url("${getItemPlaceholder(item.name)}")` }}
                />
                <span className="feed-modal__item-text">
                  <span className="feed-modal__item-name">{item.name}</span>
                  {item.effect_stat && item.effect_amount !== null && (
                    <span className="feed-modal__item-effect text-muted">
                      +{item.effect_amount} {item.effect_stat}
                    </span>
                  )}
                </span>
                <span className="feed-modal__item-qty" aria-label={`Quantity ${item.quantity}`}>
                  x{item.quantity}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

function extractMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { error?: { message?: string } } | undefined;
    return data?.error?.message ?? 'Could not feed your companion.';
  }
  return 'Could not feed your companion.';
}
