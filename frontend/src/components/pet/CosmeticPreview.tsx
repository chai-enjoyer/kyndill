import { SpritePet, type SpriteEquippedMap, type SpriteEquipSlot } from './SpritePet';
import type { PetMood, PetSpecies } from './PlaceholderPet';

interface CosmeticPreviewProps {
  name: string;
  category?: string | null;
  size?: number;
  compact?: boolean;
  species?: PetSpecies;
  mood?: PetMood;
  equipped?: SpriteEquippedMap;
}

const SLOTS = new Set<SpriteEquipSlot>(['hat', 'accessory', 'glasses', 'scarf', 'badge', 'charm']);

export function CosmeticPreview({
  name,
  category,
  size = 132,
  compact = false,
  species = 'star',
  mood = 'happy',
  equipped,
}: CosmeticPreviewProps) {
  const slot = getSlot(name, category);
  const previewEquipped: SpriteEquippedMap = slot
    ? { ...equipped, [slot]: { name } }
    : { ...equipped };

  return (
    <span className={['cosmetic-preview', compact && 'cosmetic-preview--compact'].filter(Boolean).join(' ')}>
      <SpritePet species={species} mood={mood} size={size} equipped={previewEquipped} />
    </span>
  );
}

function getSlot(name: string, category?: string | null): SpriteEquipSlot | null {
  if (category && SLOTS.has(category as SpriteEquipSlot)) return category as SpriteEquipSlot;
  const normalized = name.toLowerCase();
  if (normalized.includes('hat')) return 'hat';
  if (normalized.includes('sunglasses')) return 'glasses';
  if (normalized.includes('bow tie')) return 'scarf';
  if (normalized.includes('medal')) return 'badge';
  if (normalized.includes('bow')) return 'accessory';
  return null;
}
