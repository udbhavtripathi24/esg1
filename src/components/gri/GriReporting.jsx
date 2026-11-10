import { useState } from 'react'
import { BookOpen, CheckCircle2, Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import { Button, Card, EmptyState, Field, ProgressBar, Select } from '../ui.jsx'
import LoadingState from '../LoadingState.jsx'
import ErrorState from '../ErrorState.jsx'
import { useDisclosureWorkspace } from '../../hooks/useDisclosures.js'
import { FRAMEWORK_UI } from './frameworks.js'
import { GRI_STATE, GROUP_TONE, errMessage } from './format.js'

/** Reporting → GRI / SASB: how ready the report is, who still owes what, and the two downloads. */
export default function GriReporting({ fw = 'gri' }) {
  const ui = FRAMEWORK_UI[fw]
  const [fy, setFy] = useState(null)
  const q = useDisclosureWorkspace(fw, fy, null)
  const [busy, setBusy] = useState(null)
  const [err, setErr] = useState(null)

  if (q.isLoading) return <Card><LoadingState label={`Checking the ${ui.name} report…`} /></Card>
  if (q.isError) return <Card><ErrorState message={errMessage(q.error, `Could not load ${ui.name}.`)} onRetry={() => q.refetch()} /></Card>
  const d = q.data
  if (!d.enabled) {
    return <Card><EmptyState icon={BookOpen} title={`${ui.name} is not switched on`} subtitle="Turn it on in Admin Console → Frameworks & KPIs." /></Card>
  }
  if (!d.total && ui.setupHint) return <Card><EmptyState icon={BookOpen} title={ui.setupTitle} subtitle={ui.setupHint} /></Card>
  const ready = d.complete === d.total
  const fys = [...new Set([...(d.years || []), d.fy])].sort().reverse()
  const open = d.items.filter((i) => !i.complete)
  const owed = d.departments.map((x) => ({
    ...x,
    open: open.filter((i) => i.department === x.department),
  })).filter((x) => x.open.length).sort((a, b) => b.open.length - a.open.length)

  async function get(kind) {
    setBusy(kind)
    setErr(null)
    try { await ui.downloads.find((x) => x.id === kind).fn(d.fy) } catch (e) { setErr(errMessage(e, 'Download failed')) } finally { setBusy(null) }
  }

  return (
    <div className="space-y-5">
      <Card title={`${ui.name} report readiness`} icon={CheckCircle2}
        subtitle="Figures come from approved data sheets; answers count once the owner's reviewer approves them.">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
          <div className="flex items-end gap-6">
            <div className="w-36">
              <Field label="Financial year">
                <Select value={d.fy} onChange={(e) => setFy(e.target.value)}>
                  {fys.map((y) => <option key={y} value={y}>FY {y}</option>)}
                </Select>
              </Field>
            </div>
            <div>
              <p className="text-2xl font-semibold text-ink-900 tabular-nums">{d.complete}/{d.total}
                <span className="text-sm font-normal text-ink-500"> {ui.nouns} complete</span></p>
              <p className="text-[10px] text-ink-500">{ready ? 'Ready: the files are final.' : `The files are marked DRAFT until every ${ui.noun} is complete or omitted with a reason.`}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!!busy} onClick={() => get('xlsx')}>
              {busy === 'xlsx' ? <Loader2 size={12} className="animate-spin" /> : <FileSpreadsheet size={12} />} {ui.downloads[0].label} (.xlsx)
            </Button>
            <Button size="sm" disabled={!!busy} onClick={() => get('docx')}>
              {busy === 'docx' ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />} {ui.downloads[1].label} (.docx)
            </Button>
          </div>
        </div>
        {err && <p className="mb-3 rounded p-2 bg-red-50 text-status-pending text-[11px]">{err}</p>}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {d.groups.map((g) => (
            <div key={g.key} className="rounded-lg border border-surface-border p-3">
              <p className={`text-[11px] font-semibold ${(GROUP_TONE[g.key] || 'text-ink-900')}`}>{g.title}</p>
              <p className="text-[10px] text-ink-500 mb-2 tabular-nums">{g.complete} of {g.total}</p>
              <ProgressBar pct={g.total ? (g.complete / g.total) * 100 : 0} />
            </div>
          ))}
        </div>
      </Card>

      <Card title="Still to do, by owner" icon={Download}
        subtitle={`Each owner answers its ${ui.nouns} in Upload Center → ${ui.name}.`}>
        {owed.length === 0 ? <p className="text-[11px] text-ink-500">Nothing left — everything is complete.</p> : (
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-left text-[10px] text-ink-500 border-b border-surface-border">
                <th className="py-2 font-medium">Department</th>
                <th className="py-2 font-medium text-right">Open</th>
                {['todo', 'brsr_available', 'draft', 'submitted', 'returned', 'no_data'].map((s) => (
                  <th key={s} className="py-2 font-medium text-right">{GRI_STATE[s].label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {owed.map((x) => (
                <tr key={x.department}>
                  <td className="py-2 text-ink-900 font-medium">{x.department}</td>
                  <td className="py-2 text-right tabular-nums font-semibold">{x.open.length}</td>
                  {['todo', 'brsr_available', 'draft', 'submitted', 'returned', 'no_data'].map((s) => (
                    <td key={s} className="py-2 text-right tabular-nums text-ink-500">{x.open.filter((i) => i.state === s).length || '–'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
