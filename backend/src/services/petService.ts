// Pet state: stats, fainting, recovery, consumable effects.

export async function getForUser(_userId: string): Promise<never> {
  throw new Error('petService.getForUser not implemented');
}

export async function applyConsumable(_userId: string, _itemId: string): Promise<never> {
  throw new Error('petService.applyConsumable not implemented');
}

export async function decayStats(_userId: string): Promise<never> {
  throw new Error('petService.decayStats not implemented');
}

export async function rename(_userId: string, _name: string): Promise<never> {
  throw new Error('petService.rename not implemented');
}
