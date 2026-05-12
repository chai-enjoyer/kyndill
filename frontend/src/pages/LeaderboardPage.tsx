import { useState } from 'react';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { useAuthContext } from '../context/AuthContext';
import { useLeaderboard, type LeaderboardEntry, type LeaderboardScope } from '../hooks/useLeaderboard';

export function LeaderboardPage() {
  const [scope, setScope] = useState<LeaderboardScope>('friends');
  const { entries, isLoading } = useLeaderboard(scope);
  const { user } = useAuthContext();
  const top = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <section className="page leaderboard-page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">Ranks</p>
          <h1>Leaderboard</h1>
        </div>
        <div className="shop-tabs" role="tablist" aria-label="Leaderboard scope">
          <button type="button" className={scope === 'friends' ? 'is-active' : ''} onClick={() => setScope('friends')}>Friends</button>
          <button type="button" className={scope === 'global' ? 'is-active' : ''} onClick={() => setScope('global')}>Global</button>
        </div>
      </header>

      {isLoading ? (
        <LoadingSkeleton width="100%" height={420} />
      ) : (
        <>
          <div className="podium-grid">
            {top.map((entry) => <RankCard key={entry.id} entry={entry} current={entry.id === user?.id} />)}
          </div>
          <div className="leaderboard-table" role="table" aria-label="Leaderboard">
            <div className="leaderboard-row leaderboard-row--head" role="row">
              <span>Rank</span><span>Name</span><span>Level</span><span>XP</span>
            </div>
            {rest.map((entry) => (
              <div key={entry.id} className={`leaderboard-row ${entry.id === user?.id ? 'leaderboard-row--current' : ''}`} role="row">
                <span>{entry.rank}</span>
                <span>{entry.display_name}</span>
                <span>{entry.level}</span>
                <span>{entry.xp}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function RankCard({ entry, current }: { entry: LeaderboardEntry; current: boolean }) {
  const tone = entry.rank === 1 ? 'gold' : entry.rank === 2 ? 'silver' : 'bronze';
  return (
    <article className={`rank-card rank-card--${tone} ${current ? 'rank-card--current' : ''}`}>
      <span className="rank-card__badge">#{entry.rank}</span>
      <h2>{entry.display_name}</h2>
      <p>@{entry.username}</p>
      <dl>
        <div><dt>Level</dt><dd>{entry.level}</dd></div>
        <div><dt>XP</dt><dd>{entry.xp}</dd></div>
      </dl>
    </article>
  );
}
