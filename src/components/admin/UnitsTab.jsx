import { useMemo, useState } from 'react'
import { ArrowRightLeft, Check, FileSpreadsheet, Info, Loader2, Ruler, Save } from 'lucide-react'
import { Button, Card, Select } from '../ui.jsx'
import LoadingState from '../LoadingState.jsx'
import ErrorState from '../ErrorState.jsx'
import { useSaveUnits, useUnits } from '../../hooks/useUnits.js'
import { TableShell } from './parts.jsx'
import { td, th } from './util.js'

const KIND_LABEL = { energy: 'Energy', mass: 'Mass', volume: 'Volume', distance: 'Distance' }
const pretty = (name) => name.replace(/_/g, ' ')
const num = (v) => (v === null || v === undefined || Number.isNaN(v) ? '—'
  : v.toLocaleString('en-IN', { maximumSignificantDigits: 8 }))

/**
 * Admin Console → Units (backend: app/api/routes/units.py).
 *
 * Reporting units: how the Dashboard and Analytics show energy, water, emissions and waste (the KPI engine
 * always computes in fixed units; BRSR, GRI and SASB keep the units their formats require).
 * Upload units: the unit each data sheet template asks for. A file may use any unit of the same kind in its
 * column header (…_MWh instead of …_kWh) and is converted when it is read, so sites can report in the unit
 * on their bills. A converter for everyone, with the factors VISTA uses.
 */
export default function UnitsTab({ canManage, toast }) {
  const q = useUnits()
  if (q.isLoading) return <LoadingState label="Loading units…" />
  if (q.isError) return <ErrorState message={q.error?.message || 'Could not load the units.'} onRetry={() => q.refetch()} />
  return <UnitsForm key={String(q.data.updated_at)} data={q.data} canManage={canManage && q.data.can_edit} toast={toast} />
}

