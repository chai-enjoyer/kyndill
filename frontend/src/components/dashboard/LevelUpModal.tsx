import { useEffect } from 'react';
import { createPortal } from 'react-dom';

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
        <div className="level-up__burst" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} className={`level-up__ray level-up__ray--${i}`} />
          ))}
        </div>
        <p className="level-up__eyebrow">LEVEL UP!</p>
        <p className="level-up__level" id="level-up-heading">
          <span className="level-up__level-prefix" aria-hidden="true">L</span>
          {newLevel}
        </p>
        <p className="level-up__caption">Steady, steady. Small flames, every day.</p>
        <button type="button" className="btn btn--primary btn--lg" onClick={onClose} autoFocus>
          Keep going
        </button>
      </div>
    </div>,
    document.body,
  );
}
