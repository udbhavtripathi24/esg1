/** Formatting shared by the KPI catalogue, factors directory and dashboards. */

export function fmtNum(v, unit = '') {
  if (v === null || v === undefined || Number.isNaN(v)) return '—'
  const a = Math.abs(v)
  if (unit === '₹') {
    if (a >= 1e7) return `₹${(v / 1e7).toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr`
    return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
  }
  const s = a !== 0 && a < 0.001 ? v.toExponential(2)
    : v.toLocaleString('en-IN', { maximumFractionDigits: a < 10 ? 3 : a < 1000 ? 2 : 0 })
  return unit === '%' ? `${s}%` : s
}

export function changePct(cur, prev) {
  if (cur === null || cur === undefined || prev === null || prev === undefined || prev === 0) return null
  return ((cur - prev) / Math.abs(prev)) * 100
}

/** 'good' | 'bad' | 'flat' | null — whether the change is in the KPI's better direction. */
export function changeTone(pct, better) {
  if (pct === null || pct === undefined) return null
  if (Math.abs(pct) < 0.05) return 'flat'
  if (!better) return 'flat'
  return (pct < 0) === (better === 'lower') ? 'good' : 'bad'
}

export function currentFy(today = new Date()) {
  const y = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1
  return `${y}-${String((y + 1) % 100).padStart(2, '0')}`
}

export function fyOptions(n = 4, today = new Date()) {
  const start = Number(currentFy(today).slice(0, 4))
  return Array.from({ length: n }, (_, i) => `${start - i}-${String((start - i + 1) % 100).padStart(2, '0')}`)
}

export const KIND_LABEL = { base: 'Base', calculated: 'Calculated', emission: 'Emission', breakdown: 'Chart' }
export const PILLAR_TONE = { Environment: 'text-brand-greenDark bg-brand-green/10', Social: 'text-blue-700 bg-blue-50',
  Governance: 'text-purple-700 bg-purple-50', Narrative: 'text-amber-800 bg-amber-50' }

/** Roles that may be named uploader / reviewer of a KPI domain (Roles → KPI domains, SASB setup). */
export const CAN_UPLOAD = ['Client Uploader', 'Client Administrator']
export const CAN_REVIEW = ['Client Reviewer', 'Client Approver']
