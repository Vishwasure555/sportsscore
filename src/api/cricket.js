// CricketData.org (api.cricapi.com) client.
// Free tier = 100 hits/day, so we use the single "cricScore" endpoint
// (all live + upcoming + recent matches in ONE hit) and cache it on the phone.
import { load, save } from '../storage.js';

const BASE = 'https://api.cricapi.com/v1';
const CACHE_KEY = 'ss_cricket_cache';
const HITS_KEY = 'ss_cricket_hits';

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function getHitInfo() {
  const h = load(HITS_KEY, null);
  if (!h || h.day !== today()) return { day: today(), used: 0, limit: 100 };
  return h;
}

function recordHit(info) {
  const h = getHitInfo();
  const next = {
    day: today(),
    used: info && Number.isFinite(info.hitsToday) ? info.hitsToday : h.used + 1,
    limit: info && Number.isFinite(info.hitsLimit) ? info.hitsLimit : h.limit,
  };
  save(HITS_KEY, next);
  return next;
}

// "India [IND]" -> { name: "India", short: "IND" }
function parseTeam(raw, img) {
  const s = String(raw || 'TBA');
  const m = s.match(/^(.*?)\s*\[(.+?)\]\s*$/);
  return {
    name: (m ? m[1] : s).trim(),
    short: (m ? m[2] : s.slice(0, 3)).trim().toUpperCase(),
    img: img && !/icon512/.test(img) ? img : '',
  };
}

function parseDate(gmt) {
  if (!gmt) return null;
  const d = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(gmt) ? gmt : gmt + 'Z');
  return isNaN(d) ? null : d;
}

export function normalise(raw) {
  const state = raw.ms === 'live' ? 'live' : raw.ms === 'result' ? 'result' : 'upcoming';
  return {
    id: raw.id,
    sport: 'cricket',
    state,
    series: raw.series || '',
    name: raw.name || '',
    format: (raw.matchType || '').toUpperCase(),
    start: parseDate(raw.dateTimeGMT),
    status: raw.status || '',
    t1: { ...parseTeam(raw.t1, raw.t1img), score: raw.t1s || '' },
    t2: { ...parseTeam(raw.t2, raw.t2img), score: raw.t2s || '' },
  };
}

export function getCached() {
  const c = load(CACHE_KEY, null);
  if (!c) return null;
  return { fetchedAt: c.fetchedAt, matches: (c.raw || []).map(normalise) };
}

export class ApiError extends Error {}

export async function fetchMatches(apiKey) {
  if (!apiKey) throw new ApiError('Add your CricketData.org API key in Settings to load cricket.');
  const res = await fetch(`${BASE}/cricScore?apikey=${encodeURIComponent(apiKey)}`);
  if (!res.ok) throw new ApiError(`Cricket API error (HTTP ${res.status}).`);
  const json = await res.json();
  const hits = recordHit(json.info);
  if (json.status !== 'success' || !Array.isArray(json.data)) {
    const reason = json.reason || json.status || 'unknown error';
    throw new ApiError(`Cricket API: ${reason}`);
  }
  const fetchedAt = Date.now();
  save(CACHE_KEY, { fetchedAt, raw: json.data });
  return { fetchedAt, matches: json.data.map(normalise), hits };
}

// Detailed scorecard for one match (costs 1 hit; cached for 2 min).
export async function fetchMatchInfo(apiKey, id) {
  const key = 'ss_cricket_info_' + id;
  const c = load(key, null);
  if (c && Date.now() - c.at < 120000) return c.data;
  const res = await fetch(`${BASE}/match_info?apikey=${encodeURIComponent(apiKey)}&id=${encodeURIComponent(id)}`);
  if (!res.ok) throw new ApiError(`Cricket API error (HTTP ${res.status}).`);
  const json = await res.json();
  recordHit(json.info);
  if (json.status !== 'success') throw new ApiError(`Cricket API: ${json.reason || json.status}`);
  save(key, { at: Date.now(), data: json.data });
  return json.data;
}

export function isFavourite(match, favs) {
  if (!favs || !favs.length) return false;
  const hay = [match.t1.name, match.t1.short, match.t2.name, match.t2.short].map((s) => s.toLowerCase());
  return favs.some((f) => {
    const n = f.trim().toLowerCase();
    return n && hay.some((h) => h === n || h.includes(n));
  });
}
