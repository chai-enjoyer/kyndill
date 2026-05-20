import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AnimatedValue } from '../components/common/AnimatedValue';
import { Button } from '../components/common/Button';
import { FlameIcon } from '../components/common/FlameIcon';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { Modal } from '../components/common/Modal';
import { SpritePet } from '../components/common/SpritePet';
import { useInventory, type InventoryEntry } from '../hooks/useInventory';
import {
  useSocial,
  extractMessage,
  type Friend,
  type FriendProfile,
  type UserSearchResult,
} from '../hooks/useSocial';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useToastContext } from '../context/ToastContext';
import { getItemPlaceholder } from '../lib/utils';
import { trackEvent } from '../lib/analytics';

export function FriendsPage() {
  const {
    friends,
    requests,
    sentRequests,
    receivedGifts,
    isLoading,
    error,
    searchUsers,
    sendRequest,
    respondRequest,
    sendGift,
    removeFriend,
    acceptGift,
    getFriendProfile,
  } = useSocial();
  const { entries, isLoading: leaderboardLoading } = useLeaderboard('friends');
  const { consumables, refetch: refetchInventory } = useInventory();
  const { showToast } = useToastContext();
  const [query, setQuery] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [giftFriend, setGiftFriend] = useState<Friend | null>(null);
  const [profile, setProfile] = useState<FriendProfile | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [acceptingGiftId, setAcceptingGiftId] = useState<string | null>(null);

  const filtered = friends.filter((friend) =>
    `${friend.display_name} ${friend.username}`.toLowerCase().includes(query.toLowerCase()),
  );

  async function handleRespond(requestId: string, action: 'accept' | 'reject') {
    setRespondingId(requestId);
    try {
      await respondRequest(requestId, action);
      trackEvent('friend_request_responded', { action });
      showToast(action === 'accept' ? "You're now friends." : 'Request declined.', 'success');
    } catch (err) {
      showToast(extractMessage(err), 'error');
    } finally {
      setRespondingId(null);
    }
  }

  async function openProfile(friend: Friend) {
    try {
      setProfile(await getFriendProfile(friend.id));
    } catch (err) {
      showToast(extractMessage(err), 'error');
    }
  }

  async function handleAcceptGift(giftId: string) {
    setAcceptingGiftId(giftId);
    try {
      await acceptGift(giftId);
      await refetchInventory();
      trackEvent('gift_accepted', { gift_id: giftId });
      showToast('Gift kept — find it in your inventory.', 'success');
    } catch (err) {
      showToast(extractMessage(err), 'error');
    } finally {
      setAcceptingGiftId(null);
    }
  }

  async function handleRemoveFriend(friend: Friend) {
    if (!window.confirm(`Remove ${friend.display_name} from your friends?`)) return;
    try {
      await removeFriend(friend.id);
      trackEvent('friend_removed', { friend_id: friend.id });
      showToast(`${friend.display_name} removed from friends.`, 'success');
    } catch (err) {
      showToast(extractMessage(err), 'error');
    }
  }

  return (
    <section className="page friends-page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">Social</p>
          <h1>Friends</h1>
        </div>
        <Button variant="primary" onClick={() => setAddOpen(true)}>Add Friend</Button>
      </header>

      <div className="friends-layout">
        <section className="friends-list-panel">
          <div className="friends-toolbar">
            <input
              className="input"
              placeholder="Search friends by username"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <section className="pending-panel" aria-label="Received friend requests">
            <h2>Received requests</h2>
            {isLoading ? (
              <LoadingSkeleton width="100%" height={72} />
            ) : requests.length === 0 ? (
              <div className="friends-empty">No incoming requests.</div>
            ) : (
              <div className="pending-list">
                {requests.map((request) => (
                  <article key={request.id} className="request-card">
                    <Avatar name={request.from_display_name} url={request.from_avatar_url} />
                    <div>
                      <strong>{request.from_display_name}</strong>
                      <span>@{request.from_username}</span>
                    </div>
                    <div className="request-card__actions">
                      <Button size="sm" variant="primary" disabled={respondingId === request.id} onClick={() => handleRespond(request.id, 'accept')}>Accept</Button>
                      <Button size="sm" variant="ghost" disabled={respondingId === request.id} onClick={() => handleRespond(request.id, 'reject')}>Reject</Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="pending-panel" aria-label="Sent friend requests">
            <h2>Sent requests</h2>
            {isLoading ? (
              <LoadingSkeleton width="100%" height={72} />
            ) : sentRequests.length === 0 ? (
              <div className="friends-empty">No sent requests waiting.</div>
            ) : (
              <div className="pending-list">
                {sentRequests.map((request) => (
                  <article key={request.id} className="request-card request-card--sent">
                    <Avatar name={request.to_display_name} url={request.to_avatar_url} />
                    <div>
                      <strong>{request.to_display_name}</strong>
                      <span>@{request.to_username}</span>
                    </div>
                    <span className="owned-badge">Pending</span>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="pending-panel" aria-label="Received gifts">
            <h2>Received gifts</h2>
            {isLoading ? (
              <LoadingSkeleton width="100%" height={72} />
            ) : receivedGifts.length === 0 ? (
              <div className="friends-empty">No gifts waiting.</div>
            ) : (
              <div className="pending-list">
                {receivedGifts.map((gift) => (
                  <article key={gift.id} className="request-card gift-card">
                    <span
                      className="gift-option__image"
                      style={{ backgroundImage: `url("${getItemPlaceholder(gift.item_name)}")` }}
                      aria-hidden="true"
                    />
                    <div>
                      <strong>{gift.item_name}</strong>
                      <span>From @{gift.from_username}</span>
                      {gift.message && <p>{gift.message}</p>}
                    </div>
                    <div className="request-card__actions">
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={acceptingGiftId === gift.id}
                        onClick={() => handleAcceptGift(gift.id)}
                      >
                        {acceptingGiftId === gift.id ? 'Adding...' : 'Accept'}
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {error ? (
            <div className="friends-empty" role="alert">{error}</div>
          ) : isLoading ? (
            <div className="friend-list" aria-busy="true">
              {[0, 1, 2].map((i) => <LoadingSkeleton key={i} width="100%" height={96} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="friends-empty">{query.trim() ? 'No friends match that search.' : 'No friends yet. Add someone by username to start.'}</div>
          ) : (
            <div className="friend-list">
              {filtered.map((friend) => (
                <article key={friend.id} className="friend-card">
                  <Avatar name={friend.display_name} url={friend.avatar_url} />
                  <div className="friend-card__body">
                    <div className="friend-card__name">
                      <h2>{friend.display_name}</h2>
                      <span>@{friend.username}</span>
                    </div>
                    <div className="friend-card__meta">
                      <span className="level-chip">Level {friend.level}</span>
                      {friend.streak_current === null ? (
                        <span>Private streak</span>
                      ) : (
                        <span className="friend-card__streak">
                          <FlameIcon size={15} />
                          <AnimatedValue value={friend.streak_current} />
                          <span>day streak</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="friend-card__actions">
                    <Button size="sm" variant="secondary" onClick={() => setGiftFriend(friend)}>Send Gift</Button>
                    <Button size="sm" variant="ghost" onClick={() => openProfile(friend)}>View Profile</Button>
                    <Button size="sm" variant="ghost" onClick={() => handleRemoveFriend(friend)}>Remove</Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="friends-leaderboard">
          <div className="friends-leaderboard__header">
            <h2>Friends leaderboard</h2>
            <Link to="/leaderboard" className="btn btn--secondary btn--sm">
              View all
            </Link>
          </div>
          {leaderboardLoading ? (
            <LoadingSkeleton width="100%" height={180} />
          ) : entries.length === 0 ? (
            <div className="friends-empty">No ranked friends yet.</div>
          ) : (
            entries.slice(0, 8).map((entry) => (
              <div key={entry.id} className="mini-rank-row">
                <span>{entry.rank}</span>
                <Avatar name={entry.display_name} url={entry.avatar_url} />
                <strong>{entry.display_name}</strong>
                <em>Level {entry.level}</em>
              </div>
            ))
          )}
        </aside>
      </div>

      {addOpen && (
        <AddFriendModal
          searchUsers={searchUsers}
          sendRequest={sendRequest}
          onClose={() => setAddOpen(false)}
        />
      )}
      {giftFriend && (
        <SendGiftModal
          friend={giftFriend}
          items={consumables}
          onClose={() => setGiftFriend(null)}
          onSend={async (itemId, message) => {
            await sendGift(giftFriend.id, itemId, message);
            await refetchInventory();
            trackEvent('gift_sent', {
              friend_id: giftFriend.id,
              item_id: itemId,
              has_message: Boolean(message && message.trim()),
            });
            showToast('Gift sent.', 'success');
            setGiftFriend(null);
          }}
        />
      )}
      {profile && <FriendProfileModal profile={profile} onClose={() => setProfile(null)} />}
    </section>
  );
}

function Avatar({ name, url }: { name: string; url?: string | null }) {
  return (
    <span className="avatar-circle" aria-hidden="true">
      {url ? <img src={url} alt="" /> : name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function AddFriendModal({
  searchUsers,
  sendRequest,
  onClose,
}: {
  searchUsers: (query: string) => Promise<UserSearchResult[]>;
  sendRequest: (username: string) => Promise<void>;
  onClose: () => void;
}) {
  const { showToast } = useToastContext();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = window.setTimeout(() => {
      searchUsers(query)
        .then((users) => {
          if (alive) setResults(users);
        })
        .catch((err) => showToast(extractMessage(err), 'error'))
        .finally(() => {
          if (alive) setLoading(false);
        });
    }, 250);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [query, searchUsers, showToast]);

  async function request(username: string) {
    setSending(username);
    try {
      await sendRequest(username);
      trackEvent('friend_request_sent', {});
      showToast(`Request sent to ${username}.`, 'success');
      onClose();
    } catch (err) {
      showToast(extractMessage(err), 'error');
    } finally {
      setSending(null);
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="Add Friend">
      <div className="add-friend-modal">
        <input className="input" placeholder="Search username" value={query} onChange={(event) => setQuery(event.target.value)} autoFocus />
        {loading ? <LoadingSkeleton width="100%" height={64} /> : query.trim().length >= 2 && results.length === 0 ? (
          <div className="friends-empty">No users found.</div>
        ) : (
          <ul className="search-results" role="list">
            {results.map((user) => (
              <li key={user.id}>
                <Avatar name={user.display_name} url={user.avatar_url} />
                <div>
                  <strong>{user.display_name}</strong>
                  <span>@{user.username} - Level {user.level}</span>
                </div>
                <Button size="sm" variant="primary" disabled={sending === user.username} onClick={() => request(user.username)}>
                  {sending === user.username ? 'Sending...' : 'Send Request'}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

function SendGiftModal({
  friend,
  items,
  onClose,
  onSend,
}: {
  friend: Friend;
  items: InventoryEntry[];
  onClose: () => void;
  onSend: (itemId: string, message?: string) => Promise<void>;
}) {
  const { showToast } = useToastContext();
  const [selected, setSelected] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    setSending(true);
    try {
      await onSend(selected, message);
    } catch (err) {
      showToast(extractMessage(err), 'error');
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={`Send gift to ${friend.display_name}`}>
      <form className="gift-form" onSubmit={submit}>
        {items.length === 0 ? (
          <p className="friends-empty">No consumables available to gift.</p>
        ) : (
          <div className="gift-list">
            {items.map((item) => (
              <label key={item.id} className="gift-option">
                <input type="radio" name="gift" value={item.id} checked={selected === item.id} onChange={() => setSelected(item.id)} />
                <span className="gift-option__image" style={{ backgroundImage: `url("${getItemPlaceholder(item.name)}")` }} />
                <span>{item.name}</span>
                <em>x{item.quantity}</em>
              </label>
            ))}
          </div>
        )}
        <textarea className="textarea" maxLength={280} placeholder="Optional message" value={message} onChange={(event) => setMessage(event.target.value)} />
        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={!selected || sending}>
            {sending ? 'Sending...' : 'Confirm send'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function FriendProfileModal({ profile, onClose }: { profile: FriendProfile; onClose: () => void }) {
  const mood = profile.pet?.is_fainted ? 'sad' : (profile.pet?.health ?? 0) > 60 ? 'happy' : 'neutral';
  return (
    <Modal isOpen onClose={onClose} title={profile.display_name}>
      <div className="friend-profile-modal">
        <header className="friend-profile-modal__header">
          <Avatar name={profile.display_name} url={profile.avatar_url} />
          <div>
            <strong>{profile.display_name}</strong>
            <span>@{profile.username}</span>
          </div>
        </header>
        {profile.pet && (
          <section className="friend-profile-modal__pet">
            <SpritePet species={profile.pet.species} mood={mood} size={180} />
            <div>
              <span className="text-muted">Companion</span>
              <strong>{profile.pet.name}</strong>
              <em>{profile.pet.species}</em>
            </div>
          </section>
        )}
        <dl>
          <div><dt>Level</dt><dd>{profile.level}</dd></div>
          <div><dt>Total habits</dt><dd>{profile.total_habits_completed ?? 'Private'}</dd></div>
          <div>
            <dt>Streak</dt>
            <dd>
              {profile.streak_current === null ? (
                'Private'
              ) : (
                <span className="friend-profile-modal__streak">
                  <FlameIcon size={17} />
                  <AnimatedValue value={profile.streak_current} />
                  <span>{profile.streak_current === 1 ? 'day' : 'days'}</span>
                </span>
              )}
            </dd>
          </div>
          {profile.pet && (
            <>
              <div><dt>Health</dt><dd>{profile.pet.health}</dd></div>
              <div><dt>Happiness</dt><dd>{profile.pet.happiness}</dd></div>
              <div><dt>Care stats</dt><dd>{Math.round((profile.pet.hunger + profile.pet.energy + profile.pet.cleanliness) / 3)}</dd></div>
            </>
          )}
        </dl>
      </div>
    </Modal>
  );
}
