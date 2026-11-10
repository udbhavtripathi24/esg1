import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Building2, Check, Database, Factory, Loader2, PenLine, UserCheck, X } from 'lucide-react'
import { Button } from '../ui.jsx'
import LoadingState from '../LoadingState.jsx'
import ErrorState from '../ErrorState.jsx'
import { Drawer } from '../surveys/parts.jsx'
import { inputCls } from '../surveys/util.js'
import { useAdminUsers } from '../../hooks/useAdmin.js'
import { useSetDomain } from '../../hooks/useKpis.js'
import { useSasbIndustries, useSasbMetrics, useSetSasbIndustries } from '../../hooks/useSasb.js'
import { StarterNote } from '../sasb/SasbWorkspace.jsx'
import { Names, PeoplePicker } from './DomainAssignmentPanel.jsx'
import { CAN_REVIEW, CAN_UPLOAD, PILLAR_TONE } from './kpiFormat.js'

/**
 * Admin Console → Frameworks & KPIs → SASB setup (the engagement manager's wireframe):
 * Industry (SICS sector) → Sub-industry (SICS industry) → its metrics, each with KPI type, domain,
 * uploader and reviewer. People are assigned per domain, the same assignment as Roles → KPI domains,
 * so one assignment covers the data sheets, BRSR, GRI and SASB.
 */
