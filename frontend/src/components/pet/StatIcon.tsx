export type StatIconName = 'health' | 'happiness' | 'hunger' | 'energy' | 'cleanliness';

const STAT_ICON_PATHS: Record<StatIconName, string> = {
  health: 'M12 21s-7-4.4-7-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.6-7 10-7 10z',
  happiness: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8.8 10.2h.01M15.2 10.2h.01M8.8 14.3c1.6 1.8 4.8 1.8 6.4 0',
  hunger: 'M7 3v7M5 3v7M9 3v7M5 10h4M7 10v11M17 3c-1.7 1.8-2 5.2-.2 7.2.5.6 1.2.9 2.2.9V21',
  energy: 'M13 2 5 13h6l-1 9 9-13h-6l1-7z',
  cleanliness: 'M12 3c-3.5 4.1-5.2 7.1-5.2 9.5a5.2 5.2 0 0 0 10.4 0C17.2 10.1 15.5 7.1 12 3zM18.5 4.5l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z',
};

export function StatIcon({
  name,
  size = 20,
  className,
}: {
  name: StatIconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={STAT_ICON_PATHS[name]} />
    </svg>
  );
}
