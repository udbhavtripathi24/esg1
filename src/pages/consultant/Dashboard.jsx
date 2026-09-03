import { Building2, Shield, Briefcase, Users } from 'lucide-react'
import PageHeader from '../../components/PageHeader.jsx'
import { Card, StatusPill, Avatar, EmptyState } from '../../components/ui.jsx'
import LoadingState from '../../components/LoadingState.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useConsultantDashboard } from '../../hooks/useDashboard.js'

const tintMap = {
  green: 'bg-brand-green/10 text-brand-greenDark',
  purple: 'bg-purple-100 text-purple-600',
  blue: 'bg-blue-100 text-blue-600',
  gray: 'bg-ink-100 text-ink-500',
}

/**
 * Dashboard V1 — deterministic/structural methodology only. See
 * app/services/dashboard_service.py's module docstring for the full
 * backend rationale. Total Revenue, Projects, and Utilization % are
 * DELIBERATELY absent — no real data source exists for any of them
 * (no billing/revenue field, no Project entity, no capacity-per-consultant
 * definition anywhere in this backend). Fabricating any of these was
 * explicitly forbidden, not merely deferred as a styling choice.
 */
export default function ConsultantDashboard() {
  const { user } = useAuth()
  const today = new Date()
  const dateStr = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })

  const dashboardQuery = useConsultantDashboard()

  if (dashboardQuery.isLoading) {
    return (
      <div>
        <PageHeader title="Dashboard." subtitle={`Operational overview — ${dateStr}.`} />
        <LoadingState label="Loading dashboard…" />
      </div>
    )
  }
  if (dashboardQuery.isError) {
    return (
      <div>
        <PageHeader title="Dashboard." subtitle={`Operational overview — ${dateStr}.`} />
        <ErrorState
          message={dashboardQuery.error?.message || 'Could not load the dashboard.'}
          onRetry={() => dashboardQuery.refetch()}
        />
      </div>
    )
  }

  const data = dashboardQuery.data
  const cards = [
    { label: 'Total Clients', value: data.total_clients, icon: Building2, tint: 'green' },
    { label: 'Enterprise Clients', value: data.plan_distribution.Enterprise, icon: Shield, tint: 'purple' },
    { label: 'Professional Clients', value: data.plan_distribution.Professional, icon: Briefcase, tint: 'blue' },
    { label: 'Basic Clients', value: data.plan_distribution.Basic, icon: Users, tint: 'gray' },
    // Total Revenue card intentionally removed — no real data source exists.
  ]

  const planTotal = data.plan_distribution.Basic + data.plan_distribution.Professional + data.plan_distribution.Enterprise
  const planColors = { Basic: '#94A3B8', Professional: '#3B82F6', Enterprise: '#7C3AED' }

  return (
    <div>
      <PageHeader title="Dashboard." subtitle={`Good morning, ${user?.name || 'there'}. Operational overview — ${dateStr}.`} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {cards.map((k) => {
          const Icon = k.icon
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
          {data.registration_queue.length === 0 ? (
            <div className="p-6"><EmptyState title="No registrations yet" subtitle="New client registrations will appear here." /></div>
          ) : (
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
                {data.registration_queue.map((r) => (
                  <tr key={r.company_id} className="border-t border-surface-border">
                    <td className="px-5 py-3 text-ink-900 font-medium">{r.company_name}</td>
                    <td className="px-2 py-3 text-ink-500">{new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="px-2 py-3">
                      <span className="px-2 py-1 rounded-md border border-surface-border text-xs text-ink-700">{r.plan}</span>
                    </td>
                    {/* Real 3-state enum only: Pending | Approved | Rejected —
                        the mock's "Under Review" never existed in the backend. */}
                    <td className="px-2 py-3"><StatusPill status={r.status} /></td>
                    <td className="px-5 py-3 text-ink-700">
                      {r.assigned_consultants.length > 0 ? r.assigned_consultants.join(', ') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </Card>

        <Card title="Subscription Distribution" subtitle={`${data.total_clients} total clients`}>
          {planTotal === 0 ? (
            <div className="py-8"><EmptyState title="No clients yet" /></div>
          ) : (
          <>
            <div className="flex items-center justify-center py-4">
              <DonutChart data={[
                { label: 'Basic', value: data.plan_distribution.Basic, color: planColors.Basic },
                { label: 'Professional', value: data.plan_distribution.Professional, color: planColors.Professional },
                { label: 'Enterprise', value: data.plan_distribution.Enterprise, color: planColors.Enterprise },
              ]} />
            </div>
            <div className="space-y-2.5 mt-2">
              {['Basic', 'Professional', 'Enterprise'].map((plan) => (
                <div key={plan} className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: planColors[plan] }} />
                    <span className="text-ink-700">{plan}</span>
                  </div>
                  <div className="flex items-center gap-3 text-ink-500">
                    <span>{data.plan_distribution[plan]}</span>
                    <span className="w-9 text-right">{planTotal > 0 ? Math.round((data.plan_distribution[plan] / planTotal) * 100) : 0}%</span>
                  </div>
                </div>
              ))}
            </div>
          </>
          )}
        </Card>
      </div>

      <Card title="Consultant Workload" subtitle="Active client staffing">
        {data.consultant_workload.length === 0 ? (
          <div className="py-8"><EmptyState title="No active assignments yet" /></div>
        ) : (
        <div className="space-y-5 mt-2">
          {data.consultant_workload.map((c) => (
            <div key={c.name} className="flex items-center gap-4">
              <Avatar name={c.name} />
              <div className="w-40 shrink-0">
                <div className="text-[10px] font-medium text-ink-900">{c.name}</div>
                <div className="text-xs text-ink-500">{c.role}</div>
              </div>
              <div className="text-xs text-ink-500">
                <span className="text-ink-900 font-medium">{c.client_count}</span> active client{c.client_count === 1 ? '' : 's'}
              </div>
              {/* Projects/Utilization % intentionally absent — no real
                  Project entity or capacity definition exists. */}
            </div>
          ))}
        </div>
        )}
      </Card>
    </div>
  )
}

function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  let cumulative = 0
  const radius = 60
  const stroke = 18
  const c = 2 * Math.PI * radius

  if (total === 0) return null

  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      <g transform="translate(80,80) rotate(-90)">
        {data.filter((d) => d.value > 0).map((d) => {
          const dash = (d.value / total) * c
          const offset = -((cumulative / total) * c)
          cumulative += d.value
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
