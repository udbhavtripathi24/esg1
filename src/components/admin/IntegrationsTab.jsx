import { useState } from 'react'
import { AlertCircle, Info, Loader2, Plus, PlugZap, Settings2, Wifi, WifiOff } from 'lucide-react'
import { Button, EmptyState } from '../ui.jsx'
import LoadingState from '../LoadingState.jsx'
import ErrorState from '../ErrorState.jsx'
import { useCreateIntegration, useIntegrations, useUpdateIntegration } from '../../hooks/useAdminConsole.js'
import { useDataSheets } from '../../hooks/useDatasheets.js'
import { Modal } from '../surveys/parts.jsx'
import { inputCls } from '../surveys/util.js'
import { Chip, TableShell } from './parts.jsx'
import { fmtWhen, td, th } from './util.js'

const DOMAINS = ['HR', 'Energy', 'Water', 'Waste', 'Emissions', 'Health & safety', 'Supply chain', 'Finance', 'Governance', 'Other']
const FREQUENCIES = ['Manual export', 'Daily', 'Weekly', 'Monthly', 'Quarterly']
const STATUS = {
  configured: { label: 'Active', icon: Wifi, cls: 'text-status-approved' },
  disabled: { label: 'Disabled', icon: WifiOff, cls: 'text-ink-300' },
  error: { label: 'Error', icon: AlertCircle, cls: 'text-status-pending' },
}

