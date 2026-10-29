const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function whenLabel(d, now = new Date()) {
  if (!d) return 'Time TBA';
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  let day = dayFmt.format(d);
  if (sameDay(d, now)) day = 'Today';
  else if (sameDay(d, tomorrow)) day = 'Tomorrow';
  else if (sameDay(d, yesterday)) day = 'Yesterday';
  return `${day}, ${timeFmt.format(d)}`;
}

export function countdown(d, now = new Date()) {
  if (!d) return '';
  let s = Math.max(0, Math.floor((d - now) / 1000));
  const days = Math.floor(s / 86400);
  s -= days * 86400;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (days > 0) return `in ${days}d ${h}h`;
  if (h > 0) return `in ${h}h ${m}m`;
  return `in ${m}m`;
}

export function agoLabel(ts, now = Date.now()) {
  if (!ts) return 'never';
  const s = Math.round((now - ts) / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return `${h} h ago`;
}
