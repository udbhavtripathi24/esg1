import { useMemo, useState } from 'react'
import {
  ChevronLeft, FileText, ShieldCheck, Info, History, Eye, Download,
  CheckCircle2, AlertTriangle, XCircle, Circle, CheckCircle,
} from 'lucide-react'
import { Button } from './ui.jsx'

const TABS = [
  { key: 'Data Preview', icon: FileText },
  { key: 'Validation', icon: ShieldCheck },
  { key: 'Required Changes', icon: Info },
  { key: 'Version History', icon: History },
]

const DECISIONS = [
  { key: 'Approved', label: 'Approve Dataset', desc: 'Data is accurate and complete', icon: CheckCircle2, bg: 'bg-status-approved/10', border: 'border-status-approved', text: 'text-status-approved' },
  { key: 'Changes Requested', label: 'Request Changes', icon: AlertTriangle, bg: 'bg-status-review/10', border: 'border-status-review', text: 'text-status-review' },
  { key: 'Rejected', label: 'Reject Dataset', desc: 'Dataset cannot be approved', icon: XCircle, bg: 'bg-status-pending/10', border: 'border-status-pending', text: 'text-status-pending' },
]

const severityStyle = {
  fail: { bg: 'bg-status-pending/5', border: 'border-status-pending/20', icon: XCircle, text: 'text-status-pending' },
  warn: { bg: 'bg-status-review/5', border: 'border-status-review/20', icon: AlertTriangle, text: 'text-status-review' },
  pass: { bg: 'bg-status-approved/5', border: 'border-status-approved/20', icon: CheckCircle2, text: 'text-status-approved' },
}

function buildDetail(dataset) {
  const sites = ['SITE-A', 'SITE-B', 'SITE-C', 'SITE-D', 'SITE-E'].slice(0, Math.max(4, Math.min(5, dataset.docs + 2)))
  const flaggedIndex = 1
  const rows = sites.map((site, i) => {
    const base = 40000 + i * 8000
    const flagged = i === flaggedIndex || i === sites.length - 1
    return {
      site,
      month: 'Apr-26',
      value: (base + (flagged ? 12000 : 0)).toLocaleString(),
      pct: `${22 + i * 3}%`,
      method: 'v2.1',
      flagged,
    }
  })

  const domainLabel = `${dataset.domain} (${dataset.domain === 'Energy' ? 'kWh' : dataset.domain === 'Water' ? 'ML' : dataset.domain === 'Emissions' ? 'tCO2e' : dataset.domain === 'Waste' ? 't' : 'score'})`

  const validationItems = [
    { severity: 'fail', title: 'Missing Values', category: 'Data Quality', detail: `3 blank cells in 'Scope 2 Method' column — rows 3, 6 (Site C) and required for all sites` },
    { severity: 'pass', title: 'Duplicate Records', category: 'Data Quality', detail: 'No duplicate rows detected across all 36 records' },
    { severity: 'warn', title: 'Date Format Consistency', category: 'Format', detail: `2 rows use 'MM/YY' format instead of standard 'MMM-YY' — rows 14 and 27` },
    { severity: 'fail', title: 'Statistical Outlier Detection', category: 'Statistical', detail: `Site C April (51,840 kWh) and May (89,240 kWh) exceed 2 standard deviations from site mean (24,100 kWh). Possible data entry error.` },
    { severity: 'pass', title: 'Unit Consistency', category: 'Data Quality', detail: `All ${dataset.domain.toLowerCase()} values expressed consistently throughout dataset` },
    { severity: 'pass', title: 'Reporting Period Coverage', category: 'Completeness', detail: `All 3 months of ${dataset.period} (Apr, May, Jun) are present for all sites` },
    { severity: 'warn', title: 'Site Reference Validation', category: 'Reference', detail: `Site ID 'SITE-D' in row 23 does not match the registered site list for ${dataset.company}` },
    { severity: 'pass', title: 'Numeric Range Check', category: 'Statistical', detail: 'All flagged values fall within expected operational ranges' },
  ]

  const requiredChanges = [
    { id: 'rc1', text: `Verify and correct Site C ${dataset.domain.toLowerCase()} meter readings for April and May 2026` },
    { id: 'rc2', text: 'Attach utility bills for Sites A, B and C (full Q2 period)' },
    { id: 'rc3', text: 'Clarify Scope 2 calculation methodology — state whether market-based or location-based' },
  ]

  const versionHistory = [
    { version: 'v1.0', uploadedBy: dataset.uploadedBy, date: `${dataset.date} · 10:22 AM`, outcome: 'Under Review', notes: 'Initial submission' },
    { version: 'v1.1 (current)', uploadedBy: dataset.uploadedBy, date: `${dataset.date} · 10:22 AM`, outcome: dataset.status === 'Changes Requested' ? 'Under Review' : dataset.status, notes: dataset.status === 'Changes Requested' ? 'Corrections pending' : 'Initial submission' },
  ]

  const supportingDocuments = Array.from({ length: Math.max(2, dataset.docs) }).map((_, i) => ({
    name: `Q2 Meter Readings — Site ${String.fromCharCode(65 + i)}.pdf`,
    size: `${(20 + i * 4.2).toFixed(1)} MB`,
  }))

  return { rows, validationItems, requiredChanges, versionHistory, supportingDocuments, domainLabel }
}

