import { useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Check, ChevronDown, ChevronRight, Download, Info, Layers, Loader2, Minus, Search } from 'lucide-react'
import { Button } from '../ui.jsx'
import LoadingState from '../LoadingState.jsx'
import ErrorState from '../ErrorState.jsx'
import { Drawer } from '../surveys/parts.jsx'
import { inputCls } from '../surveys/util.js'
import { downloadCatalogue } from '../../api/kpis.js'
import { useFrameworks, useKpiCatalogue, useSetFrameworks, useSetSelection } from '../../hooks/useKpis.js'
import { KIND_LABEL, PILLAR_TONE, changePct, changeTone, fmtNum, fyOptions } from './kpiFormat.js'
import SasbSetup from './SasbSetup.jsx'

const FRAMEWORKS = [
  { code: 'BRSR', name: 'BRSR', text: 'SEBI Business Responsibility and Sustainability Report — mandatory for the top 1,000 listed companies.' },
  { code: 'GRI', name: 'GRI Standards', text: 'Global Reporting Initiative: universal, economic, environmental and social disclosures.' },
  { code: 'SASB', name: 'SASB', text: 'Industry-specific metrics, chosen by industry and sub-industry in SASB setup below.' },
]

/** Admin Console → Frameworks & KPIs: what the company reports under, and the KPI catalogue. */
export default function KpiCatalogueTab({ canManage, toast }) {
  const [fy, setFy] = useState(null)
  const q = useKpiCatalogue(fy ? { fy } : {})
  const fw = useFrameworks()
  const fys = [...new Set([...(q.data?.years || []), ...fyOptions(4)])].sort().reverse()
  return (
    <div className="space-y-5">
      <FrameworkPicker canManage={canManage} toast={toast} />
      {(fw.data?.frameworks || []).includes('SASB') && <SasbSetup canManage={canManage} toast={toast} />}
      {q.isLoading ? <LoadingState label="Working out every KPI…" />
        : q.isError ? <ErrorState message={q.error?.message || 'Could not load the KPI catalogue.'} onRetry={() => q.refetch()} />
          : <Catalogue data={q.data} fy={fy || q.data.fy} setFy={setFy} fys={fys} canManage={canManage} toast={toast} fetching={q.isFetching} />}
    </div>
  )
}

function FrameworkPicker({ canManage, toast }) {
  const q = useFrameworks()
  const save = useSetFrameworks()
  const [draft, setDraft] = useState(null)
  if (q.isLoading || q.isError) return null
  const current = q.data.frameworks
  const chosen = draft ?? current
  const changed = draft && draft.join() !== current.join()
  const toggle = (code) => {
    if (!canManage) return
    const next = chosen.includes(code) ? chosen.filter((c) => c !== code) : [...chosen, code]
    setDraft(FRAMEWORKS.map((f) => f.code).filter((c) => next.includes(c)))
  }
  const submit = async () => {
    try {
      const r = await save.mutateAsync(chosen)
      setDraft(null)
      toast(`Reporting under ${r.frameworks.join(' + ')}`)
    } catch (e) { toast(e.message || 'Could not save the frameworks') }
  }
  return (
    <section className="bg-white border border-surface-border rounded-lg p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-ink-900 flex items-center gap-2"><Layers size={15} className="text-brand-green" /> Reporting frameworks</h3>
          <p className="text-[11px] text-ink-500 mt-0.5">Choose what this company reports under. Reports, KPIs and the menu follow this choice.</p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            {changed && <button type="button" className="text-[11px] text-ink-500 hover:text-ink-900" onClick={() => setDraft(null)}>Cancel</button>}
            <Button size="sm" onClick={submit} disabled={!changed || save.isPending || chosen.length === 0}>
              {save.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save
            </Button>
          </div>
        )}
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        {FRAMEWORKS.map((f) => {
          const on = chosen.includes(f.code)
          return (
            <button key={f.code} type="button" onClick={() => toggle(f.code)} disabled={!canManage} aria-pressed={on}
              className={`text-left rounded-lg border p-3 transition-all ${on ? 'border-brand-green bg-brand-green/5 ring-1 ring-brand-green/30' : 'border-surface-border hover:border-ink-300'} ${canManage ? '' : 'cursor-default'}`}>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-ink-900">{f.name}</span>
                <span className={`w-4 h-4 rounded border flex items-center justify-center ${on ? 'bg-brand-green border-brand-green' : 'border-ink-300'}`}>
                  {on && <Check size={11} className="text-white" />}
                </span>
              </div>
              <p className="text-[10px] text-ink-500 mt-1.5 leading-snug">{f.text}</p>
            </button>
          )
        })}
      </div>
      {chosen.length === 0 && <p className="text-[10px] text-status-pending mt-2">Choose at least one framework.</p>}
    </section>
  )
}

