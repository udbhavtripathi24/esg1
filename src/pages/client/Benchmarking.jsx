import { useState } from 'react'
import {
  Award, TrendingUp, Sparkles, FileCode2, FileText,
  CheckCircle2, Info, Send, Trophy, Target,
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell, LabelList,
} from 'recharts'
import PageHeader from '../../components/PageHeader.jsx'
import { Card, Button, Select, ProgressBar } from '../../components/ui.jsx'
import FileDropzone from '../../components/FileDropzone.jsx'
import LoadingState from '../../components/LoadingState.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import {
  useBenchmarkFilters, useBenchmarkOverview, useKpiComparison,
  usePillarSummary, useBenchmarkTrend, useBenchmarkAiInsights,
} from '../../hooks/useBenchmarking.js'

/**
 * Benchmarking -- peer comparison against the nine BRSR Core KPIs.
 *
 * Design rationale, in short (full version in the backend service
 * docstring):
 *
 *  - BRSR is uploaded as XBRL, which is already structured and
 *    machine-tagged. It is parsed by deterministic code, NOT an LLM --
 *    that is what makes the numbers on this page exact and auditable.
 *  - A separate Sustainability Report (PDF) upload is where an LLM
 *    genuinely belongs, because that content is unstructured narrative.
 *  - Every comparison figure here is computed server-side in plain
 *    code. The AI panel narrates those figures and never calculates
 *    them, so the analysis cannot drift from the underlying data.
 *
 * Scoring avoids inventing a proprietary ESG rubric. Everything is
 * PERCENTILE RANK within the peer set -- "you beat N% of peers on this
 * KPI" -- which is factual, direction-aware, and fully explainable
 * without anyone signing off a weighting methodology first.
 */

const PILLAR_COLORS = { Environment: '#64BC44', Social: '#3B82F6', Governance: '#8B5CF6' }
const YOU_COLOR = '#64BC44'
const PEER_COLOR = '#CBD5E1'

function percentileTone(p) {
  if (p >= 75) return { label: 'Leading', cls: 'text-status-approved' }
  if (p >= 50) return { label: 'Above median', cls: 'text-blue-600' }
  if (p >= 25) return { label: 'Below median', cls: 'text-amber-600' }
  return { label: 'Lagging', cls: 'text-red-600' }
}

function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-surface-border rounded-md shadow-md px-3 py-2 text-[10px]">
      <p className="font-medium text-ink-900 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}{unit ? ` ${unit}` : ''}
        </p>
      ))}
    </div>
  )
}

function StatCard({ icon: Icon, tint, value, label, sub, subTone }) {
  return (
    <div className="bg-white border border-surface-border rounded-lg p-4">
      <div className={`w-9 h-9 rounded-md flex items-center justify-center ${tint}`}>
        <Icon size={17} />
      </div>
      <div className="mt-3 text-xl font-semibold text-ink-900">{value}</div>
      <div className="text-xs text-ink-500 mt-0.5">{label}</div>
      {sub && <div className={`text-[10px] mt-1 ${subTone || 'text-ink-400'}`}>{sub}</div>}
    </div>
  )
}

/* ---------------- Uploads ---------------- */

