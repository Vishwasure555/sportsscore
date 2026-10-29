import { useState } from 'react';
import { f1WatchLinks } from '../config/links.js';
import { currentWeekend, liveSession, isFavF1 } from '../api/f1.js';
import { whenLabel, countdown } from '../time.js';
import { WatchLinks } from './ui.jsx';

export function WeekendCard({ race, now }) {
  if (!race) return <p className="empty">No more races this season.</p>;
  const live = liveSession(race, now);
  const next = race.sessions.find((s) => s.start > now);
  return (
    <article className={'card f1' + (live ? ' live' : '')}>
      <header className="card-head">
        <span className="pill sport">🏎 F1 · Round {race.round}</span>
        {live && <span className="pill live">● {live.name.toUpperCase()} LIVE</span>}
      </header>
      <h3 className="race-name">{race.name}</h3>
      <p className="muted">
        {race.circuit} · {race.place}
      </p>
      {!live && next && (
        <p className="next">
          Next: <b>{next.name}</b> {whenLabel(next.start, now)} <span className="muted">· {countdown(next.start, now)}</span>
        </p>
      )}
      <ul className="sessions">
        {race.sessions.map((s) => {
          const state = s.end <= now ? 'done' : s.start <= now ? 'now' : '';
          return (
            <li key={s.name} className={state}>
              <span>{s.name}</span>
              <span>{whenLabel(s.start, now)}</span>
            </li>
          );
        })}
      </ul>
      <WatchLinks links={f1WatchLinks(race.name, false)} />
    </article>
  );
}

function Table({ head, rows, favs, favText }) {
  return (
    <table className="table">
      <thead>
        <tr>
          {head.map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className={isFavF1(favText(r), favs) ? 'fav' : ''}>
            {r.cells.map((c, j) => (
              <td key={j}>{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function LastResultCard({ result, favs, limit = 10 }) {
  if (!result) return null;
  return (
    <article className="card">
      <header className="card-head">
        <span className="pill sport">🏁 Result · Round {result.round}</span>
      </header>
      <h3 className="race-name">{result.name}</h3>
      <Table
        head={['Pos', 'Driver', 'Team', 'Time']}
        favs={favs}
        favText={(r) => r.text}
        rows={result.rows.slice(0, limit).map((r) => ({ text: `${r.driver} ${r.team}`, cells: [r.pos, r.driver, r.team, r.time] }))}
      />
      <WatchLinks links={f1WatchLinks(result.name, true)} />
    </article>
  );
}

export function F1View({ f1, settings, now }) {
  const [tab, setTab] = useState('drivers');
  const d = f1.data;
  if (!d) return <p className="empty">{f1.loading ? 'Loading F1…' : f1.error || 'No F1 data yet.'}</p>;
  const race = currentWeekend(d.races, now);
  return (
    <section>
      <WeekendCard race={race} now={now} />
      <LastResultCard result={d.lastResult} favs={settings.favF1} limit={20} />
      <div className="segments">
        <button className={tab === 'drivers' ? 'on' : ''} onClick={() => setTab('drivers')}>
          Drivers
        </button>
        <button className={tab === 'teams' ? 'on' : ''} onClick={() => setTab('teams')}>
          Teams
        </button>
        <button className={tab === 'calendar' ? 'on' : ''} onClick={() => setTab('calendar')}>
          Calendar
        </button>
      </div>
      <article className="card">
        {tab === 'drivers' && (
          <Table
            head={['Pos', 'Driver', 'Team', 'Pts']}
            favs={settings.favF1}
            favText={(r) => r.text}
            rows={d.drivers.map((r) => ({ text: `${r.driver} ${r.team}`, cells: [r.pos, r.driver, r.team, r.points] }))}
          />
        )}
        {tab === 'teams' && (
          <Table
            head={['Pos', 'Team', 'Wins', 'Pts']}
            favs={settings.favF1}
            favText={(r) => r.text}
            rows={d.teams.map((r) => ({ text: r.team, cells: [r.pos, r.team, r.wins, r.points] }))}
          />
        )}
        {tab === 'calendar' && (
          <ul className="sessions calendar">
            {d.races.map((r) => (
              <li key={r.round} className={r.start && r.start < now ? 'done' : ''}>
                <span>
                  R{r.round} · {r.name}
                </span>
                <span>{whenLabel(r.start, now)}</span>
              </li>
            ))}
          </ul>
        )}
      </article>
      {f1.error && <p className="error">{f1.error}</p>}
    </section>
  );
}
