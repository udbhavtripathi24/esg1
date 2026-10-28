/**
 * Survey rules shared by the builder and the respondent form. Mirrors
 * app/surveys/schema.py (visibility, answered, required) so the form reacts
 * instantly; the server re-checks everything on save and submit.
 */
import {
  AlignLeft, CalendarDays, CheckSquare, ChevronDownSquare, CircleDot, FileUp, Gauge, Grid3x3, Hash, Percent,
  SlidersHorizontal, ToggleLeft, Type, Text,
} from 'lucide-react'

export const OTHER = '__other__'

export const QUESTION_TYPES = [
  { type: 'single_choice', label: 'Single choice', icon: CircleDot, hint: 'Pick one option' },
  { type: 'multi_choice', label: 'Multiple choice', icon: CheckSquare, hint: 'Pick any number' },
  { type: 'dropdown', label: 'Dropdown', icon: ChevronDownSquare, hint: 'Pick one from a long list' },
  { type: 'yes_no', label: 'Yes / No', icon: ToggleLeft, hint: 'A simple yes or no' },
  { type: 'scale', label: 'Rating scale', icon: SlidersHorizontal, hint: '1–5, 1–10…' },
  { type: 'nps', label: 'Net Promoter Score', icon: Gauge, hint: '0–10 likelihood to recommend' },
  { type: 'matrix', label: 'Matrix / grid', icon: Grid3x3, hint: 'Rate several items on one scale' },
  { type: 'short_text', label: 'Short text', icon: Type, hint: 'A name, a word, a line' },
  { type: 'long_text', label: 'Paragraph', icon: AlignLeft, hint: 'An explanation' },
  { type: 'number', label: 'Number', icon: Hash, hint: 'With optional unit and limits' },
  { type: 'percent', label: 'Percentage', icon: Percent, hint: '0–100 %' },
  { type: 'date', label: 'Date', icon: CalendarDays, hint: 'A calendar date' },
  { type: 'file', label: 'File upload', icon: FileUp, hint: 'Policies, certificates, evidence' },
  { type: 'statement', label: 'Text block', icon: Text, hint: 'Instructions between questions' },
]
export const TYPE_BY_KEY = Object.fromEntries(QUESTION_TYPES.map((t) => [t.type, t]))

export const OPTION_TYPES = new Set(['single_choice', 'multi_choice', 'dropdown', 'yes_no'])
export const CHOICE_TYPES = new Set(['single_choice', 'dropdown', 'yes_no'])
export const NUMERIC_TYPES = new Set(['scale', 'nps', 'number', 'percent'])

export const OPS_BY_TYPE = {
  single_choice: ['equals', 'not_equals', 'answered', 'not_answered'],
  dropdown: ['equals', 'not_equals', 'answered', 'not_answered'],
  yes_no: ['equals', 'not_equals', 'answered', 'not_answered'],
  multi_choice: ['includes', 'excludes', 'answered', 'not_answered'],
  scale: ['equals', 'not_equals', 'gte', 'lte', 'answered', 'not_answered'],
  nps: ['equals', 'not_equals', 'gte', 'lte', 'answered', 'not_answered'],
  number: ['equals', 'not_equals', 'gte', 'lte', 'answered', 'not_answered'],
  percent: ['equals', 'not_equals', 'gte', 'lte', 'answered', 'not_answered'],
  short_text: ['answered', 'not_answered'],
  long_text: ['answered', 'not_answered'],
  date: ['answered', 'not_answered'],
  matrix: ['answered', 'not_answered'],
  file: ['answered', 'not_answered'],
}
export const OP_LABELS = {
  equals: 'is', not_equals: 'is not', includes: 'includes', excludes: "doesn't include",
  gte: 'is at least', lte: 'is at most', answered: 'is answered', not_answered: 'is not answered',
}
export const VALUE_OPS = new Set(['equals', 'not_equals', 'includes', 'excludes', 'gte', 'lte'])

export function* iterQuestions(defn) {
  for (const s of defn?.sections || []) for (const q of s.questions || []) yield [s, q]
}

export function questionsById(defn) {
  const out = {}
  for (const [, q] of iterQuestions(defn)) out[q.id] = q
  return out
}