function UploadPanels({ pushToast }) {
  const [xbrlFiles, setXbrlFiles] = useState([])
  const [pdfFiles, setPdfFiles] = useState([])

  return (
    <div className="grid lg:grid-cols-2 gap-4 mb-5">
      <Card
        title="BRSR Report (XBRL)"
        subtitle="Structured filing — KPIs are extracted exactly, by parser"
        icon={FileCode2}
      >
        <FileDropzone
          files={xbrlFiles}
          onFilesChange={setXbrlFiles}
          accept=".xml,.xbrl,.zip"
          hint="XBRL or XML · as filed with the exchange"
        />
        <div className="flex items-start gap-1.5 mt-3 text-[10px] text-ink-400">
          <Info size={12} className="mt-0.5 shrink-0" />
          <p>
            XBRL is machine-tagged, so every figure is read directly from the filing rather than
            interpreted — no AI guesswork in the numbers that drive these charts.
          </p>
        </div>
        <div className="flex justify-end mt-3">
          <Button
            disabled={xbrlFiles.length === 0}
            onClick={() => { pushToast('XBRL ingestion pipeline is not connected yet — charts below use prototype peer data.'); setXbrlFiles([]) }}
          >
            Extract KPIs
          </Button>
        </div>
      </Card>

      <Card
        title="Sustainability Report (PDF)"
        subtitle="Narrative document — read by AI for qualitative context"
        icon={FileText}
      >
        <FileDropzone
          files={pdfFiles}
          onFilesChange={setPdfFiles}
          accept=".pdf,.doc,.docx"
          hint="PDF or Word · annual or sustainability report"
        />
        <div className="flex items-start gap-1.5 mt-3 text-[10px] text-ink-400">
          <Info size={12} className="mt-0.5 shrink-0" />
          <p>
            Unstructured narrative is where an LLM genuinely adds value — commitments, targets and
            context that no structured filing captures.
          </p>
        </div>
        <div className="flex justify-end mt-3">
          <Button
            variant="ghost"
            disabled={pdfFiles.length === 0}
            onClick={() => { pushToast('AI document analysis is not connected yet — this is a prototype.'); setPdfFiles([]) }}
          >
            Analyse with AI
          </Button>
        </div>
      </Card>
    </div>
  )
}

/* ---------------- AI panel ---------------- */

