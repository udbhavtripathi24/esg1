import { useState } from 'react'
import { Search, Eye, MessageCircle, Download, Paperclip, Edit3, CheckCircle2 } from 'lucide-react'
import PageHeader from './PageHeader.jsx'
import { Card, Field, Select, StatusPill } from './ui.jsx'
import ReviewDataWorkspace from './ReviewDataWorkspace.jsx'
import { datasets as datasetsSeed } from '../data/mockData'

const YEARS = ['2026', '2025']
const PERIODS = ['Q2 2026', 'Q1 2026']
const FRAMEWORKS = ['GRI', 'SASB', 'BRSR']
const DOMAINS = ['Energy', 'Water', 'Emissions', 'Waste', 'Social']
const DEPARTMENTS = ['All departments', 'Sustainability', 'Operations', 'Finance', 'Facilities']

export default function ReviewCenterView({ currentUserName, reviewerName }) {
  const [datasets, setDatasets] = useState(
    datasetsSeed.map((d) => ({
      ...d,
      comments: [
        { author: reviewerName, text: 'Please confirm the Site B meter readings for this period.', time: '2 days ago' },
      ],
    }))
  )
  const [year, setYear] = useState(YEARS[0])
  const [period, setPeriod] = useState(PERIODS[0])
  const [framework, setFramework] = useState(FRAMEWORKS[0])
  const [domain, setDomain] = useState(DOMAINS[0])
  const [department, setDepartment] = useState(DEPARTMENTS[0])
  const [search, setSearch] = useState('')
  const [openId, setOpenId] = useState(null)
  const [toast, setToast] = useState(null)

  const filtered = datasets.filter((d) => !search.trim() || d.name.toLowerCase().includes(search.toLowerCase()))
  const openDataset = datasets.find((d) => d.id === openId)

  function updateStatus(id, status) {
    setDatasets((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)))
    setToast(`Marked as "${status}".`)
    setTimeout(() => setToast(null), 2500)
  }

  function addComment(id, text) {
    setDatasets((prev) =>
      prev.map((d) => (d.id === id ? { ...d, comments: [...d.comments, { author: currentUserName, text, time: 'Just now' }] } : d))
    )
  }

  if (openDataset) {
    return (
      <ReviewDataWorkspace
        dataset={openDataset}
        comments={openDataset.comments}
        onBack={() => setOpenId(null)}
        onUpdateStatus={(status) => updateStatus(openDataset.id, status)}
        onAddComment={(text) => addComment(openDataset.id, text)}
      />
    )
  }

  return (
    <div>
      <PageHeader title="Review Data" subtitle="Review uploaded datasets, respond to Deloitte feedback and resubmit corrections" />

      {toast && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-md bg-brand-green/10 text-brand-greenDark text-xs mb-4">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      <Card className="mb-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Field label="Reporting Year"><Select value={year} onChange={(e) => setYear(e.target.value)}>{YEARS.map((y) => <option key={y}>{y}</option>)}</Select></Field>
          <Field label="Reporting Period"><Select value={period} onChange={(e) => setPeriod(e.target.value)}>{PERIODS.map((p) => <option key={p}>{p}</option>)}</Select></Field>
          <Field label="Reporting Framework"><Select value={framework} onChange={(e) => setFramework(e.target.value)}>{FRAMEWORKS.map((f) => <option key={f}>{f}</option>)}</Select></Field>
          <Field label="KPI Domain"><Select value={domain} onChange={(e) => setDomain(e.target.value)}>{DOMAINS.map((d) => <option key={d}>{d}</option>)}</Select></Field>
          <Field label="Department (Optional)"><Select value={department} onChange={(e) => setDepartment(e.target.value)}>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</Select></Field>
        </div>
      </Card>

      <Card title="Datasets" action={
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            placeholder="Search datasets......"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-md border border-surface-border text-[10px] placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-green/20"
          />
        </div>
      } padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-[8px]">
            <thead>
              <tr className="text-left text-[8px] text-ink-500 border-t border-surface-border">
                <th className="font-medium px-5 py-2.5">Dataset Name</th>
                <th className="font-medium px-2 py-2.5">Framework</th>
                <th className="font-medium px-2 py-2.5">KPI Domain</th>
                <th className="font-medium px-2 py-2.5">Period</th>
                <th className="font-medium px-2 py-2.5">Date</th>
                <th className="font-medium px-2 py-2.5">Uploaded By</th>
                <th className="font-medium px-2 py-2.5">Status</th>
                <th className="font-medium px-2 py-2.5">Docs</th>
                <th className="font-medium px-5 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr
                  key={d.id}
                  onClick={() => setOpenId(d.id)}
                  className="border-t border-surface-border cursor-pointer hover:bg-surface-muted/40"
                >
                  <td className="px-5 py-3 text-ink-900 font-medium">{d.name}</td>
                  <td className="px-2 py-3">
                    <span className="px-2 py-0.5 rounded-md border border-brand-green/30 text-brand-greenDark text-[10px] font-medium">{d.framework}</span>
                  </td>
                  <td className="px-2 py-3 text-ink-700">{d.domain}</td>
                  <td className="px-2 py-3 text-ink-500">{d.period}</td>
                  <td className="px-2 py-3 text-ink-500">{d.date}</td>
                  <td className="px-2 py-3 text-ink-700">{d.uploadedBy}</td>
                  <td className="px-2 py-3"><StatusPill status={d.status} /></td>
                  <td className="px-2 py-3 text-ink-500">
                    <span className="inline-flex items-center gap-1"><Paperclip size={11} /> {d.docs}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-3 text-ink-300">
                      <button onClick={(e) => { e.stopPropagation(); setOpenId(d.id) }} className="hover:text-ink-700"><Edit3 size={13} /></button>
                      <button onClick={(e) => { e.stopPropagation(); setOpenId(d.id) }} className="hover:text-ink-700"><Eye size={13} /></button>
                      <button onClick={(e) => { e.stopPropagation(); setOpenId(d.id) }} className="hover:text-ink-700"><MessageCircle size={13} /></button>
                      <button onClick={(e) => { e.stopPropagation(); setToast('Download started.'); setTimeout(() => setToast(null), 2000) }} className="hover:text-ink-700"><Download size={13} /></button>
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