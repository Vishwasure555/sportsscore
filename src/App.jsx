import { useState } from 'react';
import { loadSettings, saveSettings } from './storage.js';
import { useCricket, useF1, useNow } from './hooks.js';
import { isFavourite } from './api/cricket.js';
import { currentWeekend, liveSession, isFavF1 } from './api/f1.js';
import { agoLabel } from './time.js';
import { CricketView, MatchCard, MatchSheet, sortMatches } from './components/Cricket.jsx';
import { F1View, WeekendCard, LastResultCard } from './components/F1.jsx';
import { SettingsView } from './components/Settings.jsx';
import { SectionTitle } from './components/ui.jsx';

const TABS = [
  ['home', '🏠', 'Home'],
  ['cricket', '🏏', 'Cricket'],
  ['f1', '🏎', 'F1'],
  ['settings', '⚙️', 'Settings'],
];

function Home({ cricket, f1, settings, now, onOpen, goTo }) {
  const favs = settings.favCricket;
  const ms = settings.showCricket ? cricket.matches : [];
  const live = sortMatches(ms.filter((m) => m.state === 'live'), favs);
  const favMatches = sortMatches(ms.filter((m) => m.state !== 'live' && isFavourite(m, favs)), favs).slice(0, 6);
  const soon = sortMatches(
    ms.filter((m) => m.state === 'upcoming' && !isFavourite(m, favs) && m.start && m.start - now < 48 * 3600 * 1000),
    favs
  ).slice(0, 6);
  const recent = sortMatches(ms.filter((m) => m.state === 'result' && !isFavourite(m, favs)), favs).slice(0, 4);

  const race = settings.showF1 && f1.data ? currentWeekend(f1.data.races, now) : null;
  const f1Live = liveSession(race, now);
  const favDrivers = settings.showF1 && f1.data ? f1.data.drivers.filter((d) => isFavF1(`${d.driver} ${d.team}`, settings.favF1)) : [];

  const nothingSetUp = !settings.cricketApiKey && settings.showCricket;

  return (
    <>
      {nothingSetUp && (
        <div className="card notice" onClick={() => goTo('settings')}>
          👋 Add your free CricketData.org API key in <b>Settings</b> to see cricket scores. F1 works without a key.
        </div>
      )}

      {(live.length > 0 || f1Live) && <SectionTitle>Live now</SectionTitle>}
      {f1Live && <WeekendCard race={race} now={now} />}
      {live.map((m) => (
        <MatchCard key={m.id} m={m} favs={favs} now={now} onOpen={onOpen} />
      ))}

      {(favMatches.length > 0 || favDrivers.length > 0) && <SectionTitle>★ Your favourites</SectionTitle>}
      {favDrivers.length > 0 && (
        <div className="card">
          {favDrivers.map((d) => (
            <div key={d.driver} className="standing-line">
              <span className="pos">P{d.pos}</span>
              <span>{d.driver}</span>
              <span className="muted">{d.team}</span>
              <span className="pts">{d.points} pts</span>
            </div>
          ))}
        </div>
      )}
      {favMatches.map((m) => (
        <MatchCard key={m.id} m={m} favs={favs} now={now} onOpen={onOpen} />
      ))}

      {race && !f1Live && (
        <>
          <SectionTitle>Next F1 session</SectionTitle>
          <WeekendCard race={race} now={now} />
        </>
      )}

      {soon.length > 0 && (
        <SectionTitle
          extra={
            <button className="link" onClick={() => goTo('cricket')}>
              All matches →
            </button>
          }
        >
          Coming up
        </SectionTitle>
      )}
      {soon.map((m) => (
        <MatchCard key={m.id} m={m} favs={favs} now={now} onOpen={onOpen} />
      ))}

      {recent.length > 0 && <SectionTitle>Recent results</SectionTitle>}
      {recent.map((m) => (
        <MatchCard key={m.id} m={m} favs={favs} now={now} onOpen={onOpen} />
      ))}
      {settings.showF1 && f1.data?.lastResult && !f1Live && <LastResultCard result={f1.data.lastResult} favs={settings.favF1} limit={5} />}
    </>
  );
}

export default function App() {
  const [settings, setSettingsState] = useState(loadSettings);
  const setSettings = (s) => {
    setSettingsState(s);
    saveSettings(s);
  };
  const [tab, setTab] = useState('home');
  const [open, setOpen] = useState(null);
  const now = useNow(30000);
  const cricket = useCricket(settings);
  const f1 = useF1(settings);

  const loading = cricket.loading || f1.loading;
  const refresh = () => {
    if (settings.showCricket) cricket.refresh();
    if (settings.showF1) f1.refresh();
  };

  return (
    <div className="app">
      <header className="topbar">
        <h1>
          Sports<span>Score</span>
        </h1>
        <div className="topbar-right">
          <span className="muted small">{settings.showCricket && cricket.fetchedAt ? `Updated ${agoLabel(cricket.fetchedAt, now.getTime())}` : ''}</span>
          <button className={'icon' + (loading ? ' spin' : '')} onClick={refresh} aria-label="Refresh">
            ⟳
          </button>
        </div>
      </header>

      <main>
        {settings.showCricket && cricket.error && tab !== 'settings' && settings.cricketApiKey && <p className="error">{cricket.error}</p>}
        {tab === 'home' && <Home cricket={cricket} f1={f1} settings={settings} now={now} onOpen={setOpen} goTo={setTab} />}
        {tab === 'cricket' && <CricketView data={cricket} settings={settings} now={now} onOpen={setOpen} />}
        {tab === 'f1' && <F1View f1={f1} settings={settings} now={now} />}
        {tab === 'settings' && <SettingsView settings={settings} setSettings={setSettings} cricket={cricket} f1={f1} />}
      </main>

      <nav className="tabbar">
        {TABS.filter(([id]) => (id === 'cricket' ? settings.showCricket : id === 'f1' ? settings.showF1 : true)).map(([id, icon, label]) => (
          <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
            <span className="ti">{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {open && <MatchSheet m={open} apiKey={settings.cricketApiKey} onClose={() => setOpen(null)} />}
    </div>
  );
}
