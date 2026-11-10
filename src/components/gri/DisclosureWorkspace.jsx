import { useMemo, useState } from 'react'
import {
  BookOpen, CheckCircle2, ChevronDown, ChevronRight, ClipboardList, Copy, Database, Download, Link2, Loader2,
  Search, Send, Sparkles, Undo2,
} from 'lucide-react'
import { Button, Card, EmptyState, Field, ProgressBar, Select } from '../ui.jsx'
import LoadingState from '../LoadingState.jsx'
import ErrorState from '../ErrorState.jsx'
import { Drawer, Toggle } from '../surveys/parts.jsx'
import { inputCls } from '../surveys/util.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useCompanies } from '../../hooks/useCompanies.js'
import {
  useAdoptBrsr, useDisclosureWorkspace, useReviewAnswers, useSaveAnswer, useSetOwner, useSubmitAnswers,
} from '../../hooks/useDisclosures.js'
import { FRAMEWORK_UI } from './frameworks.js'
import GriStatePill from './GriStatePill.jsx'
import { GRI_STATE, GROUP_TONE, STATE_ORDER, errMessage, fmtFigure } from './format.js'

/**
 * Upload Center → GRI / SASB. Every requirement (GRI) or metric (SASB) for the year:
 * - figures the platform computes from approved data sheets (same numbers as the dashboard and BRSR),
 * - answers reused from the BRSR, typed by the owner, or omitted with a reason,
 * - each typed answer approved by the owner's reviewer (Admin Console → Roles → KPI domains).
 * `fw` is 'gri' or 'sasb'; labels and downloads come from ./frameworks.js.
 */
