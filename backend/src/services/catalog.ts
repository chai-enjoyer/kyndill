export interface SpriteBackedCosmetic {
  name: string;
  rarity: 'common' | 'rare' | 'legendary';
  price: number;
  image_url: string;
  category: string;
}

export const SPRITE_BACKED_COSMETICS: readonly SpriteBackedCosmetic[] = [
  { name: 'Bow', rarity: 'common', price: 45, image_url: '/items/bow.png', category: 'accessory' },
  { name: 'Cylinder Hat', rarity: 'common', price: 55, image_url: '/items/cylinder-hat.png', category: 'hat' },
  { name: 'Bow Tie', rarity: 'common', price: 60, image_url: '/items/bow-tie.png', category: 'scarf' },
  { name: 'Sunglasses', rarity: 'rare', price: 95, image_url: '/items/sunglasses.png', category: 'glasses' },
  { name: 'Medal', rarity: 'rare', price: 120, image_url: '/items/medal.png', category: 'badge' },
  { name: 'Wizard Hat', rarity: 'legendary', price: 260, image_url: '/items/wizard-hat.png', category: 'hat' },
] as const;

export const SPRITE_BACKED_COSMETIC_NAMES = SPRITE_BACKED_COSMETICS.map((item) => item.name);

const SPRITE_BACKED_COSMETIC_SET = new Set<string>(SPRITE_BACKED_COSMETIC_NAMES);

export function isSpriteBackedCosmetic(name: string): boolean {
  return SPRITE_BACKED_COSMETIC_SET.has(name);
}
