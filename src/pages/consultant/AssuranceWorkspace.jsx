import { useState } from 'react'
import { ShieldCheck, Plus, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import PageHeader from '../../components/PageHeader.jsx'
import { Button, Card, EmptyState, Field, Input, Select } from '../../components/ui.jsx'
import LoadingState from '../../components/LoadingState.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import EngagementView from '../../components/assurance/EngagementView.jsx'
import { Chip, Toast } from '../../components/assurance/parts.jsx'
import { OPINION, errMessage, fmtDate, useToast } from '../../components/assurance/format.js'
import { useEngagements, useCreateEngagement } from '../../hooks/useAssurance.js'
import { useQuestionBank } from '../../hooks/useBrsr.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { listAssurableSets } from '../../api/assurance.js'

function NewEngagement({ onCreated, onCancel }) {
  const sets = useQuery({ queryKey: ['assurance', 'assurable-sets'], queryFn: listAssurableSets })
  const bank = useQuestionBank()
  const create = useCreateEngagement()
  const [setId, setSetId] = useState('')
  const [provider, setProvider] = useState('')
  const [level, setLevel] = useState('limited')
  const [scope, setScope] = useState(null) // null = every section
  // A BRSR is available if it has no live engagement, or its signed one has gone stale (re-assurance)
  const available = (sets.data || []).filter((s) => !s.engagement || s.engagement.needs_reassurance)
  const chosen = available.find((s) => s.response_set_id === setId)
  const codes = (bank.data?.sections || []).map((s) => s.code)
  const selected = scope || codes

  return (
    <Card title="Open an assurance engagement" icon={ShieldCheck}
      subtitle="Assurance is performed on approved figures. You can open the engagement now and test sections as they are approved.">
      {sets.isLoading || bank.isLoading ? <LoadingState label="Loading BRSRs…" /> : sets.isError ? (
        <ErrorState message={errMessage(sets.error, 'Could not load BRSRs.')} onRetry={() => sets.refetch()} />
      ) : (
        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="BRSR to assure" required>
              <Select value={setId} onChange={(e) => setSetId(e.target.value)}>
                <option value="">Select company and year…</option>
                {available.map((s) => (
                  <option key={s.response_set_id} value={s.response_set_id}>
                    {s.company_name} · FY {s.financial_year} · {s.sections_approved}/{s.sections} approved{s.engagement ? ' · re-assurance' : ''}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Assurance provider" required>
              <Input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="Firm issuing the opinion" />
            </Field>
            <Field label="Level of assurance" required>
              <Select value={level} onChange={(e) => setLevel(e.target.value)}>
                <option value="limited">Limited assurance</option>
                <option value="reasonable">Reasonable assurance (e.g. BRSR Core)</option>
              </Select>
            </Field>
          </div>
          {chosen && chosen.sections_approved < chosen.sections && (
            <p className="text-[10px] text-amber-700">{chosen.sections - chosen.sections_approved} section(s) are not approved yet. They can be tested once approved; signing needs the whole BRSR approved.</p>
          )}
          <div>
            <p className="text-[9px] text-ink-500 mb-1">Sections in scope ({selected.length} of {codes.length})</p>
            <div className="flex flex-wrap gap-1.5">
              {codes.map((c) => {
                const on = selected.includes(c)
                return (
                  <button key={c} type="button" aria-pressed={on}
                    onClick={() => setScope(on ? selected.filter((x) => x !== c) : [...selected, c])}
                    className={`px-2 py-1 rounded border text-[10px] ${on ? 'bg-brand-green/10 border-brand-green/40 text-brand-greenDark' : 'bg-white border-surface-border text-ink-500'}`}>
                    {c}
                  </button>
                )
              })}
            </div>
          </div>
          {create.isError && <p className="text-[10px] text-status-pending">{errMessage(create.error, 'Could not open the engagement.')}</p>}
          <div className="flex gap-2">
            <Button size="sm" disabled={!setId || !provider.trim() || !selected.length || create.isPending}
              onClick={() => create.mutate({ response_set_id: setId, provider_name: provider, level, scope: selected },
                { onSuccess: (d) => onCreated(d.public_id) })}>
              {create.isPending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Open engagement
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
          </div>
        </div>
      )}
    </Card>
  )
}

/** Deloitte side: the assurance team's workspace (and read-only for consultants). */
export default function AssuranceWorkspace() {
  const { hasPermission } = useAuth()
  const list = useEngagements()
  const [open, setOpen] = useState(null)
  const [creating, setCreating] = useState(false)
  const toast = useToast()
  const canManage = hasPermission('assurance:manage')

  return (
    <div>
      <PageHeader title="Assurance" subtitle="Independent assurance of client BRSRs — team and independence, fieldwork, findings and sign-off" />
      {open ? (
        <EngagementView key={open} id={open} pushToast={toast.push} onBack={() => setOpen(null)} />
      ) : (
        <div className="space-y-4">
          {canManage && !creating && <Button size="sm" onClick={() => setCreating(true)}><Plus size={13} /> New engagement</Button>}
          {creating && <NewEngagement onCreated={(id) => { setCreating(false); setOpen(id) }} onCancel={() => setCreating(false)} />}
          <Card title="Engagements" icon={ShieldCheck} padded={false}>
            {list.isLoading ? <LoadingState label="Loading…" />
              : list.isError ? <ErrorState message={errMessage(list.error, 'Could not load engagements.')} onRetry={() => list.refetch()} />
                : list.data.length === 0 ? (
                  <div className="p-6"><EmptyState icon={ShieldCheck} title="No engagements"
                    subtitle={canManage ? 'Open one for an approved client BRSR.' : 'Engagements you are assigned to appear here.'} /></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[10px]">
                      <thead><tr className="text-left text-ink-500 border-t border-surface-border">
                        <th className="font-medium px-5 py-2.5">Company</th><th className="font-medium px-2 py-2.5">FY</th>
                        <th className="font-medium px-2 py-2.5">Level</th><th className="font-medium px-2 py-2.5">Provider</th>
                        <th className="font-medium px-2 py-2.5">Status</th><th className="font-medium px-2 py-2.5">Open requests</th>
                        <th className="font-medium px-2 py-2.5">Opinion</th><th className="px-5" />
                      </tr></thead>
                      <tbody>
                        {list.data.map((e) => (
                          <tr key={e.public_id} className="border-t border-surface-border hover:bg-surface-muted/40 cursor-pointer" onClick={() => setOpen(e.public_id)}>
                            <td className="px-5 py-3 font-medium text-ink-900">{e.company_name}</td>
                            <td className="px-2 py-3 text-ink-700">{e.financial_year}</td>
                            <td className="px-2 py-3 text-ink-700">{e.level_label}</td>
                            <td className="px-2 py-3 text-ink-700">{e.provider_name}</td>
                            <td className="px-2 py-3"><Chip status={e.status} />{e.reassurance_required && <span className="ml-1 text-status-pending">needs re-assurance</span>}</td>
                            <td className="px-2 py-3 tabular-nums text-ink-700">{e.requests_open}</td>
                            <td className="px-2 py-3 text-ink-700">{e.opinion ? `${OPINION[e.opinion]} · ${fmtDate(e.signed_at)}` : '–'}</td>
                            <td className="px-5 py-3 text-right text-brand-green font-medium">Open →</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
          </Card>
        </div>
      )}
      <Toast msg={toast.msg} />
    </div>
  )
}
