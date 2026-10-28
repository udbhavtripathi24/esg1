import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle, Archive, ArrowLeft, CheckCircle2, Copy, Eye, LayoutTemplate, Loader2, Lock, MoreHorizontal, RotateCcw,
  Send, Square, Trash2,
} from 'lucide-react'
import { Button, Card } from '../ui.jsx'
import LoadingState from '../LoadingState.jsx'
import ErrorState from '../ErrorState.jsx'
import { Toast } from '../assurance/parts.jsx'
import { useToast } from '../assurance/format.js'
import { useSurveysBase } from './util.js'
import { useDeleteSurvey, useSurvey, useSurveyAction, useUpdateSurvey } from '../../hooks/useSurveys.js'
import Builder from './Builder.jsx'
import SettingsPanel from './SettingsPanel.jsx'
import SharePanel from './SharePanel.jsx'
import ResultsPanel from './ResultsPanel.jsx'
import ResponsesPanel from './ResponsesPanel.jsx'
import SurveyForm from './SurveyForm.jsx'
import { KindBadge, Modal, StatusBadge, Tabs } from './parts.jsx'
import { errText, fmtDate } from './logic.js'

export default function SurveyWorkspacePage() {
  const { surveyId } = useParams()
  const q = useSurvey(surveyId)
  const base = useSurveysBase()
  if (q.isLoading) return <Card><LoadingState label="Opening survey…" /></Card>
  if (q.isError) {
    return (
      <Card>
        <ErrorState message={q.error?.status === 404 ? 'This survey doesn’t exist or you don’t have access to it.' : errText(q.error, 'Could not load the survey.')}
          onRetry={q.error?.status === 404 ? undefined : () => q.refetch()} />
        <div className="text-center mt-3"><Link to={base} className="text-xs text-brand-greenDark hover:underline">Back to surveys</Link></div>
      </Card>
    )
  }
  return <Workspace key={q.data.id} survey={q.data} base={base} />
}

function lockedSet(survey) {
  if (!survey.structure_locked) return null
  const ids = new Set()
  for (const s of survey.definition.sections) {
    for (const qq of s.questions) {
      ids.add(qq.id)
      for (const part of ['options', 'rows', 'columns']) (qq[part] || []).forEach((o) => ids.add(o.id))
    }
  }
  return ids
}

