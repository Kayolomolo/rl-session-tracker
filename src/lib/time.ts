const pad = (n: number) => String(n).padStart(2, '0')

export function durationMs(start: number, end: number): number {
  return Math.max(0, end - start)
}

export function formatClock(ms: number): string {
  const total = Math.floor(Math.max(0, ms) / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${h}:${pad(m)}:${pad(s)}`
}

export function formatDuration(ms: number): string {
  const totalMin = Math.floor(Math.max(0, ms) / 60_000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h > 0 ? `${h}u ${m}m` : `${m}m`
}

export function dayKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function startOfWeek(ts: number): number {
  const d = new Date(ts)
  const offset = (d.getDay() + 6) % 7
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - offset).getTime()
}

export function formatDate(ts: number): string {
  const d = new Date(ts)
  const wd = d.toLocaleDateString('nl-NL', { weekday: 'short' }).replace('.', '')
  const mon = d.toLocaleDateString('nl-NL', { month: 'short' }).replace('.', '')
  return `${wd} ${d.getDate()} ${mon}`
}

export function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}
