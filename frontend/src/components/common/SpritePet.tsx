import type { CSSProperties } from 'react';
import circle from '../../assets/sprites/circle.png';
import square from '../../assets/sprites/square.png';
import triangle from '../../assets/sprites/triangle.png';
import faceHappy from '../../assets/sprites/face_happy.png';
import faceNeutral from '../../assets/sprites/face_neutral.png';
import faceSad from '../../assets/sprites/face_sad.png';
import bow from '../../assets/sprites/bow.png';
import bowTie from '../../assets/sprites/bow_tie.png';
import cylinderHat from '../../assets/sprites/cylinder_hat.png';
import medal from '../../assets/sprites/medal.png';
import star from '../../assets/sprites/star.png';
import sunglasses from '../../assets/sprites/sunglasses.png';
import wizardHat from '../../assets/sprites/wizard_hat.png';
import type { PetMood, PetSpecies } from './PlaceholderPet';

export type SpriteEquipSlot = 'hat' | 'accessory' | 'glasses' | 'scarf' | 'badge' | 'charm';

interface EquippedItem {
  name: string;
}

export type SpriteEquippedMap = Partial<Record<SpriteEquipSlot, EquippedItem>>;

interface SpritePetProps {
  species: PetSpecies;
  mood?: PetMood;
  size?: number;
  className?: string;
  style?: CSSProperties;
  equipped?: SpriteEquippedMap;
}

const BASE_BY_SPECIES: Record<PetSpecies, string> = {
  star,
  cube: square,
  sphere: circle,
  pyramid: triangle,
};

const FACE_BY_MOOD: Record<PetMood, string> = {
  happy: faceHappy,
  neutral: faceNeutral,
  sad: faceSad,
};

function cosmeticSprite(slot: SpriteEquipSlot, name?: string): string | null {
  const normalized = name?.toLowerCase() ?? '';
  if (!normalized) return null;
  if (slot === 'glasses') return normalized.includes('sunglasses') ? sunglasses : null;
  if (slot === 'scarf') return normalized.includes('bow tie') ? bowTie : null;
  if (slot === 'badge') return normalized.includes('medal') ? medal : null;
  if (slot === 'charm') return normalized.includes('medal') ? medal : null;
  if (slot === 'accessory') return normalized.includes('bow') ? bow : null;
  if (slot === 'hat') {
    if (normalized.includes('wizard')) return wizardHat;
    if (normalized.includes('cylinder')) return cylinderHat;
  }
  return null;
}

export function SpritePet({
  species,
  mood = 'neutral',
  size = 160,
  className,
  style,
  equipped,
}: SpritePetProps) {
  const layers = (['hat', 'glasses', 'scarf', 'accessory', 'badge', 'charm'] as SpriteEquipSlot[])
    .map((slot) => ({ slot, src: cosmeticSprite(slot, equipped?.[slot]?.name) }))
    .filter((layer): layer is { slot: SpriteEquipSlot; src: string } => layer.src !== null);

  return (
    <span
      className={['sprite-pet', className].filter(Boolean).join(' ')}
      style={{ width: size, height: size, ...style }}
      role="img"
      aria-label={`${species} pet, ${mood}`}
    >
      <img className="sprite-pet__layer sprite-pet__layer--base" src={BASE_BY_SPECIES[species]} alt="" draggable={false} />
      <img className="sprite-pet__layer sprite-pet__layer--face" src={FACE_BY_MOOD[mood]} alt="" draggable={false} />
      {layers.map((layer) => (
        <img
          key={`${layer.slot}-${layer.src}`}
          className={`sprite-pet__layer sprite-pet__layer--${layer.slot}`}
          src={layer.src}
          alt=""
          draggable={false}
        />
      ))}
    </span>
  );
}
