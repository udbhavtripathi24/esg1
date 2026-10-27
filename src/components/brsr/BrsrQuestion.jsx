import { useState } from 'react'
import { AlertCircle, AlertTriangle, MessageSquare, Plus, Trash2, Calculator, History, Database, ArrowRight } from 'lucide-react'
import AiWritingAssistant from '../AiWritingAssistant.jsx'
import {
  fillLabels, fmtNumber, displayFor, isComputedCell, isDerivedCell, isDerivedField, isFullyDerived, NUMERIC_KINDS,
} from './format.js'

/**
 * One BRSR question, rendered from its question-bank definition.
 *
 * The component never computes totals or percentages itself: computed
 * cells show the values the backend returned (`computed`), the same
 * numbers that go into the Word report. While an edit is still unsaved
 * the computed cells are dimmed, so a stale total is never mistaken for
 * a fresh one.
 *
 * Quantitative tables are built from the short annual data form (bank v2):
 * those cells arrive in `computed` too and are shown read-only, with a link
 * back to the data area they come from.
 */

const inputCls =
  'w-full px-2 py-1.5 rounded border border-surface-border bg-white text-[10px] text-ink-900 placeholder:text-ink-300 ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green disabled:bg-surface-muted disabled:text-ink-500'

const YESNO = ['Yes', 'No', 'NA']

function Cell({ kind, options, value, onChange, disabled, placeholder }) {
  const v = value ?? ''
  if (kind === 'yesno' || kind === 'choice') {
    const opts = kind === 'yesno' ? YESNO : options || []
    return (
      <select value={v} onChange={(e) => onChange(e.target.value || null)} disabled={disabled} className={inputCls}>
        <option value="">–</option>
        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    )
  }
  if (kind === 'longtext') {
    return <textarea rows={2} value={v} onChange={(e) => onChange(e.target.value)} disabled={disabled} className={`${inputCls} resize-y min-w-[200px]`} />
  }
  const numeric = NUMERIC_KINDS.has(kind)
  return (
    <input
      value={v}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      inputMode={numeric ? 'decimal' : undefined}
      placeholder={placeholder}
      className={`${inputCls} ${numeric ? 'text-right tabular-nums' : ''}`}
    />
  )
}

function Issues({ issues }) {
  if (!issues?.length) return null
  return (
    <ul className="mt-2 space-y-1">
      {issues.map((i, n) => (
        <li key={n} className={`flex items-start gap-1.5 text-[10px] ${i.level === 'error' ? 'text-status-pending' : 'text-status-review'}`}>
          {i.level === 'error' ? <AlertCircle size={11} className="mt-px shrink-0" /> : <AlertTriangle size={11} className="mt-px shrink-0" />}
          {i.message}
        </li>
      ))}
    </ul>
  )
}

// ---------------------------------------------------------------------------
// Type renderers
// ---------------------------------------------------------------------------

function TextAnswer({ q, value, onChange, disabled, pushToast }) {
  const text = value?.text ?? ''
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  return (
    <div>
      <textarea
        rows={4}
        value={text}
        onChange={(e) => onChange({ ...value, text: e.target.value })}
        disabled={disabled}
        placeholder="Enter your response…"
        className={`${inputCls} resize-y`}
      />
      <div className="flex items-center justify-between mt-1.5">
        <span className={`text-[9px] ${q.max_words && words > q.max_words ? 'text-status-pending' : 'text-ink-300'}`}>
          {words} words{q.max_words ? ` / ${q.max_words} max` : ''}
        </span>
        {!disabled && <AiWritingAssistant pushToast={pushToast} />}
      </div>
    </div>
  )
}