function Workspace({ survey, base }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const [defn, setDefn] = useState(survey.definition)
  const [save, setSave] = useState({ state: 'idle' })
  const [preview, setPreview] = useState(false)
  const [problems, setProblems] = useState(null)
  const [menu, setMenu] = useState(false)
  const pending = useRef(null)
  const inflight = useRef(false)
  const timer = useRef(null)
  const update = useUpdateSurvey(survey.id)
  const action = useSurveyAction(survey.id)
  const del = useDeleteSurvey()
  const cacheKey = useMemo(() => ['surveys', 'one', survey.id], [survey.id])
  const live = survey // the page re-renders with the cached copy after every save
  const locked = useMemo(() => lockedSet(live), [live])

  const isTemplate = live.is_template
  const archived = live.status === 'archived'
  const tabs = [
    { key: 'build', label: 'Questions' },
    { key: 'settings', label: 'Settings' },
    ...(!isTemplate ? [{ key: 'share', label: 'Share', count: live.audience?.invited || null }] : []),
    ...(!isTemplate ? [{ key: 'results', label: 'Results', count: live.audience?.responses ?? null }] : []),
    ...(!isTemplate && !live.anonymous ? [{ key: 'responses', label: 'Responses' }] : []),
  ]
  const tab = tabs.some((t) => t.key === params.get('tab')) ? params.get('tab') : (live.status === 'draft' || isTemplate ? 'build' : 'results')
  const setTab = (t) => setParams((p) => { const n = new URLSearchParams(p); n.set('tab', t); return n }, { replace: true })

  // ---- autosave of the questions ------------------------------------------
  const flush = useCallback(async () => {
    if (inflight.current || !pending.current) return
    const body = pending.current
    pending.current = null
    inflight.current = true
    setSave({ state: 'saving' })
    try {
      const cur = qc.getQueryData(cacheKey) || survey
      await update.mutateAsync({ revision: cur.revision, definition: body })
      setSave({ state: 'saved', at: new Date() })
    } catch (e) {
      if (e.code === 'survey_conflict') setSave({ state: 'conflict', message: e.message })
      else if (e.code === 'survey_structure_locked') setSave({ state: 'error', message: e.message, problems: e.details?.problems })
      else { pending.current = pending.current || body; setSave({ state: 'error', message: errText(e, 'Could not save') }) }
    } finally {
      inflight.current = false
      if (pending.current) setTimeout(() => flushRef.current(), 0)
    }
  }, [qc, cacheKey, survey, update])
  const flushRef = useRef(flush)
  useEffect(() => { flushRef.current = flush }, [flush])

  const onDefn = (next) => {
    setDefn(next)
    pending.current = next
    setSave({ state: 'dirty' })
    clearTimeout(timer.current)
    timer.current = setTimeout(() => flushRef.current(), 900)
  }

  useEffect(() => {
    const warn = (e) => { if (pending.current || inflight.current) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', warn)
    return () => {
      window.removeEventListener('beforeunload', warn)
      clearTimeout(timer.current)
      if (pending.current) flushRef.current()
    }
  }, [])

  const busy = save.state === 'dirty' || save.state === 'saving'

  const run = async (name, label, body) => {
    setMenu(false)
    try {
      const r = await action.mutateAsync({ action: name, body })
      if (name === 'duplicate' || name === 'save-as-template') {
        toast.push(name === 'duplicate' ? 'Copy created' : 'Saved as a company template')
        if (name === 'duplicate') navigate(`${base}/${r.id}`)
      } else toast.push(label)
      return r
    } catch (e) {
      if (e.code === 'survey_not_ready') setProblems(e.details?.problems || [])
      else toast.push(errText(e, 'That didn’t work'))
      return null
    }
  }

  const publish = async () => {
    clearTimeout(timer.current)
    await flushRef.current()
    const r = await run('publish', 'Published — it’s now open for responses')
    if (r) setTab('share')
  }

  const remove = async () => {
    setMenu(false)
    if (!window.confirm(`Delete “${live.title}”? This can’t be undone.`)) return
    try { await del.mutateAsync(live.id); navigate(base) } catch (e) { toast.push(errText(e, 'Could not delete')) }
  }

  const draft = live.status === 'draft'
  const canDelete = (draft || isTemplate || archived) && !live.has_responses

  return (
    <div>
      <Link to={base} className="inline-flex items-center gap-1 text-[11px] text-ink-500 hover:text-ink-900 mb-3"><ArrowLeft size={13} /> Surveys & Assessments</Link>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold text-ink-900 truncate max-w-[60vw]">{live.title}</h1>
            <StatusBadge status={live.status} />
            <KindBadge kind={live.kind} />
            {live.anonymous && <span className="text-[10px] text-ink-500 bg-surface-muted px-2 py-0.5 rounded-full">Anonymous</span>}
          </div>
          <p className="text-[11px] text-ink-500 mt-1">
            {live.category} · created by {live.created_by || '—'} {fmtDate(live.created_at)}
            {live.status === 'open' && live.closes_at && <> · closes {fmtDate(live.closes_at, true)}</>}
            {live.status === 'scheduled' && <> · opens {fmtDate(live.opens_at, true)}</>}
            {' · '}<SaveState save={save} onRetry={() => { pending.current = pending.current || defn; flushRef.current() }} />
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setPreview(true)}><Eye size={14} /> Preview</Button>
          {draft && !isTemplate && (
            <Button size="sm" onClick={publish} disabled={busy || action.isPending}
              title={live.problems?.length ? `${live.problems.length} thing(s) to fix first` : undefined}>
              {action.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Publish
            </Button>
          )}
          {(live.status === 'open' || live.status === 'scheduled') && (
            <Button size="sm" variant="ghost" onClick={() => window.confirm('Close the survey? People won’t be able to answer until you reopen it.') && run('close', 'Closed')}>
              <Square size={13} /> Close
            </Button>
          )}
          {live.status === 'closed' && <Button size="sm" variant="ghost" onClick={() => run('reopen', 'Reopened')}><RotateCcw size={13} /> Reopen</Button>}
          <div className="relative">
            <Button size="sm" variant="ghost" onClick={() => setMenu((v) => !v)} aria-label="More actions" aria-expanded={menu}><MoreHorizontal size={14} /></Button>
            {menu && (
              <div className="absolute right-0 z-30 mt-1 w-56 bg-white border border-surface-border rounded-lg shadow-lg py-1 text-[11px]" onMouseLeave={() => setMenu(false)}>
                {!isTemplate && <MenuItem icon={Copy} onClick={() => run('duplicate')}>Duplicate</MenuItem>}
                {!isTemplate && <MenuItem icon={LayoutTemplate} onClick={() => run('save-as-template', null, { title: live.title })}>Save as company template</MenuItem>}
                {!isTemplate && !draft && !archived && <MenuItem icon={Archive} onClick={() => window.confirm('Archive this survey? It closes and moves to the archive; results are kept.') && run('archive', 'Archived')}>Archive</MenuItem>}
                {archived && <MenuItem icon={RotateCcw} onClick={() => run('restore', 'Restored')}>Restore</MenuItem>}
                {canDelete && <MenuItem icon={Trash2} danger onClick={remove}>Delete</MenuItem>}
                {!canDelete && <p className="px-3 py-1.5 text-[10px] text-ink-300 flex items-center gap-1"><Lock size={10} /> Surveys with responses are archived, not deleted.</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      {save.state === 'conflict' && (
        <Banner tone="error" action={<Button size="sm" variant="ghost" onClick={() => window.location.reload()}>Reload</Button>}>
          Someone else saved changes to this survey while you were editing. Reload to see their version — your last change wasn’t saved.
        </Banner>
      )}
      {save.state === 'error' && save.problems && (
        <Banner tone="error">{save.message}<ul className="list-disc ml-5 mt-1">{save.problems.map((p) => <li key={p}>{p}</li>)}</ul></Banner>
      )}
      {draft && !isTemplate && live.problems?.length > 0 && tab === 'build' && (
        <ProblemsHint problems={live.problems} />
      )}
      {archived && <Banner tone="info">This survey is archived and read-only. Restore it from the ⋯ menu to make changes.</Banner>}

      <Tabs tabs={tabs} value={tab} onChange={setTab} />

      {tab === 'build' && <Builder defn={defn} onChange={onDefn} assessment={live.kind === 'assessment'} locked={locked} readOnly={archived} />}
      {tab === 'settings' && <SettingsPanel survey={live} onSaved={() => toast.push('Settings saved')} />}
      {tab === 'share' && <SharePanel survey={live} toast={toast.push} />}
      {tab === 'results' && <ResultsPanel survey={live} />}
      {tab === 'responses' && <ResponsesPanel survey={live} />}

      {preview && (
        <Modal title="Preview" subtitle="What respondents see. Nothing is saved." onClose={() => setPreview(false)} wide>
          <SurveyForm compact preview={{
            survey: { title: live.title, description: live.description, welcome: live.welcome, thank_you: live.thank_you,
              anonymous: live.anonymous, closes_at: live.closes_at, minutes: live.minutes, kind: live.kind },
            definition: defn,
          }} onClose={() => setPreview(false)} />
        </Modal>
      )}
      {problems && (
        <Modal title="Before you publish" subtitle={`${problems.length} thing${problems.length === 1 ? '' : 's'} to fix`} onClose={() => setProblems(null)}
          footer={<Button size="sm" onClick={() => { setProblems(null); setTab(problems.some((p) => p.question || p.section) ? 'build' : 'settings') }}>Fix them</Button>}>
          <ul className="space-y-1.5">
            {problems.map((p, i) => (
              <li key={i} className="flex gap-2 text-[11px] text-ink-700"><AlertTriangle size={13} className="text-amber-600 shrink-0 mt-0.5" />{p.message}</li>
            ))}
          </ul>
        </Modal>
      )}
      <Toast msg={toast.msg} />
    </div>
  )
}

function SaveState({ save, onRetry }) {
  if (save.state === 'saving' || save.state === 'dirty') return <span className="inline-flex items-center gap-1"><Loader2 size={11} className="animate-spin" /> Saving…</span>
  if (save.state === 'saved') return <span className="inline-flex items-center gap-1 text-brand-greenDark"><CheckCircle2 size={11} /> Saved</span>
  if (save.state === 'error') return <span className="text-status-pending">Not saved — {save.message} <button type="button" className="underline" onClick={onRetry}>Retry</button></span>
  if (save.state === 'conflict') return <span className="text-status-pending">Not saved</span>
  return <span>All changes saved</span>
}

function MenuItem({ icon: Icon, children, onClick, danger }) {
  return (
    <button type="button" onClick={onClick} className={`w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-surface-muted ${danger ? 'text-status-pending' : 'text-ink-700'}`}>
      <Icon size={13} /> {children}
    </button>
  )
}

export function Banner({ tone = 'info', children, action }) {
  const cls = tone === 'error' ? 'bg-red-50 border-red-200 text-red-800' : tone === 'warn' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-blue-50 border-blue-200 text-blue-900'
  return (
    <div className={`flex items-start gap-3 border rounded-md px-3 py-2.5 mb-4 text-[11px] ${cls}`}>
      <div className="flex-1">{children}</div>
      {action}
    </div>
  )
}

function ProblemsHint({ problems }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-amber-200 bg-amber-50 rounded-md px-3 py-2 mb-4 text-[11px] text-amber-900">
      <button type="button" className="flex items-center gap-2 w-full text-left" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <AlertTriangle size={13} className="text-amber-600" />
        {problems.length} thing{problems.length === 1 ? '' : 's'} to finish before publishing
        <span className="ml-auto text-[10px] underline">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && <ul className="list-disc ml-7 mt-1.5 space-y-0.5">{problems.map((p, i) => <li key={i}>{p.message}</li>)}</ul>}
    </div>
  )
}
