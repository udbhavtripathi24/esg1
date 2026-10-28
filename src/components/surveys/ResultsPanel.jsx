import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, CheckCircle2, Download, EyeOff, Info, Loader2, Paperclip } from 'lucide-react'
import { Button } from '../ui.jsx'
import LoadingState from '../LoadingState.jsx'
import ErrorState from '../ErrorState.jsx'
import { useResults } from '../../hooks/useSurveys.js'
import { exportResults, fileDownload } from '../../api/surveys.js'
import { saveBlob } from './util.js'
import { TYPE_BY_KEY, errText, fmtDate } from './logic.js'

// Chart colours: one hue (brand green) for magnitude; a blue ↔ grey ↔ red
// diverging set for NPS (promoters / passives / detractors). Text stays in ink.
const GREEN = '#4A9038'
const GREEN_RAMP = ['#EEF6EA', '#D4EACB', '#B3DAA3', '#8CC777', '#64BC44', '#4A9038']
const PROMOTER = '#2a78d6'
const PASSIVE = '#c9c8c3'
const DETRACTOR = '#e34948'
const GRID = '#ECEDEE'

export default function ResultsPanel({ survey }) {
  const [group, setGroup] = useState('')
  const [exporting, setExporting] = useState(false)
  const [exportErr, setExportErr] = useState(null)
  const res = useResults(survey.id, group || null)

  const doExport = async () => {
    setExporting(true)
    setExportErr(null)
    try {
      const { blob, filename } = await exportResults(survey.id, survey.title)
      saveBlob(blob, filename)
    } catch (e) { setExportErr(errText(e, 'Export failed')) } finally { setExporting(false) }
  }

  if (res.isLoading) return <LoadingState label="Calculating results…" />
  if (res.isError) return <ErrorState message={errText(res.error, 'Could not load results.')} onRetry={() => res.refetch()} />
  const d = res.data
  const s = d.summary
  const assessment = survey.kind === 'assessment'
  const visibleGroups = d.groups.filter((g) => !g.hidden)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        {d.groups.length > 0 && (
          <label className="flex items-center gap-2 text-[11px] text-ink-500">
            Show
            <select className="px-2 py-1.5 rounded-md border border-surface-border text-[11px] bg-white" value={group} onChange={(e) => setGroup(e.target.value)}>
              <option value="">Everyone</option>
              {d.groups.map((g) => (
                <option key={g.label} value={g.label} disabled={g.hidden}>
                  {g.label} ({g.responses}){g.hidden ? ` — fewer than ${d.min_group}` : ''}
                </option>
              ))}
            </select>
          </label>
        )}
        {survey.anonymous && <span className="flex items-center gap-1 text-[10px] text-ink-500"><EyeOff size={11} /> Anonymous — groups under {d.min_group} responses are hidden</span>}
        <div className="ml-auto flex items-center gap-2">
          {exportErr && <span className="text-[10px] text-status-pending">{exportErr}</span>}
          <Button size="sm" variant="ghost" onClick={doExport} disabled={exporting || !s.responses}>
            {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Export to Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile label="Responses" value={group ? s.responses_in_group : s.responses} hint={group ? `of ${s.responses} in total` : s.last_response ? `latest ${fmtDate(s.last_response)}` : null} />
        <Tile label="Response rate" value={s.response_rate !== null ? `${s.response_rate}%` : '—'} hint={s.eligible ? `${s.submitted_invites} of ${s.eligible} asked` : 'no one invited — link only'} />
        <Tile label="In progress" value={s.in_progress} hint="started, not submitted" />
        {assessment
          ? <Tile label="Average score" value={d.scores?.average !== null && d.scores?.average !== undefined ? `${d.scores.average}%` : '—'} hint={d.scores?.band || null} />
          : <Tile label="Questions" value={d.questions.length || '—'} />}
      </div>

      {d.withheld ? (
        <div className="bg-white border border-surface-border rounded-lg p-8 text-center">
          <EyeOff size={24} className="mx-auto text-ink-300 mb-2" />
          <p className="text-sm text-ink-700">{d.withheld_reason}</p>
        </div>
      ) : !s.responses ? (
        <div className="bg-white border border-surface-border rounded-lg p-8 text-center">
          <p className="text-sm text-ink-500">No responses yet.</p>
          <p className="text-[11px] text-ink-300 mt-1">{survey.status === 'draft' ? 'Publish the survey and share it to start collecting answers.' : 'Results appear here as people submit.'}</p>
        </div>
      ) : (
        <>
          {d.findings.length > 0 && <Findings items={d.findings} />}
          {assessment && d.scores && <ScoreOverview scores={d.scores} byGroup={d.by_group} showGroups={!group && visibleGroups.length > 1} />}
          {survey.definition.sections.map((sec) => {
            const qs = d.questions.filter((q) => q.section_id === sec.id)
            if (!qs.length) return null
            const secScore = d.scores?.sections.find((x) => x.id === sec.id)
            return (
              <section key={sec.id}>
                <div className="flex items-baseline justify-between mb-2">
                  <h3 className="text-xs font-semibold text-ink-900">{sec.title || 'Untitled section'}</h3>
                  {secScore?.average !== null && secScore?.average !== undefined && <span className="text-[11px] text-ink-500">Section score {secScore.average}%</span>}
                </div>
                <div className="grid xl:grid-cols-2 gap-3">
                  {qs.map((q) => <QuestionResult key={q.id} q={q} survey={survey} />)}
                </div>
              </section>
            )
          })}
        </>
      )}
    </div>
  )
}

