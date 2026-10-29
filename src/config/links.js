// "Watch on" links shown on match cards.
// Edit this file when broadcast rights change — nothing else needs to change.

export const BROADCASTERS = {
  jiohotstar: { name: 'JioHotstar', url: 'https://www.hotstar.com/in/sports/cricket' },
  fancode: { name: 'FanCode', url: 'https://www.fancode.com/cricket' },
  sonyliv: { name: 'SonyLIV', url: 'https://www.sonyliv.com/sports' },
  fancodeF1: { name: 'FanCode', url: 'https://www.fancode.com/formula1' },
  f1tv: { name: 'F1 TV', url: 'https://f1tv.formula1.com/' },
};

// Cricket: first rule whose pattern matches the series/match name wins.
// Fallback shows all three main Indian cricket streamers.
export const CRICKET_RULES = [
  { match: /indian premier league|\bipl\b/i, show: ['jiohotstar'] },
  { match: /\bicc\b|world cup|champions trophy/i, show: ['jiohotstar'] },
  { match: /tour of india|in india/i, show: ['jiohotstar'] },
  { match: /women's premier league|\bwpl\b/i, show: ['jiohotstar'] },
];
export const CRICKET_DEFAULT = ['jiohotstar', 'sonyliv', 'fancode'];

// F1 in India streams on FanCode (deal runs to 2028); F1 TV as a second option.
export const F1_BROADCASTERS = ['fancodeF1', 'f1tv'];

export const YOUTUBE_CHANNELS = {
  cricket: { name: 'ICC on YouTube', url: 'https://www.youtube.com/@ICC' },
  f1: { name: 'F1 on YouTube', url: 'https://www.youtube.com/@Formula1' },
};

export function youtubeSearch(query) {
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query);
}

export function cricketWatchLinks(match) {
  const text = `${match.series || ''} ${match.name || ''}`;
  const rule = CRICKET_RULES.find((r) => r.match.test(text));
  const ids = rule ? rule.show : CRICKET_DEFAULT;
  const links = ids.map((id) => BROADCASTERS[id]);
  const vs = `${match.t1.name} vs ${match.t2.name}`;
  links.push({
    name: match.state === 'result' ? 'Highlights' : 'YouTube',
    url: youtubeSearch(`${vs} ${match.state === 'result' ? 'highlights' : 'live'}`),
    youtube: true,
  });
  return links;
}

export function f1WatchLinks(raceName, isPast) {
  const links = F1_BROADCASTERS.map((id) => BROADCASTERS[id]);
  links.push({
    name: isPast ? 'Highlights' : 'YouTube',
    url: youtubeSearch(`F1 ${new Date().getFullYear()} ${raceName} ${isPast ? 'race highlights' : ''}`.trim()),
    youtube: true,
  });
  return links;
}
