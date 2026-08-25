import { Building2, Shield, Briefcase, Users, Wallet } from 'lucide-react'
import PageHeader from '../../components/PageHeader.jsx'
import { Card, StatusPill, ProgressBar, Avatar } from '../../components/ui.jsx'
import { kpiSummary, registrationQueue, subscriptionDistribution, consultantWorkload } from '../../data/mockData'

const iconMap = { building: Building2, shield: Shield, briefcase: Briefcase, users: Users, wallet: Wallet }
const tintMap = {
  green: 'bg-brand-green/10 text-brand-greenDark',
  purple: 'bg-purple-100 text-purple-600',
  blue: 'bg-blue-100 text-blue-600',
  gray: 'bg-ink-100 text-ink-500',
  amber: 'bg-amber-100 text-amber-600',
}

function workloadColor(pct) {
  if (pct >= 80) return '#DC2626'
  if (pct >= 50) return '#D98A1F'
  return '#2E9E4F'
}

export default function ConsultantDashboard() {
  const today = new Date()
  const dateStr = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div>
      <PageHeader title="Dashboard." subtitle={`Good morning, James. Operational overview — ${dateStr}.`} />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {kpiSummary.map((k) => {
          const Icon = iconMap[k.icon]
          return (
            <div key={k.label} className="bg-white border border-surface-border rounded-lg p-4">
              <div className={`w-9 h-9 rounded-md flex items-center justify-center ${tintMap[k.tint]}`}>
                <Icon size={17} />
              </div>
              <div className="mt-3 text-sm font-semibold text-ink-900">{k.value}</div>
              <div className="text-xs text-ink-500 mt-0.5">{k.label}</div>
            </div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <Card title="Client Registration Queue" subtitle="Pending registrations requiring review" className="lg:col-span-2" padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="text-left text-xs text-ink-500 border-t border-surface-border">
                  <th className="font-medium px-5 py-2.5">Company</th>
                  <th className="font-medium px-2 py-2.5">Registration Date</th>
                  <th className="font-medium px-2 py-2.5">Plan</th>
                  <th className="font-medium px-2 py-2.5">Status</th>
                  <th className="font-medium px-5 py-2.5">Assigned Consultant</th>
                </tr>
              </thead>
              <tbody>
                {registrationQueue.map((r, i) => (
                  <tr key={i} className="border-t border-surface-border">
                    <td className="px-5 py-3 text-ink-900 font-medium">{r.company}</td>
                    <td className="px-2 py-3 text-ink-500">{r.date}</td>
                    <td className="px-2 py-3">
                      <span className="px-2 py-1 rounded-md border border-surface-border text-xs text-ink-700">{r.plan}</span>
                    </td>
                    <td className="px-2 py-3"><StatusPill status={r.status} /></td>
                    <td className="px-5 py-3 text-ink-700">{r.consultant}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Subscription Distribution" subtitle="247 total clients">
          <div className="flex items-center justify-center py-4">
            <DonutChart data={subscriptionDistribution} />
          </div>
          <div className="space-y-2.5 mt-2">
            {subscriptionDistribution.map((d) => (
              <div key={d.label} className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-ink-700">{d.label}</span>
                </div>
                <div className="flex items-center gap-3 text-ink-500">
                  <span>{d.value}</span>
                  <span className="w-9 text-right">{d.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Consultant Workload" subtitle="Current capacity utilization">
        <div className="space-y-5 mt-2">
          {consultantWorkload.map((c) => (
            <div key={c.name} className="flex items-center gap-4">
              <Avatar name={c.name} />
              <div className="w-40 shrink-0">
                <div className="text-[10px] font-medium text-ink-900">{c.name}</div>
                <div className="text-xs text-ink-500">{c.role}</div>
              </div>
              <div className="w-20 text-xs text-ink-500 shrink-0">
                <div className="text-ink-900 font-medium">{c.clients}</div>
                Clients
              </div>
              <div className="w-20 text-xs text-ink-500 shrink-0">
                <div className="text-ink-900 font-medium">{c.projects}</div>
                Projects
              </div>
              <div className="flex-1">
                <ProgressBar pct={c.pct} color={workloadColor(c.pct)} />
              </div>
              <div className="w-10 text-right text-[10px] font-medium" style={{ color: workloadColor(c.pct) }}>
                {c.pct}%
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.pct, 0)
  let cumulative = 0
  const radius = 60
  const stroke = 18
  const c = 2 * Math.PI * radius

  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      <g transform="translate(80,80) rotate(-90)">
        {data.map((d) => {
          const dash = (d.pct / total) * c
          const offset = -((cumulative / total) * c)
          cumulative += d.pct
          return (
            <circle
              key={d.label}
              r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={offset}
            />
          )
        })}
      </g>
    </svg>
  )
}