function Tile({ label, value, hint }) {
  return (
    <div className="bg-white border border-surface-border rounded-lg px-4 py-3">
      <p className="text-[10px] text-ink-500">{label}</p>
      <p className="text-2xl font-semibold text-ink-900 tabular-nums">{value ?? '—'}</p>
      {hint && <p className="text-[10px] text-ink-500 mt-0.5 truncate">{hint}</p>}
    </div>
  )
}

function Findings({ items }) {
  const icon = { positive: CheckCircle2, attention: AlertTriangle, info: Info }
  const color = { positive: 'text-status-approved', attention: 'text-amber-600', info: 'text-blue-600' }
  return (
    <div className="bg-white border border-surface-border rounded-lg p-4">
      <p className="text-xs font-semibold text-ink-900">Key findings</p>
      <p className="text-[10px] text-ink-300 mb-3">Calculated from the responses below.</p>
      <ul className="space-y-2">
        {items.map((f, i) => {
          const I = icon[f.tone] || Info
          return (
            <li key={i} className="flex gap-2 text-[11px] text-ink-700">
              <I size={14} className={`${color[f.tone]} shrink-0 mt-px`} aria-label={f.tone} />
              {f.question ? <a href={`#rq-${f.question}`} className="hover:underline">{f.text}</a> : <span>{f.text}</span>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function ChartTip({ active, payload, label, unit = '' }) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div className="bg-white border border-surface-border rounded-md shadow px-2.5 py-1.5 text-[10px]">
      <p className="text-ink-900 font-medium">{p.payload.tip || label}</p>
      <p className="text-ink-500">{p.value}{unit}{p.payload.n !== undefined ? ` · ${p.payload.n} response${p.payload.n === 1 ? '' : 's'}` : ''}</p>
    </div>
  )
}

function ScoreOverview({ scores, byGroup, showGroups }) {
  const sections = scores.sections.filter((s) => s.average !== null).map((s) => ({ name: s.title, value: s.average, n: s.responses }))
  const dist = scores.distribution.map((b) => ({ name: `${b.from}–${b.to}`, value: b.count, tip: `${b.from}–${b.to}% score` }))
  return (
    <div className="grid lg:grid-cols-2 gap-3">
      <div className="bg-white border border-surface-border rounded-lg p-4">
        <p className="text-xs font-semibold text-ink-900">Score by section</p>
        <p className="text-[10px] text-ink-500 mb-2">Average % of the available points</p>
        <ResponsiveContainer width="100%" height={Math.max(120, sections.length * 34 + 30)}>
          <BarChart data={sections} layout="vertical" margin={{ top: 4, right: 30, bottom: 4, left: 4 }}>
            <CartesianGrid horizontal={false} stroke={GRID} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#6B6B6B' }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 10, fill: '#3D3D3D' }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTip unit="%" />} cursor={{ fill: '#F5F6F7' }} />
            <Bar dataKey="value" fill={GREEN} barSize={14} radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 10, fill: '#3D3D3D', formatter: (v) => `${v}%` }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white border border-surface-border rounded-lg p-4">
        <p className="text-xs font-semibold text-ink-900">How scores are spread</p>
        <p className="text-[10px] text-ink-500 mb-2">Responses per score range{scores.min !== null ? ` · lowest ${scores.min}%, highest ${scores.max}%` : ''}</p>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={dist} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#6B6B6B' }} axisLine={false} tickLine={false} interval={0} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#6B6B6B' }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTip />} cursor={{ fill: '#F5F6F7' }} />
            <Bar dataKey="value" fill={GREEN} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        {scores.bands.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 pt-3 border-t border-surface-border">
            {scores.bands.map((b, i) => (
              <span key={b.label} className="flex items-center gap-1.5 text-[10px] text-ink-700" title={b.description || undefined}>
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: GREEN_RAMP[Math.min(GREEN_RAMP.length - 1, 2 + i)] }} />
                {b.label} <span className="text-ink-500">({b.min}%+)</span>: <strong className="font-semibold">{b.count}</strong>
              </span>
            ))}
          </div>
        )}
      </div>
      {showGroups && byGroup.length > 1 && (
        <div className="bg-white border border-surface-border rounded-lg p-4 lg:col-span-2">
          <p className="text-xs font-semibold text-ink-900 mb-2">Average score by group</p>
          <HBars rows={byGroup.map((g) => ({ label: g.label, value: g.average, sub: `${g.responses} resp.` }))} max={100} unit="%" />
        </div>
      )}
    </div>
  )
}

/** Horizontal bars in HTML: long labels wrap, values are always printed. */
function HBars({ rows, max, unit = '' }) {
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="flex justify-between gap-3 text-[11px] text-ink-700">
            <span className="min-w-0">{r.label}</span>
            <span className="shrink-0 tabular-nums text-ink-900">{r.value ?? '—'}{r.value !== null && r.value !== undefined ? unit : ''}{r.sub ? <span className="text-ink-500 ml-1.5">{r.sub}</span> : null}</span>
          </div>
          <div className="h-2 rounded-full bg-ink-100 mt-1 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${max ? Math.min(100, (100 * (r.value || 0)) / max) : 0}%`, background: GREEN }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function QuestionResult({ q, survey }) {
  const T = TYPE_BY_KEY[q.type]
  const wide = q.type === 'matrix' || q.type === 'long_text'
  return (
    <div id={`rq-${q.id}`} className={`bg-white border border-surface-border rounded-lg p-4 scroll-mt-4 ${wide ? 'xl:col-span-2' : ''}`}>
      <div className="flex items-start gap-2 mb-3">
        {T && <T.icon size={13} className="text-ink-300 mt-0.5 shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-medium text-ink-900">{q.title || 'Untitled question'}</p>
          <p className="text-[10px] text-ink-500">
            {q.answered} answered{q.shown !== q.answered ? ` of ${q.shown} shown` : ''}
            {q.average_score !== undefined && q.average_score !== null ? ` · average score ${q.average_score}%` : ''}
          </p>
        </div>
      </div>
      <QuestionBody q={q} survey={survey} />
    </div>
  )
}

function QuestionBody({ q, survey }) {
  const [all, setAll] = useState(false)
  if (!q.answered) return <p className="text-[11px] text-ink-300">No answers.</p>
  if (q.options) {
    const rows = q.options.map((o) => ({ label: o.label, value: o.percent ?? 0, sub: `${o.count}` }))
    if (q.other) rows.push({ label: 'Other', value: q.other.percent ?? 0, sub: `${q.other.count}` })
    return (
      <div>
        <HBars rows={rows} max={100} unit="%" />
        {q.type === 'multi_choice' && <p className="text-[10px] text-ink-300 mt-2">% of people who answered; people could choose several.</p>}
        {q.other?.texts?.length > 0 && <TextList items={q.other.texts.map((t) => ({ text: t }))} title="“Other” answers" />}
      </div>
    )
  }
  if (q.type === 'nps') return <Nps q={q} />
  if (q.type === 'scale') {
    const data = q.distribution.map((x) => ({ name: String(x.value), value: x.count, tip: `${x.value}${x.value === q.min && q.min_label ? ` — ${q.min_label}` : x.value === q.max && q.max_label ? ` — ${q.max_label}` : ''}` }))
    return (
      <div>
        <p className="text-[11px] text-ink-700 mb-1">Average <strong className="text-base text-ink-900 tabular-nums">{q.mean}</strong> <span className="text-ink-500">of {q.max} · median {q.median}</span></p>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B6B6B' }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#6B6B6B' }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTip />} cursor={{ fill: '#F5F6F7' }} />
            <Bar dataKey="value" fill={GREEN} radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
        {(q.min_label || q.max_label) && <div className="flex justify-between text-[9px] text-ink-500 px-1"><span>{q.min_label}</span><span>{q.max_label}</span></div>}
      </div>
    )
  }
  if (q.type === 'number' || q.type === 'percent') {
    const u = q.type === 'percent' ? '%' : q.unit ? ` ${q.unit}` : ''
    const stats = [['Average', q.mean], ['Median', q.median], ['Lowest', q.min], ['Highest', q.max], ...(q.total !== null && q.total !== undefined ? [['Total', q.total]] : [])]
    return (
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {stats.map(([l, v]) => (
          <div key={l} className="bg-surface-muted rounded-md px-2.5 py-2">
            <p className="text-[9px] text-ink-500">{l}</p>
            <p className="text-[13px] font-semibold text-ink-900 tabular-nums">{v !== null && v !== undefined ? `${Number(v).toLocaleString()}${u}` : '—'}</p>
          </div>
        ))}
      </div>
    )
  }
  if (q.type === 'date') return <p className="text-[11px] text-ink-700">From {fmtDate(q.earliest)} to {fmtDate(q.latest)}</p>
  if (q.type === 'short_text' || q.type === 'long_text') {
    return <TextList items={q.answers} showAll={all} onAll={() => setAll(true)} truncated={q.truncated} anonymous={survey.anonymous} />
  }
  if (q.type === 'matrix') return <MatrixResult q={q} />
  if (q.type === 'file') return <FileList q={q} survey={survey} />
  return null
}