function YesNoAnswer({ q, value, onChange, disabled }) {
  const v = value || {}
  return (
    <div className="space-y-2">
      <div className="inline-flex rounded-md border border-surface-border overflow-hidden">
        {YESNO.map((o) => (
          <button
            key={o}
            type="button"
            disabled={disabled}
            onClick={() => onChange({ ...v, answer: o })}
            className={`px-4 py-1.5 text-[10px] font-medium border-r border-surface-border last:border-r-0 transition-colors ${
              v.answer === o ? 'bg-brand-green text-white' : 'bg-white text-ink-700 hover:bg-surface-muted'
            } disabled:cursor-not-allowed`}
          >
            {o === 'NA' ? 'Not applicable' : o}
          </button>
        ))}
      </div>
      {q.details_label && (
        <div>
          <label className="block text-[9px] text-ink-500 mb-1">
            {q.details_label}
            {q.details_required_when && <span className="text-ink-300"> (required if {q.details_required_when})</span>}
          </label>
          <textarea rows={2} value={v.details ?? ''} onChange={(e) => onChange({ ...v, details: e.target.value })} disabled={disabled} className={`${inputCls} resize-y`} />
        </div>
      )}
      {q.link && (
        <div>
          <label className="block text-[9px] text-ink-500 mb-1">Web-link to the policy (optional)</label>
          <input value={v.link ?? ''} onChange={(e) => onChange({ ...v, link: e.target.value })} disabled={disabled} placeholder="https://" className={inputCls} />
        </div>
      )}
    </div>
  )
}

function DerivedValue({ children }) {
  return (
    <div className="px-2 py-1.5 rounded border border-brand-green/20 bg-brand-green/5 text-[10px] text-ink-900 tabular-nums text-right"
      title="Built from your annual data">
      {children}
    </div>
  )
}

