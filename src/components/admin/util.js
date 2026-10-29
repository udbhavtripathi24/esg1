/** Small helpers shared by the Admin Console tabs. */
export const th = 'font-medium px-3 py-2.5 text-[10px] text-ink-500 text-left whitespace-nowrap'
export const td = 'px-3 py-2.5 text-[11px] align-middle'

export function fmtWhen(v, withTime = true) {
  if (!v) return '—'
  const d = new Date(typeof v === 'string' && !/[zZ]|[+-]\d\d:\d\d$/.test(v) ? `${v}Z` : v)
  return d.toLocaleString(undefined, withTime
    ? { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'short', year: 'numeric' })
}
