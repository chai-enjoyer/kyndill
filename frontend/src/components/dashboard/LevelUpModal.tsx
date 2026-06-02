import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FlameIcon } from '../common/FlameIcon';

interface LevelUpModalProps {
  newLevel: number;
  onClose: () => void;
}

export function LevelUpModal({ newLevel, onClose }: LevelUpModalProps) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div className="level-up" role="dialog" aria-modal="true" aria-labelledby="level-up-heading">
      <button
        type="button"
        className="modal__backdrop"
        aria-label="Dismiss level-up"
        onClick={onClose}
      />
      <div className="level-up__content" role="document">
        <div className="level-up__emblem" aria-hidden="true">
          <span className="level-up__halo" />
          <FlameIcon size={52} className="level-up__flame" />
        </div>
        <p className="level-up__eyebrow">You reached</p>
        <p className="level-up__level" id="level-up-heading">
          Level {newLevel}
        </p>
        <p className="level-up__caption">
          Another day tending the flame. Keep it lit tomorrow.
        </p>
        <button type="button" className="btn btn--primary btn--lg" onClick={onClose} autoFocus>
          Continue
        </button>
      </div>
    </div>,
    document.body,
  );
}
