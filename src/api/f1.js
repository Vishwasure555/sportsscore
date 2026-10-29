// Formula 1 via the free Jolpica API (successor to Ergast). No key needed.
import { load, save } from '../storage.js';

const BASE = 'https://api.jolpi.ca/ergast/f1';
const CACHE_KEY = 'ss_f1_cache';
const MAX_AGE = 30 * 60 * 1000; // 30 minutes

// Rough session lengths, used to decide whether a session is "live now".
const DURATION_MIN = { Race: 130, Sprint: 60, Qualifying: 70, 'Sprint Qualifying': 50, FP1: 60, FP2: 60, FP3: 60 };

function at(date, time) {
  if (!date) return null;
  const d = new Date(`${date}T${time || '00:00:00Z'}`);
  return isNaN(d) ? null : d;
}

function sessionsOf(race) {
  const list = [
    ['FP1', race.FirstPractice],
    ['FP2', race.SecondPractice],
    ['FP3', race.ThirdPractice],
    ['Sprint Qualifying', race.SprintQualifying || race.SprintShootout],
    ['Sprint', race.Sprint],
    ['Qualifying', race.Qualifying],
    ['Race', { date: race.date, time: race.time }],
  ];
  return list
    .filter(([, s]) => s && s.date)
    .map(([name, s]) => {
      const start = at(s.date, s.time);
      const end = start ? new Date(start.getTime() + DURATION_MIN[name] * 60000) : null;
      return { name, start, end };
    })
    .sort((a, b) => a.start - b.start);
}

function normaliseRace(r) {
  return {
    round: Number(r.round),
    name: r.raceName,
    circuit: r.Circuit?.circuitName || '',
    place: [r.Circuit?.Location?.locality, r.Circuit?.Location?.country].filter(Boolean).join(', '),
    start: at(r.date, r.time),
    sessions: sessionsOf(r),
  };
}

async function get(path) {
  const res = await fetch(`${BASE}/${path}`);
  if (!res.ok) throw new Error(`F1 API error (HTTP ${res.status})`);
  return (await res.json()).MRData;
}

function revive(data) {
  if (!data) return null;
  const races = (data.races || []).map((r) => ({
    ...r,
    start: r.start ? new Date(r.start) : null,
    sessions: r.sessions.map((s) => ({ ...s, start: new Date(s.start), end: new Date(s.end) })),
  }));
  return { ...data, races };
}

export function getCached() {
  return revive(load(CACHE_KEY, null));
}

export async function fetchF1(force = false) {
  const cached = getCached();
  if (!force && cached && Date.now() - cached.fetchedAt < MAX_AGE) return cached;

  const [sched, last, drivers, teams] = await Promise.all([
    get('current.json'),
    get('current/last/results.json'),
    get('current/driverStandings.json'),
    get('current/constructorStandings.json'),
  ]);

  const lastRace = last.RaceTable?.Races?.[0];
  const data = {
    fetchedAt: Date.now(),
    season: sched.RaceTable?.season,
    races: (sched.RaceTable?.Races || []).map(normaliseRace),
    lastResult: lastRace
      ? {
          round: Number(lastRace.round),
          name: lastRace.raceName,
          rows: lastRace.Results.map((x) => ({
            pos: x.position,
            driver: `${x.Driver.givenName} ${x.Driver.familyName}`,
            code: x.Driver.code || x.Driver.familyName.slice(0, 3).toUpperCase(),
            team: x.Constructor.name,
            time: x.Time?.time || x.status,
            points: x.points,
          })),
        }
      : null,
    drivers: (drivers.StandingsTable?.StandingsLists?.[0]?.DriverStandings || []).map((d) => ({
      pos: d.position,
      driver: `${d.Driver.givenName} ${d.Driver.familyName}`,
      code: d.Driver.code,
      team: d.Constructors?.[0]?.name || '',
      points: d.points,
      wins: d.wins,
    })),
    teams: (teams.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings || []).map((c) => ({
      pos: c.position,
      team: c.Constructor.name,
      points: c.points,
      wins: c.wins,
    })),
  };
  save(CACHE_KEY, data);
  return revive(JSON.parse(JSON.stringify(data)));
}

// The weekend to show: the race in progress or the next one.
export function currentWeekend(races, now = new Date()) {
  return races.find((r) => r.sessions.length && r.sessions[r.sessions.length - 1].end > now) || null;
}

export function liveSession(race, now = new Date()) {
  if (!race) return null;
  return race.sessions.find((s) => s.start <= now && now < s.end) || null;
}

export function isFavF1(text, favs) {
  if (!favs || !favs.length) return false;
  const t = String(text).toLowerCase();
  return favs.some((f) => f.trim() && t.includes(f.trim().toLowerCase()));
}