export default function DisclosureWorkspace({ fw = 'gri', pushToast }) {
  const ui = FRAMEWORK_UI[fw]
  const { user } = useAuth()
  const isDeloitte = user?.portal_type === 'deloitte'
  const [companyId, setCompanyId] = useState('')
  const companies = useCompanies({ page: 1, page_size: 100, sort: 'name', order: 'asc' })
  return (
    <div>
      {isDeloitte && (
        <Card className="mb-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Client company" required>
              <Select value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
                <option value="">Select a company…</option>
                {(companies.data?.items || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
          </div>
        </Card>
      )}
      {isDeloitte && !companyId
        ? <Card><EmptyState icon={ClipboardList} title="Choose a company" subtitle={`Select the client whose ${ui.name} report you want to open.`} /></Card>
        : <Workspace key={`${fw}-${companyId || 'own'}`} ui={ui} companyId={isDeloitte ? Number(companyId) : null} pushToast={pushToast} />}
    </div>
  )
}

function Workspace({ ui, companyId, pushToast }) {
  const fw = ui.key
  const { hasPermission } = useAuth()
  const [fy, setFy] = useState(null)
  const q = useDisclosureWorkspace(fw, fy, companyId)
  const [group, setGroup] = useState('all')
  const [state, setState] = useState('all')
  const [dept, setDept] = useState('')
  const [mine, setMine] = useState(false)
  const [search, setSearch] = useState('')
  const [openKey, setOpenKey] = useState(null)
  const adopt = useAdoptBrsr(fw, companyId)
  const submit = useSubmitAnswers(fw, companyId)
  const [busy, setBusy] = useState(null)

  const data = q.data
  const items = useMemo(() => data?.items || [], [data])
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    return items.filter((i) => (group === 'all' || i.group === group)
      && (state === 'all' || i.state === state)
      && (!dept || i.department === dept)
      && (!mine || i.can_edit || i.can_review)
      && (!s || `${i.key} ${i.title} ${i.text} ${i.standard}`.toLowerCase().includes(s)))
  }, [items, group, state, dept, mine, search])

  if (q.isLoading) return <Card><LoadingState label={`Loading the ${ui.name} ${ui.nouns}…`} /></Card>
  if (q.isError) return <Card><ErrorState message={errMessage(q.error, `Could not load ${ui.name}.`)} onRetry={() => q.refetch()} /></Card>
  if (!data.enabled) {
    return (
      <Card>
        <EmptyState icon={BookOpen} title={`${ui.name} is not switched on`}
          subtitle={`An administrator turns ${ui.name} on in Admin Console → Frameworks & KPIs. Figures and answers then appear here.`} />
      </Card>
    )
  }
  if (!data.total && ui.setupHint) {
    return <Card><EmptyState icon={BookOpen} title={ui.setupTitle} subtitle={ui.setupHint} /></Card>
  }

  const canWrite = hasPermission('dataset:create')
  const brsrReady = items.filter((i) => i.state === 'brsr_available' && i.can_edit).length
  const drafts = items.filter((i) => i.state === 'draft' && i.can_edit)
  const fys = [...new Set([...(data.years || []), data.fy])].sort().reverse()
  const pct = data.total ? Math.round((data.complete / data.total) * 100) : 0
  const open = openKey ? items.find((i) => i.key === openKey) : null

  async function run(kind, fn, ok) {
    setBusy(kind)
    try { const r = await fn(); pushToast?.(ok(r)) } catch (e) { pushToast?.(errMessage(e, 'Something went wrong')) } finally { setBusy(null) }
  }

  return (
    <div className="space-y-4">
      <Card padded={false}>
        <div className="p-4 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Ring pct={pct} />
            <div>
              <h3 className="text-sm font-semibold text-ink-900">{ui.title} · FY {data.fy}</h3>
              <p className="text-[11px] text-ink-500 mt-0.5 max-w-xl">
                <strong className="text-ink-900 tabular-nums">{data.complete}</strong> of {data.total} {ui.nouns} complete.
                {' '}{data.from_data} come straight from approved data sheets; the rest are answered by their owner and approved by its reviewer.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="w-32">
              <Field label="Financial year">
                <Select value={data.fy} onChange={(e) => setFy(e.target.value)}>
                  {fys.map((y) => <option key={y} value={y}>FY {y}</option>)}
                </Select>
              </Field>
            </div>
            {ui.downloads.map((d) => (
              <Button key={d.id} variant="outline" size="sm" disabled={busy === d.id} onClick={() => run(d.id, () => d.fn(data.fy, companyId), () => `${d.label} downloaded`)}>
                {busy === d.id ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} {d.short}
              </Button>
            ))}
          </div>
        </div>
        <div className={`grid grid-cols-2 ${data.groups.length >= 4 ? 'lg:grid-cols-4' : data.groups.length === 3 ? 'lg:grid-cols-3' : ''} border-t border-surface-border`}>
          {data.groups.map((g) => (
            <button key={g.key} type="button" onClick={() => setGroup(group === g.key ? 'all' : g.key)}
              className={`text-left p-3 border-r last:border-r-0 border-surface-border transition-colors ${group === g.key ? 'bg-brand-green/5' : 'hover:bg-surface-muted/60'}`}>
              <p className={`text-[11px] font-semibold ${(GROUP_TONE[g.key] || 'text-ink-900')}`}>{g.title}</p>
              <p className="text-[10px] text-ink-500 mb-1.5 tabular-nums">{g.complete} / {g.total} complete</p>
              <ProgressBar pct={g.total ? (g.complete / g.total) * 100 : 0} />
            </button>
          ))}
        </div>
      </Card>

      {(brsrReady > 0 || drafts.length > 0) && canWrite && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3">
          <Sparkles size={15} className="text-blue-600 shrink-0" />
          <p className="text-[11px] text-ink-700 flex-1 min-w-[16rem]">
            {brsrReady > 0 && <><strong>{brsrReady}</strong> requirement{brsrReady === 1 ? '' : 's'} can reuse this year's BRSR answer. </>}
            {drafts.length > 0 && <><strong>{drafts.length}</strong> draft{drafts.length === 1 ? '' : 's'} not yet sent for review.</>}
          </p>
          {brsrReady > 0 && (
            <Button size="sm" variant="outline" disabled={busy === 'adopt'}
              onClick={() => run('adopt', () => adopt.mutateAsync({ fy: data.fy }), (r) => `${r.adopted} BRSR answer(s) adopted as drafts`)}>
              {busy === 'adopt' ? <Loader2 size={12} className="animate-spin" /> : <Link2 size={12} />} Use BRSR answers
            </Button>
          )}
          {drafts.length > 0 && hasPermission('dataset:submit') && (
            <Button size="sm" disabled={busy === 'submit'}
              onClick={() => run('submit', () => submit.mutateAsync({ fy: data.fy, keys: drafts.map((d) => d.key).slice(0, 200) }), (r) => `${r.submitted} answer(s) sent for review`)}>
              {busy === 'submit' ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} Send drafts for review
            </Button>
          )}
        </div>
      )}

      <Card padded={false}>
        <div className="p-3 border-b border-surface-border flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[14rem]">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-300" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${ui.nouns}, ${ui.searchHint}`}
              className={`${inputCls} pl-8`} aria-label={`Search ${ui.name} ${ui.nouns}`} />
          </div>
          <select value={dept} onChange={(e) => setDept(e.target.value)} className={inputCls.replace('w-full', 'w-56')} aria-label="Department">
            <option value="">All owners</option>
            {data.departments.map((d) => <option key={d.department} value={d.department}>{d.department} · {d.complete}/{d.total}</option>)}
          </select>
          <label className="flex items-center gap-1.5 text-[11px] text-ink-700 px-1 whitespace-nowrap">
            <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} className="accent-brand-green" /> Mine to answer or review
          </label>
        </div>
        <div className="px-3 py-2 border-b border-surface-border flex flex-wrap gap-1.5">
          <Chip active={state === 'all'} onClick={() => setState('all')}>All · {items.length}</Chip>
          {STATE_ORDER.filter((s) => data.by_state[s]).map((s) => (
            <Chip key={s} active={state === s} onClick={() => setState(state === s ? 'all' : s)}>
              <span className={`w-1.5 h-1.5 rounded-full ${GRI_STATE[s].dot}`} /> {GRI_STATE[s].label} · {data.by_state[s]}
            </Chip>
          ))}
        </div>
        <DisclosureList disclosures={data.disclosures} items={filtered} onOpen={setOpenKey} expandAll={!!search || state !== 'all' || mine || !!dept} />
      </Card>

      {open && <RequirementDrawer key={open.key} ui={ui} item={open} data={data} companyId={companyId} onClose={() => setOpenKey(null)} pushToast={pushToast} />}
    </div>
  )
}

