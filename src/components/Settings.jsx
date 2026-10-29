import { useState } from 'react';
import { agoLabel } from '../time.js';

function ChipEditor({ label, hint, values, onChange, suggestions }) {
  const [text, setText] = useState('');
  const add = (v) => {
    const t = (v ?? text).trim();
    if (t && !values.some((x) => x.toLowerCase() === t.toLowerCase())) onChange([...values, t]);
    setText('');
  };
  const sugg = suggestions.filter((s) => !values.some((v) => v.toLowerCase() === s.toLowerCase()) && (!text || s.toLowerCase().includes(text.toLowerCase()))).slice(0, 8);
  return (
    <div className="field">
      <label>{label}</label>
      <p className="hint">{hint}</p>
      <div className="chips">
        {values.map((v) => (
          <span key={v} className="chip on">
            ★ {v}
            <button onClick={() => onChange(values.filter((x) => x !== v))} aria-label={`Remove ${v}`}>
              ✕
            </button>
          </span>
        ))}
      </div>
      <div className="row">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="Type a name and press Add" />
        <button className="btn" onClick={() => add()}>
          Add
        </button>
      </div>
      {sugg.length > 0 && (
        <div className="chips">
          {sugg.map((s) => (
            <button key={s} className="chip" onClick={() => add(s)}>
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function SettingsView({ settings, setSettings, cricket, f1 }) {
  const [key, setKey] = useState(settings.cricketApiKey);
  const set = (patch) => setSettings({ ...settings, ...patch });

  const teamSuggestions = [...new Set(cricket.matches.flatMap((m) => [m.t1.name, m.t2.name]))].filter((n) => n && n !== 'TBA').sort();
  const f1Suggestions = f1.data
    ? [...new Set([...f1.data.drivers.map((d) => d.driver.split(' ').slice(-1)[0]), ...f1.data.teams.map((t) => t.team)])]
    : [];

  return (
    <section className="settings">
      <article className="card">
        <h2>Cricket data</h2>
        <div className="field">
          <label>CricketData.org API key</label>
          <p className="hint">
            Free key from <a href="https://cricketdata.org/" target="_blank" rel="noreferrer">cricketdata.org</a>. Stored only on this phone.
          </p>
          <div className="row">
            <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="Paste your API key" autoComplete="off" />
            <button
              className="btn"
              onClick={() => {
                set({ cricketApiKey: key.trim() });
              }}
            >
              Save
            </button>
          </div>
        </div>
        <p className="muted">
          API hits today: <b>{cricket.hits.used}</b> / {cricket.hits.limit} · Last update {agoLabel(cricket.fetchedAt)}
        </p>
        <div className="field">
          <label>Refresh while a match is live: every {settings.liveRefreshMin} min</label>
          <input type="range" min="1" max="10" value={settings.liveRefreshMin} onChange={(e) => set({ liveRefreshMin: Number(e.target.value) })} />
          <p className="hint">Each refresh uses 1 of your 100 free daily hits. 3 min ≈ 20 hits per live hour.</p>
        </div>
        <div className="field">
          <label>Refresh when nothing is live: every {settings.idleRefreshMin} min</label>
          <input type="range" min="10" max="60" step="5" value={settings.idleRefreshMin} onChange={(e) => set({ idleRefreshMin: Number(e.target.value) })} />
        </div>
      </article>

      <article className="card">
        <h2>Favourites</h2>
        <ChipEditor
          label="Cricket teams"
          hint="Matches with these teams are pinned to the top (e.g. India, Chennai Super Kings, CSK)."
          values={settings.favCricket}
          onChange={(v) => set({ favCricket: v })}
          suggestions={teamSuggestions}
        />
        <ChipEditor
          label="F1 drivers & teams"
          hint="Highlighted in results and standings (e.g. Verstappen, Ferrari)."
          values={settings.favF1}
          onChange={(v) => set({ favF1: v })}
          suggestions={f1Suggestions}
        />
      </article>

      <article className="card">
        <h2>Sports</h2>
        <label className="toggle">
          <input type="checkbox" checked={settings.showCricket} onChange={(e) => set({ showCricket: e.target.checked })} /> Cricket
        </label>
        <label className="toggle">
          <input type="checkbox" checked={settings.showF1} onChange={(e) => set({ showF1: e.target.checked })} /> Formula 1
        </label>
      </article>

      <p className="muted small center">
        SportsScore v{__APP_VERSION__} · Open with <code>?debug</code> for an on-screen console
      </p>
    </section>
  );
}
