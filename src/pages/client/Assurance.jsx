import { useState } from 'react'
import { Hash, FileCheck, TriangleAlert, Timer, Eye, Download, Search, CircleCheck, Circle } from 'lucide-react'
import PageHeader from '../../components/PageHeader.jsx'
import { Card, Select, StatusPill, Button } from '../../components/ui.jsx'
import { assuranceStats, assuranceFilters, assuranceKpiDetail, assuranceItems } from '../../data/mockData'

const iconMap = { hash: Hash, 'file-check': FileCheck, 'triangle-alert': TriangleAlert, timer: Timer }

const cardTint = {
  gray: 'bg-white',
  green: 'bg-green-50',
  purple: 'bg-purple-50',
  amber: 'bg-amber-50',
  blue: 'bg-blue-50',
}

const iconTint = {
  gray: 'bg-ink-200 text-ink-500',
  green: 'bg-status-approved text-white',
  purple: 'bg-purple-100 text-purple-600',
  amber: 'bg-amber-100 text-amber-600',
  blue: 'bg-blue-100 text-blue-600',
}

export default function Assurance() {
  const [domain, setDomain] = useState(assuranceFilters.domains[0])
  const [year, setYear] = useState(assuranceFilters.years[0])
  const [businessUnit, setBusinessUnit] = useState(assuranceFilters.businessUnits[0])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(0)

  const filteredItems = assuranceItems.filter((it) => !search.trim() || it.dataset.toLowerCase().includes(search.toLowerCase()))
  const detail = assuranceKpiDetail

  return (
    <div>
      <PageHeader title="Assurance" subtitle="Track Deloitte's review process, respond to comments and resolve outstanding items" />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-5">
        {assuranceStats.map((s) => {
          const Icon = iconMap[s.icon]
          return (
            <div key={s.label} className={`rounded-lg p-4 border border-surface-border ${cardTint[s.tint]}`}>
              <div className={`w-8 h-8 rounded-md flex items-center justify-center ${iconTint[s.tint]}`}>
                {Icon ? <Icon size={15} /> : <span className="w-3.5 h-3.5 rounded-sm bg-white" />}
              </div>
              <div className="flex items-end justify-between mt-3">
                <span className="text-xs font-medium text-ink-700 leading-tight">{s.label}</span>
                <span className="text-sm font-bold text-ink-900">{s.value}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-4 items-start">
        <Card title="Open Assurance Items">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="text-xs font-medium text-ink-700 mb-1 block">KPI Domain</label>
              <Select value={domain} onChange={(e) => setDomain(e.target.value)}>
                {assuranceFilters.domains.map((d) => <option key={d}>{d}</option>)}
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-700 mb-1 block">Financial Year</label>
              <Select value={year} onChange={(e) => setYear(e.target.value)}>
                {assuranceFilters.years.map((y) => <option key={y}>{y}</option>)}
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-700 mb-1 block">Business Unit</label>
              <Select value={businessUnit} onChange={(e) => setBusinessUnit(e.target.value)}>
                {assuranceFilters.businessUnits.map((b) => <option key={b}>{b}</option>)}
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-700 mb-1 block opacity-0">Search</label>
              <div className="relative">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search KPIs, framew..."
                  className="w-full rounded-md border border-surface-border bg-white pl-3 pr-8 py-2 text-[10px] outline-none focus:border-brand-green"
                />
                <Search size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-300" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="text-left text-xs text-ink-500 border-t border-surface-border">
                  <th className="font-medium py-2.5">Dataset Name</th>
                  <th className="font-medium py-2.5">Internal Reviewer</th>
                  <th className="font-medium py-2.5">Last Updated</th>
                  <th className="font-medium py-2.5">Priority</th>
                  <th className="font-medium py-2.5">Assurance Status</th>
                  <th className="font-medium py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((it, i) => (
                  <tr
                    key={i}
                    onClick={() => setSelected(i)}
                    className={`border-t border-surface-border cursor-pointer ${selected === i ? 'bg-brand-green/5' : ''}`}
                  >
                    <td className="py-3 text-ink-900 font-medium">{it.dataset}</td>
                    <td className="py-3 text-ink-700">{it.reviewer}</td>
                    <td className="py-3 text-ink-500">{it.updated}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          it.priority === 'High' ? 'bg-status-pending/10 text-status-pending'
                          : it.priority === 'Medium' ? 'bg-status-review/10 text-status-review'
                          : 'bg-blue-50 text-blue-600'
                        }`}
                      >
                        {it.priority}
                      </span>
                    </td>
                    <td className="py-3">
                      <StatusPill status={it.status} />
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-3">
                        <button className="text-ink-300 hover:text-ink-700">
                          <Eye size={13} />
                        </button>
                        <button className="text-ink-300 hover:text-ink-700">
                          <Download size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-md bg-surface-muted px-4 py-3 text-[10px] text-ink-500">
            <span className="font-semibold text-ink-700 shrink-0">About this page:</span>
            <span>
              Assurance is an independent verification process conducted by a third-party assurance provider. Data
              and evidence on this page are read-only. Any clarifications or additional evidence should be uploaded
              by your ESG team through the Data Management module. Assurance observations are formal audit notes and
              cannot be modified through this platform.
            </span>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold text-ink-900">{detail.title}</h3>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <StatusPill status={detail.statusBadge} />
            <span className="px-2 py-0.5 rounded-md border border-surface-border text-ink-700 text-[10px] font-medium">
              {detail.frameworkBadge}
            </span>
          </div>

          <p className="text-[10px] text-ink-500 mt-2">{detail.category}</p>

          <div className="mt-4 flex items-center justify-between bg-surface-muted rounded-md p-3">
            <div>
              <p className="text-[10px] text-ink-500">Reported Value</p>
              <p className="text-sm font-bold text-ink-900 mt-0.5">
                {detail.reportedValue} <span className="text-xs font-normal text-ink-500">{detail.reportedUnit}</span>
              </p>
            </div>
            <Button variant="ghost" size="sm">
              Download evidence <Download size={12} />
            </Button>
          </div>

          <p className="text-xs font-semibold text-ink-900 mt-5">Submission Information</p>
          <div className="grid grid-cols-2 gap-y-3 mt-2 text-[10px]">
            <div>
              <p className="text-ink-500">Submitted By</p>
              <p className="text-ink-900 font-semibold mt-0.5">{detail.submittedBy}</p>
            </div>
            <div>
              <p className="text-ink-500">Submitted on</p>
              <p className="text-ink-900 font-semibold mt-0.5">{detail.submittedOn}</p>
            </div>
            <div>
              <p className="text-ink-500">Internal Reviewer</p>
              <p className="text-ink-900 font-semibold mt-0.5">{detail.internalReviewer}</p>
            </div>
            <div>
              <p className="text-ink-500">Reviewed On</p>
              <p className="text-ink-900 font-semibold mt-0.5">{detail.reviewedOn}</p>
            </div>
          </div>

          <p className="text-[10px] text-ink-500 mt-4">Assurance Status</p>
          <p className="text-sm font-bold text-status-approved mt-0.5">{detail.assuranceStatus}</p>

          <p className="text-xs font-semibold text-ink-900 mt-5">Calculation & Methodology</p>
          <p className="text-[10px] text-ink-500 mt-2">Calculation Logic</p>
          <p className="text-[10px] text-ink-900 font-medium mt-1">{detail.calculationLogic}</p>

          <p className="text-[10px] text-ink-500 mt-4">Emission / Conversion Factors</p>
          <ul className="mt-1 space-y-1 text-[10px] text-ink-900 font-medium list-disc list-inside">
            {detail.emissionFactors.map((f) => <li key={f}>{f}</li>)}
          </ul>

          <p className="text-[10px] text-ink-500 mt-4">Assumptions</p>
          <ul className="mt-1 space-y-1 text-[10px] text-purple-600 font-medium list-disc list-inside">
            {detail.assumptions.map((a) => <li key={a}>{a}</li>)}
          </ul>

          <p className="text-xs font-semibold text-ink-900 mt-5">Assurance Observation</p>
          <p className="text-[10px] mt-2">
            <span className="font-semibold text-ink-900">No Observations Raised.</span>{' '}
            <span className="text-ink-500">This KPI passed assurance without any observations.</span>
          </p>

          <p className="text-xs font-semibold text-ink-900 mt-5">Open Assurance Items</p>
          <div className="mt-3 space-y-4">
            {detail.timeline.map((t, i) => (
              <div key={i} className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  {t.done ? (
                    <CircleCheck size={15} className="text-status-approved mt-0.5 shrink-0" />
                  ) : (
                    <Circle size={15} className="text-ink-300 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className="text-[10px] font-semibold text-ink-900">{t.title}</p>
                    <p className="text-[10px] text-ink-500">{t.detail}</p>
                  </div>
                </div>
                <span className="text-[10px] text-ink-400 whitespace-nowrap">{t.date}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