export default function ReviewDataWorkspace({ dataset, comments, onBack, onUpdateStatus, onAddComment }) {
  const [tab, setTab] = useState('Data Preview')
  const [visitedTabs, setVisitedTabs] = useState(new Set(['Data Preview']))
  const [selectedDecision, setSelectedDecision] = useState(null)
  const [decisionNote, setDecisionNote] = useState('')
  const [decisionMade, setDecisionMade] = useState(false)
  const [requiredChanges, setRequiredChanges] = useState(null)
  const [newChange, setNewChange] = useState('')
const [toast, setToast] = useState(null)
  const detail = useMemo(() => buildDetail(dataset), [dataset])
  const changes = requiredChanges || detail.requiredChanges

  function selectTab(t) {
    setTab(t)
    setVisitedTabs((prev) => new Set(prev).add(t))
  }

  function submitDecision() {
    if (!selectedDecision) return
    onUpdateStatus(selectedDecision)
    if (decisionNote.trim()) onAddComment(decisionNote.trim())
    setDecisionMade(true)
    setDecisionNote('')
    const decisionLabel = DECISIONS.find((d) => d.key === selectedDecision)?.label
    setToast(`Review submitted — ${decisionLabel}.`)
    setTimeout(() => setToast(null), 3500)
  }

  const failCount = detail.validationItems.filter((v) => v.severity === 'fail').length
  const warnCount = detail.validationItems.filter((v) => v.severity === 'warn').length
  const passCount = detail.validationItems.filter((v) => v.severity === 'pass').length

  const checklist = [
    { label: 'Dataset opened', done: true },
    { label: 'Data preview inspected', done: visitedTabs.has('Data Preview') },
    { label: 'Validation results reviewed', done: visitedTabs.has('Validation') },
    { label: 'Comments added', done: comments.length > 0 || decisionNote.length > 0 },
    { label: 'Required changes defined', done: changes.length > 0 },
    { label: 'Decision made', done: decisionMade },
  ]

  const title = `${dataset.period} ${dataset.domain} Consumption — Sites A/B/C`

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink-900 mb-1">Review Data</h1>
      <p className="text-xs text-ink-500 mb-3">Dataset review workspace</p>
      <button onClick={onBack} className="flex items-center gap-1 text-[10px] text-ink-500 hover:text-ink-900 mb-6">
        <ChevronLeft size={13} /> Back to Datasets
      </button>

      <h2 className="text-lg font-semibold text-ink-900 mb-1">{title}</h2>
      <p className="text-[10px] text-ink-500 mb-4">
        {dataset.framework} · {dataset.domain} · {dataset.period} · Submitted by {dataset.uploadedBy} on {dataset.date}
      </p>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <div>
          {/* Dataset Summary */}
          <div className="bg-white border border-surface-border rounded-lg p-5 mb-4">
            <p className="text-xs font-semibold text-ink-900 mb-4">Dataset Summary</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[10px]">
              <div>
                <div className="text-[8px] text-ink-300">Company</div>
                <div className="text-ink-900 font-medium">{dataset.company}</div>
              </div>
              <div>
                <div className="text-[8px] text-ink-300">Framework</div>
                <div className="text-ink-900 font-medium">{dataset.framework}</div>
              </div>
              <div>
                <div className="text-[8px] text-ink-300">KPI Domain</div>
                <div className="text-ink-900 font-medium">{dataset.domain}</div>
              </div>
              <div>
                <div className="text-[8px] text-ink-300">Reporting Period</div>
                <div className="text-ink-900 font-medium">{dataset.period}</div>
              </div>
              <div>
                <div className="text-[8px] text-ink-300">Submitted By</div>
                <div className="text-ink-900 font-medium">{dataset.uploadedBy}</div>
              </div>
              <div>
                <div className="text-[8px] text-ink-300">Submission Date</div>
                <div className="text-ink-900 font-medium">{dataset.date}</div>
              </div>
              <div>
                <div className="text-[8px] text-ink-300">Current Status</div>
                <span className="inline-block px-2 py-0.5 rounded-full bg-status-review/10 text-status-review text-[9px] font-medium mt-0.5">
                  {dataset.status === 'Pending' ? 'In Progress' : dataset.status}
                </span>
              </div>
              <div>
                <div className="text-[8px] text-ink-300">Assigned Reviewer</div>
                <div className="text-ink-900 font-medium">{dataset.assignedReviewer}</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white border border-surface-border rounded-lg">
            <div className="flex items-center gap-5 px-5 pt-4 border-b border-surface-border overflow-x-auto">
              {TABS.map(({ key: t, icon: TabIcon }) => {
                const badge = t === 'Validation' ? failCount
                  : t === 'Required Changes' ? changes.length
                  : 0
                return (
                  <button
                    key={t}
                    onClick={() => selectTab(t)}
                    className={`pb-3 text-[10px] whitespace-nowrap border-b-2 flex items-center gap-1.5 transition-colors ${
                      tab === t ? 'border-brand-green text-brand-green font-medium' : 'border-transparent text-ink-500 hover:text-ink-900'
                    }`}
                  >
                    <TabIcon size={12} />
                    {t}
                    {badge > 0 && (
                      <span className="w-4 h-4 rounded-full bg-status-pending text-white text-[9px] flex items-center justify-center">{badge}</span>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="p-5">
              {tab === 'Data Preview' && (
                <div>
                  {detail.rows.some((r) => r.flagged) && (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-md bg-status-review/10 text-status-review text-[10px] mb-4">
                      <AlertTriangle size={13} />
                      {detail.rows.filter((r) => r.flagged).length} rows flagged by automated validation — highlighted below
                    </div>
                  )}
                  <table className="w-full text-[8px]">
                    <thead>
                      <tr className="text-left text-ink-500 border-b border-surface-border">
                        <th className="font-medium py-2 pr-2">#</th>
                        <th className="font-medium py-2 pr-2">Dataset Name</th>
                        <th className="font-medium py-2 pr-2">Month</th>
                        <th className="font-medium py-2 pr-2">{detail.domainLabel}</th>
                        <th className="font-medium py-2 pr-2">Renewable %</th>
                        <th className="font-medium py-2">Scope 2 Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.rows.map((r, i) => (
                        <tr key={i} className={`border-b border-surface-border last:border-0 ${r.flagged ? 'bg-status-review/5' : ''}`}>
                          <td className="py-2.5 pr-2 text-ink-500">{i + 1}</td>
                          <td className="py-2.5 pr-2 text-ink-900 font-medium">{r.site}</td>
                          <td className="py-2.5 pr-2 text-ink-700">{r.month}</td>
                          <td className="py-2.5 pr-2 text-ink-700">{r.value}</td>
                          <td className="py-2.5 pr-2 text-ink-700">{r.pct}</td>
                          <td className="py-2.5 text-ink-700">{r.method}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {tab === 'Validation' && (
                <div>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-status-pending/10 rounded-md p-3">
                      <p className="text-lg font-semibold text-status-pending">{failCount}</p>
                      <p className="text-[9px] text-status-pending">Failed Checks</p>
                    </div>
                    <div className="bg-status-review/10 rounded-md p-3">
                      <p className="text-lg font-semibold text-status-review">{warnCount}</p>
                      <p className="text-[9px] text-status-review">Warnings</p>
                    </div>
                    <div className="bg-status-approved/10 rounded-md p-3">
                      <p className="text-lg font-semibold text-status-approved">{passCount}</p>
                      <p className="text-[9px] text-status-approved">Passed</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {detail.validationItems.map((v, i) => {
                      const s = severityStyle[v.severity]
                      const SevIcon = s.icon
                      return (
                        <div key={i} className={`flex items-start justify-between gap-3 border rounded-md px-3 py-2.5 ${s.bg} ${s.border}`}>
                          <div className="flex items-start gap-2">
                            <SevIcon size={13} className={`${s.text} shrink-0 mt-0.5`} />
                            <div>
                              <p className="text-[10px] font-semibold text-ink-900">{v.title}</p>
                              <p className="text-[8px] text-ink-500 mt-0.5">{v.detail}</p>
                            </div>
                          </div>
                          <span className="text-[8px] text-ink-300 whitespace-nowrap shrink-0">{v.category}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {tab === 'Required Changes' && (
                <div>
                  <p className="text-xs font-semibold text-ink-900 mb-1">Required Changes</p>
                  <p className="text-[8px] text-ink-500 mb-4 leading-relaxed">
                    Define the specific corrections the submitter must complete before this dataset can be approved. This checklist will be sent to the submitter when you select "Request Changes."
                  </p>
                  <div className="space-y-2 mb-4">
                    {changes.map((rc, i) => (
                      <div key={rc.id} className="flex items-start gap-3 border border-surface-border rounded-md px-3 py-2.5">
                        <span className="w-4 h-4 rounded-full bg-ink-100 text-ink-700 text-[8px] font-medium flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                        <span className="text-[10px] text-ink-700">{rc.text}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={newChange}
                      onChange={(e) => setNewChange(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addRequiredChange()}
                      placeholder="Describe a required correction clearly......."
                      className="flex-1 px-3 py-2 rounded-md border border-surface-border text-[10px] placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                    />
                    <Button size="sm" onClick={addRequiredChange}>Send</Button>
                  </div>
                </div>
              )}

              {tab === 'Version History' && (
                <div>
                  <p className="text-xs font-semibold text-ink-900 mb-4">Version History</p>
                  <table className="w-full text-[8px]">
                    <thead>
                      <tr className="text-left text-ink-500 border-b border-surface-border">
                        <th className="font-medium py-2 pr-2">Version</th>
                        <th className="font-medium py-2 pr-2">Uploaded By</th>
                        <th className="font-medium py-2 pr-2">Date & Time</th>
                        <th className="font-medium py-2 pr-2">Review Outcome</th>
                        <th className="font-medium py-2">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.versionHistory.map((v, i) => (
                        <tr key={i} className="border-b border-surface-border last:border-0">
                          <td className="py-2.5 pr-2 text-ink-900 font-medium">{v.version}</td>
                          <td className="py-2.5 pr-2 text-ink-700">{v.uploadedBy}</td>
                          <td className="py-2.5 pr-2 text-ink-500">{v.date}</td>
                          <td className="py-2.5 pr-2 text-status-review font-medium">{v.outcome}</td>
                          <td className="py-2.5 text-ink-500">{v.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-[8px] text-ink-300 mt-3 leading-relaxed">
                    All versions are retained for audit purposes. When a corrected version is submitted by the client, it will appear here alongside this initial version and can be compared side-by-side.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
         <div className="bg-white border border-surface-border rounded-lg p-5">
            <p className="text-xs font-semibold text-ink-900 mb-3">Review Decision</p>
            <div className="space-y-2 mb-3">
              {DECISIONS.map((d) => {
                const DIcon = d.icon
                const selected = selectedDecision === d.key
                const desc = d.key === 'Changes Requested' ? `${changes.length} corrections required` : d.desc
                return (
                  <button
                    key={d.key}
                    onClick={() => { setSelectedDecision(d.key); setDecisionMade(false) }}
                    className={`w-full text-left px-3 py-2.5 rounded-md border-2 transition-all ${d.bg} ${
                      selected ? d.border : 'border-transparent'
                    }`}
                  >
                    <p className={`text-[10px] font-semibold flex items-center gap-1.5 text-ink-900`}>
                      <DIcon size={13} className={d.text} /> {d.label}
                    </p>
                    <p className={`text-[8px] mt-0.5 ${d.text}`}>{desc}</p>
                  </button>
                )
              })}
            </div>

            {comments.length > 0 && (
              <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
                {comments.map((c, i) => (
                  <div key={i} className="border border-surface-border rounded-md px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-medium text-ink-900">{c.author}</span>
                      <span className="text-[8px] text-ink-300">{c.time}</span>
                    </div>
                    <p className="text-[9px] text-ink-700 mt-0.5">{c.text}</p>
                  </div>
                ))}
              </div>
            )}

            <textarea
              value={decisionNote}
              onChange={(e) => setDecisionNote(e.target.value)}
              placeholder="Add a comment or reply....."
              rows={2}
              className="w-full px-3 py-2 rounded-md border border-surface-border text-[10px] placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-green/20 mb-3"
            />
            {toast && (
              <p className="text-[9px] text-status-approved mb-2 flex items-center gap-1.5">
                <CheckCircle size={11} /> {toast}
              </p>
            )}
            <Button className="w-full" onClick={submitDecision} disabled={!selectedDecision || decisionMade}>
              {decisionMade ? 'Decision Submitted ✓' : 'Submit Review'}
            </Button>
          </div> 

          <div className="bg-white border border-surface-border rounded-lg p-5">
            <p className="text-xs font-semibold text-ink-900 mb-3">Supporting Documents</p>
            <div className="space-y-2">
              {detail.supportingDocuments.map((doc, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-md border border-surface-border">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={13} className="text-ink-300 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[9px] text-ink-900 truncate">{doc.name}</p>
                      <p className="text-[8px] text-ink-300">{doc.size}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-ink-300 shrink-0">
                    <button className="hover:text-ink-700"><Eye size={12} /></button>
                    <button className="hover:text-ink-700"><Download size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-surface-border rounded-lg p-5">
            <p className="text-xs font-semibold text-ink-900 mb-3">Review Checklist</p>
            <div className="space-y-2.5">
              {checklist.map((c) => (
                <div key={c.label} className="flex items-center gap-2 text-[10px]">
                  {c.done ? <CheckCircle size={14} className="text-status-approved shrink-0" /> : <Circle size={14} className="text-ink-200 shrink-0" />}
                  <span className={c.done ? 'text-ink-700' : 'text-ink-300'}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}