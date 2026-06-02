import { type CSSProperties } from 'react';
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
  onRevive: () => void;
}

/*
 * Compact pet care surface for the mobile dashboard. Lives directly
 * below the pet strip. Surfaces the four care stats not already shown
 * in the strip (happiness, hunger, energy, cleanliness) and exposes
 * Feed + Customize actions so the companion is actionable without
 * navigating to /pet first. Tap any stat tile to go to /pet for
 * detail. Health remains on the strip above.
 */
export function MobilePetCare({ pet, onOpenFeed, onRevive }: MobilePetCareProps) {
  const stats: Array<{ icon: StatIconName; label: string; value: number }> = [
    { icon: 'happiness', label: 'Happy', value: pet.happiness },
    { icon: 'hunger', label: 'Hunger', value: pet.hunger },
    { icon: 'energy', label: 'Energy', value: pet.energy },
    { icon: 'cleanliness', label: 'Clean', value: pet.cleanliness },
  ];

  return (
    <section className="m-pet-care" aria-label="Pet care">
      <ul className="m-pet-care__stats" role="list">
        {stats.map((stat) => {
          const pct = Math.max(0, Math.min(100, stat.value));
          // Inner content is rendered twice: a base layer (dark text on the
          // tile) and an overlay layer (light text on the sage fill) that is
          // clipped to the fill height. The clip line is exactly where the
          // fill meets the background, so each label sits on whichever colour
          // keeps it readable.
          const content = (
            <>
              <span className="m-pet-care__stat-icon" aria-hidden="true">
                <StatIcon name={stat.icon} size={18} />
              </span>
              <span className="m-pet-care__stat-value">{Math.round(stat.value)}</span>
              <span className="m-pet-care__stat-label">{stat.label}</span>
            </>
          );
          return (
            <li key={stat.icon} className="m-pet-care__stat">
              <Link
                to="/pet"
                className="m-pet-care__stat-link"
                style={{ '--fill': `${pct}%` } as CSSProperties}
                aria-label={`${stat.label} ${Math.round(stat.value)} of 100`}
              >
                <span className="m-pet-care__stat-content">{content}</span>
                <span className="m-pet-care__stat-content m-pet-care__stat-content--fill" aria-hidden="true">
                  {content}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="m-pet-care__actions">
        {pet.is_fainted ? (
          <>
            <button type="button" className="m-pet-care__feed" onClick={onRevive}>
              Revive
            </button>
            <button type="button" className="m-pet-care__customize" onClick={onOpenFeed}>
              Feed
            </button>
          </>
        ) : (
          <>
            <button type="button" className="m-pet-care__feed" onClick={onOpenFeed}>
              Feed
            </button>
            <Link to="/pet" className="m-pet-care__customize">
              Customize
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
