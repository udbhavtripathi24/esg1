import { useState } from 'react'
import { AlertOctagon, Send, Loader2 } from 'lucide-react'
import { Button, EmptyState } from '../ui.jsx'
import { Chip } from './parts.jsx'
import { SEVERITY, errMessage, fmtDate } from './format.js'
import { TargetPicker } from './RequestsPanel.jsx'

const inputCls = 'w-full px-2.5 py-1.5 rounded border border-surface-border bg-white text-[10px] text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-green/30'

function NewFinding({ eng, actions, sectionTitles, questionsBySection, pushToast }) {
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ section_code: eng.scope[0], question_id: '', severity: 'misstatement', description: '' })
  const m = actions.raiseFinding
  if (!open) return <Button size="sm" variant="ghost" onClick={() => setOpen(true)}><AlertOctagon size={13} /> Record a finding</Button>
  return (
    <div className="border border-surface-border rounded-md p-3 space-y-2 bg-surface-muted/40">
      <TargetPicker eng={eng} sectionTitles={sectionTitles} questionsBySection={questionsBySection} value={f} onChange={setF} />
      <label className="block text-[9px] text-ink-500 max-w-[240px]">Severity
        <select className={inputCls} value={f.severity} onChange={(e) => setF({ ...f, severity: e.target.value })}>
          {Object.entries(SEVERITY).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </label>
      <label className="block text-[9px] text-ink-500">Finding
        <textarea className={`${inputCls} resize-y`} rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })}
          placeholder="What is wrong, by how much, and against which evidence" />
      </label>
      {m.isError && <p className="text-[10px] text-status-pending">{errMessage(m.error, 'Could not record the finding.')}</p>}
      <div className="flex gap-2">
        <Button size="sm" disabled={!f.description.trim() || m.isPending}
          onClick={() => m.mutate({ ...f, question_id: f.question_id || null }, {
            onSuccess: () => { setOpen(false); setF({ ...f, description: '' }); pushToast('Finding recorded and sent to the client for a response.') },
          })}>
          {m.isPending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Record and notify client
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  )
}

function FindingCard({ f, eng, isClient, canResolve, actions, pushToast, questionLabel }) {
  const [response, setResponse] = useState(f.management_response || '')
  const [note, setNote] = useState('')
  const [outcome, setOutcome] = useState('corrected')
  const respond = actions.respondFinding
  const resolve = actions.resolveFinding
  const fieldwork = eng.status === 'fieldwork'
  const [sevLabel, sevCls] = SEVERITY[f.severity] || [f.severity, 'text-ink-700']
  const resolved = f.status === 'corrected' || f.status === 'uncorrected'

  return (
    <div className="bg-white border border-surface-border rounded-lg p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-[9px] text-ink-500">
          <span className={`font-semibold ${sevCls}`}>{sevLabel}</span> · {f.section_code}{f.question_id ? ` · ${questionLabel(f.question_id)}` : ''}
          {' '}· raised by {f.raised_by} on {fmtDate(f.raised_at)}
        </p>
        <Chip status={f.status} label={f.status === 'open' ? 'Awaiting response' : f.status === 'responded' ? 'Responded' : undefined} />
      </div>
      <p className="text-[11px] text-ink-900 mt-1.5 whitespace-pre-wrap">{f.description}</p>

      {f.management_response && !(isClient && !resolved && fieldwork) && (
        <p className="mt-2 text-[10px] text-ink-900 bg-surface-muted rounded px-2 py-1.5">
          <b>Management response</b> ({f.responded_by}, {fmtDate(f.responded_at)}): {f.management_response}
        </p>
      )}
      {resolved && (
        <p className="mt-2 text-[10px] text-ink-700">
          {f.status === 'corrected' ? 'Corrected in the BRSR' : 'Left uncorrected'} — {f.resolved_by}, {fmtDate(f.resolved_at)}
          {f.resolution_note ? `: ${f.resolution_note}` : ''}
        </p>
      )}

      {isClient && !resolved && fieldwork && (
        <div className="mt-3 pt-3 border-t border-surface-border space-y-2">
          <label className="block text-[9px] text-ink-500">Management response
            <textarea className={`${inputCls} resize-y`} rows={2} value={response} onChange={(e) => setResponse(e.target.value)}
              placeholder="Do you agree? What will you correct, and how?" />
          </label>
          <p className="text-[9px] text-ink-500">To correct a figure: reopen the section in Upload Center → BRSR, fix it, and submit it for review again.</p>
          {respond.isError && <p className="text-[10px] text-status-pending">{errMessage(respond.error, 'Could not send.')}</p>}
          <Button size="sm" disabled={!response.trim() || respond.isPending}
            onClick={() => respond.mutate({ fid: f.public_id, response }, { onSuccess: () => pushToast('Management response sent.') })}>
            <Send size={13} /> {f.management_response ? 'Update response' : 'Send response'}
          </Button>
        </div>
      )}

      {canResolve && f.status === 'responded' && fieldwork && (
        <div className="mt-3 pt-3 border-t border-surface-border space-y-2">
          <div className="flex flex-wrap gap-3 text-[10px]">
            {[['corrected', 'Corrected in the BRSR'], ['uncorrected', 'Leave uncorrected']].map(([k, l]) => (
              <label key={k} className="inline-flex items-center gap-1.5">
                <input type="radio" name={`o-${f.public_id}`} checked={outcome === k} onChange={() => setOutcome(k)} className="accent-brand-green" />{l}
              </label>
            ))}
          </div>
          <textarea className={`${inputCls} resize-y`} rows={2} value={note} onChange={(e) => setNote(e.target.value)}
            placeholder={outcome === 'uncorrected' ? 'Why it can be left uncorrected (required)' : 'Note (optional)'} aria-label="Resolution note" />
          {resolve.isError && <p className="text-[10px] text-status-pending">{errMessage(resolve.error, 'Could not resolve.')}</p>}
          <Button size="sm" disabled={resolve.isPending || (outcome === 'uncorrected' && !note.trim())}
            onClick={() => resolve.mutate({ fid: f.public_id, outcome, note: note || null })}>Resolve</Button>
        </div>
      )}
    </div>
  )
}

export default function FindingsPanel({ eng, actions, sectionTitles, questionsBySection, questionLabel, pushToast }) {
  const isClient = eng.access === 'client'
  const isMember = eng.access === 'member' && eng.my_independence_declared
  const canRaise = isMember && eng.my_role !== 'eqr'
  const canResolve = isMember && ['manager', 'partner'].includes(eng.my_role)
  return (
    <div className="space-y-3">
      {canRaise && eng.status === 'fieldwork' && (
        <NewFinding eng={eng} actions={actions} sectionTitles={sectionTitles} questionsBySection={questionsBySection} pushToast={pushToast} />
      )}
      {eng.findings.length === 0 ? (
        <div className="bg-white border border-surface-border rounded-lg p-6">
          <EmptyState icon={AlertOctagon} title="No findings" subtitle="Errors or weaknesses the assurer finds are recorded here, with the company's response and the outcome." />
        </div>
      ) : eng.findings.map((f) => (
        <FindingCard key={f.public_id} f={f} eng={eng} isClient={isClient} canResolve={canResolve} actions={actions}
          pushToast={pushToast} questionLabel={questionLabel} />
      ))}
    </div>
  )
}
