interface HabitCheckboxProps {
  checked: boolean;
  disabled?: boolean;
  onClick: () => void;
  ariaLabel: string;
}

export function HabitCheckbox({ checked, disabled, onClick, ariaLabel }: HabitCheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={`habit-checkbox ${checked ? 'is-checked' : ''}`}
    >
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="6" className="habit-checkbox__box" />
        <path
          d="M6.5 12.5 L10.2 16 L17.5 8.5"
          fill="none"
          className="habit-checkbox__check"
        />
      </svg>
    </button>
  );
}
