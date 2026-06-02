import { Link } from 'react-router-dom';
import { Button } from '../common/Button';
import { type PetSpecies } from '../common/PlaceholderPet';
import { SpritePet } from '../common/SpritePet';
import { StatBar } from './StatBar';
import { deriveStreakHealth } from '../../lib/utils';

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
  equipped?: Partial<Record<'hat' | 'accessory' | 'glasses' | 'scarf' | 'badge' | 'charm', { name: string }>>;
}

interface PetPanelProps {
  pet: PetPanelData;
  userStreak: number;
  onOpenFeed: () => void;
  onRevive: () => void;
}

const SPECIES_LABEL: Record<PetSpecies, string> = {
  star: 'Star',
  cube: 'Cube',
  sphere: 'Sphere',
  pyramid: 'Pyramid',
};

const STAT_INFO = {
  health: 'Health combines care stats and streak momentum. Strong stats keep your pet well; streaks add consistency, but there is no guaranteed base.',
  happiness: 'Happiness rises when you complete habits, especially social and wellness habits. It helps show how encouraged your pet feels.',
  hunger: 'Hunger is your pet food meter. Completing habits spends a little hunger; consumable food restores it.',
  energy: 'Energy is spent by focused effort and productivity or learning habits. Restorative consumables can bring it back up.',
  cleanliness: 'Cleanliness slowly changes through habit activity. Health habits can improve it, while most completions use a little.',
};

export function PetPanel({ pet, userStreak, onOpenFeed, onRevive }: PetPanelProps) {
  const petHealth = deriveStreakHealth(userStreak, pet);
  const mood = pet.is_fainted
    ? 'sad'
    : petHealth > 60
      ? 'happy'
      : petHealth > 30
        ? 'neutral'
        : 'sad';

  const healthHint = pet.is_fainted
    ? 'Fainted — revive to keep going.'
    : `Care stats + streak momentum = ${petHealth}`;

  return (
    <div className="pet-panel">
      <div className="pet-panel__art">
        <SpritePet
          species={pet.species}
          mood={mood}
          size={240}
          equipped={pet.equipped}
          className={pet.is_fainted ? '' : 'pet-breathing'}
        />
      </div>

      <div className="pet-panel__id">
        <h2 className="pet-panel__name">{pet.name}</h2>
        <p className="pet-panel__species text-muted">{SPECIES_LABEL[pet.species]}</p>
      </div>

      <div className="pet-panel__stats">
        <StatBar label="Health" value={petHealth} icon="health" derived={healthHint} info={STAT_INFO.health} />
        <StatBar label="Happiness" value={pet.happiness} icon="happiness" info={STAT_INFO.happiness} />
        <StatBar label="Hunger" value={pet.hunger} icon="hunger" info={STAT_INFO.hunger} />
        <StatBar label="Energy" value={pet.energy} icon="energy" info={STAT_INFO.energy} />
        <StatBar label="Cleanliness" value={pet.cleanliness} icon="cleanliness" info={STAT_INFO.cleanliness} />
      </div>

      <div className="pet-panel__actions">
        {pet.is_fainted ? (
          <>
            <Button variant="primary" onClick={onRevive}>
              Revive
            </Button>
            <Button variant="secondary" onClick={onOpenFeed}>
              Feed
            </Button>
          </>
        ) : (
          <>
            <Button variant="primary" onClick={onOpenFeed}>
              Feed
            </Button>
            <Link to="/pet" className="btn btn--secondary">
              Customize
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
