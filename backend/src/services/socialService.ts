// Friends, friend requests, gifts.

export async function listFriends(_userId: string): Promise<never> {
  throw new Error('socialService.listFriends not implemented');
}

export async function sendFriendRequest(
  _fromUserId: string,
  _toUsername: string,
): Promise<never> {
  throw new Error('socialService.sendFriendRequest not implemented');
}

export async function respondToFriendRequest(
  _userId: string,
  _requestId: string,
  _action: 'accept' | 'reject',
): Promise<never> {
  throw new Error('socialService.respondToFriendRequest not implemented');
}

export async function removeFriend(_userId: string, _friendId: string): Promise<never> {
  throw new Error('socialService.removeFriend not implemented');
}

export async function listGifts(_userId: string): Promise<never> {
  throw new Error('socialService.listGifts not implemented');
}

export async function sendGift(
  _fromUserId: string,
  _toUserId: string,
  _itemId: string,
  _message?: string,
): Promise<never> {
  throw new Error('socialService.sendGift not implemented');
}

export async function respondToGift(
  _userId: string,
  _giftId: string,
  _action: 'accept' | 'decline',
): Promise<never> {
  throw new Error('socialService.respondToGift not implemented');
}
