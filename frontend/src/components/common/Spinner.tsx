interface SpinnerProps {
  size?: number;
  label?: string;
}

export function Spinner({ size = 16, label }: SpinnerProps) {
  return (
    <span
      className="spinner"
      role="status"
      aria-label={label ?? 'Loading'}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.22" strokeWidth="2.5" />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