export function isAnswered(v) {
  if (v === null || v === undefined) return false
  if (typeof v === 'string') return v.trim() !== ''
  if (Array.isArray(v)) return v.length > 0
  if (typeof v === 'object') return Object.keys(v).length > 0
  return true
}

function ruleHolds(rule, answers, visible) {
  const v = visible[rule.question] ? answers[rule.question] : undefined
  switch (rule.op) {
    case 'answered': return isAnswered(v)
    case 'not_answered': return !isAnswered(v)
    default: break
  }
  if (v === undefined || v === null || v === '') return false
  const t = rule.value
  switch (rule.op) {
    case 'includes': return Array.isArray(v) && v.includes(t)
    case 'excludes': return Array.isArray(v) && !v.includes(t)
    case 'equals': return v === t || (typeof v === 'number' && Number(t) === v)
    case 'not_equals': return !(v === t || (typeof v === 'number' && Number(t) === v))
    case 'gte': return typeof v === 'number' && v >= Number(t)
    case 'lte': return typeof v === 'number' && v <= Number(t)
    default: return true
  }
}

function condHolds(cond, answers, visible) {
  if (!cond?.rules?.length) return true
  const results = cond.rules.map((r) => ruleHolds(r, answers, visible))
  return cond.match === 'any' ? results.some(Boolean) : results.every(Boolean)
}

/** question id → shown? (a rule about a hidden question sees no answer) */
export function visibility(defn, answers) {
  const visible = {}
  for (const s of defn?.sections || []) {
    const on = condHolds(s.show_if, answers, visible)
    for (const q of s.questions || []) visible[q.id] = on && condHolds(q.show_if, answers, visible)
  }
  return visible
}

export function sectionVisible(defn, sectionId, answers) {
  const vis = visibility(defn, answers)
  const s = defn.sections.find((x) => x.id === sectionId)
  return (s?.questions || []).some((q) => vis[q.id])
}

export function progress(defn, answers) {
  const vis = visibility(defn, answers)
  let total = 0
  let done = 0
  for (const [, q] of iterQuestions(defn)) {
    if (q.type === 'statement' || !vis[q.id]) continue
    total += 1
    if (isAnswered(answers[q.id])) done += 1
  }
  return { answered: done, total, percent: total ? Math.round((100 * done) / total) : 0 }
}

/** Client-side required check for the questions on one page. */
export function missingRequired(questions, answers, visible) {
  const errors = {}
  for (const q of questions) {
    if (q.type === 'statement' || !visible[q.id] || !q.required) continue
    const v = answers[q.id]
    if (!isAnswered(v)) errors[q.id] = 'This question needs an answer'
    else if (q.type === 'matrix' && Object.keys(v).length < q.rows.length) errors[q.id] = 'Answer every row'
    else if ((v === OTHER || (Array.isArray(v) && v.includes(OTHER))) && !String(answers[`${q.id}.other`] || '').trim())
      errors[q.id] = "Please say what 'Other' is"
  }
  return errors
}

// ---- Builder helpers ---------------------------------------------------------

export function newId(prefix, taken) {
  for (let i = 0; i < 1000; i += 1) {
    const id = `${prefix}${Math.random().toString(36).slice(2, 7)}`
    if (!taken.has(id)) return id
  }
  return `${prefix}${Date.now()}`
}

export function allIds(defn) {
  const ids = new Set()
  for (const s of defn.sections) {
    ids.add(s.id)
    for (const q of s.questions) ids.add(q.id)
  }
  return ids
}

