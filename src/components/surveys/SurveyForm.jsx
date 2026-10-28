import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, EyeOff, Loader2, Lock, Send } from 'lucide-react'
import QuestionInput from './QuestionInput.jsx'
import { fmtDate, missingRequired, progress, visibility } from './logic.js'

/**
 * The respondent's form, one section per page.
 *
 *   transport  { load, save, submit, upload, removeFile } — in-app or by link
 *   preview    { survey, definition } — builder preview: nothing is saved
 *
 * Answers autosave a moment after each change; the server re-validates on
 * submit and its per-question messages are shown where they belong.
 */
export default function SurveyForm({ transport, preview, onClose, compact = false }) {
  const [payload, setPayload] = useState(preview ? previewPayload(preview) : null)
  const [loadError, setLoadError] = useState(null)
  const [answers, setAnswers] = useState(() => ({}))
  const [files, setFiles] = useState([])
  const [page, setPage] = useState(-1) // -1 = welcome
  const [errors, setErrors] = useState({})
  const [save, setSave] = useState({ state: 'idle', at: null })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [done, setDone] = useState(null)
  const [identity, setIdentity] = useState({ name: '', organisation: '' })
  const revision = useRef(null)
  const dirty = useRef(false)
  const timer = useRef(null)
  const topRef = useRef(null)

  useEffect(() => {
    if (preview || !transport) return undefined
    let live = true
    transport.load().then((data) => {
      if (!live) return
      setPayload(data)
      setAnswers(data.response?.answers || {})
      setFiles(data.files || [])
      revision.current = data.response?.revision ?? null
    }).catch((e) => live && setLoadError(e))
    return () => { live = false }
  }, [transport, preview])

  const survey = payload?.survey
  const defn = survey?.definition
  const visible = useMemo(() => (defn ? visibility(defn, answers) : {}), [defn, answers])
  const pages = useMemo(() => (defn ? defn.sections.filter((s) => s.questions.some((q) => visible[q.id])) : []), [defn, visible])
  const prog = useMemo(() => (defn ? progress(defn, answers) : { percent: 0 }), [defn, answers])
  const status = payload?.response?.status
  const closed = survey && survey.status !== 'open' && !preview

  const flush = useCallback(async () => {
    if (preview || !transport || !dirty.current) return true
    dirty.current = false
    setSave({ state: 'saving', at: null })
    try {
      const r = await transport.save(answersRef.current, revision.current)
      revision.current = r.revision
      setSave({ state: 'saved', at: new Date() })
      return true
    } catch (e) {
      dirty.current = true
      setSave({ state: 'error', at: null, message: e.message, fields: e.details?.errors })
      if (e.details?.errors) setErrors((prev) => ({ ...prev, ...e.details.errors }))
      return false
    }
  }, [preview, transport])

  const answersRef = useRef(answers)
  useEffect(() => { answersRef.current = answers }, [answers])

  useEffect(() => () => clearTimeout(timer.current), [])

  const onAnswer = (key, value) => {
    setAnswers((prev) => {
      const next = { ...prev }
      if (value === null || value === undefined || value === '') delete next[key]
      else next[key] = value
      return next
    })
    const qid = key.split('.')[0]
    if (errors[qid]) setErrors(({ [qid]: _gone, ...rest }) => rest)
    if (!preview && transport) {
      dirty.current = true
      clearTimeout(timer.current)
      timer.current = setTimeout(flush, 1200)
    }
  }

  const onUpload = transport && !preview ? async (qid, file) => {
    await flush()
    const r = await transport.upload(qid, file)
    setFiles((prev) => [...prev, r.file])
    revision.current = r.response.revision
    setAnswers((prev) => ({ ...prev, [qid]: r.response.answers[qid] }))
    if (errors[qid]) setErrors(({ [qid]: _gone, ...rest }) => rest)
  } : null

  const onRemoveFile = transport && !preview ? async (fid) => {
    const r = await transport.removeFile(fid)
    revision.current = r.response.revision
    setFiles((prev) => prev.filter((f) => f.id !== fid))
    setAnswers((prev) => {
      const next = { ...prev }
      const qid = Object.keys(next).find((k) => Array.isArray(next[k]) && next[k].includes(fid))
      if (qid) {
        next[qid] = next[qid].filter((x) => x !== fid)
        if (!next[qid].length) delete next[qid]
      }
      return next
    })
  } : null

  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const go = async (to) => {
    if (to > page && page >= 0) {
      const missing = missingRequired(pages[page].questions, answers, visible)
      if (Object.keys(missing).length) {
        setErrors(missing)
        document.getElementById(`sq-${Object.keys(missing)[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }
    }
    clearTimeout(timer.current)
    flush()
    setPage(to)
    scrollTop()
  }

  const submit = async () => {
    const missing = missingRequired(pages[page].questions, answers, visible)
    if (Object.keys(missing).length) { setErrors(missing); return }
    setSubmitError(null)
    if (preview) { setDone({ submitted: true, thank_you: survey.thank_you, preview: true }); return }
    clearTimeout(timer.current)
    dirty.current = false
    setSubmitting(true)
    try {
      const ask = survey.ask_identity
      const r = await transport.submit(answers, ask ? { name: identity.name || null, organisation: identity.organisation || null } : undefined)
      setDone(r)
      scrollTop()
    } catch (e) {
      const fieldErrors = e.details?.errors
      if (fieldErrors) {
        setErrors(fieldErrors)
        const first = pages.findIndex((s) => s.questions.some((q) => fieldErrors[q.id]))
        if (first >= 0) setPage(first)
        setSubmitError('Some answers need attention — they are marked below.')
      } else setSubmitError(e.message || 'Could not submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ---- states ---------------------------------------------------------------
  if (loadError) {
    return (
      <Shell compact={compact}>
        <div className="text-center py-10">
          <Lock size={28} className="mx-auto text-ink-300 mb-3" />
          <h2 className="text-lg font-semibold text-ink-900">{loadError.status === 404 ? 'This link isn’t valid' : 'Couldn’t open the survey'}</h2>
          <p className="text-sm text-ink-500 mt-1">
            {loadError.status === 404 ? 'It may have expired or been replaced. Ask the person who sent it for a new one.' : loadError.message}
          </p>
        </div>
      </Shell>
    )
  }
  if (!payload) {
    return <Shell compact={compact}><div className="py-16 flex justify-center text-ink-300"><Loader2 className="animate-spin" /></div></Shell>
  }

  if (done || status === 'submitted') {
    const score = done?.score || payload.response?.score
    return (
      <Shell compact={compact}>
        <div ref={topRef} className="text-center py-8">
          <CheckCircle2 size={40} className="mx-auto text-brand-green mb-3" />
          <h2 className="text-xl font-semibold text-ink-900">{done ? 'Thank you' : 'You’ve already responded'}</h2>
          <p className="text-sm text-ink-500 mt-2 max-w-md mx-auto whitespace-pre-line">
            {done?.preview ? 'This was a preview — nothing was saved.' : survey.thank_you || 'Your response has been recorded.'}
          </p>
          {!done && payload.response?.submitted_at && (
            <p className="text-xs text-ink-300 mt-2">Submitted {fmtDate(payload.response.submitted_at, true)}</p>
          )}
        </div>
        {score && <ScoreCard score={score} />}
        {onClose && <div className="text-center mt-6"><button type="button" onClick={onClose} className="text-sm text-brand-greenDark hover:underline">Back</button></div>}
      </Shell>
    )
  }

  if (page === -1) {
    const started = Object.keys(answers).length > 0
    return (
      <Shell compact={compact}>
        <div ref={topRef}>
          {preview && <PreviewBanner />}
          {survey.company && <p className="text-xs font-medium uppercase tracking-wide text-brand-greenDark mb-2">{survey.company}</p>}
          <h1 className="text-2xl font-semibold text-ink-900">{survey.title}</h1>
          {survey.description && <p className="text-sm text-ink-500 mt-2 whitespace-pre-line">{survey.description}</p>}
          {survey.welcome && <p className="text-sm text-ink-700 mt-4 leading-relaxed whitespace-pre-line">{survey.welcome}</p>}
          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-5 text-xs text-ink-500">
            <span className="inline-flex items-center gap-1.5"><Clock size={13} /> About {survey.minutes || 5} min</span>
            {survey.anonymous && <span className="inline-flex items-center gap-1.5"><EyeOff size={13} /> Anonymous — your name isn’t stored with your answers</span>}
            {survey.closes_at && <span>Open until {fmtDate(survey.closes_at, true)}</span>}
          </div>
          {closed ? (
            <div className="mt-6 px-4 py-3 rounded-md bg-amber-50 text-sm text-amber-800">
              {survey.status === 'scheduled' ? `This survey opens on ${fmtDate(survey.opens_at, true)}.` : 'This survey is closed.'}
            </div>
          ) : !pages.length ? (
            <p className="mt-6 text-sm text-ink-500">This survey has no questions yet.</p>
          ) : (
            <button type="button" onClick={() => go(0)}
              className="mt-7 inline-flex items-center gap-2 px-6 py-3 rounded-md bg-brand-green text-white text-sm font-medium hover:bg-brand-greenDark">
              {started ? 'Continue' : 'Start'} <ArrowRight size={16} />
            </button>
          )}
          {started && !closed && <p className="text-xs text-ink-300 mt-2">{prog.percent}% answered — you can pick up where you left off.</p>}
        </div>
      </Shell>
    )
  }

  const sec = pages[Math.min(page, pages.length - 1)]
  const last = page >= pages.length - 1
  return (
    <Shell compact={compact}>
      <div ref={topRef} />
      {preview && <PreviewBanner />}
      <div className="flex items-center justify-between text-xs text-ink-500 mb-2">
        <span>Section {page + 1} of {pages.length}</span>
        <SaveIndicator save={save} preview={preview} onRetry={flush} />
      </div>
      <div className="w-full h-1.5 rounded-full bg-ink-100 overflow-hidden mb-6" role="progressbar" aria-valuenow={prog.percent} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-brand-green transition-all" style={{ width: `${prog.percent}%` }} />
      </div>
      <h2 className="text-lg font-semibold text-ink-900">{sec.title}</h2>
      {sec.description && <p className="text-sm text-ink-500 mt-1 whitespace-pre-line">{sec.description}</p>}

      <div className="mt-6 space-y-7">
        {sec.questions.filter((q) => visible[q.id]).map((q, i) => (
          <div key={q.id} id={`sq-${q.id}`} className="scroll-mt-24">
            {q.type === 'statement' ? (
              <div className="text-sm text-ink-700 bg-surface-muted rounded-md px-4 py-3 whitespace-pre-line">{q.title}{q.help ? `\n${q.help}` : ''}</div>
            ) : (
              <>
                <label className="block text-sm font-medium text-ink-900 mb-1">
                  <span className="text-ink-300 mr-1.5 font-normal">{i + 1}.</span>{q.title || 'Untitled question'}
                  {q.required ? <span className="text-status-pending ml-0.5" aria-label="required">*</span> : <span className="text-xs font-normal text-ink-300 ml-2">Optional</span>}
                </label>
                {q.help && <p className="text-xs text-ink-500 mb-2.5 whitespace-pre-line">{q.help}</p>}
                <div className={q.help ? '' : 'mt-2'}>
                  <QuestionInput q={q} value={answers[q.id]} answers={answers} onAnswer={onAnswer} files={files}
                    onUpload={onUpload} onRemoveFile={onRemoveFile} disabled={closed} />
                </div>
                {errors[q.id] && <p className="text-xs text-status-pending mt-1.5" role="alert">{errors[q.id]}</p>}
              </>
            )}
          </div>
        ))}
      </div>

      {last && survey.ask_identity && (
        <div className="mt-8 pt-6 border-t border-surface-border">
          <p className="text-sm font-medium text-ink-900">About you <span className="text-xs font-normal text-ink-300 ml-1">Optional</span></p>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <input className="w-full px-3 py-2.5 rounded-md border border-surface-border text-sm" placeholder="Your name" maxLength={120}
              value={identity.name} onChange={(e) => setIdentity((p) => ({ ...p, name: e.target.value }))} />
            <input className="w-full px-3 py-2.5 rounded-md border border-surface-border text-sm" placeholder="Organisation" maxLength={120}
              value={identity.organisation} onChange={(e) => setIdentity((p) => ({ ...p, organisation: e.target.value }))} />
          </div>
        </div>
      )}

      {submitError && <p className="mt-6 text-sm text-status-pending" role="alert">{submitError}</p>}
      <div className="flex items-center justify-between mt-8 pt-5 border-t border-surface-border">
        <button type="button" onClick={() => go(page - 1)} className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900">
          <ArrowLeft size={15} /> Back
        </button>
        {last ? (
          <button type="button" onClick={submit} disabled={submitting || closed}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md bg-brand-green text-white text-sm font-medium hover:bg-brand-greenDark disabled:opacity-60">
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Submit
          </button>
        ) : (
          <button type="button" onClick={() => go(page + 1)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md bg-brand-green text-white text-sm font-medium hover:bg-brand-greenDark">
            Next <ArrowRight size={15} />
          </button>
        )}
      </div>
    </Shell>
  )
}

function previewPayload({ survey, definition }) {
  return {
    survey: { ...survey, definition, status: 'open', company: null, ask_identity: false },
    response: { status: 'not_started', answers: {} }, files: [],
  }
}

function Shell({ children, compact }) {
  return <div className={`bg-white ${compact ? '' : 'border border-surface-border rounded-lg shadow-sm'} px-6 sm:px-10 py-8`}>{children}</div>
}

function PreviewBanner() {
  return <div className="mb-5 px-3 py-2 rounded-md bg-blue-50 text-xs text-blue-800">Preview — this is what respondents see. Answers aren’t saved.</div>
}

function SaveIndicator({ save, preview, onRetry }) {
  if (preview) return null
  if (save.state === 'saving') return <span className="inline-flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Saving…</span>
  if (save.state === 'saved') return <span>Saved {save.at?.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
  if (save.state === 'error') {
    return (
      <span className="text-status-pending">
        {save.fields ? 'Some answers need attention' : 'Not saved'} ·{' '}
        <button type="button" className="underline" onClick={onRetry}>retry</button>
      </span>
    )
  }
  return null
}

export function ScoreCard({ score }) {
  return (
    <div className="max-w-md mx-auto border border-surface-border rounded-lg p-5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-ink-500">Your score</span>
        <span className="text-3xl font-semibold text-ink-900">{score.percent ?? '—'}<span className="text-base text-ink-500">%</span></span>
      </div>
      {score.band && (
        <div className="mt-2">
          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-brand-green/15 text-brand-greenDark">{score.band}</span>
          {score.band_description && <p className="text-xs text-ink-500 mt-2">{score.band_description}</p>}
        </div>
      )}
      {score.sections?.length > 1 && (
        <div className="mt-4 space-y-2">
          {score.sections.map((s) => (
            <div key={s.title}>
              <div className="flex justify-between text-xs text-ink-700"><span>{s.title}</span><span>{s.percent}%</span></div>
              <div className="h-1.5 rounded-full bg-ink-100 mt-1 overflow-hidden"><div className="h-full rounded-full bg-brand-green" style={{ width: `${s.percent}%` }} /></div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

