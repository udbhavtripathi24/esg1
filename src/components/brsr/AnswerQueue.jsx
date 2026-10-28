import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, ListChecks } from 'lucide-react'
import { Card, EmptyState } from '../ui.jsx'
import LoadingState from '../LoadingState.jsx'
import ErrorState from '../ErrorState.jsx'
import { useQuestionBank, useQuestionQueue, useResponseSet, useSection, useReviewQuestions } from '../../hooks/useBrsr.js'
import BrsrQuestion from './BrsrQuestion.jsx'

function errMessage(err, fallback) {
  return err?.message || fallback
}

/**
 * Questionnaire answers waiting for this person's approval (as a
 * department reviewer). Each one opens read-only with Approve / Return.
 */
export default function AnswerQueue({ pushToast }) {
  const queue = useQuestionQueue()
  const bank = useQuestionBank()
  const [open, setOpen] = useState(null)
  const byId = useMemo(() => Object.fromEntries((bank.data?.questions || []).map((q) => [q.id, q])), [bank.data])

  return (
    <Card title="BRSR answers awaiting your approval" icon={ListChecks} padded={false}
      subtitle="Answers sent by department SPOCs. A section goes to Deloitte once all its answers are approved.">
      {queue.isLoading || bank.isLoading ? <LoadingState label="Loading…" /> :
       queue.isError ? <ErrorState message={errMessage(queue.error, 'Could not load the queue.')} onRetry={() => queue.refetch()} /> :
       queue.data.length === 0 ? <div className="p-6"><EmptyState icon={ListChecks} title="Nothing to approve" subtitle="Answers sent to you for review will appear here." /></div> : (
        <ul>
          {queue.data.map((r) => {
            const key = `${r.response_set}-${r.question_id}`
            const isOpen = open === key
            return (
              <li key={key} className="border-t border-surface-border">
                <button type="button" onClick={() => setOpen(isOpen ? null : key)} aria-expanded={isOpen}
                  className="w-full flex items-start gap-2 px-5 py-3 text-left hover:bg-surface-muted/40">
                  {isOpen ? <ChevronDown size={13} className="mt-0.5" /> : <ChevronRight size={13} className="mt-0.5" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-ink-900 font-medium truncate">
                      <span className="text-brand-greenDark mr-1.5">{r.question_id}</span>{r.prompt}
                    </p>
                    <p className="text-[9px] text-ink-500 mt-0.5">
                      FY {r.financial_year} · {r.departments.join(', ')} · sent by {r.submitted_by || 'a SPOC'}
                      {r.submitted_at ? ` on ${new Date(r.submitted_at).toLocaleString()}` : ''}
                    </p>
                  </div>
                </button>
                {isOpen && byId[r.question_id] && (
                  <div className="px-5 pb-4">
                    <QueuedAnswer item={r} q={byId[r.question_id]} pushToast={pushToast} onDone={() => setOpen(null)} />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

function QueuedAnswer({ item, q, pushToast, onDone }) {
  const section = useSection(item.response_set, item.section)
  const ov = useResponseSet(item.response_set)
  const review = useReviewQuestions()
  if (section.isLoading || ov.isLoading) return <LoadingState label="Loading answer…" />
  if (section.isError || ov.isError) return <ErrorState message="Could not load this answer." onRetry={() => section.refetch()} />
  const info = section.data.answers[q.id]
  return (
    <BrsrQuestion q={q} value={info?.value} info={info} labels={ov.data.fy_labels} editable={false} dirty={false}
      comments={section.data.comments.filter((c) => c.question_id === q.id)}
      workflowBusy={review.isPending}
      onReviewAnswer={(decision, note, done) => review.mutate(
        { setId: item.response_set, code: item.section, questionIds: [q.id], decision, note },
        {
          onSuccess: () => { pushToast(decision === 'approved' ? `${q.id} approved.` : `${q.id} returned to the SPOC.`); done?.(); onDone() },
          onError: (e) => pushToast(errMessage(e, 'Could not record the decision.')),
        })} />
  )
}