function Nps({ q }) {
  const n = q.nps
  const segs = [
    { k: 'Detractors (0–6)', v: n.detractors, c: DETRACTOR },
    { k: 'Passives (7–8)', v: n.passives, c: PASSIVE },
    { k: 'Promoters (9–10)', v: n.promoters, c: PROMOTER },
  ]
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-ink-900 tabular-nums">{n.score > 0 ? '+' : ''}{n.score}</span>
        <span className="text-[10px] text-ink-500">Net Promoter Score (−100 to +100) · average {q.mean}</span>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden mt-2 gap-[2px] bg-white" role="img" aria-label={segs.map((s) => `${s.k} ${s.v}%`).join(', ')}>
        {segs.map((s) => s.v > 0 && <div key={s.k} style={{ width: `${s.v}%`, background: s.c }} title={`${s.k}: ${s.v}%`} />)}
      </div>
      <div className="flex flex-wrap gap-x-4 mt-2">
        {segs.map((s) => (
          <span key={s.k} className="flex items-center gap-1.5 text-[10px] text-ink-700">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.c }} />{s.k} <strong className="tabular-nums">{s.v}%</strong>
          </span>
        ))}
      </div>
    </div>
  )
}

function MatrixResult({ q }) {
  const hasAvg = q.rows.some((r) => r.average !== undefined)
  const sorted = hasAvg ? [...q.rows].sort((a, b) => (b.average ?? -1) - (a.average ?? -1)) : q.rows
  const shade = (pct) => GREEN_RAMP[Math.min(GREEN_RAMP.length - 1, Math.floor((pct || 0) / 20))]
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[10px] border-separate border-spacing-[2px]">
        <thead>
          <tr>
            <th className="text-left font-normal text-ink-500 pr-2" />
            {q.columns.map((c) => <th key={c.id} className="font-normal text-ink-500 px-1 text-center align-bottom">{c.label}</th>)}
            {hasAvg && <th className="font-medium text-ink-700 px-1 text-right">Average{q.scale ? ` (${q.scale.min}–${q.scale.max})` : ''}</th>}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.id}>
              <td className="text-ink-900 pr-2 py-1 min-w-[140px]">{r.label}</td>
              {r.counts.map((c) => (
                <td key={c.column_id} className="text-center py-1.5 rounded tabular-nums" style={{ background: shade(c.percent), color: (c.percent || 0) >= 60 ? '#fff' : '#1A1A1A' }}
                  title={`${c.count} response${c.count === 1 ? '' : 's'}`}>
                  {c.percent !== null ? `${Math.round(c.percent)}%` : '—'}
                </td>
              ))}
              {hasAvg && <td className="text-right tabular-nums font-semibold text-ink-900 pl-2">{r.average ?? '—'}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      {hasAvg && <p className="text-[9px] text-ink-300 mt-1">Sorted by average. Cells show the share of people who answered each row.</p>}
    </div>
  )
}

