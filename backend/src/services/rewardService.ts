// XP, coins, and item drops awarded for completions and milestones.

export async function awardForCompletion(_userId: string, _habitId: string): Promise<never> {
  throw new Error('rewardService.awardForCompletion not implemented');
}

export async function awardForFocusSession(_userId: string, _sessionId: string): Promise<never> {
  throw new Error('rewardService.awardForFocusSession not implemented');
}

export async function grantItem(
  _userId: string,
  _itemId: string,
  _quantity: number = 1,
): Promise<never> {
  throw new Error('rewardService.grantItem not implemented');
}
