import { useState } from 'react'
import { ChevronDown, ChevronRight, Check, CornerDownLeft, Eye, Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '../ui.jsx'
import LoadingState from '../LoadingState.jsx'
import ErrorState from '../ErrorState.jsx'
import BrsrQuestion from '../brsr/BrsrQuestion.jsx'
import { useAssurerSection } from '../../hooks/useAssurance.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { downloadEvidence } from '../../api/assurance.js'
import { Chip, EvidenceList } from './parts.jsx'
import { errMessage, fmtDate, fyLabels } from './format.js'

const inputCls = 'w-full px-2.5 py-1.5 rounded border border-surface-border bg-white text-[10px] text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-green/30'

/** The approved figures of one section, read-only, with its evidence. */
function SectionData({ eng, code, bank, pushToast }) {
  const q = useAssurerSection(eng.public_id, code)
  if (q.isLoading) return <LoadingState label="Loading figures…" />
  if (q.isError) return <ErrorState message={errMessage(q.error, 'Could not load the section.')} onRetry={() => q.refetch()} />
  const d = q.data
  const labels = fyLabels(eng.financial_year)
  const questions = bank.questions.filter((x) => x.section === code && !x.helper)
  return (
    <div className="space-y-2">
      <div>
        <p className="text-[9px] font-semibold text-ink-500 mb-1">Evidence on file ({d.evidence.length})</p>
        <EvidenceList files={d.evidence}
          onDownload={(f) => downloadEvidence(f, { engagementId: eng.public_id }).catch((e) => pushToast(errMessage(e, 'Download failed.')))} />
      </div>
      <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
        {questions.map((x) => (
          <BrsrQuestion key={x.id} q={x} value={d.answers[x.id]?.value} info={d.answers[x.id]} labels={labels}
            editable={false} dirty={false} onChange={() => {}} />
        ))}
      </div>
    </div>
  )
}

function Workpaper({ item, eng, actions, bank, pushToast }) {
  const [open, setOpen] = useState(false)
  const [showData, setShowData] = useState(false)
  const [procedures, setProcedures] = useState(item.procedures || '')
  const [conclusion, setConclusion] = useState(item.conclusion || 'no_exceptions')
  const [note, setNote] = useState('')
  const [returning, setReturning] = useState(false)
  const member = eng.access === 'member' && eng.my_independence_declared && eng.status === 'fieldwork'
  const canPrepare = member && eng.my_role !== 'eqr' && (item.status === 'open' || item.outdated)
  const canReview = member && ['manager', 'partner'].includes(eng.my_role) && item.status === 'prepared'
  const { user } = useAuth()
  const ownWork = !!item.prepared_by_id && item.prepared_by_id === user?.id
  const prepare = actions.prepare
  const review = actions.review
  const status = item.outdated ? 'outdated' : item.status
  const sectionFinal = item.section_status === 'approved'

  return (
    <div className="bg-white border border-surface-border rounded-lg">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        className="w-full flex items-center gap-3 px-4 py-3 text-left">
        {open ? <ChevronDown size={14} className="text-ink-500" /> : <ChevronRight size={14} className="text-ink-500" />}
        <span className="text-[11px] font-semibold text-ink-900 w-10">{item.section_code}</span>
        <span className="text-[10px] text-ink-700 flex-1 min-w-0 truncate">{item.title}</span>
        {item.conclusion && (
          <span className={`text-[9px] ${item.conclusion === 'exceptions' ? 'text-amber-700' : 'text-status-approved'}`}>
            {item.conclusion === 'exceptions' ? 'Exceptions noted' : 'No exceptions'}
          </span>
        )}
        <Chip status={status} label={status === 'open' ? 'To test' : undefined} />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-surface-border pt-3">
          {item.outdated && (
            <p className="flex items-start gap-1.5 text-[10px] bg-amber-50 text-ink-900 rounded px-2 py-1.5">
              <AlertTriangle size={11} className="mt-px text-amber-700 shrink-0" />
              The section was changed and re-approved after it was tested. Test it again.
            </p>
          )}
          {!sectionFinal && (
            <p className="text-[10px] text-ink-500">This section is {item.section_status.replace('_', ' ')}. Testing is done on approved figures only.</p>
          )}
          <button type="button" onClick={() => setShowData((v) => !v)} className="inline-flex items-center gap-1 text-[10px] font-medium text-brand-green">
            <Eye size={12} /> {showData ? 'Hide the figures' : 'View the figures and evidence'}
          </button>
          {showData && <SectionData eng={eng} code={item.section_code} bank={bank} pushToast={pushToast} />}

          {item.prepared_by && (
            <div className="text-[10px] text-ink-700 bg-surface-muted rounded px-2.5 py-2 space-y-1">
              <p><b>Tested by</b> {item.prepared_by} on {fmtDate(item.prepared_at, true)}</p>
              {item.procedures && <p className="whitespace-pre-wrap">{item.procedures}</p>}
              {item.reviewed_by && <p className="text-status-approved"><b>Reviewed by</b> {item.reviewed_by} on {fmtDate(item.reviewed_at, true)}</p>}
              {item.review_note && <p className="text-amber-700">Review note: {item.review_note}</p>}
            </div>
          )}

          {canPrepare && sectionFinal && (
            <div className="space-y-2">
              <label className="block text-[9px] text-ink-500">Procedures performed and evidence examined
                <textarea className={`${inputCls} resize-y`} rows={3} value={procedures} onChange={(e) => setProcedures(e.target.value)}
                  placeholder="e.g. Agreed headcount to the HRMS extract at 31 March; recomputed turnover; vouched 25 joiners to offer letters." />
              </label>
              <div className="flex flex-wrap gap-4 text-[10px]">
                {[['no_exceptions', 'No exceptions'], ['exceptions', 'Exceptions — recorded as findings']].map(([k, l]) => (
                  <label key={k} className="inline-flex items-center gap-1.5">
                    <input type="radio" name={`c-${item.section_code}`} checked={conclusion === k} onChange={() => setConclusion(k)} className="accent-brand-green" />{l}
                  </label>
                ))}
              </div>
              {prepare.isError && <p className="text-[10px] text-status-pending">{errMessage(prepare.error, 'Could not save.')}</p>}
              <Button size="sm" disabled={!procedures.trim() || prepare.isPending}
                onClick={() => prepare.mutate({ code: item.section_code, procedures, conclusion }, { onSuccess: () => pushToast(`${item.section_code} marked as tested — awaiting review.`) })}>
                {prepare.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Mark as tested
              </Button>
            </div>
          )}

          {canReview && !ownWork && (
            <div className="space-y-2">
              {returning && (
                <textarea className={`${inputCls} resize-y`} rows={2} value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder="What needs more work?" aria-label="Review note" />
              )}
              {review.isError && <p className="text-[10px] text-status-pending">{errMessage(review.error, 'Could not record the review.')}</p>}
              <div className="flex gap-2">
                {!returning && (
                  <Button size="sm" disabled={review.isPending} onClick={() => review.mutate({ code: item.section_code, decision: 'approve' })}>
                    <Check size={13} /> Approve workpaper
                  </Button>
                )}
                <Button size="sm" variant="ghost" disabled={review.isPending || (returning && !note.trim())}
                  onClick={() => (returning
                    ? review.mutate({ code: item.section_code, decision: 'return', note }, { onSuccess: () => { setReturning(false); setNote('') } })
                    : setReturning(true))}>
                  <CornerDownLeft size={13} /> {returning ? 'Return to preparer' : 'Return'}
                </Button>
              </div>
            </div>
          )}
          {canReview && ownWork && <p className="text-[9px] text-ink-500">You tested this section; another senior member reviews it.</p>}
        </div>
      )}
    </div>
  )
}

