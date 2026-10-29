// Small localStorage wrapper. Every access is guarded so the app still
// works when storage is unavailable (private mode, cleared data, etc.).
export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export const DEFAULT_SETTINGS = {
  cricketApiKey: '',
  favCricket: [], // team names, e.g. "India", "Chennai Super Kings"
  favF1: [], // driver or team names, e.g. "Verstappen", "Ferrari"
  liveRefreshMin: 3, // how often to refresh while a match is live
  idleRefreshMin: 20, // how often to refresh when nothing is live
  showCricket: true,
  showF1: true,
};

export function loadSettings() {
  return { ...DEFAULT_SETTINGS, ...load('ss_settings', {}) };
}

export function saveSettings(s) {
  save('ss_settings', s);
}
