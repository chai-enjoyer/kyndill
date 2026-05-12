import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '../components/common/Button';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { Modal } from '../components/common/Modal';
import { PlaceholderPet } from '../components/common/PlaceholderPet';
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

export function FriendsPage() {
  const {
    friends,
    requests,
    isLoading,
    searchUsers,
    sendRequest,
    respondRequest,
    sendGift,
    getFriendProfile,
  } = useSocial();
  const { entries } = useLeaderboard('friends');
  const { consumables, refetch: refetchInventory } = useInventory();
  const { showToast } = useToastContext();
  const [query, setQuery] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [giftFriend, setGiftFriend] = useState<Friend | null>(null);
  const [profile, setProfile] = useState<FriendProfile | null>(null);

  const filtered = friends.filter((friend) =>
    `${friend.display_name} ${friend.username}`.toLowerCase().includes(query.toLowerCase()),
  );

  async function handleRespond(requestId: string, action: 'accept' | 'reject') {
    try {
      await respondRequest(requestId, action);
      showToast(action === 'accept' ? 'Friend request accepted.' : 'Friend request rejected.', 'success');
    } catch (err) {
      showToast(extractMessage(err), 'error');
    }
  }

  async function openProfile(friend: Friend) {
    try {
      setProfile(await getFriendProfile(friend.id));
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

          {requests.length > 0 && (
            <section className="pending-panel" aria-label="Pending requests">
              <h2>Pending requests</h2>
              <div className="pending-list">
                {requests.map((request) => (
                  <article key={request.id} className="request-card">
                    <Avatar name={request.from_display_name} url={request.from_avatar_url} />
                    <div>
                      <strong>{request.from_display_name}</strong>
                      <span>@{request.from_username}</span>
                    </div>
                    <div className="request-card__actions">
                      <Button size="sm" variant="primary" onClick={() => handleRespond(request.id, 'accept')}>Accept</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleRespond(request.id, 'reject')}>Reject</Button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {isLoading ? (
            <div className="friend-list" aria-busy="true">
              {[0, 1, 2].map((i) => <LoadingSkeleton key={i} width="100%" height={96} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="friends-empty">No friends match that search.</div>
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
                      <span className="level-chip">L{friend.level}</span>
                      <span>{friend.streak_current === null ? 'Private streak' : `${friend.streak_current} day streak`}</span>
                    </div>
                  </div>
                  <div className="friend-card__actions">
                    <Button size="sm" variant="secondary" onClick={() => setGiftFriend(friend)}>Send Gift</Button>
                    <Button size="sm" variant="ghost" onClick={() => openProfile(friend)}>View Profile</Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="friends-leaderboard">
          <h2>Friends leaderboard</h2>
          {entries.slice(0, 8).map((entry) => (
            <div key={entry.id} className="mini-rank-row">
              <span>{entry.rank}</span>
              <strong>{entry.display_name}</strong>
              <em>L{entry.level}</em>
            </div>
          ))}
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
    try {
      await sendRequest(username);
      showToast('Friend request sent.', 'success');
      onClose();
    } catch (err) {
      showToast(extractMessage(err), 'error');
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="Add Friend">
      <div className="add-friend-modal">
        <input className="input" placeholder="Search username" value={query} onChange={(event) => setQuery(event.target.value)} autoFocus />
        {loading ? <LoadingSkeleton width="100%" height={64} /> : (
          <ul className="search-results" role="list">
            {results.map((user) => (
              <li key={user.id}>
                <Avatar name={user.display_name} url={user.avatar_url} />
                <div>
                  <strong>{user.display_name}</strong>
                  <span>@{user.username} · L{user.level}</span>
                </div>
                <Button size="sm" variant="primary" onClick={() => request(user.username)}>Send Request</Button>
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

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    try {
      await onSend(selected, message);
    } catch (err) {
      showToast(extractMessage(err), 'error');
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
          <Button variant="primary" type="submit" disabled={!selected}>Confirm send</Button>
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
        {profile.pet && (
          <PlaceholderPet species={profile.pet.species} mood={mood} size={180} />
        )}
        <dl>
          <div><dt>Level</dt><dd>{profile.level ?? 'Private'}</dd></div>
          <div><dt>Total habits</dt><dd>{profile.total_habits_completed ?? 'Private'}</dd></div>
          <div><dt>Streak</dt><dd>{profile.streak_current === null ? 'Private' : `${profile.streak_current} days`}</dd></div>
        </dl>
      </div>
    </Modal>
  );
}
