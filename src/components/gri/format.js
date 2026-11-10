/** Labels and colours shared by the GRI workspace and GRI reporting. */

export const GRI_STATE = {
  data: { label: 'From data', cls: 'bg-brand-green/10 text-brand-greenDark', dot: 'bg-brand-green' },
  approved: { label: 'Approved', cls: 'bg-status-approved/10 text-status-approved', dot: 'bg-status-approved' },
  submitted: { label: 'In review', cls: 'bg-status-review/10 text-status-review', dot: 'bg-status-review' },
  returned: { label: 'Returned', cls: 'bg-red-50 text-status-pending', dot: 'bg-status-pending' },
  draft: { label: 'Draft', cls: 'bg-amber-50 text-amber-800', dot: 'bg-amber-400' },
  brsr_available: { label: 'BRSR answer ready', cls: 'bg-blue-50 text-blue-700', dot: 'bg-blue-500' },
  no_data: { label: 'No data yet', cls: 'bg-ink-100 text-ink-700', dot: 'bg-ink-300' },
  todo: { label: 'To do', cls: 'bg-ink-100 text-ink-500', dot: 'bg-ink-300' },
}

export const STATE_ORDER = ['todo', 'brsr_available', 'no_data', 'draft', 'returned', 'submitted', 'approved', 'data']

export const GROUP_TONE = {
  universal: 'text-ink-900',
  economic: 'text-purple-700',
  environment: 'text-brand-greenDark',
  social: 'text-blue-700',
}

export function fmtFigure(v, unit) {
  if (v === null || v === undefined) return '—'
  const a = Math.abs(v)
  const digits = a !== 0 && a < 1 ? 4 : a < 10 ? 3 : a < 1000 ? 2 : 0
  const s = v.toLocaleString('en-IN', { maximumFractionDigits: digits })
  if (unit === '%') return `${s}%`
  if (unit === '₹') return `₹${s}`
  return s
}

export function errMessage(err, fallback) {
  return err?.data?.error?.message || err?.message || fallback
}
