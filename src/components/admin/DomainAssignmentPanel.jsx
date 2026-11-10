import { useMemo, useState } from 'react'
import { AlertTriangle, Check, Info, Loader2, Plus, UserCheck, X } from 'lucide-react'
import { Button } from '../ui.jsx'
import LoadingState from '../LoadingState.jsx'
import ErrorState from '../ErrorState.jsx'
import { inputCls } from '../surveys/util.js'
import { useAdminUsers } from '../../hooks/useAdmin.js'
import { useDomains, useSetDomain } from '../../hooks/useKpis.js'
import { CAN_REVIEW, CAN_UPLOAD, PILLAR_TONE } from './kpiFormat.js'
import { TableShell } from './parts.jsx'
import { td, th } from './util.js'


/**
 * Role Assignment → KPI domains (the engagement manager's wireframe):
 * KPI type → domain → uploader(s) → reviewer(s) → Submit.
 * Quantitative domains cover data sheets: only the assigned uploaders can upload them, and a submitted
 * sheet goes straight to an assigned reviewer. Qualitative domains are the departments that write the
 * narrative answers — the same list as BRSR → Team.
 */
export default function DomainAssignmentPanel({ canManage, toast }) {
  const q = useDomains()
  const people = useAdminUsers({ page: 1, page_size: 100, status: 'active' })
  const save = useSetDomain()
  const [kpiType, setKpiType] = useState('quantitative')
  const [domain, setDomain] = useState('')
  const [ups, setUps] = useState([])
  const [revs, setRevs] = useState([])

  const items = useMemo(() => q.data?.items || [], [q.data])
  const list = useMemo(() => items.filter((d) => d.kpi_type === kpiType), [items, kpiType])
  const users = people.data?.items || []
  if (q.isLoading || people.isLoading) return <LoadingState label="Loading domains…" />
  if (q.isError) return <ErrorState message={q.error?.message || 'Could not load the domains.'} onRetry={() => q.refetch()} />

  const pick = (d) => {
    setKpiType(d.kpi_type)
    setDomain(d.key)
    setUps(d.uploaders.map((u) => u.id))
    setRevs(d.reviewers.map((u) => u.id))
  }
  const current = items.find((d) => d.key === domain && d.kpi_type === kpiType)
  const changed = current && (ups.slice().sort().join() !== current.uploaders.map((u) => u.id).sort().join()
    || revs.slice().sort().join() !== current.reviewers.map((u) => u.id).sort().join())
  const overlap = ups.filter((id) => revs.includes(id))
  const submit = async () => {
    try {
      await save.mutateAsync({ key: domain, kpiType, body: { uploader_ids: ups, reviewer_ids: revs } })
      toast(`${current.title}: saved`)
    } catch (e) { toast(e.message || 'Could not save the assignment') }
  }
  const unassigned = q.data.unassigned.length

  return (
    <div className="space-y-4">
      {canManage && (
        <section className="bg-white border border-surface-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-ink-900 flex items-center gap-2"><UserCheck size={15} className="text-brand-green" /> Assign a KPI domain</h3>
          <p className="text-[11px] text-ink-500 mt-0.5 mb-3">Pick who uploads and who reviews each domain. Uploads of a domain&apos;s data sheets are then limited to its uploaders, and every submission goes to its reviewer automatically.</p>
          <div className="grid md:grid-cols-2 gap-x-6 gap-y-3">
            <label className="block">
              <span className="text-[10px] font-medium text-ink-500">KPI type</span>
              <div className="mt-1 inline-flex rounded-md border border-surface-border p-0.5 bg-surface-muted/50">
                {[['quantitative', 'Quantitative'], ['qualitative', 'Qualitative']].map(([k, l]) => (
                  <button key={k} type="button" onClick={() => { setKpiType(k); setDomain(''); setUps([]); setRevs([]) }}
                    className={`px-3 py-1 text-[11px] rounded ${kpiType === k ? 'bg-white shadow-sm text-ink-900 font-medium' : 'text-ink-500'}`}>{l}</button>
                ))}
              </div>
            </label>
            <label className="block">
              <span className="text-[10px] font-medium text-ink-500">{kpiType === 'quantitative' ? 'KPI domain' : 'Department (narrative answers)'}</span>
              <select className={`${inputCls} mt-1`} value={domain} aria-label="Domain"
                onChange={(e) => { const d = list.find((x) => x.key === e.target.value); if (d) pick(d); else setDomain('') }}>
                <option value="">Choose…</option>
                {list.map((d) => <option key={d.key} value={d.key}>{d.title}{d.uploaders.length + d.reviewers.length === 0 ? ' — not assigned' : ''}</option>)}
              </select>
            </label>
            <PeoplePicker label="Uploader" hint={kpiType === 'quantitative' ? 'Uploads the data sheets' : 'Writes the answers (SPOC)'}
              ids={ups} setIds={setUps} users={users.filter((u) => CAN_UPLOAD.includes(u.role))} disabled={!domain} />
            <PeoplePicker label="Reviewer" hint="Approves them" ids={revs} setIds={setRevs}
              users={users.filter((u) => CAN_REVIEW.includes(u.role))} disabled={!domain} />
          </div>
          {current?.sheets?.length > 0 && (
            <p className="text-[10px] text-ink-500 mt-3">Data sheets in this domain: {current.sheets.map((s) => s.title).join(', ')}</p>
          )}
          {overlap.length > 0 && q.data.segregation && (
            <p className="text-[10px] text-status-pending mt-2 flex items-center gap-1"><AlertTriangle size={12} /> The same person cannot both upload and review a domain.</p>
          )}
          <div className="flex justify-end gap-2 mt-3">
            {changed && <button type="button" className="text-[11px] text-ink-500 hover:text-ink-900" onClick={() => pick(current)}>Undo changes</button>}
            <Button size="sm" onClick={submit} disabled={!domain || !changed || save.isPending || (overlap.length > 0 && q.data.segregation)}>
              {save.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Submit
            </Button>
          </div>
        </section>
      )}

      <div className="flex items-center gap-2">
        <h3 className="text-[12px] font-semibold text-ink-900">All domains</h3>
        {unassigned > 0
          ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">{unassigned} data domain{unassigned === 1 ? '' : 's'} not assigned — anyone with the Uploader role can upload them</span>
          : <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-green/15 text-brand-greenDark">Every data domain is assigned</span>}
      </div>
      <TableShell>
        <table className="w-full">
          <thead><tr className="bg-surface-muted/50">
            <th className={`${th} pl-5`}>Domain</th><th className={th}>Type</th><th className={th}>Uploaders</th><th className={th}>Reviewers</th>
            {canManage && <th className={`${th} pr-5 text-right`}>Action</th>}
          </tr></thead>
          <tbody>
            {items.map((d) => (
              <tr key={`${d.kpi_type}:${d.key}`} className={`border-t border-surface-border ${domain === d.key && kpiType === d.kpi_type ? 'bg-brand-green/5' : ''}`}>
                <td className={`${td} pl-5`}>
                  <span className="font-medium text-ink-900">{d.title}</span>
                  <span className={`ml-2 text-[9px] px-1.5 py-0.5 rounded ${PILLAR_TONE[d.pillar] || 'bg-ink-100 text-ink-700'}`}>{d.pillar}</span>
                  {d.sheets.length > 0 && <span className="block text-[9px] text-ink-300 mt-0.5">{d.sheets.map((s) => s.title).join(' · ')}</span>}
                </td>
                <td className={`${td} text-ink-700`}>{d.kpi_type === 'quantitative' ? 'Quantitative' : 'Qualitative'}</td>
                <td className={td}><Names people={d.uploaders} /></td>
                <td className={td}><Names people={d.reviewers} /></td>
                {canManage && <td className={`${td} pr-5 text-right`}>
                  <button type="button" className="text-[10px] text-brand-greenDark hover:underline" onClick={() => { pick(d); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>Edit</button>
                </td>}
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
      <p className="text-[10px] text-ink-500 flex items-start gap-1.5"><Info size={12} className="shrink-0 mt-px" />
        Company administrators can always upload; Deloitte staff working on your account are not limited by these assignments. Every change is in the Audit Logs.</p>
    </div>
  )
}

export function Names({ people }) {
  if (!people.length) return <span className="text-[10px] text-ink-300">Not assigned</span>
  return <span className="flex flex-wrap gap-1">{people.map((p) => (
    <span key={p.id} className={`text-[10px] px-1.5 py-0.5 rounded bg-ink-100 text-ink-700 ${p.active ? '' : 'line-through opacity-60'}`} title={p.email}>{p.name}</span>))}</span>
}

export function PeoplePicker({ label, hint, ids, setIds, users, disabled }) {
  const byId = Object.fromEntries(users.map((u) => [u.id, u]))
  const rest = users.filter((u) => !ids.includes(u.id))
  return (
    <div>
      <span className="text-[10px] font-medium text-ink-500">{label} <span className="font-normal text-ink-300">— {hint}</span></span>
      <div className={`mt-1 min-h-[34px] flex flex-wrap items-center gap-1 rounded-md border border-surface-border px-1.5 py-1 ${disabled ? 'bg-surface-muted' : 'bg-white'}`}>
        {ids.map((id) => (
          <span key={id} className="inline-flex items-center gap-1 text-[10px] bg-brand-green/10 text-brand-greenDark px-1.5 py-0.5 rounded">
            {byId[id]?.name || `User ${id}`}
            {!disabled && <button type="button" aria-label={`Remove ${byId[id]?.name || id}`} onClick={() => setIds(ids.filter((x) => x !== id))}><X size={10} /></button>}
          </span>
        ))}
        {!disabled && rest.length > 0 && (
          <label className="inline-flex items-center gap-1 text-[10px] text-ink-500">
            <Plus size={11} />
            <select className="bg-transparent text-[10px] text-ink-700 focus:outline-none" value="" aria-label={`Add ${label.toLowerCase()}`}
              onChange={(e) => e.target.value && setIds([...ids, Number(e.target.value)])}>
              <option value="">Add…</option>
              {rest.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role.replace('Client ', '')})</option>)}
            </select>
          </label>
        )}
        {!disabled && users.length === 0 && <span className="text-[10px] text-ink-300 px-1">Nobody has a {label.toLowerCase()} role yet</span>}
      </div>
    </div>
  )
}
