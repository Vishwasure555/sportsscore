import { useCallback, useEffect, useRef, useState } from 'react';
import * as cricket from './api/cricket.js';
import * as f1 from './api/f1.js';

function useVisible() {
  const [visible, setVisible] = useState(() => document.visibilityState !== 'hidden');
  useEffect(() => {
    const on = () => setVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);
  return visible;
}

// Re-render every `ms` so countdowns and "x min ago" stay fresh.
export function useNow(ms = 30000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

// Cricket data with hit budgeting: only fetch while the app is visible,
// faster while something is live, slower when nothing is.
export function useCricket(settings) {
  const [state, setState] = useState(() => {
    const c = cricket.getCached();
    return { matches: c?.matches || [], fetchedAt: c?.fetchedAt || 0, loading: false, error: '', hits: cricket.getHitInfo() };
  });
  const busy = useRef(false);
  const visible = useVisible();
  const { cricketApiKey: key, liveRefreshMin, idleRefreshMin, showCricket } = settings;

  const refresh = useCallback(
    async (force = false) => {
      if (busy.current || !showCricket) return;
      if (!key) {
        setState((s) => ({ ...s, error: 'Add your CricketData.org API key in Settings to load cricket.' }));
        return;
      }
      // Never refresh more than once a minute, even when forced.
      if (Date.now() - stateRef.current.fetchedAt < (force ? 60000 : 0)) return;
      busy.current = true;
      setState((s) => ({ ...s, loading: true, error: '' }));
      try {
        const r = await cricket.fetchMatches(key);
        setState({ matches: r.matches, fetchedAt: r.fetchedAt, loading: false, error: '', hits: r.hits });
      } catch (e) {
        setState((s) => ({ ...s, loading: false, error: e.message || String(e), hits: cricket.getHitInfo() }));
      } finally {
        busy.current = false;
      }
    },
    [key, showCricket]
  );

  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (!visible || !showCricket) return;
    const tick = () => {
      const s = stateRef.current;
      const anyLive = s.matches.some((m) => m.state === 'live');
      const every = (anyLive ? liveRefreshMin : idleRefreshMin) * 60000;
      const hitsLeft = s.hits.limit - s.hits.used;
      if (hitsLeft <= 2) return; // keep a couple in reserve for manual refresh
      if (Date.now() - s.fetchedAt >= every) refresh();
    };
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, [visible, refresh, liveRefreshMin, idleRefreshMin, showCricket]);

  return { ...state, refresh: () => refresh(true) };
}

export function useF1(settings) {
  const [state, setState] = useState(() => ({ data: f1.getCached(), loading: false, error: '' }));
  const visible = useVisible();
  const load = useCallback(async (force = false) => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const data = await f1.fetchF1(force);
      setState({ data, loading: false, error: '' });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: e.message || String(e) }));
    }
  }, []);
  useEffect(() => {
    if (!visible || !settings.showF1) return;
    load();
    const t = setInterval(() => load(), 10 * 60000);
    return () => clearInterval(t);
  }, [visible, load, settings.showF1]);
  return { ...state, refresh: () => load(true) };
}