function Ring({ pct }) {
  const r = 22
  const c = 2 * Math.PI * r
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" role="img" aria-label={`${pct}% complete`}>
      <circle cx="28" cy="28" r={r} fill="none" stroke="#E5E5E5" strokeWidth="5" />
      <circle cx="28" cy="28" r={r} fill="none" stroke="#64BC44" strokeWidth="5" strokeLinecap="round"
        strokeDasharray={`${(pct / 100) * c} ${c}`} transform="rotate(-90 28 28)" />
      <text x="28" y="32" textAnchor="middle" className="fill-ink-900" style={{ fontSize: 12, fontWeight: 600 }}>{pct}%</text>
    </svg>
  )
}

function Chip({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] border transition-colors ${active ? 'border-brand-green bg-brand-green/10 text-brand-greenDark font-medium' : 'border-surface-border text-ink-700 hover:bg-surface-muted'}`}>
      {children}
    </button>
  )
}

function DisclosureList({ disclosures, items, onOpen, expandAll }) {
  const [open, setOpen] = useState({})
  const byDisc = useMemo(() => {
    const m = {}
    for (const i of items) (m[i.disclosure] ||= []).push(i)
    return m
  }, [items])
  const shown = disclosures.filter((d) => byDisc[d.disclosure])
  if (!shown.length) return <div className="p-6"><EmptyState icon={Search} title="Nothing matches" subtitle="Change the filters above." /></div>
  let standard = null
  return (
    <div className="divide-y divide-surface-border">
      {shown.map((d) => {
        const mine = byDisc[d.disclosure]
        const header = d.standard !== standard ? (standard = d.standard) : null
        const done = mine.filter((i) => i.complete).length
        const isOpen = expandAll || open[d.disclosure]
        return (
          <div key={d.disclosure}>
            {header && <p className={`px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wide ${(GROUP_TONE[d.group] || 'text-ink-900')}`}>{header}</p>}
            <button type="button" onClick={() => setOpen((o) => ({ ...o, [d.disclosure]: !isOpen }))}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-muted/60">
              {isOpen ? <ChevronDown size={14} className="text-ink-300" /> : <ChevronRight size={14} className="text-ink-300" />}
              <span className="font-mono text-[10px] text-ink-500 min-w-[3rem] shrink-0 whitespace-nowrap">{d.disclosure}</span>
              <span className="text-[11px] font-medium text-ink-900 flex-1">{d.title}</span>
              <span className="flex gap-0.5" aria-hidden="true">
                {mine.map((i) => <span key={i.key} className={`w-1.5 h-3 rounded-sm ${GRI_STATE[i.state].dot}`} />)}
              </span>
              <span className="text-[10px] text-ink-500 tabular-nums w-14 text-right">{done}/{mine.length}</span>
            </button>
            {isOpen && (
              <ul className="pb-2">
                {mine.map((i) => (
                  <li key={i.key}>
                    <button type="button" onClick={() => onOpen(i.key)}
                      className="w-full grid grid-cols-[6.5rem_1fr_auto] gap-3 items-start pl-11 pr-4 py-2 text-left hover:bg-brand-green/5">
                      <span className="font-mono text-[10px] text-ink-500 pt-0.5">{i.key}</span>
                      <span className="min-w-0">
                        <span className="block text-[11px] text-ink-700 line-clamp-2">{i.text}</span>
                        <Preview i={i} />
                      </span>
                      <span className="flex flex-col items-end gap-1">
                        <GriStatePill state={i.state} />
                        <span className="text-[9px] text-ink-300">{i.department}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}

function Preview({ i }) {
  if (i.figures.length) {
    const f = i.figures[0]
    return (
      <span className="mt-1 inline-flex items-center gap-1.5 text-[10px] text-brand-greenDark">
        <Database size={10} /> {f.label}: <strong className="tabular-nums">{fmtFigure(f.value, f.unit)}</strong> {f.unit !== '%' && f.unit !== '₹' ? f.unit : ''}
        {i.figures.length > 1 && <span className="text-ink-300">+{i.figures.length - 1} more</span>}
      </span>
    )
  }
  const r = i.answer?.response
  if (r) return <span className="mt-1 block text-[10px] text-ink-500 italic line-clamp-1">“{r}”</span>
  if (i.answer?.omission_reason) return <span className="mt-1 block text-[10px] text-ink-500 italic">Omitted — {i.answer.omission_explanation}</span>
  return null
}

// ---------------------------------------------------------------------------
// One requirement
// ---------------------------------------------------------------------------

function RequirementDrawer({ ui, item: i, data, companyId, onClose, pushToast }) {
  const fw = ui.key
  const { hasPermission } = useAuth()
  const a = i.answer || {}
  const [text, setText] = useState(a.text || '')
  const [useBrsr, setUseBrsr] = useState(!!a.use_brsr)
  const [omit, setOmit] = useState(!!a.omission_reason)
  const [reason, setReason] = useState(a.omission_reason || data.omission_reasons[0].key)
  const [explanation, setExplanation] = useState(a.omission_explanation || '')
  const [note, setNote] = useState('')
  const [err, setErr] = useState(null)
  const save = useSaveAnswer(fw, companyId)
  const submit = useSubmitAnswers(fw, companyId)
  const review = useReviewAnswers(fw, companyId)
  const owner = useSetOwner(fw, companyId)
  const brsrText = i.brsr.filter((b) => b.text)
  const canWrite = i.can_edit && hasPermission('dataset:create')
  const dirty = (text.trim() || null) !== (a.text || null) || useBrsr !== !!a.use_brsr || omit !== !!a.omission_reason
    || (omit && (reason !== a.omission_reason || explanation.trim() !== (a.omission_explanation || '')))
  const busy = save.isPending || submit.isPending || review.isPending || owner.isPending

  async function act(fn, ok) {
    setErr(null)
    try { await fn(); pushToast?.(ok) } catch (e) { setErr(errMessage(e, 'Could not save')) }
  }
  const doSave = () => save.mutateAsync({
    key: i.key,
    body: {
      fy: data.fy, text: text.trim() || null, use_brsr: useBrsr, revision: a.revision ?? null,
      omission_reason: omit ? reason : null, omission_explanation: omit ? explanation : null,
    },
  })

  return (
    <Drawer title={`${ui.name} ${i.key} · ${i.title}`} onClose={onClose}>
      <div className="space-y-4 text-[11px]">
        <div className="flex flex-wrap items-center gap-2">
          <GriStatePill state={i.state} />
          <span className="text-[10px] px-2 py-0.5 rounded bg-ink-100 text-ink-700">{i.standard}</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-ink-100 text-ink-700 capitalize">{i.kind}</span>
        </div>
        <p className="text-[12px] leading-relaxed text-ink-900">{i.text}</p>
        {i.remarks && <p className="text-[10px] text-ink-500 bg-surface-muted rounded p-2">{ui.remarksLabel}: {i.remarks}</p>}

        {i.figures.length > 0 && (
          <Section icon={Database} title="Figures from approved data" hint={i.sheet ? `Data sheet: ${i.sheet}` : null}>
            <table className="w-full text-[11px]">
              <thead><tr className="text-[10px] text-ink-500 text-left">
                <th className="py-1 font-medium">Figure</th><th className="py-1 font-medium text-right">FY {data.fy}</th>
                <th className="py-1 font-medium text-right">FY {data.previous_fy}</th><th className="py-1 pl-2 font-medium">Unit</th>
              </tr></thead>
              <tbody className="divide-y divide-surface-border">
                {i.figures.map((f) => (
                  <tr key={f.label} title={f.formula}>
                    <td className="py-1.5 pr-2 text-ink-700">{f.label}</td>
                    <td className="py-1.5 text-right font-semibold tabular-nums text-ink-900">{fmtFigure(f.value, f.unit)}</td>
                    <td className="py-1.5 text-right tabular-nums text-ink-500">{fmtFigure(f.previous, f.unit)}</td>
                    <td className="py-1.5 pl-2 text-ink-500">{f.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] text-ink-500 mt-2">Same numbers as the dashboard, KPI catalogue and BRSR. They change only when approved data changes. Add a commentary below if the disclosure needs context.</p>
          </Section>
        )}

        {i.brsr.length > 0 && (
          <Section icon={Link2} title="Linked BRSR question" hint={i.brsr.map((b) => b.label).join(', ')}>
            {brsrText.length ? (
              <>
                {brsrText.map((b) => <pre key={b.id} className="whitespace-pre-wrap font-sans text-[11px] text-ink-700 bg-surface-muted rounded p-2 max-h-40 overflow-y-auto">{b.text}</pre>)}
                {canWrite && <div className="mt-2"><Toggle checked={useBrsr} onChange={setUseBrsr} label="Use the BRSR answer" hint={`The ${ui.name} answer follows the BRSR: if the BRSR answer changes, this one shows the new text and needs approval again.`} /></div>}
              </>
            ) : <p className="text-ink-500">Not answered in this year's BRSR yet.</p>}
          </Section>
        )}

        {i.suggestion && canWrite && !text.trim() && (
          <Section icon={Sparkles} title="Suggested by VISTA" hint="Written from the factors and method the platform used">
            <pre className="whitespace-pre-wrap font-sans text-[11px] text-ink-700 bg-blue-50/60 rounded p-2 max-h-40 overflow-y-auto">{i.suggestion}</pre>
            <Button size="sm" variant="outline" className="mt-2" onClick={() => setText(i.suggestion)}><Copy size={12} /> Use this text</Button>
          </Section>
        )}

        <Section icon={BookOpen} title={i.figures.length ? 'Commentary (optional)' : useBrsr ? 'Additional text (optional)' : 'Answer'}>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} disabled={!canWrite}
            className={inputCls} placeholder={canWrite ? `Type the answer as it should appear in the ${ui.name} report…` : 'Answered by the owner'} />
          {canWrite && (
            <div className="mt-3 space-y-2">
              <Toggle checked={omit} onChange={setOmit} label={`Omit this ${ui.noun}`} hint={ui.omitHint} />
              {omit && (
                <div className="grid gap-2 pl-11">
                  <select value={reason} onChange={(e) => setReason(e.target.value)} className={inputCls} aria-label="Reason for omission">
                    {data.omission_reasons.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                  </select>
                  <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={2} className={inputCls}
                    placeholder="Explain the omission (required), e.g. when the information will be available" />
                </div>
              )}
            </div>
          )}
        </Section>

        {a.decision_note && (
          <p className={`rounded p-2 ${i.state === 'returned' ? 'bg-red-50 text-status-pending' : 'bg-surface-muted text-ink-700'}`}>
            <strong>{i.state === 'returned' ? 'Returned' : 'Reviewer note'}:</strong> {a.decision_note}{a.decided_by ? ` — ${a.decided_by}` : ''}
          </p>
        )}
        {err && <p className="rounded p-2 bg-red-50 text-status-pending">{err}</p>}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {canWrite && (
            <Button size="sm" disabled={!dirty || busy || (omit && !explanation.trim())} onClick={() => act(doSave, 'Saved as draft')}>
              {save.isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Save draft
            </Button>
          )}
          {canWrite && hasPermission('dataset:submit') && ['draft', 'returned'].includes(i.state) && !dirty && (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => act(() => submit.mutateAsync({ fy: data.fy, keys: [i.key] }), 'Sent for review')}>
              <Send size={12} /> Send for review
            </Button>
          )}
          {i.state === 'submitted' && !i.can_review && <span className="text-ink-500">Waiting for the {i.department} reviewer{a.submitted_by ? ` · sent by ${a.submitted_by}` : ''}.</span>}
        </div>

        {i.can_review && hasPermission('dataset:review') && (
          <Section icon={CheckCircle2} title="Review" hint={a.submitted_by ? `Sent by ${a.submitted_by}` : null}>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={inputCls} placeholder="Note (required to return)" />
            <div className="flex gap-2 mt-2">
              <Button size="sm" disabled={busy} onClick={() => act(() => review.mutateAsync({ fy: data.fy, keys: [i.key], decision: 'approve', note }), 'Approved')}>
                <CheckCircle2 size={12} /> Approve
              </Button>
              <Button size="sm" variant="outline" disabled={busy || !note.trim()} onClick={() => act(() => review.mutateAsync({ fy: data.fy, keys: [i.key], decision: 'return', note }), 'Returned with your note')}>
                <Undo2 size={12} /> Return
              </Button>
            </div>
          </Section>
        )}

        <div className="border-t border-surface-border pt-3 grid grid-cols-2 gap-3 text-[10px] text-ink-500">
          <div>
            <p className="font-medium mb-1">Owner</p>
            {data.can_manage ? (
              <select value={i.owner} disabled={busy || i.state === 'submitted'} className={inputCls} aria-label="Owner"
                onChange={(e) => {
                  const label = data.owner_options.find((o) => o.key === e.target.value)?.label || e.target.value
                  act(() => owner.mutateAsync({ key: i.key, body: { fy: data.fy, department: e.target.value } }), `Owner changed to ${label}`)
                }}>
                {['domain', 'department'].map((kind) => {
                  const opts = data.owner_options.filter((o) => o.kind === kind)
                  if (!opts.length) return null
                  return (
                    <optgroup key={kind} label={kind === 'domain' ? 'KPI domains (data owners)' : 'Departments'}>
                      {opts.map((o) => <option key={o.key} value={o.key}>{o.label}{o.key === i.default_owner ? ' (default)' : ''}</option>)}
                    </optgroup>
                  )
                })}
              </select>
            ) : <p className="text-ink-900 text-[11px]">{i.department}</p>}
          </div>
          <div>
            <p className="font-medium mb-1">Last change</p>
            <p className="text-ink-700">{a.updated_by ? `${a.updated_by} · ${new Date(a.updated_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}` : '—'}</p>
          </div>
        </div>
      </div>
    </Drawer>
  )
}

function Section({ icon: Icon, title, hint, children }) {
  return (
    <section>
      <p className="flex items-center gap-1.5 text-[10px] font-semibold text-ink-700 uppercase tracking-wide mb-1.5">
        <Icon size={12} className="text-brand-green" /> {title}
        {hint && <span className="normal-case tracking-normal font-normal text-ink-300">· {hint}</span>}
      </p>
      {children}
    </section>
  )
}
