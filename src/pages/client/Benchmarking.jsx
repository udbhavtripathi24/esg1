import { useState } from 'react'
import { Award, BarChart3, Briefcase, Sparkles, CheckCircle2 } from 'lucide-react'
import PageHeader from '../../components/PageHeader.jsx'
import { Card, Button, ProgressBar } from '../../components/ui.jsx'
import FileDropzone from '../../components/FileDropzone.jsx'
import { benchmarkingOverview, pillarPerformance, esgDimensionRadar, improvementOpportunities, renewableEnergyAdoption } from '../../data/mockData'

const statusColorMap = {
  'Above Average': 'text-status-approved',
  Excellent: 'text-status-approved',
  Good: 'text-blue-600',
  Average: 'text-ink-400',
}
function StatusText({ status, bold }) {
  return <span className={`${bold ? 'font-semibold' : ''} ${statusColorMap[status] || 'text-ink-500'}`}>{status}</span>
}
export default function Benchmarking() {
  const [files, setFiles] = useState([])
  const [toast, setToast] = useState(null)

  function handleUpload() {
    if (files.length === 0) return
    setToast(`Uploaded ${files.length} benchmark dataset${files.length > 1 ? 's' : ''}.`)
    setFiles([])
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div>
      <PageHeader title="Benchmarking" subtitle="Compare ESG performance against industry peers and track progress toward goals." />

      {toast && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-md bg-brand-green/10 text-brand-greenDark text-sm mb-4">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      <Card title="Benchmark Dataset" subtitle="Upload Benchmark dataset" className="mb-5">
        <FileDropzone
          files={files}
          onFilesChange={setFiles}
          accept=".pdf,.doc,.docx,.jpg,.png,.zip"
          hint="PDF, Word, Images and ZIP · up to 100 MB total"
        />
        <div className="flex justify-end mt-4">
          <Button onClick={handleUpload} disabled={files.length === 0}>Upload</Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard icon={Award} iconTint="green" value={`${benchmarkingOverview.overallScore.value}/100`} label={benchmarkingOverview.overallScore.label} sub={benchmarkingOverview.overallScore.delta} />
        <StatCard icon={BarChart3} iconTint="purple" value={`${benchmarkingOverview.industryAverage.value}/100`} label={benchmarkingOverview.industryAverage.label} />
        <StatCard icon={Briefcase} iconTint="blue" value={benchmarkingOverview.industryRanking.value} label={benchmarkingOverview.industryRanking.label} />
        <StatCard icon={Sparkles} iconTint="amber" value={`${benchmarkingOverview.bestPerformerScore.value}/100`} label={benchmarkingOverview.bestPerformerScore.label} />
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-4">
        <Card title="ESG Pillar Performance" subtitle="Your organization vs Industry Average vs Best Performer">
          <PillarBarChart data={pillarPerformance} />
          <div className="flex items-center justify-center gap-6 mt-4 text-xs text-ink-500">
            <LegendDot color="#64BC44" label="Your Organization" />
            <LegendDot color="#6B6B6B" label="Industry Average" />
            <LegendDot color="#C4C4C4" label="Best Performer" />
          </div>
        </Card>

        <Card title="ESG Dimension Radar" subtitle="Your organization vs Industry Average">
          <RadarChart axes={esgDimensionRadar.axes} yourOrg={esgDimensionRadar.yourOrg} industryAvg={esgDimensionRadar.industryAvg} />
          <div className="flex items-center justify-center gap-6 mt-2 text-xs text-ink-500">
            <LegendDot color="#E5E7EB" label="Industry Average" outline />
            <LegendDot color="#64BC44" label="Your Organization" />
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <Card title="Top Improvement Opportunities" subtitle="Gap to industry best performer">
          <div className="space-y-4">
            {improvementOpportunities.map((item) => (
              <div key={item.area}>
               <div className="flex items-center justify-between text-[10px] mb-1.5">
                  <span className="text-ink-700">{item.area}</span>
                  <span className="text-ink-900 font-medium">-{item.gap} pts</span>
                </div>
                <ProgressBar pct={(item.gap / 27) * 100} color="#64BC44" />
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="Renewable Energy Adoption"
          subtitle={`${renewableEnergyAdoption.sector} · ${renewableEnergyAdoption.period} · ${renewableEnergyAdoption.orgCount} organizations`}
          padded={false}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="text-left text-xs text-ink-500 border-t border-surface-border">
                  <th className="font-medium px-5 py-2.5">Organization</th>
                  <th className="font-medium px-2 py-2.5">ESG Score</th>
                  <th className="font-medium px-2 py-2.5">Industry Rank</th>
                  <th className="font-medium px-5 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {renewableEnergyAdoption.rows.map((r) => (
                  <tr key={r.org} className={`border-t border-surface-border ${r.highlight ? 'bg-brand-green/5' : ''}`}>
                    <td className={`px-5 py-3 ${r.highlight ? 'text-ink-900 font-semibold' : 'text-ink-700'}`}>{r.org}</td>
                    <td className="px-2 py-3 text-ink-700">{r.score}</td>
                    <td className="px-2 py-3 text-ink-700">{r.rank}</td>
                    <td className="px-5 py-3"><StatusText status={r.status} bold={r.highlight} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}

const tintMap = {
  green: 'bg-brand-green/10 text-brand-greenDark',
  purple: 'bg-purple-100 text-purple-600',
  blue: 'bg-blue-100 text-blue-600',
  amber: 'bg-amber-100 text-amber-600',
}

function StatCard({ icon: Icon, iconTint, value, label, sub }) {
  return (
    <div className="bg-white border border-surface-border rounded-lg p-4">
      <div className={`w-9 h-9 rounded-md flex items-center justify-center ${tintMap[iconTint]}`}>
        <Icon size={17} />
      </div>
      <div className="mt-3 text-sm font-semibold text-ink-900">{value}</div>
      <div className="text-xs text-ink-500 mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-status-approved mt-1">{sub}</div>}
    </div>
  )
}

function LegendDot({ color, label, outline }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="w-2.5 h-2.5 rounded-full"
        style={outline ? { backgroundColor: color, border: '1px solid #9CA3AF' } : { backgroundColor: color }}
      />
      {label}
    </span>
  )
}

function PillarBarChart({ data }) {
  const width = 560
  const height = 300
  const groupWidth = width / data.length
  const barWidth = 22
  const gap = 6
  const maxVal = 100
  const chartHeight = 230
  const baseline = chartHeight + 20

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {[0, 25, 50, 75, 100].map((v) => {
        const y = baseline - (v / maxVal) * chartHeight
        return (
          <g key={v}>
            <line x1={40} y1={y} x2={width - 10} y2={y} stroke="#E5E7EB" strokeDasharray="3 3" />
            <text x={30} y={y + 4} fontSize="12" textAnchor="end" fill="#9CA3AF">{v}</text>
          </g>
        )
      })}
      {data.map((d, i) => {
        const groupX = 50 + i * groupWidth
        const bars = [
          { val: d.yourOrg, color: '#64BC44' },
          { val: d.industryAvg, color: '#6B6B6B' },
          { val: d.bestPerformer, color: '#C4C4C4' },
        ]
        return (
          <g key={d.pillar}>
            {bars.map((b, j) => {
              const barH = (b.val / maxVal) * chartHeight
              const x = groupX + j * (barWidth + gap)
              const y = baseline - barH
              return <rect key={j} x={x} y={y} width={barWidth} height={barH} fill={b.color} rx="2" />
            })}
            <text x={groupX + (barWidth + gap)} y={baseline + 16} fontSize="13" textAnchor="middle" fill="#404040">{d.pillar}</text>
          </g>
        )
      })}
    </svg>
  )
}

function RadarChart({ axes, yourOrg, industryAvg }) {
  const size = 280
  const center = size / 2
  const radius = 95
  const angleStep = (2 * Math.PI) / axes.length

  function pointFor(value, index) {
    const angle = angleStep * index - Math.PI / 2
    const r = (value / 100) * radius
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)]
  }

  function polygonPoints(values) {
    return values.map((v, i) => pointFor(v, i).join(',')).join(' ')
  }

  const rings = [0.25, 0.5, 0.75, 1]

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto max-w-[280px] mx-auto">
      {rings.map((r) => (
        <polygon
          key={r}
          points={axes.map((_, i) => pointFor(r * 100, i).join(',')).join(' ')}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="1"
        />
      ))}
      {axes.map((_, i) => {
        const [x, y] = pointFor(100, i)
        return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="#E5E7EB" strokeWidth="1" />
      })}
      <polygon points={polygonPoints(industryAvg)} fill="#9CA3AF" fillOpacity="0.15" stroke="#9CA3AF" strokeWidth="1.5" />
      <polygon points={polygonPoints(yourOrg)} fill="#64BC44" fillOpacity="0.25" stroke="#64BC44" strokeWidth="2" />
      {axes.map((label, i) => {
        const [x, y] = pointFor(122, i)
        return (
          <text key={label} x={x} y={y} fontSize="13" textAnchor="middle" fill="#404040">{label}</text>
        )
      })}
    </svg>
  )
}