function UnitsForm({ data, canManage, toast }) {
  const save = useSaveUnits()
  const [rep, setRep] = useState(data.reporting)
  const [ups, setUps] = useState(data.uploads)
  const unitOf = (g) => ups[g.key] || g.unit
  const dirty = JSON.stringify(rep) !== JSON.stringify(data.reporting)
    || data.groups.some((g) => unitOf(g) !== (data.uploads[g.key] || g.unit))
  const bySheet = useMemo(() => {
    const out = []
    for (const g of data.groups) {
      const last = out[out.length - 1]
      if (last && last.sheet === g.sheet) last.groups.push(g)
      else out.push({ sheet: g.sheet, title: g.sheet_title, groups: [g] })
    }
    return out
  }, [data.groups])

  const submit = async () => {
    try {
      await save.mutateAsync({ reporting: rep, uploads: Object.fromEntries(data.groups.map((g) => [g.key, unitOf(g)])) })
      toast('Units saved. Dashboard and Analytics use them now; download the templates again for the new headers.')
    } catch (e) { toast(e.message || 'Could not save the units') }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start gap-3">
        <p className="flex-1 min-w-[280px] flex items-start gap-1.5 text-[11px] text-ink-500"><Info size={13} className="shrink-0 mt-px" />
          Choose how figures are shown, and the units your sites fill the data sheets in. Every figure is still
          calculated the same way; only the unit it is shown or collected in changes. Every change is in the Audit Logs.</p>
        {canManage && (
          <Button size="sm" onClick={submit} disabled={!dirty || save.isPending}>
            {save.isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save changes
          </Button>
        )}
      </div>

      <Card title="Reporting units" icon={Ruler} subtitle="How the Dashboard and Analytics show these quantities">
        <div className="divide-y divide-surface-border">
          {data.quantities.map((qn) => (
            <div key={qn.key} className="py-3 first:pt-0 last:pb-0 grid md:grid-cols-[11rem_1fr_auto] gap-x-4 gap-y-2 items-center">
              <div>
                <p className="text-[12px] font-medium text-ink-900">{qn.title}</p>
                <p className="text-[10px] text-ink-500">{qn.covers}</p>
              </div>
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={`${qn.title} unit`}>
                {qn.options.map((o) => {
                  const on = rep[qn.key] === o.unit
                  return (
                    <button key={o.unit} type="button" role="radio" aria-checked={on} disabled={!canManage}
                      onClick={() => setRep({ ...rep, [qn.key]: o.unit })}
                      className={`text-[11px] px-3 py-1 rounded-full border transition-colors inline-flex items-center gap-1 ${on
                        ? 'border-brand-green bg-brand-green/10 text-brand-greenDark font-medium'
                        : 'border-surface-border text-ink-700 hover:border-ink-300'} ${!canManage ? 'cursor-default' : ''}`}>
                      {on && <Check size={11} />}{o.unit}{o.unit === qn.default && <span className="text-[9px] text-ink-300 font-normal">default</span>}
                    </button>
                  )
                })}
              </div>
              <p className="text-[10px] text-ink-300 md:text-right">{qn.frameworks}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-ink-500 mt-3 pt-3 border-t border-surface-border">
          BRSR, GRI and SASB reports always use the units their formats require, whatever is chosen here.
        </p>
      </Card>

      <Card title="Upload units" icon={FileSpreadsheet} padded={false}
        subtitle="The unit each data sheet template asks for. Sites may report in any unit of the same kind.">
        <div className="px-5 pb-3 -mt-1">
          <p className="text-[10px] text-ink-500">
            The unit is part of the column header (…_kWh). A file whose header says another unit of the same kind
            (…_MWh) is accepted and converted to the template unit when it is checked, so a site billed in MWh and a
            site billed in kWh can both upload. The reviewer sees the conversion. Download the template again after a change.
          </p>
        </div>
        <TableShell>
          <table className="w-full">
            <thead><tr className="bg-surface-muted/50">
              <th className={`${th} pl-5`}>Data sheet</th><th className={th}>Columns</th><th className={th}>Kind</th>
              <th className={th}>Calculated in</th><th className={`${th} w-44`}>Template asks for</th><th className={`${th} pr-5`}>Header in the template</th>
            </tr></thead>
            <tbody>
              {bySheet.map((s) => s.groups.map((g, i) => {
                const u = unitOf(g)
                const header = u === g.unit ? g.columns[0] : g.columns[0].replace(/_[A-Za-z0-9]+$/, `_${u === 'm³' ? 'm3' : u}`)
                return (
                  <tr key={g.key} className={`${i === 0 ? 'border-t' : ''} border-surface-border align-top`}>
                    <td className={`${td} pl-5 font-medium text-ink-900`}>{i === 0 ? s.title : ''}</td>
                    <td className={`${td} text-ink-700 max-w-[260px]`} title={g.columns.map(pretty).join('\n')}>
                      {g.columns.length} column{g.columns.length === 1 ? '' : 's'}
                      <span className="block text-[9px] text-ink-300 truncate">{pretty(g.columns[0])}{g.columns.length > 1 ? ', …' : ''}</span>
                    </td>
                    <td className={`${td} text-ink-500`}>{KIND_LABEL[g.kind] || g.kind}</td>
                    <td className={`${td} text-ink-700 whitespace-nowrap`}>{g.unit}</td>
                    <td className={td}>
                      <Select value={u} disabled={!canManage} aria-label={`${s.title} ${g.unit} unit`}
                        onChange={(e) => setUps({ ...ups, [g.key]: e.target.value })}>
                        {g.options.map((o) => <option key={o.unit} value={o.unit}>{o.label}</option>)}
                      </Select>
                      {u !== g.unit && <span className="block text-[9px] text-blue-700 mt-0.5">Converted to {g.unit} on upload</span>}
                    </td>
                    <td className={`${td} pr-5 text-[10px] text-ink-500 break-all max-w-[220px]`}>{header}</td>
                  </tr>
                )
              }))}
            </tbody>
          </table>
        </TableShell>
      </Card>

      <Converter kinds={data.kinds} />
    </div>
  )
}

function Converter({ kinds }) {
  const names = Object.keys(kinds)
  const [kind, setKind] = useState(names[0])
  const units = kinds[kind]
  const [from, setFrom] = useState(units[1]?.unit || units[0].unit)
  const [to, setTo] = useState(units[0].unit)
  const [value, setValue] = useState('1')
  const size = Object.fromEntries(units.map((u) => [u.unit, u.size]))
  const n = Number(value)
  const result = value.trim() === '' || Number.isNaN(n) || !(from in size) || !(to in size) ? null : (n * size[from]) / size[to]
  const pick = (k) => { setKind(k); setFrom(kinds[k][1]?.unit || kinds[k][0].unit); setTo(kinds[k][0].unit) }
  const base = units[0]
  return (
    <Card title="Unit converter" icon={ArrowRightLeft} subtitle="The same factors VISTA uses when it converts an upload">
      <div className="grid lg:grid-cols-[1fr_18rem] gap-5">
        <div className="flex flex-wrap items-end gap-2">
          <label className="block w-32"><span className="text-[10px] text-ink-500">Kind</span>
            <Select value={kind} onChange={(e) => pick(e.target.value)} aria-label="Kind">
              {names.map((k) => <option key={k} value={k}>{KIND_LABEL[k] || k}</option>)}
            </Select></label>
          <label className="block w-32"><span className="text-[10px] text-ink-500">Value</span>
            <input className="w-full border border-surface-border rounded-md px-2.5 py-1.5 text-[12px] tabular-nums focus:outline-none focus:ring-1 focus:ring-brand-green"
              inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} aria-label="Value" /></label>
          <label className="block w-40"><span className="text-[10px] text-ink-500">From</span>
            <Select value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From">
              {units.map((u) => <option key={u.unit} value={u.unit}>{u.label}</option>)}
            </Select></label>
          <button type="button" className="mb-1.5 text-ink-500 hover:text-brand-green" aria-label="Swap units"
            onClick={() => { setFrom(to); setTo(from) }}><ArrowRightLeft size={14} /></button>
          <label className="block w-40"><span className="text-[10px] text-ink-500">To</span>
            <Select value={to} onChange={(e) => setTo(e.target.value)} aria-label="To">
              {units.map((u) => <option key={u.unit} value={u.unit}>{u.label}</option>)}
            </Select></label>
          <p className="basis-full text-[13px] text-ink-900 mt-2" aria-live="polite">
            {result === null ? 'Enter a number.' : <><span className="tabular-nums">{num(n)}</span> {from} = <strong className="tabular-nums">{num(result)}</strong> {to}</>}
          </p>
        </div>
        <div className="bg-surface-muted rounded-md p-3">
          <p className="text-[10px] font-semibold text-ink-900 mb-1.5">{KIND_LABEL[kind] || kind}: in {base.unit}</p>
          <ul className="space-y-1">
            {units.slice(1).map((u) => (
              <li key={u.unit} className="flex justify-between text-[10px] text-ink-700">
                <span>1 {u.unit}</span><span className="tabular-nums">{num(u.size / base.size)} {base.unit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  )
}