function AiInsightsPanel({ params, pushToast }) {
  const q = useBenchmarkAiInsights(params)
  const [question, setQuestion] = useState('')

  if (q.isLoading) return <Card title="AI Insights"><LoadingState label="Analysing…" /></Card>
  if (q.isError) return <Card title="AI Insights"><ErrorState message="Could not load insights." onRetry={() => q.refetch()} /></Card>
  const d = q.data

  function ask(text) {
    if (!text.trim()) return
    pushToast('Conversational analysis is not connected yet — answers will be generated from the figures shown here.')
    setQuestion('')
  }

  return (
    <Card
      title="AI Insights"
      subtitle="Generated from the computed comparison below — not a separate calculation"
      icon={Sparkles}
      className="mb-5"
    >
      <div className="bg-brand-green/5 border border-brand-green/25 rounded-lg p-3.5 mb-4">
        <p className="text-xs text-ink-800 leading-relaxed">{d.headline}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-status-approved mb-2">
            <TrendingUp size={13} /> Where you lead
          </p>
          <div className="space-y-2">
            {d.strengths.map((s) => (
              <div key={s.name} className="border border-surface-border rounded-md p-2.5">
                <p className="text-[11px] font-medium text-ink-900">{s.name}</p>
                <p className="text-[10px] text-ink-500 mt-0.5">{s.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 mb-2">
            <Target size={13} /> Biggest opportunities
          </p>
          <div className="space-y-2">
            {d.gaps.map((g) => (
              <div key={g.name} className="border border-surface-border rounded-md p-2.5">
                <p className="text-[11px] font-medium text-ink-900">{g.name}</p>
                <p className="text-[10px] text-ink-500 mt-0.5">{g.detail}</p>
                <p className="text-[10px] text-brand-greenDark mt-1.5 leading-relaxed">
                  <span className="font-medium">Suggested action: </span>{g.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-surface-border">
        <p className="text-[11px] font-medium text-ink-700 mb-2">Ask about this comparison</p>
        <div className="flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') ask(question) }}
            placeholder="e.g. Where am I ahead of the industry leader?"
            className="flex-1 px-3 py-2 rounded-md border border-surface-border text-[11px] placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-green/20"
          />
          <Button onClick={() => ask(question)} disabled={!question.trim()}>
            <Send size={13} /> Ask
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {d.suggested_questions.map((sq) => (
            <button
              key={sq}
              onClick={() => ask(sq)}
              className="text-[10px] px-2.5 py-1 rounded-full border border-surface-border text-ink-500 hover:bg-surface-muted/60"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>
    </Card>
  )
}

/* ---------------- Charts ---------------- */

function PillarChart({ params }) {
  const q = usePillarSummary(params)
  if (q.isLoading) return <LoadingState label="Loading…" />
  if (q.isError) return <ErrorState message="Could not load." onRetry={() => q.refetch()} />
  const data = q.data.pillars.map((p) => ({ name: p.pillar, percentile: p.your_percentile }))
  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={data} margin={{ top: 18, right: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EEE" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
        <Tooltip content={<ChartTooltip unit="percentile" />} />
        <Bar dataKey="percentile" name="Your percentile" radius={[4, 4, 0, 0]} isAnimationActive={false}>
          <LabelList dataKey="percentile" position="top" formatter={(v) => `${v}%`} style={{ fontSize: 9, fill: '#6B6B6B' }} />
          {data.map((d) => <Cell key={d.name} fill={PILLAR_COLORS[d.name] || YOU_COLOR} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function PercentileRadar({ overview }) {
  // Percentile is already a normalised 0-100 scale, so unlike raw KPI
  // values (kL vs GJ vs %) these nine axes are genuinely comparable on
  // one radar without implying a false equivalence between units.
  const data = overview.kpis.map((k) => ({
    kpi: k.name.replace(/ (Intensity|Rate|Frequency Rate)$/, ''),
    percentile: k.percentile,
  }))
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data} outerRadius={100}>
        <PolarGrid stroke="#E5E7EB" />
        <PolarAngleAxis dataKey="kpi" tick={{ fontSize: 8, fill: '#6B6B6B' }} />
        <PolarRadiusAxis type="number" domain={[0, 100]} tick={{ fontSize: 8 }} angle={90} />
        <Tooltip content={<ChartTooltip unit="percentile" />} />
        <Radar
          name="Your percentile" dataKey="percentile"
          stroke={YOU_COLOR} fill={YOU_COLOR} fillOpacity={0.3} strokeWidth={2}
          isAnimationActive={false}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}

function PeerComparisonChart({ params, kpis }) {
  const [kpiCode, setKpiCode] = useState(kpis[0]?.code)
  const q = useKpiComparison({ ...params, kpi_code: kpiCode })
  const selected = kpis.find((k) => k.code === kpiCode)

  return (
    <Card
      title="Peer comparison"
      subtitle={selected ? `${selected.name} — ${selected.direction === 'lower' ? 'lower is better' : 'higher is better'}` : ''}
      action={
        <div className="w-52">
          <Select value={kpiCode} onChange={(e) => setKpiCode(e.target.value)}>
            {kpis.map((k) => <option key={k.code} value={k.code}>{k.name}</option>)}
          </Select>
        </div>
      }
    >
      {q.isLoading ? <LoadingState label="Loading…" /> :
       q.isError ? <ErrorState message="Could not load." onRetry={() => q.refetch()} /> :
       q.data.not_found ? <p className="text-xs text-ink-400 py-8 text-center">KPI not found.</p> : (
        <ResponsiveContainer width="100%" height={Math.max(220, q.data.rows.length * 32)}>
          <BarChart data={q.data.rows} layout="vertical" margin={{ left: 10, right: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEE" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="company" tick={{ fontSize: 9 }} width={150} />
            <Tooltip content={<ChartTooltip unit={q.data.kpi.unit} />} />
            <Bar dataKey="value" name={q.data.kpi.name} radius={[0, 4, 4, 0]} isAnimationActive={false}>
              <LabelList dataKey="value" position="right" style={{ fontSize: 9, fill: '#6B6B6B' }} />
              {q.data.rows.map((r, i) => <Cell key={i} fill={r.is_you ? YOU_COLOR : PEER_COLOR} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}

function TrendChart({ sector, kpis }) {
  const [kpiCode, setKpiCode] = useState(kpis[0]?.code)
  const q = useBenchmarkTrend({ sector, kpi_code: kpiCode })

  return (
    <Card
      title="Trend vs industry"
      subtitle="Your value against the peer average over time"
      action={
        <div className="w-52">
          <Select value={kpiCode} onChange={(e) => setKpiCode(e.target.value)}>
            {kpis.map((k) => <option key={k.code} value={k.code}>{k.name}</option>)}
          </Select>
        </div>
      }
    >
      {q.isLoading ? <LoadingState label="Loading…" /> :
       q.isError ? <ErrorState message="Could not load." onRetry={() => q.refetch()} /> :
       q.data.not_found ? <p className="text-xs text-ink-400 py-8 text-center">KPI not found.</p> : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={q.data.points} margin={{ top: 15, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEE" />
            <XAxis dataKey="period" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip content={<ChartTooltip unit={q.data.kpi.unit} />} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Line type="monotone" dataKey="your_value" name="You" stroke={YOU_COLOR} strokeWidth={2.5} dot={{ r: 4 }} isAnimationActive={false} />
            <Line type="monotone" dataKey="industry_average" name="Industry average" stroke="#94A3B8" strokeWidth={2} strokeDasharray="4 3" dot={{ r: 3 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}

/* ---------------- Page ---------------- */

function BenchmarkBody({ overview, params, sector, pushToast }) {
  const tone = percentileTone(overview.overall_percentile)

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard
          icon={Award} tint="bg-brand-green/10 text-brand-greenDark"
          value={`${overview.overall_percentile}%`}
          label="Overall percentile"
          sub={tone.label} subTone={tone.cls}
        />
        <StatCard
          icon={Trophy} tint="bg-purple-100 text-purple-600"
          value={`#${overview.overall_rank}`}
          label={`Rank of ${overview.total_companies}`}
          sub={`${overview.peer_count} peers compared`}
        />
        <StatCard
          icon={TrendingUp} tint="bg-blue-100 text-blue-600"
          value={`${overview.kpis_ahead_of_median}/${overview.kpis_total}`}
          label="KPIs above peer median"
        />
        <StatCard
          icon={Target} tint="bg-amber-100 text-amber-600"
          value={overview.kpis.filter((k) => k.percentile < 25).length}
          label="KPIs in bottom quartile"
          sub="Priority for improvement"
        />
      </div>

      <AiInsightsPanel params={params} pushToast={pushToast} />

      <div className="grid lg:grid-cols-[1fr_400px] gap-4 mb-4">
        <Card title="Pillar performance" subtitle="Your percentile rank within the peer set, by pillar">
          <PillarChart params={params} />
          <p className="text-[10px] text-ink-400 mt-2 text-center">
            50% is the peer median. Higher is better in every case — direction is already applied.
          </p>
        </Card>
        <Card title="BRSR Core profile" subtitle="Percentile across all nine attributes">
          <PercentileRadar overview={overview} />
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <PeerComparisonChart params={params} kpis={overview.kpis} />
        <TrendChart sector={sector} kpis={overview.kpis} />
      </div>

      <Card
        title="BRSR Core KPI detail"
        subtitle="Your value against the peer average and the best performer"
        padded={false}
        className="mb-4"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="text-left text-ink-500 border-b border-surface-border">
                <th className="font-medium px-5 py-2.5">KPI</th>
                <th className="font-medium px-2 py-2.5">Pillar</th>
                <th className="font-medium px-2 py-2.5">You</th>
                <th className="font-medium px-2 py-2.5">Peer avg</th>
                <th className="font-medium px-2 py-2.5">Best</th>
                <th className="font-medium px-2 py-2.5 min-w-[130px]">Percentile</th>
                <th className="font-medium px-5 py-2.5">Gap to best</th>
              </tr>
            </thead>
            <tbody>
              {overview.kpis.map((k) => {
                const t = percentileTone(k.percentile)
                return (
                  <tr key={k.code} className="border-b border-surface-border last:border-0">
                    <td className="px-5 py-2.5">
                      <p className="text-ink-900 font-medium">{k.name}</p>
                      <p className="text-ink-300 text-[9px]">
                        {k.unit} · {k.direction === 'lower' ? 'lower is better' : 'higher is better'}
                      </p>
                    </td>
                    <td className="px-2 py-2.5">
                      <span
                        className="text-[9px] px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${PILLAR_COLORS[k.pillar]}1A`, color: PILLAR_COLORS[k.pillar] }}
                      >
                        {k.pillar}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-ink-900 font-semibold">{k.your_value}</td>
                    <td className="px-2 py-2.5 text-ink-600">{k.industry_average}</td>
                    <td className="px-2 py-2.5 text-ink-600">
                      {k.best_value}
                      <span className="block text-[9px] text-ink-300">{k.best_company}</span>
                    </td>
                    <td className="px-2 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-[50px]"><ProgressBar pct={k.percentile} /></div>
                        <span className={`${t.cls} font-medium whitespace-nowrap`}>{k.percentile}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-2.5 text-ink-600">
                      {k.gap_to_best === 0
                        ? <span className="text-status-approved font-medium">Best in peer set</span>
                        : `${k.gap_to_best} ${k.unit}`}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-ink-400 px-5 py-3 border-t border-surface-border leading-relaxed">
          <span className="font-medium">How percentile is calculated: </span>{overview.methodology}
        </p>
      </Card>

      <Card title="Sector leaderboard" subtitle="Ranked by mean percentile across all nine KPIs" padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="text-left text-ink-500 border-b border-surface-border">
                <th className="font-medium px-5 py-2.5">Rank</th>
                <th className="font-medium px-2 py-2.5">Organisation</th>
                <th className="font-medium px-2 py-2.5 min-w-[160px]">Mean percentile</th>
                <th className="font-medium px-5 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {overview.leaderboard.map((r) => (
                <tr
                  key={r.company}
                  className={`border-b border-surface-border last:border-0 ${r.is_you ? 'bg-brand-green/5' : ''}`}
                >
                  <td className="px-5 py-2.5 text-ink-700">#{r.rank}</td>
                  <td className={`px-2 py-2.5 ${r.is_you ? 'text-ink-900 font-semibold' : 'text-ink-700'}`}>{r.company}</td>
                  <td className="px-2 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-[60px]">
                        <ProgressBar pct={r.mean_percentile} color={r.is_you ? YOU_COLOR : '#CBD5E1'} />
                      </div>
                      <span className="text-ink-600 whitespace-nowrap">{r.mean_percentile}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-2.5">
                    {r.is_you && <span className="text-[9px] text-brand-greenDark font-medium">You</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}

export default function Benchmarking() {
  const [sector, setSector] = useState('Manufacturing')
  const [period, setPeriod] = useState('FY 2024-25')
  const [toast, setToast] = useState(null)

  function pushToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  const params = { sector, period }
  const filtersQuery = useBenchmarkFilters()
  const overviewQuery = useBenchmarkOverview(params)

  return (
    <div>
      <PageHeader
        title="Benchmarking"
        subtitle="Compare BRSR Core performance against sector peers."
        action={
          <div className="flex gap-2">
            <div className="w-44">
              <Select value={sector} onChange={(e) => setSector(e.target.value)}>
                {(filtersQuery.data?.sectors || [sector]).map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
            <div className="w-36">
              <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
                {(filtersQuery.data?.periods || [period]).map((p) => <option key={p} value={p}>{p}</option>)}
              </Select>
            </div>
          </div>
        }
      />

      {toast && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-md bg-brand-green/10 text-brand-greenDark text-xs mb-4">
          <CheckCircle2 size={15} /> {toast}
        </div>
      )}

      <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 mb-5">
        <Info size={15} className="text-amber-600 mt-0.5 shrink-0" />
        <p className="text-[11px] text-amber-800 leading-relaxed">
          <span className="font-semibold">Prototype data.</span> Peer figures are illustrative and the
          peer companies named are fictional — nothing here is extracted from real BRSR filings yet.
          The comparison logic, percentile ranking and chart behaviour are real and will carry over
          unchanged once XBRL ingestion is connected.
        </p>
      </div>

      <UploadPanels pushToast={pushToast} />

      {overviewQuery.isLoading ? <LoadingState label="Loading benchmark…" /> :
       overviewQuery.isError ? <ErrorState message="Could not load benchmark data." onRetry={() => overviewQuery.refetch()} /> : (
        <BenchmarkBody
          overview={overviewQuery.data}
          params={params}
          sector={sector}
          pushToast={pushToast}
        />
      )}
    </div>
  )
}
