import { useMemo, useState } from 'react'
import { Search, Eye, MessageCircle, CheckCircle2 } from 'lucide-react'
import PageHeader from './PageHeader.jsx'
import { Card, Field, Select, StatusPill, EmptyState } from './ui.jsx'
import LoadingState from './LoadingState.jsx'
import ErrorState from './ErrorState.jsx'
import ReviewDataWorkspace from './ReviewDataWorkspace.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useDatasets } from '../hooks/useDatasets.js'
import { useCompanies } from '../hooks/useCompanies.js'
import { useUsers } from '../hooks/useUsers.js'

const YEARS = ['2026', '2025']
const PERIODS = ['Q2 2026', 'Q1 2026']

export default function ReviewCenterView() {
  const { user } = useAuth()
  const [year, setYear] = useState(YEARS[0])
  const [period, setPeriod] = useState(PERIODS[0])
  const [search, setSearch] = useState('')
  const [openPublicId, setOpenPublicId] = useState(null)
  const [toast, setToast] = useState(null)

  function pushToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const datasetsQuery = useDatasets({ page: 1, page_size: 100 })
  const datasets = useMemo(() => datasetsQuery.data?.items || [], [datasetsQuery.data])

  // Resolve company_id -> name and created_by -> name via already-fetched
  // real data — no N+1 requests, same pattern used throughout this project.
  const companiesQuery = useCompanies({ page: 1, page_size: 100, sort: 'name', order: 'asc' })
  const companyNameById = useMemo(() => {
    const map = new Map()
    for (const c of companiesQuery.data?.items || []) map.set(c.id, c.name)
    return map
  }, [companiesQuery.data])

  const usersQuery = useUsers({ page: 1, page_size: 100 })
  const userNameById = useMemo(() => {
    const map = new Map()
    for (const u of usersQuery.data?.items || []) map.set(u.id, u.name)
    return map
  }, [usersQuery.data])

  const filtered = useMemo(
    () => datasets.filter((d) => !search.trim() ||
      (companyNameById.get(d.company_id) || '').toLowerCase().includes(search.toLowerCase()) ||
      d.status.toLowerCase().includes(search.toLowerCase())),
    [datasets, search, companyNameById]
  )
  const openDataset = datasets.find((d) => d.public_id === openPublicId)

  if (openDataset) {
    return (
      <ReviewDataWorkspace
        dataset={openDataset}
        companyName={companyNameById.get(openDataset.company_id) || `Company #${openDataset.company_id}`}
        uploaderName={userNameById.get(openDataset.created_by) || `User #${openDataset.created_by}`}
        currentUser={user}
        onBack={() => setOpenPublicId(null)}
        pushToast={pushToast}
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Reporting Year"><Select value={year} onChange={(e) => setYear(e.target.value)}>{YEARS.map((y) => <option key={y}>{y}</option>)}</Select></Field>
          <Field label="Reporting Period"><Select value={period} onChange={(e) => setPeriod(e.target.value)}>{PERIODS.map((p) => <option key={p}>{p}</option>)}</Select></Field>
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
        {datasetsQuery.isLoading ? (
          <LoadingState label="Loading datasets…" />
        ) : datasetsQuery.isError ? (
          <ErrorState message={datasetsQuery.error?.message || 'Could not load datasets.'} onRetry={() => datasetsQuery.refetch()} />
        ) : filtered.length === 0 ? (
          <div className="p-6"><EmptyState title="No datasets to review" subtitle="Datasets submitted for review will appear here." /></div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[8px]">
            <thead>
              <tr className="text-left text-[8px] text-ink-500 border-t border-surface-border">
                <th className="font-medium px-5 py-2.5">Company</th>
                <th className="font-medium px-2 py-2.5">Upload Type</th>
                <th className="font-medium px-2 py-2.5">Period</th>
                <th className="font-medium px-2 py-2.5">Date</th>
                <th className="font-medium px-2 py-2.5">Uploaded By</th>
                <th className="font-medium px-2 py-2.5">Status</th>
                <th className="font-medium px-5 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr
                  key={d.public_id}
                  onClick={() => setOpenPublicId(d.public_id)}
                  className="border-t border-surface-border cursor-pointer hover:bg-surface-muted/40"
                >
                  <td className="px-5 py-3 text-ink-900 font-medium">{companyNameById.get(d.company_id) || `Company #${d.company_id}`}</td>
                  <td className="px-2 py-3 text-ink-700">Upload Type #{d.upload_type_id}</td>
                  <td className="px-2 py-3 text-ink-500">{d.reporting_period_start} – {d.reporting_period_end}</td>
                  <td className="px-2 py-3 text-ink-500">{new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td className="px-2 py-3 text-ink-700">{userNameById.get(d.created_by) || `User #${d.created_by}`}</td>
                  <td className="px-2 py-3"><StatusPill status={d.status} /></td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-3 text-ink-300">
                      <button onClick={(e) => { e.stopPropagation(); setOpenPublicId(d.public_id) }} className="hover:text-ink-700"><Eye size={13} /></button>
                      <button onClick={(e) => { e.stopPropagation(); setOpenPublicId(d.public_id) }} className="hover:text-ink-700"><MessageCircle size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </Card>
    </div>
  )
}