function NumberAnswer({ q, value, onChange, disabled, info }) {
  if (q.derive) {
    const v = info?.computed?.derived_answer?.value
    return (
      <div className="flex items-center gap-2 max-w-[220px]">
        <div className="flex-1"><DerivedValue>{fmtNumber(v, q.kind === 'percent' ? 'percent' : 'number')}</DerivedValue></div>
        <span className="text-[10px] text-ink-500">{q.kind === 'percent' ? '%' : q.unit || ''}</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 max-w-[220px]">
      <Cell kind={q.kind} value={value?.value} onChange={(x) => onChange({ ...value, value: x })} disabled={disabled} />
      <span className="text-[10px] text-ink-500">{q.kind === 'percent' ? '%' : q.unit || ''}</span>
    </div>
  )
}

function FieldsAnswer({ q, value, onChange, disabled, info }) {
  const f = value?.fields || {}
  const derived = info?.computed?.derived_answer?.fields || {}
  const set = (key, x) => onChange({ ...value, fields: { ...f, [key]: x } })
  return (
    <div className="grid md:grid-cols-2 gap-x-4 gap-y-3">
      {q.fields.map((fd) => (
        <div key={fd.key} className={fd.kind === 'longtext' ? 'md:col-span-2' : ''}>
          <label className="block text-[9px] text-ink-500 mb-1">
            {fd.number && <span className="text-ink-300 mr-1">{fd.number}.</span>}
            {fd.label}
            {fd.required && !fd.readonly && <span className="text-status-pending">*</span>}
          </label>
          {isDerivedField(q, fd.key) ? (
            <DerivedValue>{NUMERIC_KINDS.has(fd.kind) ? fmtNumber(derived[fd.key]) : (derived[fd.key] ?? '–')}</DerivedValue>
          ) : (
            <Cell
              kind={fd.kind === 'email' || fd.kind === 'url' ? 'text' : fd.kind}
              options={fd.options}
              value={f[fd.key]}
              onChange={(x) => set(fd.key, x)}
              disabled={disabled || fd.readonly}
              placeholder={fd.pattern_hint}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function TableAnswer({ q, value, onChange, disabled, computed, stale, labels }) {
  const cells = value?.cells || {}
  const set = (rk, ck, x) => {
    const row = { ...(cells[rk] || {}), [ck]: x }
    onChange({ ...value, cells: { ...cells, [rk]: row } })
  }
  const ncols = q.columns.length + 1
  return (
    <div>
      <div className="overflow-x-auto border border-surface-border rounded-md">
        <table className="w-full text-[10px] border-collapse">
          <thead>
            {(q.headers || []).map((h, i) => (
              <tr key={i} className="bg-surface-muted">
                {h.map((c, j) => (
                  <th key={j} colSpan={c.span} className="px-2 py-1.5 font-semibold text-ink-700 text-center border-b border-r border-surface-border last:border-r-0">
                    {fillLabels(c.label, labels)}
                  </th>
                ))}
              </tr>
            ))}
            <tr className="bg-surface-muted">
              <th className="px-2 py-1.5 font-semibold text-ink-700 text-left border-b border-r border-surface-border min-w-[180px]">{q.row_header}</th>
              {q.columns.map((c) => (
                <th key={c.key} className={`px-2 py-1.5 font-semibold text-ink-700 text-center border-b border-r border-surface-border last:border-r-0 ${
                  c.kind === 'longtext' ? 'min-w-[220px]' : c.kind === 'text' ? 'min-w-[140px]' : 'min-w-[86px]'}`}>
                  {fillLabels(c.label, labels)}
                  {c.kind === 'computed' && <Calculator size={9} className="inline ml-1 text-ink-300" />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {q.rows.map((r) => {
              if (r.header) {
                return (
                  <tr key={r.key}><td colSpan={ncols} className="px-2 py-1 font-semibold text-ink-900 bg-brand-green/5 border-b border-surface-border">{r.label}</td></tr>
                )
              }
              const total = !!r.formula
              return (
                <tr key={r.key} className="border-b border-surface-border last:border-b-0">
                  <td className={`px-2 py-1 border-r border-surface-border ${total ? 'font-semibold text-ink-900' : 'text-ink-700'}`}>{r.label}</td>
                  {q.columns.map((c) => {
                    if (!total && isDerivedCell(q, c, r)) {
                      return (
                        <td key={c.key} title="From your annual data"
                          className={`px-2 py-1 text-right tabular-nums border-r border-surface-border last:border-r-0 bg-brand-green/5 ${stale ? 'text-ink-300' : 'text-ink-900'}`}>
                          {fmtNumber(computed?.[r.key]?.[c.key], displayFor(c, r))}
                        </td>
                      )
                    }
                    if (isComputedCell(c, r)) {
                      return (
                        <td key={c.key} title="Calculated automatically"
                          className={`px-2 py-1 text-right tabular-nums border-r border-surface-border last:border-r-0 bg-surface-muted/60 ${total ? 'font-semibold' : ''} ${stale ? 'text-ink-300' : 'text-ink-900'}`}>
                          {fmtNumber(computed?.[r.key]?.[c.key], displayFor(c, r))}
                        </td>
                      )
                    }
                    if (total) return <td key={c.key} className="px-2 py-1 border-r border-surface-border last:border-r-0 bg-surface-muted/60" />
                    return (
                      <td key={c.key} className="px-1 py-1 border-r border-surface-border last:border-r-0">
                        <Cell kind={c.kind} options={c.options} value={cells[r.key]?.[c.key]} onChange={(x) => set(r.key, c.key, x)} disabled={disabled} />
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[9px] text-ink-300 mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
        {q.derive && <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-brand-green/20" /> Green cells come from the annual data</span>}
        <span className="flex items-center gap-1"><Calculator size={9} /> Grey cells are calculated{q.unit ? ` · Unit: ${q.unit}` : ''}</span>
      </p>
    </div>
  )
}

function RowsAnswer({ q, value, onChange, disabled }) {
  const rows = value?.rows || []
  const setRows = (next) => onChange({ ...value, rows: next, none: next.length ? false : value?.none })
  return (
    <div>
      {rows.length > 0 && (
        <div className="overflow-x-auto border border-surface-border rounded-md mb-2">
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr className="bg-surface-muted">
                <th className="px-2 py-1.5 w-8 text-ink-500 border-b border-r border-surface-border">#</th>
                {q.columns.map((c) => (
                  <th key={c.key} className={`px-2 py-1.5 font-semibold text-ink-700 text-left border-b border-r border-surface-border ${
                    c.kind === 'longtext' ? 'min-w-[220px]' : c.kind === 'text' ? 'min-w-[150px]' : 'min-w-[90px]'}`}>{c.label}</th>
                ))}
                {!disabled && <th className="w-8 border-b border-surface-border" />}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-surface-border last:border-b-0">
                  <td className="px-2 py-1 text-ink-500 text-center border-r border-surface-border">{i + 1}</td>
                  {q.columns.map((c) => (
                    <td key={c.key} className="px-1 py-1 border-r border-surface-border">
                      <Cell kind={c.kind} options={c.options} value={row[c.key]} disabled={disabled}
                        onChange={(x) => setRows(rows.map((r, j) => (j === i ? { ...r, [c.key]: x } : r)))} />
                    </td>
                  ))}
                  {!disabled && (
                    <td className="px-1 text-center">
                      <button type="button" onClick={() => setRows(rows.filter((_, j) => j !== i))} className="text-ink-300 hover:text-status-pending" aria-label="Remove row">
                        <Trash2 size={12} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!disabled && (
        <div className="flex items-center gap-4">
          {(!q.max_rows || rows.length < q.max_rows) && (
            <button type="button" onClick={() => setRows([...rows, {}])} className="inline-flex items-center gap-1 text-[10px] font-medium text-brand-green hover:text-brand-greenDark">
              <Plus size={12} /> Add row
            </button>
          )}
          {q.min_rows === 0 && rows.length === 0 && (
            <label className="inline-flex items-center gap-1.5 text-[10px] text-ink-700">
              <input type="checkbox" checked={!!value?.none} onChange={(e) => onChange({ ...value, rows: [], none: e.target.checked })} className="accent-brand-green" />
              Nothing to report (prints as “Nil”)
            </label>
          )}
        </div>
      )}
      {disabled && rows.length === 0 && <p className="text-[10px] text-ink-500">{value?.none ? 'Nil' : '–'}</p>}
    </div>
  )
}

const PRINCIPLES = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9']

function GridAnswer({ q, value, onChange, disabled }) {
  const cells = value?.cells || {}
  const span = value?.span || {}
  const setCell = (rk, p, x) => onChange({ ...value, cells: { ...cells, [rk]: { ...(cells[rk] || {}), [p]: x } } })
  const setSpan = (rk, x) => onChange({ ...value, span: { ...span, [rk]: x } })
  const toggleSpan = (rk, on) => {
    const nextSpan = { ...span }
    const nextCells = { ...cells }
    if (on) { nextSpan[rk] = ''; delete nextCells[rk] } else { delete nextSpan[rk] }
    onChange({ ...value, span: nextSpan, cells: nextCells })
  }
  return (
    <div className="overflow-x-auto border border-surface-border rounded-md">
      <table className="w-full text-[10px] border-collapse">
        <thead>
          <tr className="bg-surface-muted">
            <th className="px-2 py-1.5 text-left font-semibold text-ink-700 border-b border-r border-surface-border min-w-[260px]">Disclosure question</th>
            {PRINCIPLES.map((p) => <th key={p} className="px-1 py-1.5 font-semibold text-ink-700 border-b border-r border-surface-border last:border-r-0 min-w-[84px]">{p}</th>)}
          </tr>
        </thead>
        <tbody>
          {q.grid_rows.map((g) => {
            const spanned = Object.prototype.hasOwnProperty.call(span, g.key)
            return (
              <tr key={g.key} className="border-b border-surface-border last:border-b-0 align-top">
                <td className="px-2 py-1.5 text-ink-700 border-r border-surface-border">
                  {g.label}
                  {g.span_allowed && !disabled && (
                    <label className="flex items-center gap-1 mt-1 text-[9px] text-ink-500">
                      <input type="checkbox" checked={spanned} onChange={(e) => toggleSpan(g.key, e.target.checked)} className="accent-brand-green" />
                      One answer for all principles
                    </label>
                  )}
                </td>
                {spanned ? (
                  <td colSpan={9} className="px-1 py-1">
                    <Cell kind={g.kind === 'text' ? 'text' : 'longtext'} value={span[g.key]} onChange={(x) => setSpan(g.key, x)} disabled={disabled} />
                  </td>
                ) : PRINCIPLES.map((p) => (
                  <td key={p} className="px-1 py-1 border-r border-surface-border last:border-r-0">
                    <Cell kind={g.kind === 'longtext' ? 'text' : g.kind} options={g.options} value={cells[g.key]?.[p]} onChange={(x) => setCell(g.key, p, x)} disabled={disabled} />
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const FILLABLE_KINDS = new Set(['count', 'number', 'amount'])

/** The short annual form for one data area: figures for the year, grouped,
 * with the previous year alongside when the client wants to add or correct
 * it (it is normally carried forward from last year's approved BRSR). */
function MetricsAnswer({ q, value, onChange, disabled, info, labels, fieldIssues }) {
  const values = value?.values || {}
  const py = value?.py || {}
  const [showPy, setShowPy] = useState(() => Object.keys(py).length > 0)
  const hidden = new Set(info?.hidden_groups || [])
  const missing = new Set(info?.missing_fields || [])
  const visible = q.groups.filter((_, i) => !hidden.has(i))
  const blanks = visible.flatMap((g) => g.fields).filter((f) => FILLABLE_KINDS.has(f.kind) && (values[f.key] ?? '') === '')

  const setV = (key, x) => onChange({ ...value, values: { ...values, [key]: x }, py })
  const setPy = (key, x) => onChange({ ...value, values, py: { ...py, [key]: x } })
  const fillZero = () => {
    const next = { ...values }
    for (const f of blanks) next[f.key] = '0'
    onChange({ ...value, values: next, py })
  }

  return (
    <div className="space-y-4 max-w-[860px]">
      <div className="flex flex-wrap items-center gap-4 text-[10px]">
        <label className="inline-flex items-center gap-1.5 text-ink-700">
          <input type="checkbox" checked={showPy} onChange={(e) => setShowPy(e.target.checked)} className="accent-brand-green" />
          Show {labels?.py || 'previous year'}
        </label>
        {!disabled && blanks.length > 0 && (
          <button type="button" onClick={fillZero} className="text-brand-green hover:text-brand-greenDark font-medium"
            title="Sets every empty number in this area to 0 — use when the rest genuinely do not apply">
            Fill {blanks.length} blank{blanks.length > 1 ? 's' : ''} with 0
          </button>
        )}
      </div>

      {q.groups.map((g, gi) => {
        if (hidden.has(gi)) {
          return (
            <p key={g.title} className="text-[9px] text-ink-300 italic">
              {g.title} — not asked: you reported no workers.
            </p>
          )
        }
        return (
          <div key={g.title}>
            <h4 className="text-[10px] font-semibold text-ink-900 mb-1">{g.title}</h4>
            {g.note && <p className="text-[9px] text-ink-500 mb-1.5">{g.note}</p>}
            <div className="border border-surface-border rounded-md divide-y divide-surface-border">
              <div className="hidden sm:grid grid-cols-[1fr_150px] md:grid-cols-[1fr_150px_150px] gap-2 px-2 py-1 bg-surface-muted text-[9px] font-semibold text-ink-500">
                <span>Figure</span>
                <span className="text-right">{labels?.cy || 'Current FY'}</span>
                {showPy && <span className="text-right hidden md:block">{labels?.py || 'Previous FY'}</span>}
              </div>
              {g.fields.map((f) => {
                const isMissing = missing.has(f.key)
                const errs = fieldIssues?.[f.key] || []
                return (
                  <div key={f.key} className={`px-2 py-1.5 ${isMissing ? 'bg-status-pending/5' : ''}`}>
                    <div className="grid sm:grid-cols-[1fr_150px] md:grid-cols-[1fr_150px_150px] gap-2 items-center">
                      <label htmlFor={`m-${f.key}`} className="text-[10px] text-ink-700">
                        {f.label}
                        {f.required && <span className="text-status-pending">*</span>}
                        {f.unit && <span className="text-ink-300"> · {f.unit}</span>}
                        {f.help && <span className="block text-[9px] text-ink-300">{f.help}</span>}
                      </label>
                      <div id={`m-${f.key}`}>
                        <Cell kind={f.kind} options={f.options} value={values[f.key]} onChange={(x) => setV(f.key, x)} disabled={disabled} />
                      </div>
                      {showPy && (
                        <div>
                          <span className="md:hidden text-[9px] text-ink-300">{labels?.py || 'Previous FY'}</span>
                          <Cell kind={f.kind} options={f.options} value={py[f.key]} onChange={(x) => setPy(f.key, x)} disabled={disabled} />
                        </div>
                      )}
                    </div>
                    {errs.map((i, n) => (
                      <p key={n} className={`mt-1 text-[9px] flex items-start gap-1 ${i.level === 'error' ? 'text-status-pending' : 'text-status-review'}`}>
                        <AlertCircle size={10} className="mt-px shrink-0" />{i.message}
                      </p>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const RENDERERS = {
  text: TextAnswer, yesno: YesNoAnswer, number: NumberAnswer, fields: FieldsAnswer,
  table: TableAnswer, rows: RowsAnswer, principle_grid: GridAnswer, metrics: MetricsAnswer,
}

// ---------------------------------------------------------------------------

export default function BrsrQuestion({
  q, value, info, comments, labels, editable, dirty, onChange, pushToast,
  reviewComment, onReviewComment, onShowHistory, areaTitles, onOpenSection,
}) {
  const [showNote, setShowNote] = useState(!!value?.note)
  const Renderer = RENDERERS[q.type]
  const fullyDerived = isFullyDerived(q)
  const isMetrics = q.type === 'metrics'
  const naAllowed = !fullyDerived && !isMetrics
  const na = naAllowed && !!value?.na
  const allIssues = info?.issues || []
  // Metric issues are shown beside their field; the rest under the question.
  const fieldIssues = {}
  const issues = []
  for (const i of allIssues) {
    const m = isMetrics && /^(values|py)\.(.+)$/.exec(i.path || '')
    if (m) (fieldIssues[m[2]] ||= []).push(i)
    else issues.push(i)
  }
  const hasError = allIssues.some((i) => i.level === 'error')
  const status = fullyDerived ? 'derived' : info?.answered ? 'answered' : info?.required ? 'required' : 'optional'
  const missingCount = info?.missing_fields?.length || 0

  return (
    <div id={`q-${q.id}`} className={`bg-white border rounded-lg p-4 ${hasError ? 'border-status-pending/40' : 'border-surface-border'}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2 min-w-0">
          {q.number && q.number !== '—' && (
            <span className="shrink-0 text-[10px] font-semibold text-brand-greenDark bg-brand-green/10 rounded px-1.5 py-0.5">{q.number}</span>
          )}
          <p className="text-[11px] font-medium text-ink-900 leading-snug">{fillLabels(q.prompt, labels)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {dirty && <span className="text-[9px] text-status-review">Unsaved</span>}
          {q.departments?.length > 0 && !isMetrics && (
            <span className="hidden md:inline text-[9px] text-ink-300 max-w-[160px] truncate" title={`Owner: ${q.departments.join(', ')}`}>
              {q.departments.join(' · ')}
            </span>
          )}
          <span className={`text-[9px] px-1.5 py-0.5 rounded ${
            status === 'answered' ? 'bg-status-approved/10 text-status-approved' : status === 'derived' ? 'bg-brand-green/10 text-brand-greenDark'
              : status === 'required' ? 'bg-ink-100 text-ink-500' : 'text-ink-300'}`}>
            {status === 'answered' ? 'Answered' : status === 'derived' ? 'Auto-filled' : status === 'required'
              ? (isMetrics && missingCount ? `${missingCount} to fill` : 'Required') : 'Optional'}
          </span>
          {onShowHistory && info?.revision && (
            <button type="button" onClick={() => onShowHistory(q.id)} title="Change history" className="text-ink-300 hover:text-ink-700"><History size={12} /></button>
          )}
        </div>
      </div>

      {q.guidance && <p className="text-[9px] text-ink-500 bg-surface-muted rounded px-2 py-1.5 mb-3">{q.guidance}</p>}

      {q.derived_from?.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] text-brand-greenDark bg-brand-green/5 rounded px-2 py-1.5 mb-3">
          <Database size={10} className="shrink-0" />
          <span>{fullyDerived ? 'Built automatically from' : 'Figures come from'} Annual data:</span>
          {q.derived_from.map((code) => (
            onOpenSection ? (
              <button key={code} type="button" onClick={() => onOpenSection(code)}
                className="inline-flex items-center gap-0.5 font-medium underline decoration-dotted hover:text-ink-900">
                {areaTitles?.[code] || code}<ArrowRight size={9} />
              </button>
            ) : <span key={code} className="font-medium">{areaTitles?.[code] || code}</span>
          ))}
          {!fullyDerived && <span className="text-ink-500">· the other columns are yours to fill</span>}
        </div>
      )}

      {comments?.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {comments.map((c) => (
            <div key={c.public_id} className="flex items-start gap-1.5 text-[10px] bg-status-review/10 text-ink-900 rounded px-2 py-1.5">
              <MessageSquare size={11} className="mt-px text-status-review shrink-0" />
              <span><span className="font-semibold">{c.author || 'Reviewer'}:</span> {c.body}</span>
            </div>
          ))}
        </div>
      )}

      {na ? (
        <div className="text-[10px] text-ink-700 bg-surface-muted rounded px-3 py-2">
          <span className="font-medium">Not applicable.</span>{' '}
          {editable ? (
            <input value={value?.na_reason ?? ''} onChange={(e) => onChange({ ...value, na_reason: e.target.value })} placeholder="Reason (required, printed in the report)" className={`${inputCls} mt-1.5`} />
          ) : (value?.na_reason || '')}
        </div>
      ) : (
        <Renderer q={q} value={value} onChange={onChange} disabled={!editable || fullyDerived} computed={info?.computed} stale={dirty}
          labels={labels} pushToast={pushToast} info={info} fieldIssues={fieldIssues} />
      )}

      <Issues issues={issues} />

      {(editable || value?.note) && (
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-surface-border">
          {editable && naAllowed && (
            <label className="inline-flex items-center gap-1.5 text-[10px] text-ink-500">
              <input type="checkbox" checked={na} onChange={(e) => onChange(e.target.checked ? { ...value, na: true } : { ...value, na: false, na_reason: undefined })} className="accent-brand-green" />
              Not applicable
            </label>
          )}
          {editable && !showNote && (
            <button type="button" onClick={() => setShowNote(true)} className="text-[10px] text-ink-500 hover:text-ink-900">+ Footnote</button>
          )}
        </div>
      )}
      {showNote && (
        <div className="mt-2">
          <label className="block text-[9px] text-ink-500 mb-1">Footnote (printed under this answer)</label>
          <input value={value?.note ?? ''} onChange={(e) => onChange({ ...value, note: e.target.value })} disabled={!editable} className={inputCls} />
        </div>
      )}

      {onReviewComment && (
        <div className="mt-3 pt-3 border-t border-dashed border-status-review/40">
          <label className="block text-[9px] text-status-review font-medium mb-1">Comment for the client on this question (sent with “Request changes”)</label>
          <textarea rows={2} value={reviewComment ?? ''} onChange={(e) => onReviewComment(q.id, e.target.value)} className={`${inputCls} resize-y`} />
        </div>
      )}
    </div>
  )
}
