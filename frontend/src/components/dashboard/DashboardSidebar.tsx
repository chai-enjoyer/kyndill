import { PlaceholderPet, type PetSpecies } from '../common/PlaceholderPet';
import { CompletionRing } from './CompletionRing';
import { LoadingSkeleton } from '../common/LoadingSkeleton';

interface DashboardSidebarProps {
  pet: { species: PetSpecies; health: number; is_fainted: boolean } | null;
  completed: number;
  total: number;
  streak: number;
  isLoading: boolean;
}

export function DashboardSidebar({
  pet,
  completed,
  total,
  streak,
  isLoading,
}: DashboardSidebarProps) {
  const mood = !pet || pet.is_fainted
    ? 'sad'
    : pet.health > 60
      ? 'happy'
      : pet.health > 30
        ? 'neutral'
        : 'sad';

  return (
    <aside className="dashboard__sidebar" aria-label="Today summary">
      <div className="dashboard__sidebar-pet">
        {pet ? (
          <PlaceholderPet
            species={pet.species}
            mood={mood}
            size={120}
            className={pet.is_fainted ? '' : 'pet-breathing'}
          />
        ) : isLoading ? (
          <LoadingSkeleton width={120} height={120} rounded />
        ) : null}
      </div>

      <CompletionRing completed={completed} total={total} />

      <div className="dashboard__sidebar-streak">
        <span className="dashboard__sidebar-streak-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M12 3c-2 4-4 5-4 9a4 4 0 0 0 8 0c0-2-1-3-2-4 0-2 0-3-2-5z" />
          </svg>
        </span>
        <span className="dashboard__sidebar-streak-value">{streak}</span>
        <span className="dashboard__sidebar-streak-label text-muted">
          {streak === 1 ? 'day steady' : 'days steady'}
        </span>
      </div>
    </aside>
  );
}