export default function WorkpapersPanel({ eng, actions, bank, pushToast }) {
  if (eng.access === 'client' || eng.access === 'observer') {
    return (
      <div className="bg-white border border-surface-border rounded-lg overflow-hidden">
        <table className="w-full text-[10px]">
          <thead><tr className="bg-surface-muted text-left text-ink-700">
            <th className="px-3 py-2 font-semibold">Section</th><th className="px-3 py-2 font-semibold">Assurance testing</th>
            <th className="px-3 py-2 font-semibold">Tested by</th><th className="px-3 py-2 font-semibold">Result</th>
          </tr></thead>
          <tbody>
            {eng.items.map((i) => (
              <tr key={i.section_code} className="border-t border-surface-border">
                <td className="px-3 py-2"><b className="text-ink-900">{i.section_code}</b> <span className="text-ink-500">{i.title}</span></td>
                <td className="px-3 py-2">{i.status === 'reviewed' ? <Chip status="reviewed" label="Done" /> : i.status === 'prepared' ? <Chip status="prepared" label="Being reviewed" /> : <Chip status="planning" label={eng.status === 'fieldwork' ? 'Not yet tested' : 'Not started'} />}</td>
                <td className="px-3 py-2 text-ink-700">{i.prepared_by || '–'}</td>
                <td className="px-3 py-2 text-ink-700">{i.conclusion ? (i.conclusion === 'exceptions' ? 'Exceptions noted' : 'No exceptions') : '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[9px] text-ink-500 px-3 py-2 border-t border-surface-border">The assurer's working notes stay with the assurer; you see progress and, after signing, who tested each section.</p>
      </div>
    )
  }
  return (
    <div className="space-y-2">
      {eng.items.map((i) => <Workpaper key={i.section_code} item={i} eng={eng} actions={actions} bank={bank} pushToast={pushToast} />)}
    </div>
  )
}
