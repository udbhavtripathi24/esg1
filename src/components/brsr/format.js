/** Shared BRSR display helpers — same formatting rules as the Word report
 * (app/brsr/docx_report.py) so the screen and the document agree. */

const IN_INT = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
const IN_2 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 })

export function fillLabels(text, labels) {
  if (!text || !labels) return text || ''
  return text.replaceAll('{cy}', labels.cy).replaceAll('{py}', labels.py).replaceAll('{ppy}', labels.ppy)
}

export function fmtNumber(v, display = 'number') {
  if (v === null || v === undefined || v === '') return '–'
  const n = Number(v)
  if (!Number.isFinite(n)) return String(v)
  if (display === 'percent') return n.toFixed(2)
  if (display === 'intensity') {
    if (n === 0) return '0'
    const mag = Math.floor(Math.log10(Math.abs(n)))
    return n.toFixed(Math.max(0, 3 - mag))
  }
  return Number.isInteger(n) ? IN_INT.format(n) : IN_2.format(n)
}

export const NUMERIC_KINDS = new Set(['count', 'number', 'amount', 'percent', 'rate'])

export function displayFor(col, row) {
  if (col.kind === 'computed') return col.display || 'number'
  if (row?.formula) return row.display || 'number'
  return col.kind === 'percent' ? 'percent' : 'number'
}

export function isComputedCell(col, row) {
  return col.kind === 'computed' || (!!row?.formula && NUMERIC_KINDS.has(col.kind))
}

export const SECTION_STATUS = {
  draft: { label: 'Draft', cls: 'bg-ink-100 text-ink-500' },
  submitted: { label: 'Under review', cls: 'bg-status-review/10 text-status-review' },
  approved: { label: 'Approved', cls: 'bg-status-approved/10 text-status-approved' },
  changes_requested: { label: 'Changes requested', cls: 'bg-status-pending/10 text-status-pending' },
}


/** Current and recent Indian financial years, newest first. */
export function financialYearOptions(count = 4) {
  const now = new Date()
  const start = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
  return Array.from({ length: count }, (_, i) => {
    const s = start - i
    return `${s}-${String(s + 1).slice(-2)}`
  })
}

export function fyPeriod(fy) {
  const s = Number(fy.slice(0, 4))
  return { start: `${s}-04-01`, end: `${s + 1}-03-31` }
}

// ---------------------------------------------------------------------------
// Annual data (short form) and derived questions — bank v2
// ---------------------------------------------------------------------------

/** Navigation label for a section: data areas by title, SEBI sections by code. */
export function sectionName(code, meta) {
  if (meta?.kind === 'data') return meta.title
  return code.startsWith('P') ? `Principle ${code.slice(1)}` : `Section ${code}`
}

export function sectionSubtitle(code, meta) {
  if (meta?.kind === 'data') return (meta.departments || []).join(' · ')
  return code.startsWith('P') ? meta?.statement : meta?.title?.split(': ')[1]
}

/** The platform builds this whole question from the annual data. */
export function isFullyDerived(q) {
  return !!q?.derive && !q.required
}

/** Mirrors engine.derive_key: a table cell filled from the annual data.
 * Only current- and previous-year columns are derived. */
export function isDerivedCell(q, col, row) {
  if (!q?.derive || !row) return false
  const period = col.period
  if (period && period !== 'cy' && period !== 'py') return false
  const base = period ? col.key.slice(period.length + 1) : col.key
  return `${row.key}.${base}` in q.derive
}

/** A field of a "fields" question filled from the annual data. */
export function isDerivedField(q, key) {
  return !!q?.derive && `fields.${key}` in q.derive
}

/** Does this question (or section) concern the given department? */
export function forDepartment(item, dept) {
  return !dept || (item?.departments || []).includes(dept)
}
