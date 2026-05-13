import { InfoTip } from '../common/InfoTip';
import { StatIcon, type StatIconName } from '../common/StatIcon';

interface StatBarProps {
  label: string;
  value: number;
  max?: number;
  icon: StatIconName;
  derived?: string;
  info?: string;
}

export function StatBar({ label, value, max = 100, icon, derived, info }: StatBarProps) {
  const safeValue = Math.min(max, Math.max(0, value));
  const pct = max === 0 ? 0 : (safeValue / max) * 100;
  const labelId = `stat-${icon}-label`;
  return (
    <div className="stat-bar" data-icon={icon}>
      <div className="stat-bar__head">
        <span className="stat-bar__icon" aria-hidden="true">
          <StatIcon name={icon} size={18} />
        </span>
        <span className="stat-bar__label" id={labelId}>{label}</span>
        {info && <InfoTip label={`${label} info`} text={info} />}
        <span className="stat-bar__value">{Math.round(safeValue)}</span>
      </div>
      <div
        className="stat-bar__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.round(safeValue)}
        aria-labelledby={labelId}
      >
        <div className="stat-bar__fill" style={{ width: `${pct}%` }} />
      </div>
      {derived && <span className="stat-bar__derived text-muted">{derived}</span>}
    </div>
  );
}
