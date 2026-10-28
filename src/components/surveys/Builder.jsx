import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle, ArrowDown, ArrowUp, ChevronDown, ChevronRight, Copy, GitBranch, ListPlus, Lock, Plus, Trash2, X,
} from 'lucide-react'
import {
  CHOICE_TYPES, OPS_BY_TYPE, OP_LABELS, OPTION_TYPES, OTHER, QUESTION_TYPES, TYPE_BY_KEY, VALUE_OPS, allIds,
  blankQuestion, cloneQuestion, describeCondition, earlierQuestions, newId, questionMax, truncate,
} from './logic.js'
import { Label, Toggle } from './parts.jsx'
import { inputCls } from './util.js'

/**
 * The question builder. Edits a local copy of the definition and hands every
 * change to `onChange` (the workspace autosaves it). When the survey already
 * has responses, questions/options/rows/columns that existed are `locked`:
 * they can be reworded and re-scored but not removed or retyped.
 */
export default function Builder({ defn, onChange, assessment, locked, readOnly }) {
  const [open, setOpen] = useState(() => new Set())
  const taken = useMemo(() => allIds(defn), [defn])

  const lockedIds = locked // Set of ids that existing answers depend on, or null
  const isLocked = (id) => !!lockedIds?.has(id)

  const update = (fn) => {
    if (readOnly) return
    const next = JSON.parse(JSON.stringify(defn))
    fn(next)
    onChange(next)
  }

  const toggle = (id) => setOpen((prev) => {
    const n = new Set(prev)
    if (n.has(id)) n.delete(id); else n.add(id)
    return n
  })

  const addQuestion = (sIdx, type, at) => {
    const q = blankQuestion(type, taken, assessment)
    update((d) => {
      const list = d.sections[sIdx].questions
      list.splice(at ?? list.length, 0, q)
    })
    setOpen((prev) => new Set(prev).add(q.id))
    setTimeout(() => document.getElementById(`bq-${q.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
  }

  const addSection = () => {
    const id = newId('s', taken)
    update((d) => { d.sections.push({ id, title: `Section ${d.sections.length + 1}`, description: '', questions: [] }) })
    setTimeout(() => document.getElementById(`bs-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const moveQuestion = (sIdx, qIdx, dir) => update((d) => {
    const flat = d.sections.flatMap((s, si) => s.questions.map((q, qi) => [si, qi]))
    const pos = flat.findIndex(([si, qi]) => si === sIdx && qi === qIdx)
    const target = pos + dir
    if (target < 0 || target >= flat.length) {
      // Past the edge of the survey: nothing to do
      return
    }
    const [q] = d.sections[sIdx].questions.splice(qIdx, 1)
    if (flat[target][0] === sIdx) {
      d.sections[sIdx].questions.splice(qIdx + dir, 0, q)
    } else if (dir > 0) {
      d.sections[sIdx + 1].questions.unshift(q)
    } else {
      d.sections[sIdx - 1].questions.push(q)
    }
    dropBrokenLogic(d)
  })

  const total = defn.sections.reduce((n, s) => n + s.questions.filter((q) => q.type !== 'statement').length, 0)
  let number = 0

  return (
    <div className="grid lg:grid-cols-[220px_1fr] gap-5 items-start">
      <Outline defn={defn} />
      <div className="space-y-5 min-w-0">
        {lockedIds && (
          <div className="flex gap-2 items-start text-[11px] text-ink-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2.5">
            <Lock size={14} className="text-amber-600 mt-0.5 shrink-0" />
            <span>
              This survey already has responses. You can reword questions, add new ones and change logic and scoring
              (responses are re-scored), but questions and answer choices people have used can’t be deleted or change type.
            </span>
          </div>
        )}
        {defn.sections.map((s, sIdx) => (
          <section key={s.id} id={`bs-${s.id}`} className="bg-white border border-surface-border rounded-lg scroll-mt-4">
            <SectionHeader s={s} sIdx={sIdx} defn={defn} update={update} assessment={assessment} readOnly={readOnly}
              canDelete={!s.questions.some((q) => isLocked(q.id)) && defn.sections.length > 1} count={defn.sections.length} />
            <div className="px-4 pb-4 space-y-2.5">
              {s.questions.length === 0 && (
                <p className="text-[11px] text-ink-300 py-3 text-center border border-dashed border-surface-border rounded-md">No questions in this section yet.</p>
              )}
              {s.questions.map((q, qIdx) => {
                if (q.type !== 'statement') number += 1
                return (
                  <QuestionCard key={q.id} q={q} n={q.type === 'statement' ? null : number} sIdx={sIdx} qIdx={qIdx}
                    defn={defn} update={update} assessment={assessment} open={open.has(q.id)} onToggle={() => toggle(q.id)}
                    locked={isLocked(q.id)} isLocked={isLocked} readOnly={readOnly} taken={taken}
                    onMove={(dir) => moveQuestion(sIdx, qIdx, dir)}
                    onDuplicate={() => {
                      const c = cloneQuestion(q, taken)
                      update((d) => d.sections[sIdx].questions.splice(qIdx + 1, 0, c))
                      setOpen((prev) => new Set(prev).add(c.id))
                    }}
                    first={sIdx === 0 && qIdx === 0}
                    last={sIdx === defn.sections.length - 1 && qIdx === s.questions.length - 1} />
                )
              })}
              {!readOnly && <AddQuestion onAdd={(type) => addQuestion(sIdx, type)} />}
            </div>
          </section>
        ))}
        {!readOnly && (
          <button type="button" onClick={addSection}
            className="w-full py-3 rounded-lg border border-dashed border-ink-300 text-[11px] text-ink-500 hover:border-brand-green hover:text-brand-greenDark inline-flex items-center justify-center gap-1.5">
            <ListPlus size={14} /> Add section
          </button>
        )}
        {assessment && <BandsEditor defn={defn} update={update} readOnly={readOnly} />}
        <p className="text-[10px] text-ink-300 text-center">{total} question{total === 1 ? '' : 's'} · {defn.sections.length} section{defn.sections.length === 1 ? '' : 's'}</p>
      </div>
    </div>
  )
}

/** After a move, a rule may point at a question that now comes later: drop it. */
function dropBrokenLogic(d) {
  const seen = new Set()
  for (const s of d.sections) {
    if (s.show_if?.rules) s.show_if.rules = s.show_if.rules.filter((r) => seen.has(r.question))
    if (s.show_if && !s.show_if.rules.length) delete s.show_if
    for (const q of s.questions) {
      if (q.show_if?.rules) q.show_if.rules = q.show_if.rules.filter((r) => seen.has(r.question))
      if (q.show_if && !q.show_if.rules.length) delete q.show_if
      if (q.type !== 'statement') seen.add(q.id)
    }
  }
}

function Outline({ defn }) {
  return (
    <nav className="hidden lg:block sticky top-4 bg-white border border-surface-border rounded-lg p-3 max-h-[80vh] overflow-y-auto" aria-label="Survey outline">
      <p className="text-[10px] font-semibold text-ink-500 uppercase tracking-wide mb-2">Outline</p>
      <ol className="space-y-2.5">
        {defn.sections.map((s, i) => (
          <li key={s.id}>
            <button type="button" className="text-left text-[11px] font-medium text-ink-900 hover:text-brand-greenDark"
              onClick={() => document.getElementById(`bs-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
              {i + 1}. {truncate(s.title || 'Untitled section', 28)}
            </button>
            <ul className="mt-1 space-y-0.5 border-l border-surface-border ml-1 pl-2">
              {s.questions.map((q) => {
                const T = TYPE_BY_KEY[q.type]?.icon
                return (
                  <li key={q.id}>
                    <button type="button" className="w-full flex items-center gap-1.5 text-left text-[10px] text-ink-500 hover:text-ink-900 py-0.5"
                      onClick={() => document.getElementById(`bq-${q.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
                      {T && <T size={11} className="shrink-0 text-ink-300" />}
                      <span className="truncate">{q.title || <em className="text-ink-300">Untitled</em>}</span>
                      {q.show_if && <GitBranch size={10} className="shrink-0 text-blue-500" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
      </ol>
    </nav>
  )
}

function SectionHeader({ s, sIdx, defn, update, assessment, readOnly, canDelete, count }) {
  const [logic, setLogic] = useState(!!s.show_if)
  const prior = earlierQuestions(defn, s.id, { sectionLevel: true })
  return (
    <div className="px-4 pt-4 pb-3 border-b border-surface-border mb-3">
      <div className="flex items-start gap-2">
        <span className="text-[10px] font-semibold text-ink-300 mt-2 w-5 shrink-0">{sIdx + 1}</span>
        <div className="flex-1 min-w-0 space-y-1.5">
          <input className={`${inputCls} !text-[13px] font-semibold !border-transparent hover:!border-surface-border focus:!border-brand-green`}
            value={s.title} placeholder="Section title" disabled={readOnly} aria-label="Section title"
            onChange={(e) => update((d) => { d.sections[sIdx].title = e.target.value })} />
          <textarea className={`${inputCls} !border-transparent hover:!border-surface-border focus:!border-brand-green resize-none`} rows={1}
            value={s.description || ''} placeholder="Description (optional)" disabled={readOnly} aria-label="Section description"
            onChange={(e) => update((d) => { d.sections[sIdx].description = e.target.value })} />
        </div>
        {!readOnly && (
          <div className="flex items-center gap-0.5 shrink-0 mt-1">
            {assessment && (
              <label className="flex items-center gap-1 text-[10px] text-ink-500 mr-2" title="How much this section counts in the total score">
                Weight
                <input type="number" min={0} max={100} step="0.5" className={`${inputCls} !w-14`} value={s.weight ?? 1}
                  onChange={(e) => update((d) => { d.sections[sIdx].weight = e.target.value === '' ? 1 : Number(e.target.value) })} />
              </label>
            )}
            <IconBtn title="Show only if…" active={!!s.show_if} onClick={() => setLogic((v) => !v)} disabled={sIdx === 0}><GitBranch size={13} /></IconBtn>
            <IconBtn title="Move section up" disabled={sIdx === 0} onClick={() => update((d) => { swap(d.sections, sIdx, sIdx - 1); dropBrokenLogic(d) })}><ArrowUp size={13} /></IconBtn>
            <IconBtn title="Move section down" disabled={sIdx === count - 1} onClick={() => update((d) => { swap(d.sections, sIdx, sIdx + 1); dropBrokenLogic(d) })}><ArrowDown size={13} /></IconBtn>
            <IconBtn title={canDelete ? 'Delete section' : 'This section can’t be deleted'} disabled={!canDelete} danger
              onClick={() => {
                if (s.questions.length && !window.confirm(`Delete “${s.title || 'this section'}” and its ${s.questions.length} question(s)?`)) return
                update((d) => { d.sections.splice(sIdx, 1); dropBrokenLogic(d) })
              }}><Trash2 size={13} /></IconBtn>
          </div>
        )}
      </div>
      {(logic || s.show_if) && sIdx > 0 && (
        <div className="ml-7 mt-2">
          <LogicEditor cond={s.show_if} prior={prior} readOnly={readOnly} what="this section"
            onChange={(c) => update((d) => { if (c) d.sections[sIdx].show_if = c; else delete d.sections[sIdx].show_if })} />
        </div>
      )}
    </div>
  )
}

function swap(arr, i, j) { [arr[i], arr[j]] = [arr[j], arr[i]] }

function IconBtn({ children, title, onClick, disabled, danger, active }) {
  return (
    <button type="button" title={title} aria-label={title} onClick={onClick} disabled={disabled}
      className={`p-1.5 rounded-md disabled:opacity-30 disabled:cursor-not-allowed ${active ? 'text-blue-600 bg-blue-50' : 'text-ink-500'} ${
        danger ? 'hover:text-status-pending hover:bg-red-50' : 'hover:text-ink-900 hover:bg-surface-muted'}`}>
      {children}
    </button>
  )
}

function AddQuestion({ onAdd }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium text-brand-greenDark hover:bg-brand-green/10">
        <Plus size={14} /> Add question
      </button>
      {open && (
        <div className="absolute z-20 mt-1 left-0 w-[340px] max-w-[90vw] bg-white border border-surface-border rounded-lg shadow-lg p-1.5 grid grid-cols-2 gap-0.5">
          {QUESTION_TYPES.map((t) => (
            <button key={t.type} type="button" onClick={() => { onAdd(t.type); setOpen(false) }}
              className="flex items-start gap-2 text-left px-2 py-1.5 rounded-md hover:bg-surface-muted">
              <t.icon size={14} className="text-brand-greenDark mt-0.5 shrink-0" />
              <span>
                <span className="block text-[11px] text-ink-900">{t.label}</span>
                <span className="block text-[9px] text-ink-500">{t.hint}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function QuestionCard({ q, n, sIdx, qIdx, defn, update, assessment, open, onToggle, locked, isLocked, readOnly, onMove, onDuplicate, first, last }) {
  const T = TYPE_BY_KEY[q.type]
  const set = (fn) => update((d) => fn(d.sections[sIdx].questions[qIdx]))
  const max = assessment ? questionMax(q) : 0
  const cond = describeCondition(q.show_if, defn)
  const prior = earlierQuestions(defn, q.id)

  const changeType = (type) => set((x) => {
    const fresh = blankQuestion(type, allIds(defn), assessment)
    const keep = { id: x.id, title: x.title, help: x.help, required: type === 'statement' ? undefined : x.required, show_if: x.show_if }
    if (OPTION_TYPES.has(type) && OPTION_TYPES.has(x.type) && type !== 'yes_no' && x.type !== 'yes_no') fresh.options = x.options
    Object.keys(x).forEach((k) => delete x[k])
    Object.assign(x, fresh, keep)
    if (x.required === undefined) delete x.required
    if (!x.show_if) delete x.show_if
  })

  return (
    <div id={`bq-${q.id}`} className={`border rounded-md scroll-mt-4 ${open ? 'border-brand-green/60 shadow-sm' : 'border-surface-border hover:border-ink-300'}`}>
      <button type="button" onClick={onToggle} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left" aria-expanded={open}>
        {open ? <ChevronDown size={14} className="text-ink-300 shrink-0" /> : <ChevronRight size={14} className="text-ink-300 shrink-0" />}
        <span className="text-[10px] text-ink-300 w-5 shrink-0">{n ?? ''}</span>
        {T && <T.icon size={14} className="text-brand-greenDark shrink-0" />}
        <span className={`flex-1 text-[12px] truncate ${q.title ? 'text-ink-900' : 'text-ink-300 italic'}`}>{q.title || (q.type === 'statement' ? 'Text block' : 'Untitled question')}</span>
        {cond && <span className="hidden sm:inline-flex items-center gap-1 text-[9px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded max-w-[220px]" title={`Shown when ${cond}`}><GitBranch size={10} /> <span className="truncate">{cond}</span></span>}
        {q.required && <span className="text-[9px] text-ink-500 bg-surface-muted px-1.5 py-0.5 rounded">Required</span>}
        {assessment && max > 0 && <span className="text-[9px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">{fmtNum(max)} pts{q.weight !== undefined && q.weight !== 1 ? ` · ×${q.weight}` : ''}</span>}
        {locked && <Lock size={11} className="text-amber-600 shrink-0" title="Has responses" />}
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 border-t border-surface-border space-y-3">
          <div className="grid sm:grid-cols-[1fr_190px] gap-3 pt-2">
            <div>
              <Label>{q.type === 'statement' ? 'Text' : 'Question'}</Label>
              <textarea className={`${inputCls} resize-y`} rows={q.type === 'statement' ? 3 : 2} value={q.title} disabled={readOnly}
                placeholder={q.type === 'statement' ? 'Instructions or context shown between questions' : 'Type the question'}
                onChange={(e) => set((x) => { x.title = e.target.value })} autoFocus={!q.title} />
            </div>
            <div>
              <Label>Type</Label>
              <select className={inputCls} value={q.type} disabled={readOnly || locked} onChange={(e) => changeType(e.target.value)}
                title={locked ? 'Questions with responses can’t change type' : undefined}>
                {QUESTION_TYPES.map((t) => <option key={t.type} value={t.type}>{t.label}</option>)}
              </select>
            </div>
          </div>
          {q.type !== 'statement' && (
            <div>
              <Label hint="optional">Help text</Label>
              <input className={inputCls} value={q.help || ''} disabled={readOnly} placeholder="Explain what you mean, give an example…"
                onChange={(e) => set((x) => { x.help = e.target.value })} />
            </div>
          )}

          <TypeSettings q={q} set={set} assessment={assessment} readOnly={readOnly} isLocked={isLocked} />

          {q.show_if && (
            <LogicEditor cond={q.show_if} prior={prior} readOnly={readOnly} what="this question"
              onChange={(c) => set((x) => { if (c) x.show_if = c; else delete x.show_if })} />
          )}

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 border-t border-surface-border">
            {q.type !== 'statement' && (
              <Toggle checked={!!q.required} disabled={readOnly} onChange={(v) => set((x) => { x.required = v })} label="Required" />
            )}
            {assessment && max > 0 && (
              <label className="flex items-center gap-1.5 text-[10px] text-ink-500" title="How much this question counts within its section">
                Weight
                <input type="number" min={0} max={100} step="0.5" className={`${inputCls} !w-14`} value={q.weight ?? 1} disabled={readOnly}
                  onChange={(e) => set((x) => { if (e.target.value === '' || Number(e.target.value) === 1) delete x.weight; else x.weight = Number(e.target.value) })} />
              </label>
            )}
            <div className="flex items-center gap-0.5 ml-auto">
              {!q.show_if ? (
                <IconBtn title={prior.length ? 'Show only if…' : 'Logic needs an earlier question'} disabled={readOnly || !prior.length}
                  onClick={() => set((x) => { x.show_if = { match: 'all', rules: [] } })}><GitBranch size={13} /></IconBtn>
              ) : null}
              <IconBtn title="Duplicate" disabled={readOnly} onClick={onDuplicate}><Copy size={13} /></IconBtn>
              <IconBtn title="Move up" disabled={readOnly || first} onClick={() => onMove(-1)}><ArrowUp size={13} /></IconBtn>
              <IconBtn title="Move down" disabled={readOnly || last} onClick={() => onMove(1)}><ArrowDown size={13} /></IconBtn>
              <IconBtn title={locked ? 'Questions with responses can’t be deleted' : 'Delete'} danger disabled={readOnly || locked}
                onClick={() => update((d) => { d.sections[sIdx].questions.splice(qIdx, 1); dropBrokenLogic(d) })}><Trash2 size={13} /></IconBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function fmtNum(n) { return Number.isInteger(n) ? n : n.toFixed(1) }

function TypeSettings({ q, set, assessment, readOnly, isLocked }) {
  const num = (v) => (v === '' || v === null || v === undefined ? null : Number(v))
  if (OPTION_TYPES.has(q.type)) {
    return (
      <div>
        <OptionsEditor list={q.options || []} readOnly={readOnly} isLocked={isLocked} scored={assessment}
          fixed={q.type === 'yes_no'} allowNa={assessment && q.type !== 'multi_choice'} allowExclusive={q.type === 'multi_choice'}
          onChange={(opts) => set((x) => { x.options = opts })} itemName="option" />
        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-2.5">
          {(q.type === 'single_choice' || q.type === 'multi_choice') && (
            <Toggle checked={!!q.allow_other} disabled={readOnly} onChange={(v) => set((x) => { if (v) x.allow_other = true; else delete x.allow_other })}
              label="Add “Other” with a text box" />
          )}
          {q.type === 'multi_choice' && (
            <div className="flex items-center gap-2 text-[10px] text-ink-500">
              Choose at least
              <input type="number" min={0} className={`${inputCls} !w-14`} value={q.min_select ?? ''} disabled={readOnly}
                onChange={(e) => set((x) => { if (e.target.value === '') delete x.min_select; else x.min_select = Number(e.target.value) })} />
              and at most
              <input type="number" min={1} className={`${inputCls} !w-14`} value={q.max_select ?? ''} disabled={readOnly}
                onChange={(e) => set((x) => { if (e.target.value === '') delete x.max_select; else x.max_select = Number(e.target.value) })} />
            </div>
          )}
        </div>
        {assessment && q.type === 'multi_choice' && <p className="text-[10px] text-ink-300 mt-1.5">Points of every chosen option are added up, to at most the total of all options.</p>}
      </div>
    )
  }
  if (q.type === 'scale') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div><Label>From</Label>
          <select className={inputCls} value={q.min} disabled={readOnly || isLocked(q.id)} onChange={(e) => set((x) => { x.min = Number(e.target.value) })}>
            <option value={0}>0</option><option value={1}>1</option></select></div>
        <div><Label>To</Label>
          <select className={inputCls} value={q.max} disabled={readOnly || isLocked(q.id)} onChange={(e) => set((x) => { x.max = Number(e.target.value) })}>
            {[2, 3, 4, 5, 6, 7, 8, 9, 10].filter((v) => v > q.min).map((v) => <option key={v} value={v}>{v}</option>)}</select></div>
        <div><Label>Label at {q.min}</Label><input className={inputCls} value={q.min_label || ''} disabled={readOnly} placeholder="e.g. Poor" onChange={(e) => set((x) => { x.min_label = e.target.value })} /></div>
        <div><Label>Label at {q.max}</Label><input className={inputCls} value={q.max_label || ''} disabled={readOnly} placeholder="e.g. Excellent" onChange={(e) => set((x) => { x.max_label = e.target.value })} /></div>
        {assessment && (
          <div className="col-span-full">
            <Toggle checked={q.scored !== false} disabled={readOnly} onChange={(v) => set((x) => { if (v) delete x.scored; else x.scored = false })}
              label="Counts towards the score" hint={`${q.min} earns 0 points, ${q.max} earns ${q.max - q.min}.`} />
          </div>
        )}
      </div>
    )
  }
  if (q.type === 'nps') {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Label at 0</Label><input className={inputCls} value={q.min_label || ''} disabled={readOnly} onChange={(e) => set((x) => { x.min_label = e.target.value })} /></div>
        <div><Label>Label at 10</Label><input className={inputCls} value={q.max_label || ''} disabled={readOnly} onChange={(e) => set((x) => { x.max_label = e.target.value })} /></div>
        <p className="col-span-full text-[10px] text-ink-300">Results show the Net Promoter Score: % answering 9–10 minus % answering 0–6.</p>
      </div>
    )
  }
  if (q.type === 'number' || q.type === 'percent') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div><Label hint="optional">Minimum</Label><input type="number" className={inputCls} value={q.min ?? ''} disabled={readOnly} onChange={(e) => set((x) => { x.min = num(e.target.value) })} /></div>
        <div><Label hint="optional">Maximum</Label><input type="number" className={inputCls} value={q.max ?? ''} disabled={readOnly} onChange={(e) => set((x) => { x.max = num(e.target.value) })} /></div>
        {q.type === 'number' && (
          <>
            <div><Label hint="optional">Unit</Label><input className={inputCls} value={q.unit || ''} disabled={readOnly} placeholder="kWh, people, ₹ lakh…" onChange={(e) => set((x) => { x.unit = e.target.value })} /></div>
            <div className="flex items-end pb-1"><Toggle checked={!!q.integer} disabled={readOnly} onChange={(v) => set((x) => { if (v) x.integer = true; else delete x.integer })} label="Whole numbers" /></div>
          </>
        )}
      </div>
    )
  }
  if (q.type === 'short_text' || q.type === 'long_text') {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div><Label hint="optional">Placeholder</Label><input className={inputCls} value={q.placeholder || ''} disabled={readOnly} onChange={(e) => set((x) => { x.placeholder = e.target.value })} /></div>
        <div><Label hint="characters">Maximum length</Label><input type="number" min={1} className={inputCls} value={q.max_length ?? ''} disabled={readOnly}
          placeholder={q.type === 'short_text' ? '500' : '10000'} onChange={(e) => set((x) => { if (e.target.value === '') delete x.max_length; else x.max_length = Number(e.target.value) })} /></div>
      </div>
    )
  }
  if (q.type === 'matrix') {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>Rows (the items rated)</Label>
          <OptionsEditor list={q.rows || []} readOnly={readOnly} isLocked={isLocked} itemName="row" idPrefix="r"
            onChange={(rows) => set((x) => { x.rows = rows })} />
        </div>
        <div>
          <Label>Columns (the scale)</Label>
          <OptionsEditor list={q.columns || []} readOnly={readOnly} isLocked={isLocked} itemName="column" idPrefix="c"
            scored={assessment} allowNa={assessment} onChange={(cols) => set((x) => { x.columns = cols })}
            scoreHint={!assessment ? 'Give columns values to see an average per row' : null} scoredAlways />
        </div>
      </div>
    )
  }
  if (q.type === 'file') {
    return (
      <div className="flex items-center gap-2 text-[10px] text-ink-500">
        Up to
        <select className={`${inputCls} !w-16`} value={q.max_files || 3} disabled={readOnly} onChange={(e) => set((x) => { x.max_files = Number(e.target.value) })}>
          {[1, 2, 3, 4, 5, 10].map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        files · PDF, Word, Excel, CSV or image, 25 MB each
      </div>
    )
  }
  return null
}

function OptionsEditor({ list, onChange, readOnly, isLocked, scored, scoredAlways, allowNa, allowExclusive, fixed, itemName, idPrefix = 'o', scoreHint }) {
  const [bulk, setBulk] = useState(null)
  const taken = new Set(list.map((o) => o.id))
  const showScore = scored || scoredAlways
  const edit = (i, patch) => onChange(list.map((o, j) => (j === i ? clean({ ...o, ...patch }) : o)))
  return (
    <div>
      {scoreHint && <p className="text-[10px] text-ink-300 mb-1">{scoreHint}</p>}
      <div className="space-y-1.5">
        {list.map((o, i) => (
          <div key={o.id} className="flex items-center gap-1.5">
            <input className={inputCls} value={o.label} disabled={readOnly} placeholder={`${cap(itemName)} ${i + 1}`} aria-label={`${cap(itemName)} ${i + 1}`}
              onChange={(e) => edit(i, { label: e.target.value })} />
            {showScore && (
              <input type="number" step="0.5" className={`${inputCls} !w-16 shrink-0`} value={o.na ? '' : o.score ?? ''} disabled={readOnly || o.na}
                placeholder={o.na ? 'N/A' : 'pts'} title={o.na ? 'Not applicable — left out of the score' : 'Points'} aria-label="Points"
                onChange={(e) => edit(i, { score: e.target.value === '' ? undefined : Number(e.target.value) })} />
            )}
            {allowNa && (
              <button type="button" disabled={readOnly} onClick={() => edit(i, { na: !o.na, score: undefined })} title="Not applicable: leaves the question out of the score"
                className={`text-[9px] px-1.5 py-1 rounded border shrink-0 ${o.na ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-surface-border text-ink-300 hover:text-ink-700'}`}>N/A</button>
            )}
            {allowExclusive && (
              <button type="button" disabled={readOnly} onClick={() => edit(i, { exclusive: !o.exclusive })} title="Can’t be combined with other answers (e.g. “None of these”)"
                className={`text-[9px] px-1.5 py-1 rounded border shrink-0 ${o.exclusive ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-surface-border text-ink-300 hover:text-ink-700'}`}>Only</button>
            )}
            {!fixed && (
              <>
                <IconBtn title="Move up" disabled={readOnly || i === 0} onClick={() => { const n = [...list]; swap(n, i, i - 1); onChange(n) }}><ArrowUp size={12} /></IconBtn>
                <IconBtn title={isLocked(o.id) ? 'Used in responses — can’t be removed' : `Remove ${itemName}`} danger disabled={readOnly || isLocked(o.id) || list.length <= 1}
                  onClick={() => onChange(list.filter((_, j) => j !== i))}><X size={12} /></IconBtn>
              </>
            )}
          </div>
        ))}
      </div>
      {!fixed && !readOnly && (
        bulk === null ? (
          <div className="flex gap-3 mt-1.5">
            <button type="button" className="text-[10px] text-brand-greenDark hover:underline"
              onClick={() => onChange([...list, { id: newId(idPrefix, taken), label: '' }])}>+ Add {itemName}</button>
            <button type="button" className="text-[10px] text-ink-500 hover:underline" onClick={() => setBulk('')}>Paste a list</button>
          </div>
        ) : (
          <div className="mt-2">
            <textarea className={inputCls} rows={4} autoFocus value={bulk} onChange={(e) => setBulk(e.target.value)}
              placeholder={`One ${itemName} per line${showScore ? ' — add “ | points” to score it, e.g. In place | 4' : ''}`} />
            <div className="flex gap-2 mt-1">
              <button type="button" className="text-[10px] px-2 py-1 rounded bg-brand-green text-white" onClick={() => {
                const added = bulk.split('\n').map((l) => l.trim()).filter(Boolean).map((line) => {
                  const [label, pts] = line.split('|').map((x) => x.trim())
                  const o = { id: newId(idPrefix, taken), label }
                  taken.add(o.id)
                  if (showScore && pts !== undefined && pts !== '' && !Number.isNaN(Number(pts))) o.score = Number(pts)
                  return o
                })
                const keep = list.filter((o) => o.label || isLocked(o.id))
                onChange([...keep, ...added])
                setBulk(null)
              }}>Add {bulk.split('\n').filter((l) => l.trim()).length || ''}</button>
              <button type="button" className="text-[10px] px-2 py-1 rounded text-ink-500" onClick={() => setBulk(null)}>Cancel</button>
            </div>
          </div>
        )
      )}
    </div>
  )
}

function clean(o) {
  const out = { ...o }
  for (const k of ['score', 'na', 'exclusive']) if (out[k] === undefined || out[k] === false) delete out[k]
  return out
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1) }

export function LogicEditor({ cond, prior, onChange, readOnly, what }) {
  const rules = cond?.rules || []
  const match = cond?.match || 'all'
  const emit = (rs, m = match) => onChange(rs.length || cond ? { match: m, rules: rs } : null)
  const firstQ = prior[prior.length - 1]
  const defaultRule = (q) => {
    const op = OPS_BY_TYPE[q.type][0]
    return { question: q.id, op, ...(VALUE_OPS.has(op) ? { value: q.options?.[0]?.id ?? (CHOICE_TYPES.has(q.type) ? '' : 0) } : {}) }
  }
  return (
    <div className="rounded-md border border-blue-200 bg-blue-50/50 p-2.5">
      <div className="flex items-center gap-2 text-[10px] text-blue-900 mb-1.5">
        <GitBranch size={12} />
        <span>Show {what} only if</span>
        {rules.length > 1 && (
          <select className={`${inputCls} !w-auto !py-0.5`} value={match} disabled={readOnly} onChange={(e) => emit(rules, e.target.value)}>
            <option value="all">all of these are true</option>
            <option value="any">any of these is true</option>
          </select>
        )}
        <button type="button" className="ml-auto text-blue-700 hover:underline" disabled={readOnly} onClick={() => onChange(null)}>Remove logic</button>
      </div>
      {!prior.length && <p className="text-[10px] text-ink-500">Logic can only depend on questions that come earlier.</p>}
      <div className="space-y-1.5">
        {rules.map((r, i) => {
          const q = prior.find((x) => x.id === r.question)
          const ops = q ? OPS_BY_TYPE[q.type] : []
          return (
            <div key={i} className="flex flex-wrap items-center gap-1.5">
              <select className={`${inputCls} !w-auto max-w-[260px]`} value={r.question} disabled={readOnly}
                onChange={(e) => { const nq = prior.find((x) => x.id === e.target.value); emit(rules.map((x, j) => (j === i ? defaultRule(nq) : x))) }}>
                {!q && <option value="">Choose a question…</option>}
                {prior.map((p) => <option key={p.id} value={p.id}>{truncate(p.title || 'Untitled question', 50)}</option>)}
              </select>
              {q && (
                <select className={`${inputCls} !w-auto`} value={r.op} disabled={readOnly}
                  onChange={(e) => {
                    const op = e.target.value
                    emit(rules.map((x, j) => (j === i ? { question: x.question, op, ...(VALUE_OPS.has(op) ? { value: x.value ?? q.options?.[0]?.id ?? 0 } : {}) } : x)))
                  }}>
                  {ops.map((op) => <option key={op} value={op}>{OP_LABELS[op]}</option>)}
                </select>
              )}
              {q && VALUE_OPS.has(r.op) && (OPTION_TYPES.has(q.type) ? (
                <select className={`${inputCls} !w-auto max-w-[200px]`} value={r.value ?? ''} disabled={readOnly}
                  onChange={(e) => emit(rules.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}>
                  {(q.options || []).map((o) => <option key={o.id} value={o.id}>{o.label || 'Untitled option'}</option>)}
                  {q.allow_other && <option value={OTHER}>Other</option>}
                </select>
              ) : (
                <input type="number" className={`${inputCls} !w-20`} value={r.value ?? ''} disabled={readOnly}
                  onChange={(e) => emit(rules.map((x, j) => (j === i ? { ...x, value: e.target.value === '' ? 0 : Number(e.target.value) } : x)))} />
              ))}
              <button type="button" className="text-ink-300 hover:text-status-pending" disabled={readOnly} aria-label="Remove rule"
                onClick={() => { const rs = rules.filter((_, j) => j !== i); onChange(rs.length ? { match, rules: rs } : null) }}><X size={13} /></button>
            </div>
          )
        })}
      </div>
      {prior.length > 0 && !readOnly && (
        <button type="button" className="text-[10px] text-blue-700 hover:underline mt-1.5" onClick={() => emit([...rules, defaultRule(firstQ)])}>+ Add condition</button>
      )}
      {rules.length > 0 && rules.some((r) => !prior.find((p) => p.id === r.question)) && (
        <p className="flex items-center gap-1 text-[10px] text-amber-700 mt-1"><AlertTriangle size={11} /> A condition refers to a question that no longer comes earlier.</p>
      )}
    </div>
  )
}

function BandsEditor({ defn, update, readOnly }) {
  const bands = defn.bands || []
  return (
    <section className="bg-white border border-surface-border rounded-lg p-4">
      <h3 className="text-xs font-semibold text-ink-900">Maturity bands</h3>
      <p className="text-[10px] text-ink-500 mt-0.5 mb-3">Name the score ranges, e.g. 0 % Beginning, 40 % Developing, 70 % Leading. Each band runs up to the next one.</p>
      <div className="space-y-2">
        {bands.map((b, i) => (
          <div key={i} className="grid grid-cols-[80px_1fr_auto] sm:grid-cols-[80px_180px_1fr_auto] gap-2 items-start">
            <div className="flex items-center gap-1">
              <input type="number" min={0} max={100} className={inputCls} value={b.min} disabled={readOnly} aria-label="Starts at %"
                onChange={(e) => update((d) => { d.bands[i].min = e.target.value === '' ? 0 : Number(e.target.value) })} />
              <span className="text-[10px] text-ink-500">%</span>
            </div>
            <input className={inputCls} value={b.label} disabled={readOnly} placeholder="Band name" aria-label="Band name"
              onChange={(e) => update((d) => { d.bands[i].label = e.target.value })} />
            <input className={`${inputCls} hidden sm:block`} value={b.description || ''} disabled={readOnly} placeholder="What it means / next steps (shown with the score)"
              onChange={(e) => update((d) => { d.bands[i].description = e.target.value })} />
            <IconBtn title="Remove band" danger disabled={readOnly} onClick={() => update((d) => { d.bands.splice(i, 1) })}><X size={12} /></IconBtn>
          </div>
        ))}
      </div>
      {!readOnly && (
        <button type="button" className="text-[10px] text-brand-greenDark hover:underline mt-2"
          onClick={() => update((d) => {
            d.bands = d.bands || []
            const top = d.bands.reduce((m, b) => Math.max(m, b.min), -25)
            d.bands.push({ min: Math.min(100, top + 25), label: '', description: '' })
          })}>+ Add band</button>
      )}
    </section>
  )
}
