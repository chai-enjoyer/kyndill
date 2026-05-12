import { Link } from 'react-router-dom';
import { Button } from '../common/Button';
import { PlaceholderPet, type PetSpecies } from '../common/PlaceholderPet';
import { StatBar } from './StatBar';

export interface PetPanelData {
  species: PetSpecies;
  name: string;
  health: number;
  happiness: number;
  hunger: number;
  energy: number;
  cleanliness: number;
  stage: number;
  is_fainted: boolean;
}

interface PetPanelProps {
  pet: PetPanelData;
  userStreak: number;
  onOpenFeed: () => void;
}

const SPECIES_LABEL: Record<PetSpecies, string> = {
  blob: 'Blob',
  cube: 'Cube',
  sphere: 'Sphere',
  pyramid: 'Pyramid',
};

export function PetPanel({ pet, userStreak, onOpenFeed }: PetPanelProps) {
  const streakHealth = Math.min(100, userStreak * 5);
  const mood = pet.is_fainted
    ? 'sad'
    : pet.health > 60
      ? 'happy'
      : pet.health > 30
        ? 'neutral'
        : 'sad';

  const healthHint = pet.is_fainted
    ? 'Resting. Light a habit to wake them.'
    : `Streak x 5 = ${streakHealth}`;

  return (
    <div className="pet-panel">
      <div className="pet-panel__art">
        <PlaceholderPet
          species={pet.species}
          mood={mood}
          size={240}
          className={pet.is_fainted ? '' : 'pet-breathing'}
        />
      </div>

      <div className="pet-panel__id">
        <h2 className="pet-panel__name">{pet.name}</h2>
        <p className="pet-panel__species text-muted">{SPECIES_LABEL[pet.species]}</p>
      </div>

      <div className="pet-panel__stats">
        <StatBar label="Health" value={streakHealth} icon="health" derived={healthHint} />
        <StatBar label="Happiness" value={pet.happiness} icon="happiness" />
        <StatBar label="Hunger" value={pet.hunger} icon="hunger" />
        <StatBar label="Energy" value={pet.energy} icon="energy" />
        <StatBar label="Cleanliness" value={pet.cleanliness} icon="cleanliness" />
      </div>

      <div className="pet-panel__actions">
        <Button variant="primary" onClick={onOpenFeed}>
          Feed
        </Button>
        <Link to="/pet" className="btn btn--secondary">
          Customize
        </Link>
      </div>
    </div>
  );
}
