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