export default function SasbSetup({ canManage, toast }) {
  const q = useSasbIndustries()
  const metrics = useSasbMetrics(null, { enabled: !!q.data?.selected?.length })
  const save = useSetSasbIndustries()
  const [sector, setSector] = useState('')
  const [draft, setDraft] = useState(null)
  const [edit, setEdit] = useState(null)
  const [filter, setFilter] = useState('')

  const sel = draft ?? q.data?.selected ?? []
  const rows = useMemo(() => (metrics.data?.items || []).filter((m) => !filter || m.industry === filter), [metrics.data, filter])
  if (q.isLoading) return <LoadingState label="Loading SASB industries…" />
  if (q.isError) return <ErrorState message={q.error?.message || 'Could not load SASB.'} onRetry={() => q.refetch()} />
  const d = q.data
  const sectorCode = sector || d.industries.find((i) => sel.includes(i.code))?.sector || d.sectors[0].code
  const inSector = d.industries.filter((i) => i.sector === sectorCode)
  const changed = draft && draft.join() !== d.selected.join()
  const toggle = (code) => setDraft(sel.includes(code) ? sel.filter((c) => c !== code) : [...sel, code])
  const name = (code) => d.industries.find((i) => i.code === code)?.name || code
  const submit = async () => {
    try {
      const r = await save.mutateAsync(sel)
      setDraft(null)
      toast(r.selected.length ? `SASB industries: ${r.selected.map(name).join(', ')}` : 'No SASB industry selected')
    } catch (e) { toast(e.message || 'Could not save the SASB industries') }
  }

  return (
    <section className="bg-white border border-surface-border rounded-lg p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink-900 flex items-center gap-2"><Factory size={15} className="text-brand-green" /> SASB setup</h3>
          <p className="text-[11px] text-ink-500 mt-0.5">Pick the industry and sub-industry the company reports under. Their metrics appear in Upload Center → SASB with the people assigned below.</p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            {changed && <button type="button" className="text-[11px] text-ink-500 hover:text-ink-900" onClick={() => setDraft(null)}>Cancel</button>}
            <Button size="sm" onClick={submit} disabled={!changed || save.isPending}>
              {save.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save industries
            </Button>
          </div>
        )}
      </div>
      {!d.verified && <StarterNote />}

      <div className="grid md:grid-cols-[14rem_1fr] gap-4">
        <div>
          <label htmlFor="sasb-sector" className="text-[10px] font-medium text-ink-500">Industry</label>
          <select id="sasb-sector" className={`${inputCls} mt-1`} value={sectorCode} onChange={(e) => setSector(e.target.value)}>
            {d.sectors.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
          </select>
          {sel.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] font-medium text-ink-500 mb-1">Selected ({sel.length})</p>
              <div className="flex flex-wrap gap-1">
                {sel.map((c) => (
                  <span key={c} className="inline-flex items-center gap-1 text-[10px] bg-brand-green/10 text-brand-greenDark px-1.5 py-0.5 rounded">
                    {name(c)}
                    {canManage && <button type="button" aria-label={`Remove ${name(c)}`} onClick={() => toggle(c)}><X size={10} /></button>}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div>
          <p className="text-[10px] font-medium text-ink-500 mb-1">Sub-industry</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {inSector.map((i) => {
              const on = sel.includes(i.code)
              return (
                <button key={i.code} type="button" disabled={!canManage} onClick={() => toggle(i.code)} aria-pressed={on}
                  className={`text-left rounded-lg border p-3 transition-all ${on ? 'border-brand-green bg-brand-green/5 ring-1 ring-brand-green/30' : 'border-surface-border hover:border-ink-300'}`}>
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-semibold text-ink-900">{i.name}</span>
                    <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${on ? 'bg-brand-green border-brand-green' : 'border-ink-300'}`}>
                      {on && <Check size={11} className="text-white" />}
                    </span>
                  </span>
                  <span className="block text-[10px] text-ink-500 mt-1">
                    {i.code} · {i.metrics} metrics · {i.topics.length} topics · {i.from_data} filled from your data
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {d.selected.length > 0 && (
        <div className="border-t border-surface-border pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h4 className="text-[12px] font-semibold text-ink-900 flex items-center gap-1.5"><UserCheck size={13} className="text-brand-green" /> Metrics, domains and people</h4>
            {d.selected.length > 1 && (
              <select className={inputCls.replace('w-full', 'w-64')} value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by sub-industry">
                <option value="">All sub-industries</option>
                {d.selected.map((c) => <option key={c} value={c}>{name(c)}</option>)}
              </select>
            )}
          </div>
          {metrics.isLoading ? <LoadingState label="Loading metrics…" /> : (
            <div className="overflow-x-auto border border-surface-border rounded-md">
              <table className="w-full text-[11px]">
                <thead className="bg-surface-muted">
                  <tr className="text-left text-[10px] text-ink-500">
                    <th className="px-3 py-2 font-medium">Metric</th>
                    <th className="px-3 py-2 font-medium">KPI type</th>
                    <th className="px-3 py-2 font-medium">Domain</th>
                    <th className="px-3 py-2 font-medium">Uploader</th>
                    <th className="px-3 py-2 font-medium">Reviewer</th>
                    {canManage && <th className="px-3 py-2" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {rows.map((m) => (
                    <tr key={m.key} className="align-top">
                      <td className="px-3 py-2 max-w-md">
                        <span className="font-mono text-[10px] text-ink-500">{m.key}</span>
                        <span className="block text-ink-900">{m.text}</span>
                        <span className="text-[10px] text-ink-300">{m.industry_name} · {m.topic}</span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="capitalize">{m.kind}</span>
                        {m.from_data && <span className="flex items-center gap-1 text-[10px] text-brand-greenDark mt-0.5"><Database size={10} /> From data</span>}
                        {!m.from_data && <span className="flex items-center gap-1 text-[10px] text-ink-500 mt-0.5"><PenLine size={10} /> Typed</span>}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${PILLAR_TONE[m.pillar] || 'bg-ink-100 text-ink-700'}`}>{m.domain_title}</span>
                      </td>
                      <td className="px-3 py-2"><Names people={m.uploaders} /></td>
                      <td className="px-3 py-2"><Names people={m.reviewers} /></td>
                      {canManage && (
                        <td className="px-3 py-2 text-right">
                          <button type="button" className="text-[10px] text-brand-green hover:underline whitespace-nowrap" onClick={() => setEdit(m)}>Assign</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-[10px] text-ink-500 mt-2 flex items-center gap-1"><Building2 size={11} /> People are assigned per domain: changing one metric's people changes every metric and data sheet in that domain.</p>
        </div>
      )}
      {edit && <AssignDrawer m={edit} onClose={() => setEdit(null)} toast={toast} />}
    </section>
  )
}

function AssignDrawer({ m, onClose, toast }) {
  const people = useAdminUsers({ page: 1, page_size: 100, status: 'active' })
  const save = useSetDomain()
  const qc = useQueryClient()
  const [ups, setUps] = useState(m.uploaders.map((u) => u.id))
  const [revs, setRevs] = useState(m.reviewers.map((u) => u.id))
  const users = people.data?.items || []
  const overlap = ups.filter((id) => revs.includes(id))
  const submit = async () => {
    try {
      await save.mutateAsync({ key: m.domain, kpiType: m.domain_kpi_type, body: { uploader_ids: ups, reviewer_ids: revs } })
      await qc.invalidateQueries({ queryKey: ['sasb'] })
      toast(`${m.domain_title}: saved`)
      onClose()
    } catch (e) { toast(e.message || 'Could not save the assignment') }
  }
  return (
    <Drawer title={`Assign · ${m.domain_title}`} onClose={onClose}>
      <div className="space-y-4 text-[11px]">
        <p className="text-ink-700"><span className="font-mono text-[10px] text-ink-500">{m.key}</span> {m.text}</p>
        <p className="text-[10px] text-ink-500 bg-surface-muted rounded p-2">
          {m.domain_kpi_type === 'quantitative'
            ? `The ${m.domain_title} domain: these people also upload and review its data sheets.`
            : `The ${m.domain_title} department: the uploader is its SPOC for BRSR, GRI and SASB answers.`}
        </p>
        {people.isLoading ? <LoadingState label="Loading people…" /> : (
          <>
            <PeoplePicker label="Uploader" hint="answers and uploads" ids={ups} setIds={setUps} users={users.filter((u) => CAN_UPLOAD.includes(u.role))} />
            <PeoplePicker label="Reviewer" hint="approves" ids={revs} setIds={setRevs} users={users.filter((u) => CAN_REVIEW.includes(u.role))} />
          </>
        )}
        {overlap.length > 0 && <p className="text-status-pending">The same person cannot upload and review the same domain.</p>}
        <Button size="sm" onClick={submit} disabled={save.isPending || overlap.length > 0}>
          {save.isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Submit
        </Button>
      </div>
    </Drawer>
  )
}