export function blankQuestion(type, taken, assessment) {
  const id = newId('q', taken)
  const q = { id, type, title: '', help: '', required: type !== 'statement' && type !== 'file' }
  const opt = (label, score) => ({ id: newId('o', taken), label, ...(assessment && score !== undefined ? { score } : {}) })
  if (type === 'single_choice' || type === 'dropdown') q.options = [opt('Option 1', 0), opt('Option 2', 1)]
  if (type === 'multi_choice') q.options = [opt('Option 1', 1), opt('Option 2', 1)]
  if (type === 'yes_no') q.options = [{ id: 'yes', label: 'Yes', ...(assessment ? { score: 1 } : {}) },
    { id: 'no', label: 'No', ...(assessment ? { score: 0 } : {}) }]
  if (type === 'scale') Object.assign(q, { min: 1, max: 5, min_label: '', max_label: '' })
  if (type === 'nps') Object.assign(q, { min_label: 'Not at all likely', max_label: 'Extremely likely' })
  if (type === 'percent') Object.assign(q, { min: 0, max: 100 })
  if (type === 'number') Object.assign(q, { min: null, max: null, unit: '' })
  if (type === 'matrix') {
    q.rows = [{ id: newId('r', taken), label: 'Row 1' }, { id: newId('r', taken), label: 'Row 2' }]
    q.columns = ['Poor', 'Fair', 'Good'].map((l, i) => ({ id: newId('c', taken), label: l, ...(assessment ? { score: i } : {}) }))
  }
  if (type === 'file') q.max_files = 3
  return q
}

/** Re-ids a copied question so ids stay unique. */
export function cloneQuestion(q, taken) {
  const c = JSON.parse(JSON.stringify(q))
  c.id = newId('q', taken)
  for (const part of ['options', 'rows', 'columns']) {
    if (c[part] && c.type !== 'yes_no') c[part] = c[part].map((o) => ({ ...o, id: newId(part[0], taken) }))
  }
  delete c.show_if
  return c
}

export function questionMax(q) {
  const scores = (list) => (list || []).filter((o) => typeof o.score === 'number' && !o.na).map((o) => o.score)
  if (CHOICE_TYPES.has(q.type)) return Math.max(0, ...scores(q.options))
  if (q.type === 'multi_choice') return scores(q.options).filter((s) => s > 0).reduce((a, b) => a + b, 0)
  if (q.type === 'scale') return q.scored === false ? 0 : q.max - q.min
  if (q.type === 'matrix') return Math.max(0, ...scores(q.columns)) * (q.rows?.length || 0)
  return 0
}

/** Questions a rule in `targetId` may refer to: answerable ones that come before it. */
export function earlierQuestions(defn, targetId, { sectionLevel = false } = {}) {
  const out = []
  for (const s of defn.sections) {
    if (sectionLevel && s.id === targetId) return out
    for (const q of s.questions) {
      if (!sectionLevel && q.id === targetId) return out
      if (q.type !== 'statement') out.push(q)
    }
  }
  return out
}

/** Readable sentence for a condition, e.g. "Shown when “Policy?” is No". */
export function describeCondition(cond, defn) {
  if (!cond?.rules?.length) return null
  const qs = questionsById(defn)
  const parts = cond.rules.map((r) => {
    const q = qs[r.question]
    const name = q?.title ? `“${truncate(q.title, 40)}”` : 'an earlier question'
    let val = ''
    if (VALUE_OPS.has(r.op)) {
      const o = q?.options?.find((x) => x.id === r.value)
      val = ` ${o ? o.label : r.value === OTHER ? 'Other' : r.value}`
    }
    return `${name} ${OP_LABELS[r.op]}${val}`
  })
  return parts.join(cond.match === 'any' ? ' or ' : ' and ')
}

export function truncate(s, n) {
  s = String(s || '')
  return s.length > n ? `${s.slice(0, n - 1)}…` : s
}

export const STATUS_META = {
  draft: { label: 'Draft', cls: 'bg-ink-100 text-ink-700' },
  scheduled: { label: 'Scheduled', cls: 'bg-blue-100 text-blue-700' },
  open: { label: 'Open', cls: 'bg-brand-green/15 text-brand-greenDark' },
  closed: { label: 'Closed', cls: 'bg-amber-100 text-amber-700' },
  archived: { label: 'Archived', cls: 'bg-ink-100 text-ink-500' },
  template: { label: 'Template', cls: 'bg-purple-100 text-purple-700' },
}

export function fmtDate(v, withTime = false) {
  if (!v) return '—'
  const d = new Date(typeof v === 'string' && !/[zZ]|[+-]\d\d:\d\d$/.test(v) ? `${v}Z` : v)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, withTime
    ? { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'short', year: 'numeric' })
}

export function errText(err, fallback) {
  return err?.message || fallback
}
