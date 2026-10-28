import { useMemo, useState } from 'react'
import {
  ShieldCheck, AlertTriangle, FileSignature, Play, Loader2, PackageCheck, FileSpreadsheet, FileText,
  CircleCheck, Circle, Ban, ClipboardCheck,
} from 'lucide-react'
import { Button, Card } from '../ui.jsx'
import LoadingState from '../LoadingState.jsx'
import ErrorState from '../ErrorState.jsx'
import { useEngagement, useAssuranceActions } from '../../hooks/useAssurance.js'
import { useQuestionBank } from '../../hooks/useBrsr.js'
import { downloadSignedDocument, downloadPack, downloadDraftRegister } from '../../api/assurance.js'
import { Chip, SignoffRegister } from './parts.jsx'
import { OPINION, ROLE_LABEL, errMessage, fmtDate } from './format.js'
import RequestsPanel from './RequestsPanel.jsx'
import FindingsPanel from './FindingsPanel.jsx'
import WorkpapersPanel from './WorkpapersPanel.jsx'
import TeamPanel from './TeamPanel.jsx'

const inputCls = 'w-full px-2.5 py-1.5 rounded border border-surface-border bg-white text-[10px] text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-green/30'

function Stage({ eng }) {
  const steps = [
    ['planning', 'Planning', 'Team chosen, independence declared'],
    ['fieldwork', 'Fieldwork', 'Testing, requests, findings'],
    ['signed', 'Signed', 'Opinion issued'],
  ]
  const idx = steps.findIndex((s) => s[0] === eng.status)
  return (
    <ol className="flex flex-wrap gap-x-6 gap-y-2">
      {steps.map(([k, label, hint], i) => {
        const done = eng.status !== 'withdrawn' && (i < idx || (eng.status === 'signed' && i === idx))
        const now = i === idx
        return (
          <li key={k} className="flex items-center gap-2">
            {done ? <CircleCheck size={15} className="text-status-approved" /> : <Circle size={15} className={now ? 'text-brand-green' : 'text-ink-300'} />}
            <span>
              <span className={`block text-[10px] ${now ? 'font-semibold text-ink-900' : 'text-ink-700'}`}>{label}</span>
              <span className="block text-[9px] text-ink-500">{hint}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function Banner({ tone = 'info', icon: Icon, children, action }) {
  const cls = { info: 'bg-brand-green/5 border-brand-green/20', warn: 'bg-amber-50 border-amber-200', bad: 'bg-status-pending/5 border-status-pending/30' }[tone]
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 border rounded-lg px-4 py-3 ${cls}`}>
      <div className="flex items-start gap-2 text-[10px] text-ink-900 min-w-0 flex-1">
        {Icon && <Icon size={14} className="mt-px shrink-0" />}<div className="min-w-0">{children}</div>
      </div>
      {action}
    </div>
  )
}

function SignPanel({ eng, actions, pushToast }) {
  const [opinion, setOpinion] = useState('unmodified')
  const [basis, setBasis] = useState('')
  const [custom, setCustom] = useState(false)
  const [statement, setStatement] = useState('')
  const [confirm, setConfirm] = useState(false)
  const sign = actions.sign
  const blocked = eng.signoff_blockers.length > 0
  return (
    <Card title="Sign the assurance opinion" icon={FileSignature}
      subtitle="Signing fixes a fingerprint of the BRSR. If anyone changes it afterwards, the assurance is shown as needing re-assurance.">
      {blocked ? (
        <div className="text-[10px] text-ink-900">
          <p className="font-semibold mb-1">Not ready to sign yet:</p>
          <ul className="list-disc pl-4 space-y-0.5 text-ink-700">{eng.signoff_blockers.map((b) => <li key={b}>{b}</li>)}</ul>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-4 text-[10px]">
            {Object.entries(OPINION).map(([k, l]) => (
              <label key={k} className="inline-flex items-center gap-1.5">
                <input type="radio" name="opinion" checked={opinion === k} onChange={() => setOpinion(k)} className="accent-brand-green" />{l}
              </label>
            ))}
          </div>
          {eng.counts.uncorrected > 0 && opinion === 'unmodified' && (
            <p className="text-[10px] text-amber-700">{eng.counts.uncorrected} finding(s) were left uncorrected. Confirm they are not material before issuing an unmodified opinion.</p>
          )}
          {opinion !== 'unmodified' && (
            <label className="block text-[9px] text-ink-500">Basis for the {OPINION[opinion].toLowerCase()} (required, printed in the statement)
              <textarea className={`${inputCls} resize-y`} rows={3} value={basis} onChange={(e) => setBasis(e.target.value)} />
            </label>
          )}
          <label className="inline-flex items-center gap-1.5 text-[10px] text-ink-700">
            <input type="checkbox" checked={custom} onChange={(e) => setCustom(e.target.checked)} className="accent-brand-green" />
            Write the statement myself (otherwise the standard wording for this level and opinion is used)
          </label>
          {custom && <textarea className={`${inputCls} resize-y`} rows={8} value={statement} onChange={(e) => setStatement(e.target.value)} aria-label="Statement" />}
          {sign.isError && <p className="text-[10px] text-status-pending">{errMessage(sign.error, 'Could not sign.')}</p>}
          {!confirm ? (
            <Button size="sm" disabled={(opinion !== 'unmodified' && !basis.trim()) || (custom && !statement.trim())} onClick={() => setConfirm(true)}>
              <FileSignature size={13} /> Sign…
            </Button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] text-ink-900">Sign a <b>{OPINION[opinion].toLowerCase()}</b> {eng.level} assurance opinion as engagement partner? This cannot be undone.</span>
              <Button size="sm" disabled={sign.isPending}
                onClick={() => sign.mutate({ opinion, basis: basis || null, statement: custom ? statement : null }, {
                  onSuccess: () => { setConfirm(false); pushToast('Opinion signed. The statement and register are issued.') },
                })}>
                {sign.isPending ? <Loader2 size={13} className="animate-spin" /> : <FileSignature size={13} />} Sign now
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function Documents({ eng, pushToast }) {
  const [busy, setBusy] = useState(null)
  async function run(key, fn) {
    setBusy(key)
    try { await fn() } catch (e) { pushToast(errMessage(e, 'Download failed.')) } finally { setBusy(null) }
  }
  const icon = (k, I) => (busy === k ? <Loader2 size={13} className="animate-spin" /> : <I size={13} />)
  if (eng.status !== 'signed') {
    if (!['member', 'manager'].includes(eng.access)) return null
    return (
      <Button size="sm" variant="ghost" onClick={() => run('draft', () => downloadDraftRegister(eng.public_id))}>
        {icon('draft', FileSpreadsheet)} Draft sign-off register (Excel)
      </Button>
    )
  }
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="ghost" onClick={() => run('st', () => downloadSignedDocument(eng.public_id, 'statement'))}>{icon('st', FileText)} Assurance statement (Word)</Button>
      <Button size="sm" variant="ghost" onClick={() => run('rg', () => downloadSignedDocument(eng.public_id, 'register'))}>{icon('rg', FileSpreadsheet)} Sign-off register (Excel)</Button>
      <Button size="sm" onClick={() => run('pk', () => downloadPack(eng.public_id))}>{icon('pk', PackageCheck)} Assurance pack (zip)</Button>
    </div>
  )
}

export default function EngagementView({ id, pushToast, onBack }) {
  const q = useEngagement(id)
  const bankQ = useQuestionBank()
  const actions = useAssuranceActions(id)
  const [tab, setTab] = useState('overview')
  const [withdrawing, setWithdrawing] = useState(false)
  const [reason, setReason] = useState('')

  const meta = useMemo(() => {
    const bank = bankQ.data
    if (!bank) return null
    const sectionTitles = Object.fromEntries(bank.sections.map((s) => [s.code, s.title]))
    const questionsBySection = {}
    const labelById = {}
    for (const x of bank.questions) {
      if (x.helper) continue
      const label = `${x.number && x.number !== '—' ? `${x.section} Q${x.number}` : x.id} — ${String(x.prompt).slice(0, 70)}`
      ;(questionsBySection[x.section] ||= []).push({ id: x.id, label })
      labelById[x.id] = x.number && x.number !== '—' ? `${x.section} Q${x.number}` : x.id
    }
    return { bank, sectionTitles, questionsBySection, questionLabel: (qid) => labelById[qid] || qid }
  }, [bankQ.data])

  if (q.isLoading || bankQ.isLoading) return <Card><LoadingState label="Loading engagement…" /></Card>
  if (q.isError || bankQ.isError) return <Card><ErrorState message={errMessage(q.error || bankQ.error, 'Could not load the engagement.')} onRetry={() => q.refetch()} /></Card>
  const eng = q.data
  const isAssurer = ['member', 'manager'].includes(eng.access)
  const me = eng.access === 'member'
  const c = eng.counts
  const tabs = [
    ['overview', 'Overview'],
    ['requests', `Information requests${c.requests_open + c.requests_awaiting_assurer ? ` (${isAssurer ? c.requests_awaiting_assurer : c.requests_open})` : ''}`],
    ['findings', `Findings${c.findings_open ? ` (${c.findings_open})` : ''}`],
    ['workpapers', isAssurer ? 'Workpapers' : 'Testing progress'],
    ['team', 'Team'],
    ['register', 'Sign-off register'],
  ]
  const shared = { eng, actions, pushToast, ...meta }

  return (
    <div className="space-y-4">
      {onBack && <button type="button" onClick={onBack} className="text-[11px] text-ink-500 hover:text-ink-900">← All engagements</button>}
      <div className="bg-white border border-surface-border rounded-lg p-4 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1"><Chip status={eng.status} />
              {eng.opinion && <span className="text-[10px] font-semibold text-ink-900">{OPINION[eng.opinion]} conclusion</span>}
            </div>
            <h2 className="text-[14px] font-semibold text-ink-900">{eng.company_name} · BRSR FY {eng.financial_year}</h2>
            <p className="text-[10px] text-ink-500">{eng.level_label} by <b className="text-ink-700">{eng.provider_name}</b> · {eng.standard} · sections {eng.scope.join(', ')}</p>
            {eng.signed_at && <p className="text-[10px] text-ink-700 mt-1">Signed by {eng.signed_by} on {fmtDate(eng.signed_at, true)}</p>}
            {me && <p className="text-[9px] text-ink-500 mt-1">You are the {ROLE_LABEL[eng.my_role]?.toLowerCase()} on this engagement.</p>}
          </div>
          <Documents eng={eng} pushToast={pushToast} />
        </div>
        <Stage eng={eng} />
      </div>

      {eng.reassurance_required && (
        <Banner tone="bad" icon={AlertTriangle}>
          <b>Needs re-assurance.</b> The BRSR has changed since this opinion was signed, so the assurance no longer covers it.
          The report stops printing the assurance until a new engagement is signed{eng.can_manage ? ' — open a new engagement for this BRSR from the engagement list' : ''}.
        </Banner>
      )}
      {eng.status === 'withdrawn' && <Banner tone="warn" icon={Ban}>Withdrawn: {eng.withdrawn_reason}</Banner>}
      {eng.status === 'superseded' && (
        <Banner tone="warn" icon={Ban}>Superseded by a re-assurance after the BRSR changed. This signed record and its documents are kept as issued.</Banner>
      )}

      {me && !eng.my_independence_declared && ['planning', 'fieldwork'].includes(eng.status) && (
        <Banner icon={ShieldCheck} action={
          <Button size="sm" disabled={actions.declare.isPending}
            onClick={() => actions.declare.mutate(undefined, { onError: (e) => pushToast(errMessage(e, 'Could not record the declaration.')) })}>
            I confirm my independence
          </Button>}>
          <b>Declare your independence before starting.</b> I confirm I have no financial, family or business relationship with
          {' '}{eng.company_name} that impairs my objectivity, and I have not prepared, reviewed or approved the information I will assure.
        </Banner>
      )}

      {eng.can_manage && eng.status === 'planning' && (
        <Banner icon={Play} action={
          <Button size="sm" disabled={actions.start.isPending}
            onClick={() => actions.start.mutate(undefined, { onError: (e) => pushToast(errMessage(e, 'Cannot start yet.')) })}>
            Start fieldwork
          </Button>}>
          Fieldwork starts once the team has a signing partner and at least one manager or practitioner, and everyone has declared independence (see Team).
        </Banner>
      )}

      {me && eng.my_role === 'eqr' && eng.status === 'fieldwork' && !eng.eqr_cleared_at && (
        <Banner icon={ClipboardCheck} action={
          <Button size="sm" disabled={actions.clearEqr.isPending}
            onClick={() => actions.clearEqr.mutate(null, { onError: (e) => pushToast(errMessage(e, 'Not ready for quality review.')) })}>
            Clear quality review
          </Button>}>
          As engagement quality reviewer, clear the engagement once you have reviewed the significant judgements and the workpapers.
        </Banner>
      )}
      {eng.eqr_cleared_at && <p className="text-[10px] text-status-approved px-1">Quality review cleared by {eng.eqr_cleared_by} on {fmtDate(eng.eqr_cleared_at)}.</p>}

      <div className="border-b border-surface-border flex flex-wrap gap-1" role="tablist">
        {tabs.map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`px-3 py-2 text-[11px] -mb-px border-b-2 ${tab === k ? 'border-brand-green text-ink-900 font-semibold' : 'border-transparent text-ink-500 hover:text-ink-900'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              ['Workpapers reviewed', `${c.workpapers_reviewed}/${c.workpapers}`],
              ['Requests with the client', c.requests_open],
              ['Responses awaiting the assurer', c.requests_awaiting_assurer],
              ['Open findings', c.findings_open],
            ].map(([l, v]) => (
              <div key={l} className="bg-white border border-surface-border rounded-lg px-4 py-3">
                <p className="text-[9px] text-ink-500">{l}</p><p className="text-xl font-semibold text-ink-900 tabular-nums">{v}</p>
              </div>
            ))}
          </div>
          {me && eng.my_role === 'partner' && eng.status === 'fieldwork' && eng.my_independence_declared && (
            <SignPanel eng={eng} actions={actions} pushToast={pushToast} />
          )}
          {eng.status === 'fieldwork' && eng.signoff_blockers.length > 0 && !(me && eng.my_role === 'partner') && (
            <Card title="Still to do before signing" icon={ClipboardCheck}>
              <ul className="list-disc pl-4 text-[10px] text-ink-700 space-y-0.5">{eng.signoff_blockers.map((b) => <li key={b}>{b}</li>)}</ul>
            </Card>
          )}
          {eng.statement_text && (
            <Card title="Independent assurance statement" icon={FileText}
              subtitle={`As signed · SHA-256 ${eng.statement_sha256?.slice(0, 16)}…`}>
              <div className="text-[10.5px] text-ink-900 whitespace-pre-wrap leading-relaxed max-w-3xl">{eng.statement_text}</div>
            </Card>
          )}
          {eng.can_manage && ['planning', 'fieldwork'].includes(eng.status) && (
            <div className="pt-2">
              {!withdrawing ? (
                <button type="button" className="text-[10px] text-ink-500 hover:text-status-pending" onClick={() => setWithdrawing(true)}>Withdraw this engagement…</button>
              ) : (
                <div className="flex flex-wrap items-end gap-2 max-w-xl">
                  <label className="flex-1 text-[9px] text-ink-500">Reason (recorded)
                    <input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} />
                  </label>
                  <Button size="sm" variant="dark" disabled={!reason.trim() || actions.withdraw.isPending}
                    onClick={() => actions.withdraw.mutate(reason, { onSuccess: () => setWithdrawing(false) })}>Withdraw</Button>
                  <Button size="sm" variant="ghost" onClick={() => setWithdrawing(false)}>Cancel</Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {tab === 'requests' && <RequestsPanel {...shared} />}
      {tab === 'findings' && <FindingsPanel {...shared} />}
      {tab === 'workpapers' && <WorkpapersPanel eng={eng} actions={actions} bank={meta.bank} pushToast={pushToast} />}
      {tab === 'team' && <TeamPanel eng={eng} actions={actions} pushToast={pushToast} />}
      {tab === 'register' && (
        <div className="space-y-2">
          <p className="text-[10px] text-ink-500">Everyone involved in each section, from preparation to assurance. {eng.register_frozen ? 'This is the register exactly as signed.' : 'Live — it is fixed when the partner signs.'}</p>
          <SignoffRegister rows={eng.register} />
        </div>
      )}
    </div>
  )
}
