import { useMemo, useState } from 'react'
import { MessageSquareText, CalendarClock, CornerDownLeft, Check, Send, Loader2 } from 'lucide-react'
import { Button, EmptyState } from '../ui.jsx'
import { downloadEvidence } from '../../api/assurance.js'
import { Chip, EvidenceList, EvidenceUploader } from './parts.jsx'
import { errMessage, fmtDate } from './format.js'

const inputCls = 'w-full px-2.5 py-1.5 rounded border border-surface-border bg-white text-[10px] text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-green/30'

export function TargetPicker({ eng, sectionTitles, questionsBySection, value, onChange }) {
  const qs = questionsBySection[value.section_code] || []
  return (
    <div className="grid sm:grid-cols-2 gap-2">
      <label className="text-[9px] text-ink-500">Section
        <select className={inputCls} value={value.section_code}
          onChange={(e) => onChange({ ...value, section_code: e.target.value, question_id: '' })}>
          {eng.scope.map((c) => <option key={c} value={c}>{c} — {sectionTitles[c]}</option>)}
        </select>
      </label>
      <label className="text-[9px] text-ink-500">Question (optional)
        <select className={inputCls} value={value.question_id} onChange={(e) => onChange({ ...value, question_id: e.target.value })}>
          <option value="">Whole section</option>
          {qs.map((q) => <option key={q.id} value={q.id}>{q.label}</option>)}
        </select>
      </label>
    </div>
  )
}

function NewRequest({ eng, actions, sectionTitles, questionsBySection, pushToast }) {
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ section_code: eng.scope[0], question_id: '', title: '', detail: '', due_date: '' })
  const m = actions.raiseRequest
  if (!open) return <Button size="sm" onClick={() => setOpen(true)}><MessageSquareText size={13} /> New information request</Button>
  return (
    <div className="border border-surface-border rounded-md p-3 space-y-2 bg-surface-muted/40">
      <TargetPicker eng={eng} sectionTitles={sectionTitles} questionsBySection={questionsBySection} value={f} onChange={setF} />
      <label className="block text-[9px] text-ink-500">What do you need?
        <input className={inputCls} value={f.title} maxLength={300} onChange={(e) => setF({ ...f, title: e.target.value })}
          placeholder="e.g. HRMS headcount extract as at 31 March" />
      </label>
      <label className="block text-[9px] text-ink-500">Detail (optional)
        <textarea className={`${inputCls} resize-y`} rows={2} value={f.detail} onChange={(e) => setF({ ...f, detail: e.target.value })} />
      </label>
      <label className="block text-[9px] text-ink-500 max-w-[180px]">Due date (optional)
        <input type="date" className={inputCls} value={f.due_date} onChange={(e) => setF({ ...f, due_date: e.target.value })} />
      </label>
      {m.isError && <p className="text-[10px] text-status-pending">{errMessage(m.error, 'Could not raise the request.')}</p>}
      <div className="flex gap-2">
        <Button size="sm" disabled={!f.title.trim() || m.isPending}
          onClick={() => m.mutate({ ...f, question_id: f.question_id || null, due_date: f.due_date || null }, {
            onSuccess: () => { setOpen(false); setF({ ...f, title: '', detail: '', due_date: '' }); pushToast('Request sent to the client.') },
          })}>
          {m.isPending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Send to client
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  )
}