function Catalogue({ data, fy, setFy, fys, canManage, toast, fetching }) {
  const [search, setSearch] = useState('')
  const [pillar, setPillar] = useState('')
  const [kind, setKind] = useState('')
  const [status, setStatus] = useState('')
  const [open, setOpen] = useState({})
  const [detail, setDetail] = useState(null)
  const [busy, setBusy] = useState(false)
  const select = useSetSelection()

  const items = useMemo(() => {
    const s = search.trim().toLowerCase()
    return data.items.filter((i) => (!pillar || i.pillar === pillar) && (!kind || i.kind === kind)
      && (!status || (status === 'ok' ? i.status === 'ok' : status === 'off' ? !i.enabled : i.status === 'no_data'))
      && (!s || i.name.toLowerCase().includes(s) || i.code.includes(s) || (i.catalogue || '').toLowerCase().includes(s)
        || i.brsr.toLowerCase().includes(s)))
  }, [data.items, search, pillar, kind, status])
  const groups = useMemo(() => {
    const m = new Map()
    items.forEach((i) => { if (!m.has(i.domain)) m.set(i.domain, { key: i.domain, title: i.domain_title, pillar: i.pillar, items: [] }); m.get(i.domain).items.push(i) })
    return [...m.values()]
  }, [items])
  const withData = data.items.filter((i) => i.status === 'ok').length
  const filtering = Boolean(search || pillar || kind || status)

  const toggle = async (codes, enabled) => {
    try {
      const r = await select.mutateAsync({ codes, enabled })
      toast(r.changed ? `${r.changed} KPI${r.changed === 1 ? '' : 's'} ${enabled ? 'tracked' : 'no longer tracked'}` : 'Nothing to change')
    } catch (e) { toast(e.message || 'Could not change the selection') }
  }
  const exportXlsx = async () => {
    setBusy(true)
    try { await downloadCatalogue(fy) } catch (e) { toast(e.message || 'Download failed') } finally { setBusy(false) }
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-ink-900 mr-2">KPI catalogue</h3>
        <span className="text-[10px] px-2 py-1 rounded-full bg-ink-100 text-ink-700"><strong className="tabular-nums">{data.total}</strong> KPIs</span>
        <span className="text-[10px] px-2 py-1 rounded-full bg-brand-green/15 text-brand-greenDark"><strong className="tabular-nums">{data.enabled}</strong> tracked</span>
        <span className="text-[10px] px-2 py-1 rounded-full bg-blue-50 text-blue-700"><strong className="tabular-nums">{withData}</strong> with data in FY {data.fy}</span>
        {fetching && <Loader2 size={13} className="animate-spin text-ink-300" />}
        <div className="flex-1" />
        <Button size="sm" variant="ghost" onClick={exportXlsx} disabled={busy}>
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Export (Excel)
        </Button>
      </div>
      <p className="text-[11px] text-ink-500 flex items-start gap-1.5"><Info size={13} className="shrink-0 mt-px" />
        Every KPI from the engagement&apos;s KPI catalogue, worked out from the approved data sheets. Untick a KPI to stop tracking it; it stays in the catalogue. Open a KPI to see its formula, data sheets and BRSR reference.</p>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-300" />
          <input className={`${inputCls} !pl-7 !w-64 !py-2`} placeholder="Search KPI, code or BRSR reference" value={search}
            onChange={(e) => setSearch(e.target.value)} aria-label="Search KPIs" />
        </div>
        <select className={`${inputCls} !w-36 !py-2`} value={fy} onChange={(e) => setFy(e.target.value)} aria-label="Financial year">
          {fys.map((f) => <option key={f} value={f}>FY {f}{data.years?.includes(f) ? '' : ' (no data)'}</option>)}
        </select>
        <select className={`${inputCls} !w-36 !py-2`} value={pillar} onChange={(e) => setPillar(e.target.value)} aria-label="Pillar">
          <option value="">All pillars</option><option>Environment</option><option>Social</option><option>Governance</option>
        </select>
        <select className={`${inputCls} !w-36 !py-2`} value={kind} onChange={(e) => setKind(e.target.value)} aria-label="KPI type">
          <option value="">All types</option>{Object.entries(KIND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className={`${inputCls} !w-40 !py-2`} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="">Any status</option><option value="ok">With data</option><option value="no_data">No data yet</option><option value="off">Not tracked</option>
        </select>
        {filtering && <button type="button" className="text-[11px] text-brand-greenDark hover:underline" onClick={() => { setSearch(''); setPillar(''); setKind(''); setStatus('') }}>Clear filters</button>}
        <span className="text-[10px] text-ink-500 ml-auto">{items.length} shown</span>
      </div>

      <div className="space-y-2">
        {groups.length === 0 && <p className="text-[11px] text-ink-500 py-6 text-center">No KPI matches these filters.</p>}
        {groups.map((g) => {
          const isOpen = open[g.key] ?? filtering
          const tracked = g.items.filter((i) => i.enabled).length
          return (
            <div key={g.key} className="bg-white border border-surface-border rounded-lg overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-2.5">
                <button type="button" className="flex items-center gap-2 flex-1 text-left" aria-expanded={isOpen}
                  onClick={() => setOpen((p) => ({ ...p, [g.key]: !isOpen }))}>
                  {isOpen ? <ChevronDown size={14} className="text-ink-500" /> : <ChevronRight size={14} className="text-ink-500" />}
                  <span className="text-[12px] font-semibold text-ink-900">{g.title}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${PILLAR_TONE[g.pillar]}`}>{g.pillar}</span>
                  <span className="text-[10px] text-ink-500">{g.items.length} KPIs · {tracked} tracked · {g.items.filter((i) => i.status === 'ok').length} with data</span>
                </button>
                {canManage && isOpen && (
                  <span className="flex items-center gap-2 text-[10px]">
                    <button type="button" className="text-brand-greenDark hover:underline" onClick={() => toggle(g.items.map((i) => i.code), true)}>Track all</button>
                    <span className="text-ink-300">·</span>
                    <button type="button" className="text-ink-500 hover:underline" onClick={() => toggle(g.items.map((i) => i.code), false)}>Stop tracking all</button>
                  </span>
                )}
              </div>
              {isOpen && (
                <table className="w-full border-t border-surface-border">
                  <thead><tr className="bg-surface-muted/50 text-[10px] text-ink-500">
                    <th className="w-10 px-3 py-2 text-left font-medium">Track</th>
                    <th className="px-3 py-2 text-left font-medium">KPI</th>
                    <th className="px-3 py-2 text-left font-medium">Type</th>
                    <th className="px-3 py-2 text-right font-medium">FY {data.fy}</th>
                    <th className="px-3 py-2 text-right font-medium">FY {data.previous_fy}</th>
                    <th className="px-3 py-2 text-right font-medium">Change</th>
                    <th className="px-3 py-2 text-left font-medium">BRSR</th>
                    <th className="w-10 px-3 py-2" />
                  </tr></thead>
                  <tbody>
                    {g.items.map((i) => <KpiRow key={i.code} i={i} canManage={canManage} onToggle={toggle} onOpen={() => setDetail(i)} />)}
                  </tbody>
                </table>
              )}
            </div>
          )
        })}
      </div>
      {detail && <KpiDetail i={detail} fy={data.fy} pfy={data.previous_fy} onClose={() => setDetail(null)} all={data.items} />}
    </section>
  )
}

function KpiRow({ i, canManage, onToggle, onOpen }) {
  const pct = i.kind === 'breakdown' ? null : changePct(i.value, i.previous)
  const tone = changeTone(pct, i.better)
  const Arrow = tone === 'flat' ? Minus : pct > 0 ? ArrowUpRight : ArrowDownRight
  return (
    <tr className={`border-t border-surface-border text-[11px] ${i.enabled ? '' : 'opacity-50'}`}>
      <td className="px-3 py-2">
        <input type="checkbox" checked={i.enabled} disabled={!canManage} onChange={(e) => onToggle([i.code], e.target.checked)}
          aria-label={`Track ${i.name}`} className="accent-brand-green" />
      </td>
      <td className="px-3 py-2">
        <button type="button" onClick={onOpen} className="text-left">
          <span className="font-medium text-ink-900 hover:text-brand-greenDark">{i.name}</span>
          <span className="block text-[9px] text-ink-300 font-mono">{i.code}</span>
        </button>
      </td>
      <td className="px-3 py-2"><span className="text-[9px] px-1.5 py-0.5 rounded bg-ink-100 text-ink-700">{KIND_LABEL[i.kind]}</span></td>
      <td className="px-3 py-2 text-right tabular-nums text-ink-900 whitespace-nowrap">
        {i.kind === 'breakdown' ? <span className="text-ink-300">{i.parts.length} parts</span>
          : i.status === 'no_data' ? <span className="text-[10px] text-ink-300">No data</span>
            : <>{fmtNum(i.value, i.unit)} {i.unit && i.unit !== '%' && i.unit !== '₹' && <span className="text-[9px] text-ink-500">{i.unit}</span>}</>}
      </td>
      <td className="px-3 py-2 text-right tabular-nums text-ink-500 whitespace-nowrap">{i.kind === 'breakdown' ? '' : fmtNum(i.previous, i.unit)}</td>
      <td className="px-3 py-2 text-right whitespace-nowrap">
        {pct === null ? <span className="text-ink-300">—</span> : (
          <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${tone === 'good' ? 'text-status-approved' : tone === 'bad' ? 'text-status-pending' : 'text-ink-500'}`}>
            <Arrow size={11} />{Math.abs(pct).toFixed(1)}%
          </span>)}
      </td>
      <td className="px-3 py-2 text-[10px] text-ink-500 whitespace-nowrap">{i.brsr || '—'}</td>
      <td className="px-3 py-2">{(i.note || i.skipped.length > 0) && <span title={i.note || i.skipped[0]} className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />}</td>
    </tr>
  )
}

function KpiDetail({ i, fy, pfy, onClose, all }) {
  const byCode = Object.fromEntries(all.map((x) => [x.code, x]))
  const parts = i.kind === 'breakdown' ? i.parts.map((c) => byCode[c]).filter(Boolean) : []
  const used = (i.formula || '').match(/[a-z][a-z0-9_]*/g)?.filter((n) => byCode[n] && !['pct', 'div', 'sum', 'add'].includes(n)) || []
  return (
    <Drawer title={i.name} onClose={onClose}>
      <div className="p-5 space-y-4 text-[11px]">
        <div className="flex flex-wrap gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded ${PILLAR_TONE[i.pillar]}`}>{i.pillar} · {i.domain_title}</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-ink-100 text-ink-700">{KIND_LABEL[i.kind]}</span>
          {i.brsr && <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700">BRSR {i.brsr}</span>}
          {i.gri.map((g) => <span key={g} className="text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-700">GRI {g}</span>)}
        </div>
        {i.kind !== 'breakdown' && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-surface-muted/60 p-3"><p className="text-[10px] text-ink-500">FY {fy}</p>
              <p className="text-lg font-semibold text-ink-900 tabular-nums">{fmtNum(i.value, i.unit)} <span className="text-[10px] font-normal text-ink-500">{i.unit !== '%' && i.unit !== '₹' ? i.unit : ''}</span></p></div>
            <div className="rounded-lg bg-surface-muted/60 p-3"><p className="text-[10px] text-ink-500">FY {pfy}</p>
              <p className="text-lg font-semibold text-ink-700 tabular-nums">{fmtNum(i.previous, i.unit)}</p></div>
          </div>
        )}
        <Row label="How the year's value is formed">{i.agg}</Row>
        {i.formula && (
          <Row label="Formula">
            <code className="block bg-ink-900 text-green-200 rounded p-2 text-[10px] whitespace-pre-wrap break-words">{i.formula}</code>
            {used.length > 0 && <ul className="mt-2 space-y-1">{[...new Set(used)].map((n) => (
              <li key={n} className="flex justify-between gap-3"><span className="font-mono text-[10px] text-ink-500">{n}</span>
                <span className="text-ink-700 text-right">{byCode[n].name} — <strong className="tabular-nums">{fmtNum(byCode[n].value, byCode[n].unit)}</strong></span></li>))}</ul>}
          </Row>
        )}
        {parts.length > 0 && (
          <Row label="Shown together">
            <ul className="space-y-1">{parts.map((p) => (
              <li key={p.code} className="flex justify-between gap-3"><span className="text-ink-700">{p.name}</span>
                <strong className="tabular-nums">{fmtNum(p.value, p.unit)}</strong></li>))}</ul>
          </Row>
        )}
        {i.sheets.length > 0 && <Row label="Data sheets">{i.sheets.map((s) => s.replace(/_/g, ' ')).join(', ')}</Row>}
        <Row label="Catalogue name"><span className="font-mono text-[10px]">{i.catalogue}</span></Row>
        {i.note && <Row label="Difference from the catalogue"><p className="bg-amber-50 text-amber-900 rounded p-2 leading-relaxed">{i.note}</p></Row>}
        {i.skipped.length > 0 && <Row label="Rows not counted"><ul className="list-disc pl-4 text-status-pending">{i.skipped.slice(0, 8).map((s) => <li key={s}>{s}</li>)}</ul></Row>}
      </div>
    </Drawer>
  )
}

function Row({ label, children }) {
  return <div><p className="text-[10px] font-medium text-ink-500 mb-1">{label}</p><div className="text-ink-900">{children}</div></div>
}
