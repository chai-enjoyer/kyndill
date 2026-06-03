import { useId } from 'react';

interface InfoTipProps {
  label: string;
  text: string;
}

export function InfoTip({ label, text }: InfoTipProps) {
  const id = useId();
  return (
    <span className="info-tip">
      <button type="button" className="info-tip__button" aria-label={label} aria-describedby={id}>
        i
      </button>
      <span id={id} className="info-tip__bubble" role="tooltip">
        {text}
      </span>
    </span>
  );
}
