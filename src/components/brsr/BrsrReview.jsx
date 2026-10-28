import { useMemo, useState } from 'react'
import { ArrowLeft, CheckCircle2, XCircle, ClipboardCheck, Loader2, AlertTriangle, AlertCircle } from 'lucide-react'
import { Button, Card, EmptyState, Field } from '../ui.jsx'
import LoadingState from '../LoadingState.jsx'
import ErrorState from '../ErrorState.jsx'
import { useQuestionBank, useReviewQueue, useResponseSet, useSection, useDecideSection } from '../../hooks/useBrsr.js'
import BrsrQuestion from './BrsrQuestion.jsx'
import { EvidenceList } from '../assurance/parts.jsx'
import { downloadEvidence } from '../../api/assurance.js'
import StatusBadge from './StatusBadge.jsx'
import { sectionName as nameFor, fillLabels } from './format.js'

function errMessage(err, fallback) {
  return err?.data?.error?.message || err?.message || fallback
}

function useSectionMeta() {
  const bank = useQuestionBank()
  return useMemo(() => Object.fromEntries((bank.data?.sections || []).map((s) => [s.code, s])), [bank.data])
}

/** Review queue for submitted BRSR sections (needs dataset:review). */
export default function BrsrReview({ pushToast }) {
  const queue = useReviewQueue()
  const sectionMeta = useSectionMeta()
  const [open, setOpen] = useState(null) // {setId, code}

  if (open) return <SectionReview {...open} onBack={() => setOpen(null)} pushToast={pushToast} />

  return (
    <Card title="BRSR sections awaiting review" icon={ClipboardCheck} padded={false}
      subtitle="Each section is approved or sent back on its own. The report can be generated once every section is approved.">
      {queue.isLoading ? <LoadingState label="Loading…" /> :
       queue.isError ? <ErrorState message={errMessage(queue.error, 'Could not load the review queue.')} onRetry={() => queue.refetch()} /> :
       queue.data.length === 0 ? <div className="p-6"><EmptyState icon={ClipboardCheck} title="Nothing to review" subtitle="Submitted BRSR sections will appear here." /></div> : (
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="text-left text-ink-500 border-t border-surface-border">
                <th className="font-medium px-5 py-2.5">Company</th>
                <th className="font-medium px-2 py-2.5">FY</th>
                <th className="font-medium px-2 py-2.5">Section</th>
                <th className="font-medium px-2 py-2.5">Stage</th>
                <th className="font-medium px-2 py-2.5">Submitted</th>
                <th className="font-medium px-2 py-2.5">By</th>
                <th className="font-medium px-5 py-2.5 text-right" />
              </tr>
            </thead>
            <tbody>
              {queue.data.map((r) => (
                <tr key={`${r.response_set_id}-${r.section}`} className="border-t border-surface-border hover:bg-surface-muted/40 cursor-pointer"
                  onClick={() => setOpen({ setId: r.response_set_id, code: r.section })}>
                  <td className="px-5 py-3 font-medium text-ink-900">{r.company_name}</td>
                  <td className="px-2 py-3 text-ink-700">{r.financial_year}</td>
                  <td className="px-2 py-3 text-ink-700">{nameFor(r.section, sectionMeta[r.section])}{r.submission_count > 1 ? ` · resubmission ${r.submission_count}` : ''}</td>
                  <td className="px-2 py-3 text-ink-700">
                    {r.stage === 'internal' ? 'Internal review' : r.internal_reviewed_by ? `Deloitte review · internally approved by ${r.internal_reviewed_by}` : 'Review'}
                  </td>
                  <td className="px-2 py-3 text-ink-500">{new Date(r.submitted_at).toLocaleString()}</td>
                  <td className="px-2 py-3 text-ink-700">{r.submitted_by}{r.own_submission && <span className="ml-1 text-ink-300">(you)</span>}</td>
                  <td className="px-5 py-3 text-right"><span className="text-brand-green font-medium">Review →</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

function SectionReview({ setId, code, onBack, pushToast }) {
  const bank = useQuestionBank()
  const ov = useResponseSet(setId)
  const section = useSection(setId, code)
  const decide = useDecideSection()
  const [note, setNote] = useState('')
  const [qComments, setQComments] = useState({})

  const questions = useMemo(() => (bank.data?.questions || []).filter((q) => q.section === code), [bank.data, code])

  if (bank.isLoading || ov.isLoading || section.isLoading) return <Card><LoadingState label="Loading section…" /></Card>
  if (bank.isError || ov.isError || section.isError) return <Card><ErrorState message="Could not load this section." onRetry={() => section.refetch()} /></Card>

  const d = section.data
  const meta = bank.data.sections.find((s) => s.code === code)
  const commentsList = Object.entries(qComments).filter(([, v]) => v.trim()).map(([question_id, body]) => ({ question_id, body }))
  const awaiting = d.status === 'submitted' || d.status === 'internally_approved'
  const internalStage = d.status === 'submitted' && d.internal_review_required
  const name = nameFor(code, meta)

  function send(decision) {
    decide.mutate({ setId, code, decision, note, questionComments: decision === 'changes_requested' ? commentsList : [] }, {
      onSuccess: () => {
        pushToast(decision === 'approved' ? `${name} approved.` : `Changes requested on ${name}.`)
        onBack()
      },
      onError: (e) => pushToast(errMessage(e, 'Could not record the decision.')),
    })
  }

  let lastGroup = null
  return (
    <div className="space-y-3">
      <button type="button" onClick={onBack} className="flex items-center gap-1 text-[11px] text-ink-500 hover:text-ink-900"><ArrowLeft size={13} /> Back to queue</button>

      <div className="bg-white border border-surface-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-1"><StatusBadge status={d.status} /><span className="text-[10px] text-ink-500">{ov.data.company_name} · FY {ov.data.financial_year}</span></div>
        <h2 className="text-[13px] font-semibold text-ink-900">{code.startsWith('P') ? `${meta.title}: ${meta.statement}` : meta.title}</h2>
        {d.data_changed && <p className="text-[10px] text-status-pending mt-1">The approved data sheets changed after this section was approved.</p>}
        {d.internal_reviewed_by && (
          <p className="text-[10px] text-ink-700 mt-1">Approved internally by {d.internal_reviewed_by} on {new Date(d.internal_reviewed_at).toLocaleString()}{d.internal_review_note ? ` — “${d.internal_review_note}”` : ''}</p>
        )}
        <p className="text-[10px] text-ink-500 mt-1">Submitted by {d.submitted_by} on {d.submitted_at ? new Date(d.submitted_at).toLocaleString() : '–'}</p>
        {(d.report.warnings.length > 0 || d.report.errors.length > 0) && (
          <div className="mt-2 space-y-1">
            {d.report.errors.map((i, n) => <p key={`e${n}`} className="flex items-start gap-1.5 text-[10px] text-status-pending"><AlertCircle size={11} className="mt-px" />{i.question_id}: {fillLabels(i.message, ov.data.fy_labels)}</p>)}
            {d.report.warnings.map((i, n) => <p key={`w${n}`} className="flex items-start gap-1.5 text-[10px] text-status-review"><AlertTriangle size={11} className="mt-px" />{i.question_id}: {fillLabels(i.message, ov.data.fy_labels)}</p>)}
          </div>
        )}
      </div>

      <div className="bg-white border border-surface-border rounded-lg p-4">
        <h3 className="text-[11px] font-semibold text-ink-900 mb-2">Supporting evidence ({(d.evidence || []).length})</h3>
        <EvidenceList files={d.evidence} empty="The client attached no evidence to this section."
          onDownload={(f) => downloadEvidence(f, { setId }).catch((e) => pushToast(errMessage(e, 'Download failed.')))} />
      </div>

      {questions.map((q) => {
        const header = q.group !== lastGroup ? q.group : null
        lastGroup = q.group
        const info = d.answers[q.id]
        return (
          <div key={q.id}>
            {header && <h3 className="text-[11px] font-semibold text-ink-900 mt-4 mb-2 px-1">{header}</h3>}
            <BrsrQuestion q={q} value={info?.value} info={info} labels={ov.data.fy_labels} editable={false} dirty={false}
              comments={d.comments.filter((c) => c.question_id === q.id)}
              reviewComment={awaiting ? qComments[q.id] : undefined}
              onReviewComment={awaiting ? (qid, v) => setQComments((c) => ({ ...c, [qid]: v })) : undefined} />
          </div>
        )
      })}

      {awaiting && (
        <div className="bg-white border border-surface-border rounded-lg p-4 sticky bottom-3 shadow-md">
          <Field label="Decision note (required — sent to the person who submitted)">
            <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-surface-border text-[10px] focus:outline-none focus:ring-2 focus:ring-brand-green/30" />
          </Field>
          <div className="flex items-center justify-between mt-3">
            <span className="text-[10px] text-ink-500">{commentsList.length} question comment{commentsList.length === 1 ? '' : 's'} will be sent with “Request changes”</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" disabled={!note.trim() || decide.isPending} onClick={() => send('changes_requested')}>
                <XCircle size={13} /> Request changes
              </Button>
              <Button size="sm" disabled={!note.trim() || decide.isPending || commentsList.length > 0} onClick={() => send('approved')}
                title={commentsList.length ? 'Clear question comments to approve, or request changes' : ''}>
                {decide.isPending ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} {internalStage ? 'Approve internally' : 'Approve'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
