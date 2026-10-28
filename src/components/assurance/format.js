/** Assurance display helpers (no components here, so fast refresh works). */
import { useCallback, useState } from 'react'

export function errMessage(err, fallback) {
  return err?.data?.error?.message || err?.message || fallback
}

export function fmtDate(v, withTime = false) {
  if (!v) return '–'
  const s = String(v)
  // Backend timestamps are UTC without a zone; plain dates are calendar dates.
  const d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T00:00:00`)
    : new Date(s.endsWith('Z') || /[+-]\d\d:\d\d$/.test(s) ? s : `${s}Z`)
  if (Number.isNaN(d.getTime())) return String(v)
  return withTime
    ? d.toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

export function fmtBytes(n) {
  if (!n && n !== 0) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

export const SEVERITY = {
  misstatement: ['Misstatement', 'text-status-pending'],
  control_deficiency: ['Control deficiency', 'text-amber-700'],
  observation: ['Observation', 'text-ink-700'],
}

export const OPINION = {
  unmodified: 'Unmodified', qualified: 'Qualified', adverse: 'Adverse', disclaimer: 'Disclaimer of conclusion',
}

export const ROLE_LABEL = {
  partner: 'Engagement partner', manager: 'Manager', practitioner: 'Practitioner', eqr: 'Quality reviewer (EQR)',
}

export const EVIDENCE_ACCEPT = '.pdf,.docx,.xlsx,.xls,.csv,.png,.jpg,.jpeg'

export function fyLabels(fy) {
  const s = Number(String(fy).slice(0, 4))
  const f = (y) => `FY ${y}-${String(y + 1).slice(-2)}`
  return { cy: f(s), py: f(s - 1), ppy: f(s - 2) }
}


/** Toast state for a page; render <Toast msg={toast.msg} />. */
export function useToast() {
  const [msg, setMsg] = useState(null)
  const push = useCallback((m) => { setMsg(m); setTimeout(() => setMsg(null), 3500) }, [])
  return { msg, push }
}
