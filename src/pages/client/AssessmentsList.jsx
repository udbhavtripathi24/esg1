import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Pencil, Eye, Trash2 } from 'lucide-react'
import PageHeader from '../../components/PageHeader.jsx'
import { Card, Button, Select, Input, ProgressBar } from '../../components/ui.jsx'

/**
 * Static, frontend-only prototype for manager review, built from a
 * reference mockup. This is the Assessments landing page -- clicking
 * the eye icon on any row navigates to the (already-built) assessment
 * detail page. "Create Assessment", the edit icon, and the delete icon
 * are static placeholders for now (show a toast) -- building a full
 * create/edit/delete flow was outside the scope of this specific
 * request and can follow once this prototype is approved.
 */

const ASSESSMENTS = [
  { title: 'Climate Risk Assessment Q2 2025', type: 'Climate Risk', createdBy: 'Sarah Johnson', createdOn: '12 Jun 2025', dueDate: 'Jul 9, 2026', participants: 24, responded: 12, status: 'Active' },
  { title: 'Tier-1 Supplier ESG Due Diligence', type: 'Due Diligence', createdBy: 'Michael Chen', createdOn: '12 Jun 2025', dueDate: 'Jul 9, 2026', participants: 15, responded: 15, status: 'Completed' },
  { title: 'AWS Water Stewardship Assessment', type: 'AWS', createdBy: 'Rachel Kim', createdOn: '12 Jun 2025', dueDate: 'Jul 9, 2026', participants: 12, responded: 10, status: 'In Progress' },
  { title: 'Annual Employee ESG Awareness', type: 'Custom', createdBy: 'David Patel', createdOn: '12 Jun 2025', dueDate: 'Jul 9, 2026', participants: 120, responded: 102, status: 'In Progress' },
  { title: 'BRSR Material Topics Assessment', type: 'BRSR', createdBy: 'Sarah Johnson', createdOn: '12 Jun 2025', dueDate: 'Jul 9, 2026', participants: 30, responded: 12, status: 'Active' },
]

const STATUS_STYLES = {
  Active: 'bg-status-approved/10 text-status-approved',
  Completed: 'bg-status-approved/10 text-status-approved',
  'In Progress': 'bg-blue-50 text-blue-600',
}

function StatTile({ value, label, sub, color }) {
  return (
    <div className="bg-white border border-surface-border rounded-lg p-4">
      <p className="text-2xl font-semibold" style={{ color }}>{value}</p>
      <p className="text-xs text-ink-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-ink-300 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function AssessmentsList({ pushToast: pushToastProp }) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All Types')
  const [statusFilter, setStatusFilter] = useState('All Statuses')
  const [toast, setToast] = useState(null)

  function showToast(msg) {
    if (pushToastProp) { pushToastProp(msg); return }
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const types = ['All Types', ...new Set(ASSESSMENTS.map((a) => a.type))]
  const statuses = ['All Statuses', 'Active', 'Completed', 'In Progress']

  const filtered = ASSESSMENTS.filter((a) => {
    const matchesSearch = !search.trim() || a.title.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'All Types' || a.type === typeFilter
    const matchesStatus = statusFilter === 'All Statuses' || a.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-ink-900 text-white text-xs px-4 py-2.5 rounded-md shadow-lg">
          {toast}
        </div>
      )}

      <PageHeader
        title="Assessments"
        subtitle="Manage and track organization-specific ESG assessments"
        action={<Button onClick={() => showToast('Assessment creation will be available once this prototype is approved.')}><Plus size={14} /> Create Assessment</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatTile value="5" label="Total Assessments" sub="+2 this month" color="#2563EB" />
        <StatTile value="1" label="Active" color="#64BC44" />
        <StatTile value="2" label="In progress" color="#7C3AED" />
        <StatTile value="86%" label="Completion Rate" color="#D97706" />
      </div>

      <Card padded={false}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-surface-border">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
            <Input placeholder="Search datasets......" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
          </div>
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="sm:w-40">
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-40">
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <p className="text-[11px] text-ink-400 sm:ml-auto whitespace-nowrap">{filtered.length} Assessments</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-left text-ink-500 border-b border-surface-border">
                <th className="font-medium px-4 py-2.5 whitespace-nowrap">Assessment Title</th>
                <th className="font-medium px-3 py-2.5 whitespace-nowrap">Type</th>
                <th className="font-medium px-3 py-2.5 whitespace-nowrap">Created By</th>
                <th className="font-medium px-3 py-2.5 whitespace-nowrap">Created On</th>
                <th className="font-medium px-3 py-2.5 whitespace-nowrap">Due Date</th>
                <th className="font-medium px-3 py-2.5 whitespace-nowrap">Participants</th>
                <th className="font-medium px-3 py-2.5 whitespace-nowrap">Status</th>
                <th className="font-medium px-3 py-2.5 whitespace-nowrap">Responses</th>
                <th className="font-medium px-4 py-2.5 whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.title} className="border-b border-surface-border last:border-0">
                  <td className="px-4 py-2.5 text-ink-900 font-medium whitespace-nowrap">{a.title}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="text-[10px] border border-surface-border rounded-full px-2 py-0.5 text-ink-600">{a.type}</span>
                  </td>
                  <td className="px-3 py-2.5 text-ink-700 whitespace-nowrap">{a.createdBy}</td>
                  <td className="px-3 py-2.5 text-ink-700 whitespace-nowrap">{a.createdOn}</td>
                  <td className="px-3 py-2.5 text-ink-700 whitespace-nowrap">{a.dueDate}</td>
                  <td className="px-3 py-2.5 text-ink-700 whitespace-nowrap">{a.participants}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-medium ${STATUS_STYLES[a.status]}`}>{a.status}</span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap w-32">
                    <p className="text-[9px] text-ink-400 mb-1">{a.responded}/{a.participants}</p>
                    <ProgressBar pct={(a.responded / a.participants) * 100} height="h-1" />
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <button onClick={() => showToast('Editing assessments will be available once this prototype is approved.')} className="text-ink-400 hover:text-ink-700">
                        <Pencil size={13} />
                      </button>
                      <Link to="/client/personalized-assessment" className="text-ink-400 hover:text-brand-green">
                        <Eye size={13} />
                      </Link>
                      <button onClick={() => showToast('Deleting assessments will be available once this prototype is approved.')} className="text-status-pending/70 hover:text-status-pending">
                        <Trash2 size={13} />
                      </button>
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
