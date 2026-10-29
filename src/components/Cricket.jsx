import { useEffect, useState } from 'react';
import { cricketWatchLinks } from '../config/links.js';
import { fetchMatchInfo, isFavourite } from '../api/cricket.js';
import { whenLabel, countdown } from '../time.js';
import { WatchLinks, Sheet } from './ui.jsx';

function TeamRow({ team, winner }) {
  return (
    <div className={'team' + (winner ? ' winner' : '')}>
      {team.img ? (
        <img className="flag" src={team.img} alt="" loading="lazy" />
      ) : (
        <span className="flag ph">{team.short.slice(0, 3)}</span>
      )}
      <span className="tname">{team.name}</span>
      <span className="tscore">{team.score}</span>
    </div>
  );
}

function winnerOf(m) {
  if (m.state !== 'result') return null;
  const s = m.status.toLowerCase();
  if (s.includes(m.t1.name.toLowerCase() + ' won')) return 't1';
  if (s.includes(m.t2.name.toLowerCase() + ' won')) return 't2';
  return null;
}

export function MatchCard({ m, favs, now, onOpen }) {
  const fav = isFavourite(m, favs);
  const w = winnerOf(m);
  return (
    <article className={`card match ${m.state}${fav ? ' fav' : ''}`} onClick={() => onOpen && onOpen(m)}>
      <header className="card-head">
        <span className="pill sport">🏏 {m.format || 'Cricket'}</span>
        {m.state === 'live' && <span className="pill live">● LIVE</span>}
        {fav && <span className="pill star">★</span>}
        <span className="series">{m.series}</span>
      </header>
      <TeamRow team={m.t1} winner={w === 't1'} />
      <TeamRow team={m.t2} winner={w === 't2'} />
      <footer className="card-foot">
        {m.state === 'upcoming' ? (
          <span className="when">
            {whenLabel(m.start, now)} <span className="muted">· {countdown(m.start, now)}</span>
          </span>
        ) : (
          <span className={'status ' + m.state}>{m.status}</span>
        )}
      </footer>
      <WatchLinks links={cricketWatchLinks(m)} />
    </article>
  );
}

export function MatchSheet({ m, apiKey, onClose }) {
  const [info, setInfo] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    if (!m || m.state === 'upcoming' || !apiKey) return;
    let off = false;
    fetchMatchInfo(apiKey, m.id)
      .then((d) => !off && setInfo(d))
      .catch((e) => !off && setErr(e.message));
    return () => {
      off = true;
    };
  }, [m, apiKey]);
  if (!m) return null;
  return (
    <Sheet title={`${m.t1.name} vs ${m.t2.name}`} onClose={onClose}>
      <p className="muted">{m.series}</p>
      <p>
        <b>{m.format}</b> · {whenLabel(m.start)}
      </p>
      {info?.venue && <p>📍 {info.venue}</p>}
      {info?.tossWinner && (
        <p>
          🪙 {info.tossWinner} won the toss and chose to {info.tossChoice}
        </p>
      )}
      {Array.isArray(info?.score) && info.score.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>Innings</th>
              <th>Score</th>
              <th>Overs</th>
            </tr>
          </thead>
          <tbody>
            {info.score.map((s, i) => (
              <tr key={i}>
                <td>{s.inning}</td>
                <td>
                  {s.r}/{s.w}
                </td>
                <td>{s.o}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className={'status ' + m.state}>{info?.status || m.status}</p>
      {err && <p className="error">{err}</p>}
      {m.state !== 'upcoming' && !info && !err && <p className="muted">Loading scorecard…</p>}
      <WatchLinks links={cricketWatchLinks(m)} />
    </Sheet>
  );
}

const SEGMENTS = [
  ['live', 'Live'],
  ['upcoming', 'Upcoming'],
  ['result', 'Results'],
];

export function sortMatches(list, favs) {
  const favFirst = (a, b) => isFavourite(b, favs) - isFavourite(a, favs);
  return [...list].sort((a, b) => {
    const f = favFirst(a, b);
    if (f) return f;
    if (a.state === 'result') return (b.start || 0) - (a.start || 0);
    return (a.start || 0) - (b.start || 0);
  });
}

export function CricketView({ data, settings, now, onOpen }) {
  const anyLive = data.matches.some((m) => m.state === 'live');
  const [seg, setSeg] = useState(anyLive ? 'live' : 'upcoming');
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const list = sortMatches(
    data.matches.filter(
      (m) =>
        m.state === seg &&
        (!query || `${m.t1.name} ${m.t2.name} ${m.series} ${m.t1.short} ${m.t2.short}`.toLowerCase().includes(query))
    ),
    settings.favCricket
  );
  return (
    <section>
      <div className="segments">
        {SEGMENTS.map(([id, label]) => (
          <button key={id} className={seg === id ? 'on' : ''} onClick={() => setSeg(id)}>
            {label}
            <span className="count">{data.matches.filter((m) => m.state === id).length}</span>
          </button>
        ))}
      </div>
      <input className="search" placeholder="Search team or series…" value={q} onChange={(e) => setQ(e.target.value)} />
      {list.length === 0 && <p className="empty">No {SEGMENTS.find((s) => s[0] === seg)[1].toLowerCase()} matches.</p>}
      {list.map((m) => (
        <MatchCard key={m.id} m={m} favs={settings.favCricket} now={now} onOpen={onOpen} />
      ))}
    </section>
  );
}
