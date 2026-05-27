import { Link } from 'react-router-dom';
import { StatIcon, type StatIconName } from '../../common/StatIcon';

interface MobilePetCareProps {
  pet: {
    happiness: number;
    hunger: number;
    energy: number;
    cleanliness: number;
    is_fainted: boolean;
  };
  onOpenFeed: () => void;
}

/*
 * Compact pet care surface for the mobile dashboard. Lives directly
 * below the pet strip. Surfaces the four care stats not already shown
 * in the strip (happiness, hunger, energy, cleanliness) and exposes
 * Feed + Customize actions so the companion is actionable without
 * navigating to /pet first. Tap any stat tile to go to /pet for
 * detail. Health remains on the strip above.
 */
export function MobilePetCare({ pet, onOpenFeed }: MobilePetCareProps) {
  const stats: Array<{ icon: StatIconName; label: string; value: number }> = [
    { icon: 'happiness', label: 'Happy', value: pet.happiness },
    { icon: 'hunger', label: 'Hunger', value: pet.hunger },
    { icon: 'energy', label: 'Energy', value: pet.energy },
    { icon: 'cleanliness', label: 'Clean', value: pet.cleanliness },
  ];

  return (
    <section className="m-pet-care" aria-label="Pet care">
      <ul className="m-pet-care__stats" role="list">
        {stats.map((stat) => (
          <li key={stat.icon} className="m-pet-care__stat">
            <Link to="/pet" className="m-pet-care__stat-link" aria-label={`${stat.label} ${Math.round(stat.value)} of 100`}>
              <span className="m-pet-care__stat-icon" aria-hidden="true">
                <StatIcon name={stat.icon} size={18} />
              </span>
              <span className="m-pet-care__stat-meta">
                <span className="m-pet-care__stat-value">{Math.round(stat.value)}</span>
                <span className="m-pet-care__stat-bar" aria-hidden="true">
                  <span style={{ width: `${Math.max(2, Math.min(100, stat.value))}%` }} />
                </span>
              </span>
              <span className="m-pet-care__stat-label">{stat.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="m-pet-care__actions">
        <button
          type="button"
          className="m-pet-care__feed"
          onClick={onOpenFeed}
          disabled={pet.is_fainted}
        >
          {pet.is_fainted ? 'Pet is resting' : 'Feed'}
        </button>
        <Link to="/pet" className="m-pet-care__customize">
          Customize
        </Link>
      </div>
    </section>
  );
}