export default function IntegrationsTab({ toast }) {
  const q = useIntegrations({ page: 1, page_size: 100 })
  const sheets = useDataSheets()
  const [edit, setEdit] = useState(null)
  if (q.isLoading) return <LoadingState label="Loading connections…" />
  if (q.isError) return <ErrorState message={q.error?.message || 'Could not load the connections.'} onRetry={() => q.refetch()} />
  const items = q.data.items
  const count = (s) => items.filter((i) => i.status === s).length
  const sheetTitle = Object.fromEntries((sheets.data?.sheets || []).map((s) => [s.code, s.title]))

  return (
    <div>
      <p className="text-[11px] text-ink-500 mb-3">The business systems your ESG data comes from, and which data sheets each one feeds.</p>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Chip label="total" value={items.length} />
        <Chip label="active" value={count('configured')} tone="green" />
        <Chip label="disabled" value={count('disabled')} tone="amber" />
        <Chip label="error" value={count('error')} tone="red" />
        <Button size="sm" className="ml-auto" onClick={() => setEdit({})}><Plus size={13} /> New connection</Button>
      </div>
      <p className="flex items-start gap-1.5 text-[10px] text-blue-900 bg-blue-50 border border-blue-200 rounded-md px-3 py-2 mb-3">
        <Info size={12} className="shrink-0 mt-px" />
        This is a register, not a live link yet: no data is pulled automatically. Data still arrives through the Upload Center’s data sheets; recording the source system here documents where each figure comes from.
      </p>
      {items.length === 0 ? (
        <EmptyState icon={PlugZap} title="No systems recorded" subtitle="Add the HR, energy, finance and other systems your data comes from." />
      ) : (
        <TableShell>
          <table className="w-full">
            <thead><tr className="bg-surface-muted/50">
              <th className={`${th} pl-5`}>ESG domain</th><th className={th}>System</th><th className={th}>Status</th>
              <th className={th}>Feeds</th><th className={th}>Frequency / owner</th><th className={th}>Last sync</th><th className={`${th} text-right pr-5`}>Actions</th>
            </tr></thead>
            <tbody>
              {items.map((i) => {
                const c = i.config || {}
                const st = STATUS[i.status] || STATUS.error
                return (
                  <tr key={i.id} className="border-t border-surface-border align-top">
                    <td className={`${td} pl-5 font-medium text-ink-900`}>{c.domain || <span className="text-ink-300">—</span>}</td>
                    <td className={`${td} text-ink-700`}>{c.system || i.type}</td>
                    <td className={td}><span className={`inline-flex items-center gap-1 text-[10px] font-medium ${st.cls}`}><st.icon size={11} /> {st.label}</span></td>
                    <td className={`${td} max-w-[240px]`}>
                      {(c.sheets || []).length ? <span className="flex flex-wrap gap-1">{c.sheets.map((s) => <span key={s} className="text-[9px] bg-surface-muted px-1.5 py-0.5 rounded">{sheetTitle[s] || s}</span>)}</span>
                        : <span className="text-ink-300">—</span>}
                    </td>
                    <td className={`${td} text-ink-500`}>{c.frequency || '—'}{c.owner && <span className="block text-[10px]">{c.owner}</span>}</td>
                    <td className={`${td} text-ink-500`}>{i.last_sync_at ? fmtWhen(i.last_sync_at) : 'Not connected'}</td>
                    <td className={`${td} text-right pr-5`}>
                      <button type="button" onClick={() => setEdit(i)} className="inline-flex items-center gap-1 text-[10px] text-ink-700 hover:text-ink-900"><Settings2 size={12} /> Manage</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </TableShell>
      )}
      {edit && <ConnectionModal item={edit.id ? edit : null} sheets={sheets.data?.sheets || []} onClose={() => setEdit(null)} toast={toast} />}
    </div>
  )
}

function ConnectionModal({ item, sheets, onClose, toast }) {
  const create = useCreateIntegration()
  const update = useUpdateIntegration()
  const c = item?.config || {}
  const [f, setF] = useState({ domain: c.domain || 'HR', system: c.system || item?.type || '', status: item?.status || 'configured',
    frequency: c.frequency || 'Manual export', owner: c.owner || '', notes: c.notes || c.note || '', sheets: c.sheets || [] })
  const [err, setErr] = useState(null)
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }))
  const toggleSheet = (code) => setF((p) => ({ ...p, sheets: p.sheets.includes(code) ? p.sheets.filter((x) => x !== code) : [...p.sheets, code] }))
  const save = async () => {
    setErr(null)
    const config = { domain: f.domain, system: f.system, frequency: f.frequency, owner: f.owner, notes: f.notes, sheets: f.sheets }
    try {
      if (item) await update.mutateAsync({ id: item.id, body: { type: f.system, status: f.status, config } })
      else await create.mutateAsync({ type: f.system, status: f.status, config })
      toast(item ? 'Connection saved' : 'Connection added')
      onClose()
    } catch (e) { setErr(e.message || 'Could not save') }
  }
  const busy = create.isPending || update.isPending
  const lbl = 'block text-[10px] font-medium text-ink-700 mb-1'
  return (
    <Modal title={item ? `Manage ${c.system || item.type}` : 'New connection'} wide onClose={onClose}
      footer={<><Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={save} disabled={busy || !f.system.trim()}>{busy && <Loader2 size={13} className="animate-spin" />} Save</Button></>}>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="grid grid-cols-2 gap-3">
          <label><span className={lbl}>ESG domain</span>
            <select className={inputCls} value={f.domain} onChange={set('domain')}>{DOMAINS.map((d) => <option key={d}>{d}</option>)}</select></label>
          <label><span className={lbl}>System</span>
            <input className={inputCls} value={f.system} onChange={set('system')} placeholder="e.g. Workday HCM" maxLength={60} autoFocus={!item} /></label>
          <label><span className={lbl}>Status</span>
            <select className={inputCls} value={f.status} onChange={set('status')}>
              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></label>
          <label><span className={lbl}>How data comes out</span>
            <select className={inputCls} value={f.frequency} onChange={set('frequency')}>{FREQUENCIES.map((x) => <option key={x}>{x}</option>)}</select></label>
          <label className="col-span-2"><span className={lbl}>Data owner</span>
            <input className={inputCls} value={f.owner} onChange={set('owner')} placeholder="Team or role responsible" maxLength={120} /></label>
          <label className="col-span-2"><span className={lbl}>Notes</span>
            <textarea className={inputCls} rows={3} value={f.notes} onChange={set('notes')} maxLength={1000} placeholder="Report name, export steps, contact… (no passwords)" /></label>
        </div>
        <div>
          <span className={lbl}>Data sheets it feeds <span className="font-normal text-ink-300">({f.sheets.length})</span></span>
          <div className="border border-surface-border rounded-md max-h-64 overflow-y-auto divide-y divide-surface-border">
            {sheets.map((s) => (
              <label key={s.code} className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] cursor-pointer hover:bg-surface-muted">
                <input type="checkbox" className="accent-brand-green" checked={f.sheets.includes(s.code)} onChange={() => toggleSheet(s.code)} />
                {s.title}
              </label>
            ))}
          </div>
        </div>
      </div>
      {err && <p className="text-[11px] text-status-pending mt-3" role="alert">{err}</p>}
    </Modal>
  )
}
