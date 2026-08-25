import { useState } from 'react'
import { Search, SquarePen, Eye, MessageSquare, Download } from 'lucide-react'
import PageHeader from '../../components/PageHeader.jsx'
import { Card, Button, Select, StatusPill } from '../../components/ui.jsx'
import { reportingFilters, frameworkReadiness, generatedReportsList } from '../../data/mockData'

export default function Reporting() {
  const [year, setYear] = useState(reportingFilters.years[0])
  const [period, setPeriod] = useState('Q2 2026')
  const [businessUnit, setBusinessUnit] = useState(reportingFilters.businessUnits[0])
  const [legalEntity, setLegalEntity] = useState(reportingFilters.legalEntities[0])
  const [status, setStatus] = useState(reportingFilters.statuses[0])
  const [search, setSearch] = useState('')
  const [generating, setGenerating] = useState(null)
  const [reports, setReports] = useState(generatedReportsList)

  function handleGenerate(fw) {
    if (!fw.canGenerate) return
    setGenerating(fw.code)
    setTimeout(() => {
      setReports((prev) => [
        { dataset: `${fw.code} Sustainability Report — ${period}`, framework: fw.code, publishedBy: 'You', period, date: 'Just now', version: 'v1.0', status: 'Not Published' },
        ...prev,
      ])
      setGenerating(null)
    }, 900)
  }

  const filteredReports = reports.filter(
    (r) => !search.trim() || r.dataset.toLowerCase().includes(search.toLowerCase()) || r.framework.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <PageHeader title="Reporting" subtitle="Generate, monitor and download ESG reports across all active frameworks" />

      <Card className="mb-5">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="text-xs font-medium text-ink-700 mb-1 block">Reporting Year</label>
            <Select value={year} onChange={(e) => setYear(e.target.value)}>
              {reportingFilters.years.map((y) => <option key={y}>{y}</option>)}
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-ink-700 mb-1 block">Reporting Period</label>
            <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
              {reportingFilters.periods.map((p) => <option key={p}>{p}</option>)}
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-ink-700 mb-1 block">Business Unit</label>
            <Select value={businessUnit} onChange={(e) => setBusinessUnit(e.target.value)}>
              {reportingFilters.businessUnits.map((b) => <option key={b}>{b}</option>)}
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-ink-700 mb-1 block">Legal Entity</label>
            <Select value={legalEntity} onChange={(e) => setLegalEntity(e.target.value)}>
              {reportingFilters.legalEntities.map((l) => <option key={l}>{l}</option>)}
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-ink-700 mb-1 block">Report Status</label>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              {reportingFilters.statuses.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </div>
        </div>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {frameworkReadiness.map((fw) => (
          <div key={fw.code} className="bg-white border border-surface-border rounded-lg p-4 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${fw.badge}`}>{fw.code}</span>
                <StatusPill status={fw.status} />
              </div>
              <span className="text-lg font-bold text-ink-900">{fw.pct}%</span>
            </div>
            <p className="text-xs text-ink-500 mt-2">{fw.name}</p>
            <div className="mt-3 h-2 rounded-full bg-surface-muted overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${fw.pct}%`, backgroundColor: fw.bar }} />
            </div>

            <div className="mt-4 space-y-1.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-ink-500 whitespace-nowrap">Reporting period</span>
                <span className="text-ink-900 whitespace-nowrap">{fw.period}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-ink-500 whitespace-nowrap">Last generated</span>
                <span className="text-ink-900 whitespace-nowrap">{fw.lastGenerated}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-ink-500 whitespace-nowrap">Data readiness</span>
                <span className={`font-medium text-right ${fw.readinessColor}`}>{fw.readiness}</span>
              </div>
            </div>

            {fw.canGenerate ? (
              <Button
                className="mt-auto w-full justify-center"
                variant="primary"
                disabled={generating === fw.code}
                onClick={() => handleGenerate(fw)}
              >
                {generating === fw.code ? 'Generating…' : 'Generate Report'}
              </Button>
            ) : (
              <button
                disabled
                className="mt-auto w-full py-2.5 rounded-md text-sm font-medium bg-ink-100 text-ink-400 cursor-not-allowed"
              >
                Generate Report
              </button>
            )}
          </div>
        ))}
      </div>

      <Card title="Generated Reports" padded={false}>
        <div className="flex justify-end px-5 pt-1 pb-3">
          <div className="relative w-full max-w-xs">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports......"
              className="w-full rounded-full border border-surface-border bg-white pl-4 pr-9 py-2 text-[10px] outline-none focus:border-brand-green"
            />
            <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="text-left text-xs text-ink-500 border-t border-surface-border">
                <th className="font-medium px-5 py-2.5">Dataset Name</th>
                <th className="font-medium px-2 py-2.5">Framework</th>
                <th className="font-medium px-2 py-2.5">Published By</th>
                <th className="font-medium px-2 py-2.5">Period</th>
                <th className="font-medium px-2 py-2.5">Date</th>
                <th className="font-medium px-2 py-2.5">Version</th>
                <th className="font-medium px-2 py-2.5">Status</th>
                <th className="font-medium px-5 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((r, i) => (
                <tr key={i} className="border-t border-surface-border">
                  <td className="px-5 py-3 text-ink-900 font-medium">{r.dataset}</td>
                  <td className="px-2 py-3">
                    <span className="px-2 py-0.5 rounded-md border border-green-300 text-green-600 bg-green-50 text-[10px] font-medium">{r.framework}</span>
                  </td>
                  <td className="px-2 py-3 text-ink-700">{r.publishedBy}</td>
                  <td className="px-2 py-3 text-ink-700">{r.period}</td>
                  <td className="px-2 py-3 text-ink-700">{r.date}</td>
                  <td className="px-2 py-3 text-ink-700">{r.version}</td>
                  <td className="px-2 py-3"><StatusPill status={r.status} /></td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2.5 text-ink-400">
                      <SquarePen size={13} className="cursor-pointer hover:text-brand-green" />
                      <Eye size={13} className="cursor-pointer hover:text-brand-green" />
                      <MessageSquare size={13} className="cursor-pointer hover:text-brand-green" />
                      <Download size={13} className="cursor-pointer hover:text-brand-green" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
