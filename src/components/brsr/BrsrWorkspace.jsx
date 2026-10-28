import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  FileText, Download, Send, Undo2, Unlock, CheckCircle2, AlertCircle, AlertTriangle, Loader2, ClipboardList,
  X, RefreshCw, Filter, Database, ChevronDown, ChevronRight, Users,
} from 'lucide-react'
import { Button, Card, Field, Select, ProgressBar, EmptyState } from '../ui.jsx'
import LoadingState from '../LoadingState.jsx'
import ErrorState from '../ErrorState.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useCompanies } from '../../hooks/useCompanies.js'
import {
  useQuestionBank, useResponseSets, useResponseSet, useSection, useCreateResponseSet, useSaveAnswers,
  useSubmitSection, useWithdrawSection, useReopenSection, useAnswerHistory, useSubmitQuestions, useReviewQuestions,
} from '../../hooks/useBrsr.js'
import { downloadPreview } from '../../api/brsr.js'
import { updateCompany } from '../../api/companies.js'
import BrsrQuestion from './BrsrQuestion.jsx'
import SectionEvidence from './SectionEvidence.jsx'
import StatusBadge from './StatusBadge.jsx'
import DepartmentRoster from './DepartmentRoster.jsx'
import { financialYearOptions, sectionName, sectionSubtitle, forDepartment, isQuestionnaire, fillLabels } from './format.js'

const AUTOSAVE_MS = 1200

function errMessage(err, fallback) {
  return err?.data?.error?.message || err?.message || fallback
}

/**
 * BRSR questionnaire — where the client enters its BRSR.
 *
 * Quantitative tables are built from the approved data sheets (Upload
 * Center → Data sheets). The questionnaire holds the questions people
 * answer: each department's SPOC answers and sends each answer for review,
 * the department reviewer approves it, and a section goes to Deloitte once
 * its answers are approved. The report is generated from Reporting once
 * every section is approved.
 */