function TextList({ items, title, showAll, onAll, truncated, anonymous }) {
  const [open, setOpen] = useState(false)
  const all = showAll || open
  const shown = all ? items : items.slice(0, 6)
  return (
    <div className={title ? 'mt-3' : ''}>
      {title && <p className="text-[10px] font-medium text-ink-500 mb-1">{title}</p>}
      <ul className="space-y-1.5">
        {shown.map((a, i) => (
          <li key={i} className="text-[11px] text-ink-700 bg-surface-muted rounded-md px-3 py-2 whitespace-pre-line">
            {a.text}
            {!anonymous && a.respondent && <span className="block text-[9px] text-ink-300 mt-0.5">— {a.respondent}</span>}
          </li>
        ))}
      </ul>
      {items.length > shown.length && (
        <button type="button" className="text-[10px] text-brand-greenDark hover:underline mt-1.5" onClick={() => (onAll ? onAll() : setOpen(true))}>
          Show all {items.length}
        </button>
      )}
      {truncated && all && <p className="text-[9px] text-ink-300 mt-1">Showing the first 300 — export to Excel for all answers.</p>}
    </div>
  )
}

function FileList({ q, survey }) {
  const [err, setErr] = useState(null)
  const open = async (f) => {
    setErr(null)
    try { const r = await fileDownload(survey.id, f.id); window.open(r.url, '_blank', 'noopener') } catch (e) { setErr(errText(e, 'Could not open the file')) }
  }
  return (
    <div>
      <ul className="space-y-1">
        {q.files.map((f) => (
          <li key={f.id} className="flex items-center gap-2 text-[11px]">
            <Paperclip size={12} className="text-ink-300" />
            <button type="button" className="text-brand-greenDark hover:underline truncate" onClick={() => open(f)}>{f.filename}</button>
            {f.respondent && <span className="text-[10px] text-ink-500 truncate">— {f.respondent}</span>}
          </li>
        ))}
      </ul>
      {err && <p className="text-[10px] text-status-pending mt-1">{err}</p>}
    </div>
  )
}
