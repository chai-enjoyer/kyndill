import { Link } from 'react-router-dom';
import { SpritePet } from '../../pet/SpritePet';
import { type PetSpecies } from '../../pet/PlaceholderPet';
import { FlameIcon } from '../../illustration/FlameIcon';
import { AnimatedValue } from '../../ui/AnimatedValue';
import { deriveStreakHealth } from '../../../lib/utils';

interface MobilePetStripProps {
  pet: {
    species: PetSpecies;
    name: string;
    health: number;
    happiness: number;
    hunger: number;
    energy: number;
    cleanliness: number;
    is_fainted: boolean;
    equipped?: Partial<Record<'hat' | 'accessory' | 'glasses' | 'scarf' | 'badge' | 'charm', { name: string }>>;
  };
  streak: number;
}

// строка-сводка питомца (только мобилка): спрайт слева, имя + health по центру,
// стрик справа. Тап ведёт на /pet.
export function MobilePetStrip({ pet, streak }: MobilePetStripProps) {
  const petHealth = deriveStreakHealth(streak, pet);
  const mood = pet.is_fainted
    ? 'sad'
    : petHealth > 60
      ? 'happy'
      : petHealth > 30
        ? 'neutral'
        : 'sad';

  return (
    <Link to="/pet" className="m-pet-strip" aria-label={`Visit ${pet.name}, your companion`}>
      <span className="m-pet-strip__sprite" aria-hidden="true">
        <SpritePet
          species={pet.species}
          mood={mood}
          size={56}
          equipped={pet.equipped}
          className={pet.is_fainted ? '' : 'pet-breathing'}
        />
      </span>

      <span className="m-pet-strip__body">
        <span className="m-pet-strip__name">{pet.name}</span>
        <span className="m-pet-strip__health" aria-label={`Health ${petHealth} of 100`}>
          <span className="m-pet-strip__health-label">Health</span>
          <span className="m-pet-strip__health-track">
            <span style={{ width: `${Math.max(2, petHealth)}%` }} />
          </span>
          <span className="m-pet-strip__health-value">{petHealth}</span>
        </span>
      </span>

      <span className="m-pet-strip__streak" title={`${streak}-day streak`}>
        <FlameIcon size={14} />
        <AnimatedValue value={streak} />
      </span>
    </Link>
  );
}