export default function BrsrWorkspace({ pushToast, onOpenDataSheets }) {
  const { user, hasPermission } = useAuth()
  const isDeloitte = user?.portal_type === 'deloitte'
  const [companyId, setCompanyId] = useState('')
  const companiesQuery = useCompanies({ page: 1, page_size: 100, sort: 'name', order: 'asc' })

  const setsQuery = useResponseSets(isDeloitte ? companyId : null, { enabled: !isDeloitte || !!companyId })
  const sets = useMemo(() => setsQuery.data || [], [setsQuery.data])
  const [setId, setSetId] = useState(null)
  const activeSetId = sets.some((s) => s.public_id === setId) ? setId : sets[0]?.public_id || null

  return (
    <div>
      {isDeloitte && (
        <Card className="mb-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Client company" required>
              <Select value={companyId} onChange={(e) => { setCompanyId(e.target.value); setSetId(null) }}>
                <option value="">Select a company…</option>
                {(companiesQuery.data?.items || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
          </div>
        </Card>
      )}

      {isDeloitte && !companyId ? (
        <Card><EmptyState icon={ClipboardList} title="Choose a company" subtitle="Select the client whose BRSR you want to open." /></Card>
      ) : setsQuery.isLoading ? (
        <Card><LoadingState label="Loading BRSR…" /></Card>
      ) : setsQuery.isError ? (
        <Card><ErrorState message={errMessage(setsQuery.error, 'Could not load BRSR responses.')} onRetry={() => setsQuery.refetch()} /></Card>
      ) : !activeSetId ? (
        <StartBrsr companyId={isDeloitte ? companyId : null} canCreate={hasPermission('dataset:create')} onCreated={setSetId} />
      ) : (
        <ResponseSetView
          key={activeSetId}
          setId={activeSetId}
          sets={sets}
          onSelectSet={setSetId}
          companyId={isDeloitte ? companyId : null}
          pushToast={pushToast}
          onOpenDataSheets={onOpenDataSheets}
        />
      )}
    </div>
  )
}

function StartBrsr({ companyId, canCreate, onCreated, compact = false, existing = [] }) {
  const options = financialYearOptions(5).filter((fy) => !existing.includes(fy))
  const [fy, setFy] = useState(options[1] || options[0])
  const create = useCreateResponseSet()
  const body = (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-44">
        <Field label="Financial year">
          <Select value={fy} onChange={(e) => setFy(e.target.value)}>
            {options.map((o) => <option key={o} value={o}>FY {o}</option>)}
          </Select>
        </Field>
      </div>
      <Button size="sm" disabled={!canCreate || create.isPending || !fy}
        onClick={() => create.mutate({ financialYear: fy, companyId }, { onSuccess: (r) => onCreated(r.public_id) })}>
        {create.isPending ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />} Start BRSR for FY {fy}
      </Button>
      {create.isError && <p className="text-[10px] text-status-pending w-full">{errMessage(create.error, 'Could not start the BRSR.')}</p>}
      {!canCreate && <p className="text-[10px] text-ink-500 w-full">Your role can view BRSR responses but not start one.</p>}
    </div>
  )
  if (compact) return body
  return (
    <Card title="Business Responsibility and Sustainability Report" icon={ClipboardList}
      subtitle="SEBI's BRSR format. Fill it here; the report is generated in Reporting once every section is approved.">
      <ul className="text-[10px] text-ink-700 space-y-1 mb-4 list-disc pl-4">
        <li>The <b>figures</b> — headcount, wages, energy, water, waste, finance — come from the approved <b>data sheets</b> (Upload Center → Data sheets). Every quantitative BRSR table is built from them.</li>
        <li>The <b>questionnaire</b> holds the rest — policies, processes, narrative. Each department's SPOC answers its questions and sends them for review; the department's reviewer approves them.</li>
        <li>A few figures have no data sheet (e.g. turnover, Scope 1 and 2 emissions); they are typed in their BRSR table.</li>
        <li>Answers save automatically. A section goes to Deloitte once its answers are approved.</li>
      </ul>
      {body}
    </Card>
  )
}

function ResponseSetView({ setId, sets, onSelectSet, companyId, pushToast, onOpenDataSheets }) {
  const bankQuery = useQuestionBank()
  const overviewQuery = useResponseSet(setId)
  const [code, setCode] = useState(null)
  const [dept, setDept] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showRoster, setShowRoster] = useState(false)
  const [downloading, setDownloading] = useState(null)
  const { hasPermission } = useAuth()

  if (bankQuery.isLoading || overviewQuery.isLoading) return <Card><LoadingState label="Loading questionnaire…" /></Card>
  if (bankQuery.isError || overviewQuery.isError) {
    return <Card><ErrorState message="Could not load the questionnaire." onRetry={() => { bankQuery.refetch(); overviewQuery.refetch() }} /></Card>
  }
  const bank = bankQuery.data
  const ov = overviewQuery.data
  const total = ov.sections.length
  const approved = ov.sections.filter((s) => s.status === 'approved').length
  const sectionMeta = Object.fromEntries(bank.sections.map((s) => [s.code, s]))
  // Sections with anything for the chosen department
  const deptSections = new Set(bank.questions.filter((q) => forDepartment(q, dept)).map((q) => q.section))
  const shown = ov.sections.filter((s) => !dept || deptSections.has(s.code))
  const activeCode = shown.some((s) => s.code === code) ? code : shown[0]?.code || ov.sections[0].code
  const sheetWarnings = ov.data_sheets?.warnings || []
  const changed = ov.data_changed_sections || []

  async function preview(fmt) {
    setDownloading(fmt)
    try {
      await downloadPreview(setId, fmt)
    } catch (e) {
      pushToast(errMessage(e, 'Could not build the preview.'))
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div>
      <Card className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-40">
              <Field label="Financial year">
                <Select value={setId} onChange={(e) => onSelectSet(e.target.value)}>
                  {sets.map((s) => <option key={s.public_id} value={s.public_id}>FY {s.financial_year}</option>)}
                </Select>
              </Field>
            </div>
            <div>
              <p className="text-[10px] text-ink-500">{ov.company_name}</p>
              <p className="text-sm font-semibold text-ink-900">{approved} of {total} sections approved</p>
              {ov.carried_forward && <p className="text-[9px] text-ink-500">Previous-year figures carried forward from last year's approved BRSR</p>}
              <InternalReviewSetting ov={ov} pushToast={pushToast} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => preview('docx')} disabled={!!downloading}>
              {downloading === 'docx' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Draft preview (Word)
            </Button>
            <Button variant="ghost" size="sm" onClick={() => preview('pdf')} disabled={!!downloading}>
              {downloading === 'pdf' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} PDF
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowRoster((v) => !v)}><Users size={13} /> SPOCs & reviewers</Button>
            {hasPermission('dataset:create') && (
              <Button variant="subtle" size="sm" onClick={() => setShowNew((v) => !v)}>New FY</Button>
            )}
          </div>
        </div>
        {showNew && (
          <div className="mt-4 pt-4 border-t border-surface-border">
            <StartBrsr compact companyId={companyId} canCreate existing={sets.map((s) => s.financial_year)}
              onCreated={(id) => { setShowNew(false); onSelectSet(id) }} />
          </div>
        )}
        <div className="mt-3"><ProgressBar pct={(approved / total) * 100} /></div>
        {changed.length > 0 && (
          <p className="mt-3 flex items-start gap-1.5 text-[10px] text-ink-900 bg-status-pending/10 rounded px-3 py-2">
            <AlertCircle size={12} className="mt-px text-status-pending shrink-0" />
            Approved data-sheet figures changed after {changed.length === 1 ? 'this section was' : 'these sections were'} approved: <b>{changed.join(', ')}</b>.
            Reopen and re-approve {changed.length === 1 ? 'it' : 'them'} — the report is held until then.
          </p>
        )}
        <DataSheetStatus warnings={sheetWarnings} coverage={ov.data_sheets?.coverage} fy={ov.financial_year} onOpen={onOpenDataSheets} />
      </Card>

      {showRoster && (
        <DepartmentRoster companyId={companyId} departments={bank.departments || []} pushToast={pushToast}
          onClose={() => setShowRoster(false)} />
      )}

      <div className="grid lg:grid-cols-[230px_1fr] gap-4 items-start">
        <div className="lg:sticky lg:top-4 space-y-2 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
          <div className="bg-white border border-surface-border rounded-lg px-3 py-2">
            <label className="flex items-center gap-1.5 text-[9px] text-ink-500 mb-1" htmlFor="brsr-dept"><Filter size={10} /> Department</label>
            <Select id="brsr-dept" value={dept} onChange={(e) => setDept(e.target.value)}>
              <option value="">All departments</option>
              {(bank.departments || []).map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
          </div>
          <nav className="bg-white border border-surface-border rounded-lg overflow-hidden" aria-label="BRSR sections">
            {shown.map((s) => {
              const meta = sectionMeta[s.code]
              const qn = s.questionnaire || { total: 0, approved: 0 }
              const active = activeCode === s.code
              return (
                <button key={s.code} type="button" onClick={() => setCode(s.code)} aria-current={active ? 'true' : undefined}
                  className={`w-full text-left px-3 py-2.5 border-b border-surface-border last:border-b-0 transition-colors ${
                    active ? 'bg-brand-green/10' : 'hover:bg-surface-muted/60'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[11px] truncate ${active ? 'font-semibold text-ink-900' : 'text-ink-700'}`}>{sectionName(s.code, meta)}</span>
                    <StatusBadge status={s.status} />
                  </div>
                  <p className="text-[9px] text-ink-500 truncate mt-0.5">{sectionSubtitle(s.code, meta)}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1"><ProgressBar pct={s.status === 'approved' || !qn.total ? 100 : (qn.approved / qn.total) * 100} height="h-1" /></div>
                    {s.status !== 'approved' && (
                      <span className="text-[9px] text-ink-500 tabular-nums" title="Questionnaire answers approved by their reviewer">{qn.approved}/{qn.total}</span>
                    )}
                    {s.errors > 0 && <AlertCircle size={10} className="text-status-pending" />}
                    {s.data_changed && <AlertTriangle size={10} className="text-status-pending" title="Data changed since approval" />}
                  </div>
                </button>
              )
            })}
          </nav>
        </div>

        <SectionPanel key={activeCode} setId={setId} code={activeCode} bank={bank} labels={ov.fy_labels} pushToast={pushToast}
          dept={dept} />
      </div>
    </div>
  )
}

/** Where the figures stand: gaps in the approved data sheets for the year. */
function DataSheetStatus({ warnings, coverage, fy, onOpen }) {
  const [open, setOpen] = useState(false)
  const sheets = Object.values(coverage || {})
  const withData = sheets.filter((c) => c.rows > 0).length
  return (
    <div className="mt-3 text-[10px] bg-surface-muted rounded px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <Database size={12} className="text-brand-greenDark" />
        <span className="text-ink-700">Figures from the approved data sheets: <b>{withData}</b> of {sheets.length} sheets have data for FY {fy}.</span>
        {warnings.length > 0 && (
          <button type="button" onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-0.5 text-status-review font-medium">
            {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}{warnings.length} gap{warnings.length > 1 ? 's' : ''}
          </button>
        )}
        <span className="flex-1" />
        {onOpen && <button type="button" onClick={onOpen} className="text-brand-green font-medium hover:text-brand-greenDark">Open data sheets →</button>}
      </div>
      {open && (
        <ul className="mt-2 space-y-0.5 max-h-40 overflow-y-auto">
          {warnings.map((w, i) => <li key={i} className="flex items-start gap-1.5 text-ink-700"><AlertTriangle size={10} className="mt-px text-status-review shrink-0" />{w.message}</li>)}
        </ul>
      )}
    </div>
  )
}

/** Two-tier review is a per-company policy, set by a Deloitte administrator. */
function InternalReviewSetting({ ov, pushToast }) {
  const { hasPermission } = useAuth()
  const qc = useQueryClient()
  const [busy, setBusy] = useState(false)
  if (!hasPermission('company:manage')) {
    return ov.internal_review_required
      ? <p className="text-[9px] text-ink-500">Each section is reviewed internally by the company, then by Deloitte.</p>
      : null
  }
  async function toggle(e) {
    setBusy(true)
    try {
      await updateCompany(ov.company_id, { brsr_internal_review_required: e.target.checked })
      await qc.invalidateQueries({ queryKey: ['brsr'] })
      pushToast(e.target.checked ? 'Internal review is now required before Deloitte review.' : 'Internal review step turned off.')
    } catch (err) {
      pushToast(errMessage(err, 'Could not change the setting.'))
    } finally {
      setBusy(false)
    }
  }
  return (
    <label className="inline-flex items-center gap-1.5 text-[9px] text-ink-700 mt-1">
      <input type="checkbox" checked={!!ov.internal_review_required} disabled={busy} onChange={toggle} className="accent-brand-green" />
      Company reviews each section internally before Deloitte (two-tier review)
    </label>
  )
}

function SectionPanel({ setId, code, bank, labels, pushToast, dept }) {
  const qc = useQueryClient()
  const { hasPermission } = useAuth()
  const sectionQuery = useSection(setId, code)
  const save = useSaveAnswers(setId, code)
  const submit = useSubmitSection()
  const withdraw = useWithdrawSection()
  const reopen = useReopenSection()
  const sendQ = useSubmitQuestions()
  const reviewQ = useReviewQuestions()
  const [busyQ, setBusyQ] = useState(null) // qid or 'bulk'
  const [showData, setShowData] = useState(false)

  const [drafts, setDrafts] = useState({})
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved | error | conflict
  const [saveError, setSaveError] = useState(null)
  const [reopenReason, setReopenReason] = useState('')
  const [showReopen, setShowReopen] = useState(false)
  const [historyFor, setHistoryFor] = useState(null)
  const [confirmWarnings, setConfirmWarnings] = useState(false)
  const draftsRef = useRef(drafts)
  draftsRef.current = drafts
  const inFlight = useRef(false)

  const meta = bank.sections.find((s) => s.code === code)
  const questions = useMemo(
    () => bank.questions.filter((q) => q.section === code && forDepartment(q, dept)), [bank, code, dept])
  const detail = sectionQuery.data
  const canEdit = !!detail?.editable && hasPermission('dataset:create')

  const doSave = useCallback(async () => {
    const pending = draftsRef.current
    const qids = Object.keys(pending)
    if (!qids.length || inFlight.current) return
    const cached = qc.getQueryData(['brsr', 'section', setId, code])
    const payload = {}
    for (const qid of qids) payload[qid] = { value: pending[qid], revision: cached?.answers?.[qid]?.revision ?? null }
    inFlight.current = true
    setSaveState('saving')
    try {
      await save.mutateAsync(payload)
      // Drop only drafts that were not edited again while saving.
      setDrafts((cur) => {
        const next = { ...cur }
        for (const qid of qids) if (next[qid] === pending[qid]) delete next[qid]
        return next
      })
      setSaveState('saved')
      setSaveError(null)
    } catch (e) {
      if (e?.status === 409 && e?.data?.conflicts) {
        setSaveState('conflict')
        setSaveError(e.data.error?.message)
      } else {
        setSaveState('error')
        setSaveError(errMessage(e, 'Could not save.'))
      }
    } finally {
      inFlight.current = false
    }
  }, [qc, save, setId, code])

  // doSave's identity changes every render (useMutation returns a new
  // object each time), so effects reach it through a ref. Depending on it
  // directly would reset the debounce on every render and fire the
  // unmount-save on every keystroke.
  const saveRef = useRef(doSave)
  saveRef.current = doSave

  // Debounced autosave
  useEffect(() => {
    if (!Object.keys(drafts).length || saveState === 'conflict') return
    const t = setTimeout(() => saveRef.current(), AUTOSAVE_MS)
    return () => clearTimeout(t)
  }, [drafts, saveState])

  // Save anything pending when leaving the section; warn on closing the tab.
  useEffect(() => () => { if (Object.keys(draftsRef.current).length) saveRef.current() }, [])
  useEffect(() => {
    const h = (e) => { if (Object.keys(draftsRef.current).length) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [])

  if (sectionQuery.isLoading) return <Card><LoadingState label="Loading section…" /></Card>
  if (sectionQuery.isError) return <Card><ErrorState message={errMessage(sectionQuery.error, 'Could not load this section.')} onRetry={() => sectionQuery.refetch()} /></Card>

  const report = detail.report
  const dirty = Object.keys(drafts).length > 0
  const commentsByQ = {}
  for (const c of detail.comments) if (c.question_id) (commentsByQ[c.question_id] ||= []).push(c)
  const sectionComments = detail.comments.filter((c) => !c.question_id)

  function change(qid, value) {
    if (saveState === 'saved') setSaveState('idle')
    setDrafts((d) => ({ ...d, [qid]: value }))
  }

  function reloadAfterConflict() {
    setDrafts({})
    setSaveState('idle')
    setSaveError(null)
    sectionQuery.refetch()
  }

  async function doSubmit() {
    // Warnings (e.g. a headcount that disagrees with Section A) do not
    // block submission — some are legitimate — but they must be seen:
    // the first click asks for confirmation, the second submits.
    if (report.warnings.length && !confirmWarnings) {
      setConfirmWarnings(true)
      return
    }
    setConfirmWarnings(false)
    if (dirty) await doSave()
    submit.mutate({ setId, code }, {
      onSuccess: () => pushToast(`${sectionName(meta.code, meta)} submitted for review.`),
      onError: (e) => pushToast(errMessage(e, 'Could not submit.')),
    })
  }

  const title = code.startsWith('P') ? `${meta.title}: ${meta.statement}` : meta.title
  const hiddenByDept = bank.questions.filter((q) => q.section === code).length - questions.length
  const questionnaire = questions.filter(isQuestionnaire)
  const fromSheets = questions.filter((q) => !isQuestionnaire(q))
  const pending = detail.pending_reviews || []
  const wf = (qid) => detail.answers[qid]?.workflow
  const sendable = questionnaire.filter((q) => {
    const w = wf(q.id)
    return w?.can_answer && (w.status === 'open' || w.status === 'returned') && detail.answers[q.id]?.answered && !(q.id in drafts)
  }).map((q) => q.id)
  const reviewable = questionnaire.filter((q) => wf(q.id)?.can_review).map((q) => q.id)

  function runQ(key, mutation, vars, okMsg, after) {
    setBusyQ(key)
    mutation.mutate({ setId, code, ...vars }, {
      onSuccess: () => { if (okMsg) pushToast(okMsg); after?.() },
      onError: (e) => pushToast(errMessage(e, 'Could not update the answer.')),
      onSettled: () => setBusyQ(null),
    })
  }

  function renderQuestion(q, lastGroupRef) {
    const header = q.group !== lastGroupRef.current ? q.group : null
    lastGroupRef.current = q.group
    const info = detail.answers[q.id]
    const value = q.id in drafts ? drafts[q.id] : info?.value
    return (
      <div key={q.id}>
        {header && (
          <h3 className="text-[11px] font-semibold text-ink-900 mt-4 mb-2 px-1 flex items-center gap-2">
            {header}
            {q.indicator === 'leadership' && <span className="text-[9px] font-normal text-ink-500">Voluntary under SEBI's format</span>}
            {q.indicator === 'helper' && <span className="text-[9px] font-normal text-ink-500">Used for calculations — not printed as a BRSR question</span>}
          </h3>
        )}
        <BrsrQuestion
          q={q} value={value} info={info} comments={commentsByQ[q.id]} labels={labels}
          editable={canEdit && saveState !== 'conflict' && info?.workflow?.can_answer !== false} dirty={q.id in drafts}
          onChange={(v) => change(q.id, v)} pushToast={pushToast} onShowHistory={setHistoryFor}
          evidenceCount={(detail.evidence || []).filter((e) => e.question_id === q.id).length}
          workflowBusy={busyQ === q.id || busyQ === 'bulk'}
          onSendForReview={() => runQ(q.id, sendQ, { questionIds: [q.id] }, 'Sent for review.')}
          onReviewAnswer={(decision, note, done) => runQ(q.id, reviewQ, { questionIds: [q.id], decision, note },
            decision === 'approved' ? 'Answer approved.' : 'Answer returned to the SPOC.', done)}
        />
      </div>
    )
  }
  const qGroup = { current: null }
  const dGroup = { current: null }

  return (
    <div className="space-y-3 min-w-0">
      <div className="bg-white border border-surface-border rounded-lg p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1"><StatusBadge status={detail.status} />
              {detail.submission_count > 1 && <span className="text-[9px] text-ink-500">Submission {detail.submission_count}</span>}
            </div>
            <h2 className="text-[13px] font-semibold text-ink-900 leading-snug">{title}</h2>
            {meta.intro && <p className="text-[10px] text-ink-500 mt-1">{meta.intro}</p>}
            {hiddenByDept > 0 && (
              <p className="text-[9px] text-ink-500 mt-1">Showing {dept}'s questions · {hiddenByDept} other question{hiddenByDept > 1 ? 's' : ''} in this section belong to other departments.</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <SaveIndicator state={saveState} dirty={dirty} error={saveError} onRetry={doSave} />
            {detail.editable && hasPermission('dataset:submit') && (
              <Button size="sm" onClick={doSubmit} disabled={!report.ready_to_submit || pending.length > 0 || submit.isPending || saveState === 'conflict'}
                title={!report.ready_to_submit ? 'Answer every required question and fix errors first'
                  : pending.length ? `${pending.length} answer(s) still need their reviewer's approval` : ''}>
                {submit.isPending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                {confirmWarnings ? `Submit with ${report.warnings.length} warning${report.warnings.length > 1 ? 's' : ''}` : 'Submit for review'}
              </Button>
            )}
            {confirmWarnings && (
              <Button variant="ghost" size="sm" onClick={() => setConfirmWarnings(false)}>Cancel</Button>
            )}
            {['submitted', 'internally_approved'].includes(detail.status) && hasPermission('dataset:submit') && (
              <Button variant="ghost" size="sm" disabled={withdraw.isPending}
                onClick={() => withdraw.mutate({ setId, code }, { onError: (e) => pushToast(errMessage(e, 'Could not withdraw.')) })}>
                <Undo2 size={13} /> Withdraw
              </Button>
            )}
            {detail.status === 'approved' && hasPermission('dataset:submit') && (
              <Button variant="ghost" size="sm" onClick={() => setShowReopen((v) => !v)}><Unlock size={13} /> Reopen</Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-3 text-[10px]">
          <span className="text-ink-700"><b className="tabular-nums">{report.required_answered}/{report.required}</b> required answered</span>
          {report.errors.length > 0 && <a href={`#q-${report.errors[0].question_id}`} className="flex items-center gap-1 text-status-pending"><AlertCircle size={11} /> {report.errors.length} error{report.errors.length > 1 ? 's' : ''}</a>}
          {report.warnings.length > 0 && <a href={`#q-${report.warnings[0].question_id}`} className="flex items-center gap-1 text-status-review"><AlertTriangle size={11} /> {report.warnings.length} warning{report.warnings.length > 1 ? 's' : ''}</a>}
          {report.missing.length > 0 && <a href={`#q-${report.missing[0]}`} className="text-ink-500 underline decoration-dotted">{report.missing.length} still to answer</a>}
          {pending.length > 0 && detail.editable && (
            <a href={`#q-${pending[0]}`} className="text-status-review underline decoration-dotted">{pending.length} answer{pending.length > 1 ? 's' : ''} awaiting approval</a>
          )}
          {report.ready_to_submit && !pending.length && detail.editable && <span className="flex items-center gap-1 text-status-approved"><CheckCircle2 size={11} /> Ready to submit</span>}
          <span className="flex-1" />
          {detail.editable && sendable.length > 1 && (
            <Button size="sm" variant="ghost" disabled={busyQ === 'bulk'}
              onClick={() => runQ('bulk', sendQ, { questionIds: sendable }, `${sendable.length} answers sent for review.`)}>
              <Send size={12} /> Send {sendable.length} answers for review
            </Button>
          )}
          {reviewable.length > 1 && (
            <Button size="sm" variant="subtle" disabled={busyQ === 'bulk'}
              onClick={() => runQ('bulk', reviewQ, { questionIds: reviewable, decision: 'approved' }, `${reviewable.length} answers approved.`)}>
              <CheckCircle2 size={12} /> Approve {reviewable.length} answers
            </Button>
          )}
        </div>
        {detail.data_changed && (
          <p className="mt-3 text-[10px] text-ink-900 bg-status-pending/10 rounded px-3 py-2">
            The approved data sheets changed after this section was approved, so its figures are different now. Reopen it and have it approved again before the report is generated.
          </p>
        )}

        {confirmWarnings && (
          <div className="mt-3 text-[10px] bg-status-review/10 text-ink-900 rounded px-3 py-2 space-y-1">
            <p className="font-semibold">Please confirm these before submitting — the reviewer will see them too:</p>
            {report.warnings.map((w, i) => <p key={i} className="flex items-start gap-1.5"><AlertTriangle size={11} className="mt-px text-status-review shrink-0" />{fillLabels(w.message, labels)}</p>)}
          </div>
        )}

        {showReopen && (
          <div className="mt-3 pt-3 border-t border-surface-border flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[240px]">
              <Field label="Why reopen this approved section? (recorded in the audit log)">
                <input value={reopenReason} onChange={(e) => setReopenReason(e.target.value)} className="w-full px-3 py-2 rounded-md border border-surface-border text-[10px]" />
              </Field>
            </div>
            <Button size="sm" variant="dark" disabled={!reopenReason.trim() || reopen.isPending}
              onClick={() => reopen.mutate({ setId, code, reason: reopenReason }, {
                onSuccess: () => { setShowReopen(false); setReopenReason(''); pushToast('Section reopened. It needs to be submitted and approved again.') },
                onError: (e) => pushToast(errMessage(e, 'Could not reopen.')),
              })}>Reopen section</Button>
          </div>
        )}

        {detail.status === 'submitted' && (
          <p className="mt-3 text-[10px] text-ink-700 bg-status-review/10 rounded px-3 py-2">
            Submitted by {detail.submitted_by || 'a team member'} on {new Date(detail.submitted_at).toLocaleString()}.{' '}
            {detail.internal_review_required ? 'Waiting for your company\'s internal review, then Deloitte\'s.' : 'Answers are locked while it is under review.'}
          </p>
        )}
        {detail.status === 'internally_approved' && (
          <p className="mt-3 text-[10px] text-ink-700 bg-blue-50 rounded px-3 py-2">
            Approved internally by {detail.internal_reviewed_by} on {new Date(detail.internal_reviewed_at).toLocaleString()}
            {detail.internal_review_note ? ` (“${detail.internal_review_note}”)` : ''}. Now with Deloitte for final review.
          </p>
        )}
        {detail.status === 'approved' && (
          <p className="mt-3 text-[10px] text-ink-700 bg-status-approved/10 rounded px-3 py-2">
            {detail.internal_reviewed_by && <>Approved internally by {detail.internal_reviewed_by}; </>}
            Approved by {detail.decided_by || 'a reviewer'} on {new Date(detail.decided_at).toLocaleString()}. {detail.decision_note}
          </p>
        )}
        {sectionComments.length > 0 && detail.status !== 'approved' && (
          <div className="mt-3 space-y-1">
            {sectionComments.slice(-3).map((c) => (
              <p key={c.public_id} className={`text-[10px] rounded px-3 py-2 ${detail.status === 'changes_requested' ? 'bg-status-pending/10 text-ink-900' : 'bg-surface-muted text-ink-700'}`}>
                <b>{c.author}</b> · {new Date(c.created_at).toLocaleDateString()}: {c.body}
              </p>
            ))}
          </div>
        )}
        {saveState === 'conflict' && (
          <div className="mt-3 flex items-center justify-between gap-3 text-[10px] bg-status-pending/10 text-ink-900 rounded px-3 py-2">
            <span>{saveError} Your unsaved edits in this section will be discarded.</span>
            <Button size="sm" variant="ghost" onClick={reloadAfterConflict}><RefreshCw size={12} /> Load latest</Button>
          </div>
        )}
      </div>

      <SectionEvidence setId={setId} code={code} detail={detail} questions={questions} pushToast={pushToast} />

      {questionnaire.map((q) => renderQuestion(q, qGroup))}

      {fromSheets.length > 0 && (
        <div className="bg-white border border-surface-border rounded-lg">
          <button type="button" onClick={() => setShowData((v) => !v)} aria-expanded={showData}
            className="w-full flex items-center gap-2 px-4 py-3 text-left">
            {showData ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            <Database size={13} className="text-brand-greenDark" />
            <span className="text-[11px] font-semibold text-ink-900">From data sheets</span>
            <span className="text-[10px] text-ink-500">{fromSheets.length} table{fromSheets.length > 1 ? 's' : ''} built automatically from the approved uploads — nothing to type</span>
            {(detail.data_sheets?.warnings || []).length > 0 && (
              <span className="ml-auto text-[9px] text-status-review">{detail.data_sheets.warnings.length} data gap{detail.data_sheets.warnings.length > 1 ? 's' : ''}</span>
            )}
          </button>
          {showData && (
            <div className="px-3 pb-3 space-y-3">
              {(detail.data_sheets?.warnings || []).map((w, i) => (
                <p key={i} className="flex items-start gap-1.5 text-[10px] text-ink-700 px-1"><AlertTriangle size={11} className="mt-px text-status-review shrink-0" />{w.message}</p>
              ))}
              {fromSheets.map((q) => renderQuestion(q, dGroup))}
            </div>
          )}
        </div>
      )}

      {historyFor && <HistoryDrawer setId={setId} qid={historyFor} onClose={() => setHistoryFor(null)} />}
    </div>
  )
}

function SaveIndicator({ state, dirty, error, onRetry }) {
  if (state === 'saving') return <span className="flex items-center gap-1 text-[10px] text-ink-500"><Loader2 size={11} className="animate-spin" /> Saving…</span>
  if (state === 'error') return (
    <span className="flex items-center gap-1 text-[10px] text-status-pending">
      <AlertCircle size={11} /> {error}
      <button type="button" onClick={onRetry} className="underline ml-1">Retry</button>
    </span>
  )
  if (state === 'conflict') return <span className="text-[10px] text-status-pending">Not saved</span>
  if (dirty) return <span className="text-[10px] text-status-review">Unsaved changes</span>
  if (state === 'saved') return <span className="flex items-center gap-1 text-[10px] text-status-approved"><CheckCircle2 size={11} /> All changes saved</span>
  return null
}

function HistoryDrawer({ setId, qid, onClose }) {
  const q = useAnswerHistory(setId, qid, { enabled: true })
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/20" onClick={onClose}>
      <div className="w-full max-w-sm h-full bg-white shadow-xl p-5 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-ink-900">Change history · {qid}</h3>
          <button type="button" onClick={onClose} className="text-ink-300 hover:text-ink-700"><X size={14} /></button>
        </div>
        {q.isLoading ? <LoadingState label="Loading…" /> : q.isError ? <ErrorState message="Could not load history." /> : (
          <ol className="space-y-3">
            {q.data.map((h) => (
              <li key={h.revision} className="border-l-2 border-brand-green/40 pl-3">
                <p className="text-[10px] font-medium text-ink-900">Revision {h.revision}{h.source === 'carry_forward' ? ' · carried forward from last year' : ''}</p>
                <p className="text-[9px] text-ink-500">{h.changed_by} · {new Date(h.changed_at).toLocaleString()}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