function RequestCard({ r, eng, isClient, canAct, actions, pushToast, questionLabel }) {
  const [response, setResponse] = useState('')
  const [note, setNote] = useState('')
  const [sendingBack, setSendingBack] = useState(false)
  const respond = actions.respondRequest
  const close = actions.closeRequest
  const upload = actions.uploadRequestEvidence
  const fieldwork = eng.status === 'fieldwork'

  return (
    <div className={`bg-white border rounded-lg p-4 ${r.overdue ? 'border-status-pending/40' : 'border-surface-border'}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-ink-900">{r.title}</p>
          <p className="text-[9px] text-ink-500 mt-0.5">
            {r.section_code}{r.question_id ? ` · ${questionLabel(r.question_id)}` : ''} · asked by {r.requested_by} on {fmtDate(r.requested_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {r.due_date && (
            <span className={`flex items-center gap-1 text-[9px] ${r.overdue ? 'text-status-pending font-semibold' : 'text-ink-500'}`}>
              <CalendarClock size={10} /> {r.overdue ? 'Overdue · ' : 'Due '}{fmtDate(r.due_date)}
            </span>
          )}
          <Chip status={r.status} />
        </div>
      </div>
      {r.detail && <p className="text-[10px] text-ink-700 mt-2 whitespace-pre-wrap">{r.detail}</p>}

      {r.history?.length > 0 && (
        <div className="mt-2 space-y-1">
          {r.history.map((h, i) => (
            <p key={i} className="text-[9px] bg-amber-50 text-ink-700 rounded px-2 py-1">
              <CornerDownLeft size={9} className="inline mr-1" />Sent back by {h.by} on {fmtDate(h.at)}: {h.note}
            </p>
          ))}
        </div>
      )}

      <div className="mt-3">
        <p className="text-[9px] font-semibold text-ink-500 mb-1">Evidence provided</p>
        <EvidenceList files={r.evidence} showQuestion={false}
          onDownload={(f) => downloadEvidence(f, { engagementId: eng.public_id }).catch((e) => pushToast(errMessage(e, 'Download failed.')))}
          empty="Nothing uploaded yet." />
      </div>
      {r.response_text && (
        <p className="mt-2 text-[10px] text-ink-900 bg-surface-muted rounded px-2 py-1.5">
          <b>{r.responded_by}</b> · {fmtDate(r.responded_at, true)}: {r.response_text}
        </p>
      )}
      {r.status === 'accepted' && <p className="mt-2 text-[9px] text-status-approved">Accepted by {r.closed_by} on {fmtDate(r.closed_at)}</p>}

      {isClient && r.status === 'open' && fieldwork && (
        <div className="mt-3 pt-3 border-t border-surface-border space-y-2">
          <EvidenceUploader label="Upload evidence" onUpload={({ file }) => upload.mutateAsync({ rid: r.public_id, file })} />
          <textarea className={`${inputCls} resize-y`} rows={2} value={response} onChange={(e) => setResponse(e.target.value)}
            placeholder="Explain what you are providing (optional if files are attached)" aria-label="Response" />
          {respond.isError && <p className="text-[10px] text-status-pending">{errMessage(respond.error, 'Could not send.')}</p>}
          <Button size="sm" disabled={respond.isPending || (!response.trim() && !r.evidence.length)}
            onClick={() => respond.mutate({ rid: r.public_id, response }, { onSuccess: () => { setResponse(''); pushToast('Response sent to the assurer.') } })}>
            <Send size={13} /> Send response
          </Button>
        </div>
      )}

      {canAct && r.status === 'responded' && fieldwork && (
        <div className="mt-3 pt-3 border-t border-surface-border space-y-2">
          {sendingBack && (
            <textarea className={`${inputCls} resize-y`} rows={2} value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="What is still missing? (sent to the client)" aria-label="Send-back note" />
          )}
          {close.isError && <p className="text-[10px] text-status-pending">{errMessage(close.error, 'Could not update.')}</p>}
          <div className="flex gap-2">
            {!sendingBack && (
              <Button size="sm" disabled={close.isPending} onClick={() => close.mutate({ rid: r.public_id, decision: 'accept' })}>
                <Check size={13} /> Accept
              </Button>
            )}
            <Button size="sm" variant="ghost" disabled={close.isPending || (sendingBack && !note.trim())}
              onClick={() => (sendingBack
                ? close.mutate({ rid: r.public_id, decision: 'return', note }, { onSuccess: () => { setSendingBack(false); setNote('') } })
                : setSendingBack(true))}>
              <CornerDownLeft size={13} /> {sendingBack ? 'Send back' : 'Not enough — send back'}
            </Button>
            {sendingBack && <Button size="sm" variant="ghost" onClick={() => setSendingBack(false)}>Cancel</Button>}
          </div>
        </div>
      )}
    </div>
  )
}

export default function RequestsPanel({ eng, actions, sectionTitles, questionsBySection, questionLabel, pushToast }) {
  const isClient = eng.access === 'client'
  const canAct = eng.access === 'member' && eng.my_independence_declared && eng.my_role !== 'eqr'
  const [filter, setFilter] = useState('active')
  const list = useMemo(() => eng.requests.filter((r) => filter === 'all' || r.status !== 'accepted'), [eng.requests, filter])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-md border border-surface-border overflow-hidden text-[10px]">
          {[['active', 'Outstanding'], ['all', 'All']].map(([k, l]) => (
            <button key={k} type="button" onClick={() => setFilter(k)}
              className={`px-3 py-1 ${filter === k ? 'bg-brand-green text-white' : 'bg-white text-ink-700'}`}>{l}</button>
          ))}
        </div>
        {canAct && eng.status === 'fieldwork' && (
          <NewRequest eng={eng} actions={actions} sectionTitles={sectionTitles} questionsBySection={questionsBySection} pushToast={pushToast} />
        )}
      </div>
      {list.length === 0 ? (
        <div className="bg-white border border-surface-border rounded-lg p-6">
          <EmptyState icon={MessageSquareText} title={filter === 'active' ? 'Nothing outstanding' : 'No information requests'}
            subtitle={isClient ? 'When the assurer needs evidence, the request appears here.' : 'Ask the client for the evidence you need to test a figure.'} />
        </div>
      ) : list.map((r) => (
        <RequestCard key={r.public_id} r={r} eng={eng} isClient={isClient} canAct={canAct} actions={actions}
          pushToast={pushToast} questionLabel={questionLabel} />
      ))}
    </div>
  )
}
