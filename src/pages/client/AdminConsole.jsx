import { useState } from 'react'
import {
  Plus, ChevronDown, ChevronLeft, ChevronRight, X, Wifi, WifiOff, AlertCircle, Settings2,
  Sigma, ShieldCheck, Table2, Database, Eye, SquarePen, ArrowLeftRight, Search,
} from 'lucide-react'
import PageHeader from '../../components/PageHeader.jsx'
import { Card, Button, Field, Input, Select, StatusPill, Avatar, ProgressBar } from '../../components/ui.jsx'
import {
  clientEmployeeDirectory, clientRoleOptions, esgTargets, approvalHistory,
  connectedSystems, emissionFactors, factorFilters, kpiRoleAssignments, kpiTeamMembers,
  auditLogs, logFilters,
} from '../../data/mockData'

const TABS = ['User Directory', 'Role Assignment', 'Targets', 'Approval History', 'Logs', 'Directory / API', 'Factors']

export default function AdminConsole() {
  const [tab, setTab] = useState('User Directory')

  return (
    <div>
      <PageHeader title="Admin Console" subtitle="Manage users, roles and organizational settings" />

      <div className="flex items-center gap-6 border-b border-surface-border mb-5 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 text-sm -mb-px border-b-2 whitespace-nowrap transition-colors ${
              tab === t ? 'border-brand-green text-brand-green font-medium' : 'border-transparent text-ink-500 hover:text-ink-900'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'User Directory' && <UserDirectoryTab />}
      {tab === 'Role Assignment' && <RoleAssignmentTab />}
      {tab === 'Targets' && <TargetsTab />}
      {tab === 'Approval History' && <ApprovalHistoryTab />}
      {tab === 'Logs' && <LogsTab />}
      {tab === 'Directory / API' && <DirectoryApiTab />}
      {tab === 'Factors' && <FactorsTab />}
    </div>
  )
}

const PAGE_SIZE = 8

function Pagination({ page, setPage, totalPages }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-end gap-2 mt-4">
      <button
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        disabled={page === 1}
        className="w-7 h-7 rounded-md border border-brand-green text-brand-green flex items-center justify-center disabled:opacity-40"
      >
        <ChevronLeft size={14} />
      </button>
      <span className="w-7 h-7 rounded-md border border-surface-border flex items-center justify-center text-[10px] text-ink-700">{page}</span>
      <button
        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        disabled={page === totalPages}
        className="w-7 h-7 rounded-md border border-brand-green text-brand-green flex items-center justify-center disabled:opacity-40"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  )
}

function UserDirectoryTab() {
  const [employees, setEmployees] = useState(clientEmployeeDirectory)
  const [page, setPage] = useState(1)
  const [showAdd, setShowAdd] = useState(false)
  const totalPages = Math.ceil(employees.length / PAGE_SIZE)
  const visible = employees.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function toggleStatus(id) {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, status: e.status === 'Active' ? 'Inactive' : 'Active' } : e)))
  }

  function removeEmployee(id) {
    setEmployees((prev) => prev.filter((e) => e.id !== id))
  }

  function handleAdd(newEmp) {
    setEmployees((prev) => [newEmp, ...prev])
    setPage(1)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button className="flex items-center gap-2 px-3 py-2.5 rounded-md border border-surface-border text-[10px] text-ink-700 w-56 justify-between">
          Select Users <ChevronDown size={14} />
        </button>
        <div className="flex items-center gap-3">
          <Button variant="ghost">Bulk Import</Button>
          <Button onClick={() => setShowAdd(true)}>Add User <Plus size={15} /></Button>
        </div>
      </div>

      <Card padded={false}>
        <table className="w-full text-[10px]">
          <thead>
            <tr className="text-left text-xs text-ink-500 bg-surface-muted/50">
              <th className="font-medium px-5 py-3">Employee</th>
              <th className="font-medium px-2 py-3">Email Id</th>
              <th className="font-medium px-2 py-3">Department</th>
              <th className="font-medium px-2 py-3">Role</th>
              <th className="font-medium px-2 py-3">Status</th>
              <th className="font-medium px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((e) => (
              <tr key={e.id} className="border-t border-surface-border">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={e.name} size="w-7 h-7" />
                    <span className="text-ink-900 font-medium">{e.name}</span>
                  </div>
                </td>
                <td className="px-2 py-3 text-ink-500">{e.email}</td>
                <td className="px-2 py-3 text-ink-700">{e.department}</td>
                <td className="px-2 py-3 text-brand-greenDark font-medium">{e.role}</td>
                <td className="px-2 py-3">
                  <button onClick={() => toggleStatus(e.id)}>
                    <StatusPill status={e.status} />
                  </button>
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-3 text-ink-300">
                    <button className="hover:text-ink-700"><Settings2 size={14} /></button>
                    <button onClick={() => removeEmployee(e.id)} className="hover:text-status-pending">
                      <X size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Pagination page={page} setPage={setPage} totalPages={totalPages} />

      {showAdd && <AddEmployeeModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
    </div>
  )
}

function AddEmployeeModal({ onClose, onAdd }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState('')
  const [role, setRole] = useState(clientRoleOptions[0])
  const [error, setError] = useState(false)

  function submit() {
    if (!name.trim() || !email.trim() || !department.trim()) {
      setError(true)
      return
    }
    onAdd({ id: `ce-${Date.now()}`, name: name.trim(), email: email.trim(), department: department.trim(), role, status: 'Active' })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-ink-900/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-surface-border">
          <h3 className="font-semibold text-ink-900">Add User</h3>
          <button onClick={onClose} className="text-ink-300 hover:text-ink-700"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <Field label="Name" required><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" /></Field>
          <Field label="Email" required><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@company.com" /></Field>
          <Field label="Department" required><Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Sustainability" /></Field>
          <Field label="Role">
            <Select value={role} onChange={(e) => setRole(e.target.value)}>
              {clientRoleOptions.map((r) => <option key={r}>{r}</option>)}
            </Select>
          </Field>
          {error && <p className="text-[10px] text-status-pending">Please fill in all required fields.</p>}
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-surface-border">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>Add User</Button>
        </div>
      </div>
    </div>
  )
}

function RoleAssignmentTab() {
  const [rows] = useState(kpiRoleAssignments)
  const [savedId, setSavedId] = useState(null)

  function handleSave(id) {
    setSavedId(id)
    setTimeout(() => setSavedId(null), 1200)
  }

  return (
    <Card padded={false}>
      <table className="w-full text-[10px]">
        <thead>
          <tr className="text-left text-xs text-ink-500 bg-surface-muted/50">
            <th className="font-medium px-5 py-3">KPI Domain</th>
            <th className="font-medium px-2 py-3">Type of Data</th>
            <th className="font-medium px-2 py-3">Uploader(s)</th>
            <th className="font-medium px-2 py-3">Reviewer(s)</th>
            <th className="font-medium px-5 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-surface-border">
              <td className="px-5 py-3 text-ink-900 font-semibold">{r.domain}</td>
              <td className="px-2 py-3 text-ink-700">{r.dataType}</td>
              <td className="px-2 py-3">
                <ChipSelect people={r.uploaders} />
              </td>
              <td className="px-2 py-3">
                <ChipSelect people={r.reviewers} />
              </td>
              <td className="px-5 py-3 text-right">
                <Button size="sm" variant={savedId === r.id ? 'subtle' : 'primary'} onClick={() => handleSave(r.id)}>
                  {savedId === r.id ? 'Saved ✓' : 'Save'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

function ChipSelect({ people }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex flex-wrap items-center gap-1 px-2.5 py-2 rounded-md border border-surface-border bg-white min-w-[180px] text-left"
      >
        {people.map((p) => (
          <span key={p} className="text-blue-600 font-medium">{p}{people.indexOf(p) < people.length - 1 ? ',' : ''}</span>
        ))}
        <ChevronDown size={12} className="ml-auto text-ink-300 shrink-0" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-1 w-48 bg-white border border-surface-border rounded-md shadow-lg z-20 py-1">
            {kpiTeamMembers.map((m) => (
              <div key={m} className="flex items-center gap-2 px-3 py-2 text-[10px] text-ink-700 hover:bg-surface-muted">
                <input type="checkbox" checked={people.includes(m)} readOnly className="rounded border-surface-border" /> {m}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function TargetsTab() {
  const [targets, setTargets] = useState(esgTargets)
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState('')

  function startEdit(t) {
    setEditingId(t.id)
    setDraft(t.target)
  }

  function saveEdit(id) {
    setTargets((prev) => prev.map((t) => (t.id === id ? { ...t, target: draft } : t)))
    setEditingId(null)
  }

  return (
    <div>
      <p className="text-[10px] text-ink-500 mb-4">Annual ESG targets configured for FY2026</p>
      <div className="space-y-4">
        {targets.map((t) => (
          <div key={t.id} className="bg-surface-muted/40 border border-surface-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-ink-900">{t.name}</h4>
              <div className="flex items-center gap-3">
                <StatusPill status={t.status === 'On Track' ? 'On Track' : 'At Risk'} />
                <button onClick={() => startEdit(t)} className="text-ink-300 hover:text-ink-700">
                  <Settings2 size={14} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 mb-3 text-[10px]">
              <div>
                <div className="text-ink-300">Target</div>
                {editingId === t.id ? (
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={() => saveEdit(t.id)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit(t.id)}
                    autoFocus
                    className="px-2 py-1 rounded-md border border-brand-green text-[10px] w-32 focus:outline-none"
                  />
                ) : (
                  <div className="text-ink-900 font-medium">{t.target}</div>
                )}
              </div>
              <div>
                <div className="text-ink-300">Current</div>
                <div className="text-ink-900 font-medium">{t.current}</div>
              </div>
              <div>
                <div className="text-ink-300">Progress</div>
                <div className="text-ink-900 font-medium">{t.progress}%</div>
              </div>
            </div>
            <ProgressBar pct={t.progress} color={t.status === 'On Track' ? '#2E9E4F' : '#EA9A3E'} height="h-2" />
          </div>
        ))}
      </div>
    </div>
  )
}

function ApprovalHistoryTab() {
  return (
    <Card padded={false}>
      <table className="w-full text-[10px]">
        <thead>
          <tr className="text-left text-xs text-ink-500 bg-surface-muted/50">
            <th className="font-medium px-5 py-3">Dataset</th>
            <th className="font-medium px-2 py-3">Approved By</th>
            <th className="font-medium px-2 py-3">Date</th>
            <th className="font-medium px-2 py-3">Framework</th>
            <th className="font-medium px-2 py-3">Status</th>
            <th className="font-medium px-5 py-3">Comments</th>
          </tr>
        </thead>
        <tbody>
          {approvalHistory.map((a, i) => (
            <tr key={i} className="border-t border-surface-border">
              <td className="px-5 py-3 text-ink-900 font-medium">{a.dataset}</td>
              <td className="px-2 py-3 text-ink-700">{a.approvedBy}</td>
              <td className="px-2 py-3 text-ink-500">{a.date}</td>
              <td className="px-2 py-3">
                <span className="px-2 py-0.5 rounded-md border border-brand-green/30 text-brand-greenDark text-[10px] font-medium">{a.framework}</span>
              </td>
              <td className="px-2 py-3"><StatusPill status={a.status} /></td>
              <td className="px-5 py-3 text-ink-500">{a.comments}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

function LogsTab() {
  const [search, setSearch] = useState('')
  const [time, setTime] = useState(logFilters.time[0])
  const [event, setEvent] = useState(logFilters.events[0])

  const filtered = auditLogs.filter(
    (l) =>
      (!search.trim() || l.message.toLowerCase().includes(search.toLowerCase()) || l.user.toLowerCase().includes(search.toLowerCase())) &&
      (event === 'All Events' || l.event === event)
  )

  return (
    <div>
      <div className="grid sm:grid-cols-[1fr_200px_200px] gap-4 mb-5">
        <div>
          <label className="text-xs text-ink-700 mb-1 block opacity-0">Search</label>
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search datasets......"
              className="w-full pl-3 pr-9 py-2.5 rounded-md border border-surface-border text-[10px] placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-green/20"
            />
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300" />
          </div>
        </div>
        <div>
          <label className="text-xs text-ink-700 mb-1 block">Time</label>
          <Select value={time} onChange={(e) => setTime(e.target.value)}>
            {logFilters.time.map((t) => <option key={t}>{t}</option>)}
          </Select>
        </div>
        <div>
          <label className="text-xs text-ink-700 mb-1 block">Events</label>
          <Select value={event} onChange={(e) => setEvent(e.target.value)}>
            {logFilters.events.map((e) => <option key={e}>{e}</option>)}
          </Select>
        </div>
      </div>

      <Card title="Audit Trail" action={<span className="text-xs text-ink-400">Read-only</span>} padded={false}>
        <table className="w-full text-[10px]">
          <thead>
            <tr className="text-left text-xs text-ink-500 bg-surface-muted/50">
              <th className="font-medium px-5 py-3">Event</th>
              <th className="font-medium px-2 py-3">User</th>
              <th className="font-medium px-2 py-3">Message</th>
              <th className="font-medium px-2 py-3">Record ID</th>
              <th className="font-medium px-2 py-3">Timestamp</th>
              <th className="font-medium px-2 py-3">IP Address</th>
              <th className="font-medium px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l, i) => (
              <tr key={i} className="border-t border-surface-border">
                <td className="px-5 py-3 text-ink-900 font-medium">{l.event}</td>
                <td className="px-2 py-3 text-ink-700">{l.user}</td>
                <td className="px-2 py-3 text-ink-500">{l.message}</td>
                <td className="px-2 py-3 text-ink-400">{l.recordId}</td>
                <td className="px-2 py-3 text-ink-500">{l.timestamp}</td>
                <td className="px-2 py-3 text-ink-500">{l.ip}</td>
                <td className="px-5 py-3 text-right">
                  <button className="text-ink-300 hover:text-ink-700"><Eye size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

const statusIcon = { Connected: Wifi, Disconnected: WifiOff, Error: AlertCircle }
const statusColor = { Connected: 'text-status-approved', Disconnected: 'text-ink-300', Error: 'text-status-pending' }

function DirectoryApiTab() {
  const [systems, setSystems] = useState(connectedSystems)
  const [showNew, setShowNew] = useState(false)

  const counts = {
    total: systems.length,
    connected: systems.filter((s) => s.status === 'Connected').length,
    disconnected: systems.filter((s) => s.status === 'Disconnected').length,
    error: systems.filter((s) => s.status === 'Error').length,
  }

  function handleConnect(newSys) {
    setSystems((prev) => [{ ...newSys, status: 'Connected', lastSync: 'Just now' }, ...prev])
  }

  return (
    <div>
      <p className="text-[10px] text-ink-500 mb-4">Connect external business systems and map data fields to ESG KPIs</p>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-ink-100 text-ink-700">{counts.total} Total</span>
          <span className="px-2.5 py-1 rounded-full bg-status-approved/10 text-status-approved">{counts.connected} Connected</span>
          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">{counts.disconnected} Disconnected</span>
          <span className="px-2.5 py-1 rounded-full bg-status-pending/10 text-status-pending">{counts.error} Error</span>
        </div>
        <Button onClick={() => setShowNew(true)}><Plus size={15} /> New Connection</Button>
      </div>

      <Card padded={false}>
        <table className="w-full text-[10px]">
          <thead>
            <tr className="text-left text-xs text-ink-500 bg-surface-muted/50">
              <th className="font-medium px-5 py-3">ESG Domain</th>
              <th className="font-medium px-2 py-3">Connected System</th>
              <th className="font-medium px-2 py-3">Connection Status</th>
              <th className="font-medium px-2 py-3">Last Sync</th>
              <th className="font-medium px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {systems.map((s, i) => {
              const Icon = statusIcon[s.status]
              return (
                <tr key={i} className="border-t border-surface-border">
                  <td className="px-5 py-3 text-ink-900 font-medium">{s.domain}</td>
                  <td className="px-2 py-3 text-ink-700">{s.system}</td>
                  <td className="px-2 py-3">
                    <span className={`inline-flex items-center gap-1.5 font-medium ${statusColor[s.status]}`}>
                      <Icon size={12} /> {s.status}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-ink-500">{s.lastSync}</td>
                  <td className="px-5 py-3 text-right">
                    <button className="inline-flex items-center gap-1.5 text-brand-green font-medium hover:underline">
                      <ArrowLeftRight size={12} /> Manage
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>

      {showNew && <NewConnectionModal onClose={() => setShowNew(false)} onConnect={handleConnect} />}
    </div>
  )
}

const CONNECTION_STEPS = ['Configure API', 'Preview Data', 'Field Mapping']

function NewConnectionModal({ onClose, onConnect }) {
  const [step, setStep] = useState(0)
  const [domain, setDomain] = useState('')
  const [sourceName, setSourceName] = useState('')
  const [sourceType, setSourceType] = useState('REST API')
  const [baseUrl, setBaseUrl] = useState('')
  const [endpoint, setEndpoint] = useState('')
  const [httpMethod, setHttpMethod] = useState('GET')
  const [authType, setAuthType] = useState('API Key')
  const [apiKey, setApiKey] = useState('')
  const [keyName, setKeyName] = useState('')
  const [tested, setTested] = useState(false)

  function handleFinish() {
    onConnect({ domain: domain || 'New Domain', system: sourceName || 'New System' })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-ink-900/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-surface-border">
          <h3 className="font-semibold text-ink-900">Configure API Connection</h3>
          <p className="text-xs text-ink-500 mt-0.5">New Connection · ABC Holding</p>

          <div className="flex items-center gap-3 mt-5">
            {CONNECTION_STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${
                      i === step ? 'bg-brand-green text-white' : i < step ? 'bg-brand-green/20 text-brand-greenDark' : 'bg-ink-100 text-ink-400'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className={`text-[10px] whitespace-nowrap ${i === step ? 'text-ink-900 font-medium' : 'text-ink-400'}`}>{s}</span>
                </div>
                {i < CONNECTION_STEPS.length - 1 && <span className="flex-1 h-px bg-surface-border" />}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-4">
          {step === 0 && (
            <>
              <Field label="Select ESG Domain">
                <Select value={domain} onChange={(e) => setDomain(e.target.value)}>
                  <option value="">Select ESG Domain</option>
                  <option>HR</option><option>Energy</option><option>Water</option><option>Waste</option><option>Supply Chain</option><option>Finance</option>
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Source Name" required><Input value={sourceName} onChange={(e) => setSourceName(e.target.value)} placeholder="e.g. Workday HCM" /></Field>
                <Field label="Source Type" required><Input value={sourceType} onChange={(e) => setSourceType(e.target.value)} placeholder="REST API" /></Field>
              </div>
              <Field label="Base URL" required><Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://api.example.com" /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Endpoint" required><Input value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="/v1/employees" /></Field>
                <Field label="HTTP Method">
                  <Select value={httpMethod} onChange={(e) => setHttpMethod(e.target.value)}>
                    <option>GET</option><option>POST</option>
                  </Select>
                </Field>
              </div>
              <Field label="Authentication Type" required>
                <Select value={authType} onChange={(e) => setAuthType(e.target.value)}>
                  <option>API Key</option><option>OAuth 2.0</option><option>Basic Auth</option>
                </Select>
              </Field>
              {authType === 'API Key' && (
                <div className="grid grid-cols-2 gap-4 bg-surface-muted/60 p-4 rounded-md">
                  <Field label="API Key" required><Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="••••••••••••••••" /></Field>
                  <Field label="Key Name" required><Input value={keyName} onChange={(e) => setKeyName(e.target.value)} placeholder="e.g. X-API-Key" /></Field>
                </div>
              )}
            </>
          )}

          {step === 1 && (
            <div className="text-center py-10">
              <p className="text-sm font-semibold text-ink-900">Preview Data</p>
              <p className="text-xs text-ink-500 mt-1">
                {tested ? 'Connection successful — sample records will appear here.' : 'Test the connection on the previous step to preview data.'}
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="text-center py-10">
              <p className="text-sm font-semibold text-ink-900">Field Mapping</p>
              <p className="text-xs text-ink-500 mt-1">Map source fields to ESG KPI fields before finishing setup.</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-surface-border">
          {step === 0 ? (
            <Button variant="ghost" onClick={() => setTested(true)}>Test Connection</Button>
          ) : (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>Back</Button>
          )}
          {step < CONNECTION_STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)}>Next</Button>
          ) : (
            <Button onClick={handleFinish}>Finish</Button>
          )}
        </div>
      </div>
    </div>
  )
}

const categoryColor = { Water: 'bg-blue-50 text-blue-600', Waste: 'bg-amber-50 text-amber-700', Energy: 'bg-green-50 text-green-700', 'Emission Factor': 'bg-purple-50 text-purple-600' }
const sourceColor = { 'Local Authority': 'bg-blue-50 text-blue-600', EPA: 'bg-purple-50 text-purple-600', DEFRA: 'bg-green-50 text-green-700', CEA: 'bg-amber-50 text-amber-700' }

function FactorsTab() {
  const [factors, setFactors] = useState(emissionFactors)
  const [showAdd, setShowAdd] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(factorFilters.categories[0])
  const [source, setSource] = useState(factorFilters.sources[0])
  const [year, setYear] = useState(factorFilters.years[0])
  const [priorityFilter, setPriorityFilter] = useState('All')

  function handleCreate(factor) {
    setFactors((prev) => [{ ...factor, id: `ef-${Date.now()}` }, ...prev])
  }

  const stats = {
    total: factors.length,
    active: factors.filter((f) => f.priority === 'Active').length,
    categories: new Set(factors.map((f) => f.category)).size,
    sources: new Set(factors.map((f) => f.source)).size,
  }

  const filtered = factors.filter((f) => {
    const matchesSearch = !search.trim() || f.name.toLowerCase().includes(search.toLowerCase()) || f.unit.toLowerCase().includes(search.toLowerCase()) || f.source.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === 'All Categories' || f.category === category
    const matchesSource = source === 'All Sources' || f.source === source
    const matchesYear = year === 'All Years' || String(f.effYear) === year
    const matchesPriority = priorityFilter === 'All' || f.priority === priorityFilter
    return matchesSearch && matchesCategory && matchesSource && matchesYear && matchesPriority
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] text-ink-500 max-w-xl">Manage emission factors, conversion factors and calculation references used across ESG reporting.</p>
        <Button onClick={() => setShowAdd(true)}>Add New Factor</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="w-8 h-8 rounded-md bg-green-100 flex items-center justify-center text-green-600"><Sigma size={15} /></div>
          <div className="flex items-end justify-between mt-3">
            <span className="text-xs font-medium text-green-700 leading-tight">Total<br />Factors</span>
            <span className="text-sm font-bold text-green-700">{stats.total}</span>
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="w-8 h-8 rounded-md bg-purple-100 flex items-center justify-center text-purple-600"><ShieldCheck size={15} /></div>
          <div className="flex items-end justify-between mt-3">
            <span className="text-xs font-medium text-purple-700 leading-tight">Active<br />Factors</span>
            <span className="text-sm font-bold text-purple-700">{stats.active}</span>
          </div>
        </div>
        <div className="bg-amber-50 rounded-lg p-4">
          <div className="w-8 h-8 rounded-md bg-amber-100 flex items-center justify-center text-amber-600"><Table2 size={15} /></div>
          <div className="flex items-end justify-between mt-3">
            <span className="text-xs font-medium text-amber-700 leading-tight">Categories</span>
            <span className="text-sm font-bold text-amber-700">{stats.categories}</span>
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center text-blue-600"><Database size={15} /></div>
          <div className="flex items-end justify-between mt-3">
            <span className="text-xs font-medium text-blue-700 leading-tight">Data<br />Sources</span>
            <span className="text-sm font-bold text-blue-700">{stats.sources}</span>
          </div>
        </div>
      </div>

      <Card>
        <div className="grid sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 items-end">
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search factor name, unit or source..."
              className="w-full pl-3 pr-9 py-2.5 rounded-md border border-surface-border text-[10px] placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-green/20"
            />
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300" />
          </div>
          <div>
            <label className="text-xs text-ink-700 mb-1 block">Category</label>
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {factorFilters.categories.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </div>
          <div>
            <label className="text-xs text-ink-700 mb-1 block">Source</label>
            <Select value={source} onChange={(e) => setSource(e.target.value)}>
              {factorFilters.sources.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </div>
          <div>
            <label className="text-xs text-ink-700 mb-1 block">Year</label>
            <Select value={year} onChange={(e) => setYear(e.target.value)}>
              {factorFilters.years.map((y) => <option key={y}>{y}</option>)}
            </Select>
          </div>
          <div className="flex items-center gap-1 bg-surface-muted rounded-md p-1">
            {['All', 'Active', 'Inactive'].map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-3 py-1.5 rounded text-[10px] font-medium ${priorityFilter === p ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card padded={false} className="mt-4">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="text-left text-xs text-ink-500 bg-surface-muted/50">
              <th className="font-medium px-5 py-3">Factor Name</th>
              <th className="font-medium px-2 py-3">Category</th>
              <th className="font-medium px-2 py-3">Value</th>
              <th className="font-medium px-2 py-3">Unit</th>
              <th className="font-medium px-2 py-3">Source</th>
              <th className="font-medium px-2 py-3">Region</th>
              <th className="font-medium px-2 py-3">EFF. Year</th>
              <th className="font-medium px-2 py-3">Priority</th>
              <th className="font-medium px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => (
              <tr key={f.id} className="border-t border-surface-border hover:bg-surface-muted/40">
                <td className="px-5 py-3 text-ink-900 font-medium">{f.name}</td>
                <td className="px-2 py-3">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${categoryColor[f.category] || 'bg-ink-100 text-ink-700'}`}>{f.category}</span>
                </td>
                <td className="px-2 py-3 text-ink-900">{f.value}</td>
                <td className="px-2 py-3 text-ink-500">{f.unit}</td>
                <td className="px-2 py-3">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${sourceColor[f.source] || 'bg-ink-100 text-ink-700'}`}>{f.source}</span>
                </td>
                <td className="px-2 py-3 text-ink-700">{f.region}</td>
                <td className="px-2 py-3 text-ink-700">{f.effYear}</td>
                <td className="px-2 py-3"><StatusPill status={f.priority} /></td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-3 text-ink-300">
                    <button onClick={() => setViewing(f)} className="hover:text-ink-700"><Eye size={13} /></button>
                    <button onClick={() => setViewing(f)} className="hover:text-ink-700"><SquarePen size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {showAdd && <FactorModal onClose={() => setShowAdd(false)} onSave={handleCreate} />}
      {viewing && <FactorDetailModal factor={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}

const CATEGORIES = ['Emission Factor', 'Water', 'Energy', 'Fuel', 'Waste']

function FactorModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', category: 'Emission Factor', value: '', unit: '', source: '', region: 'Global', effYear: new Date().getFullYear(), effectiveDate: '', expiryDate: '', description: '', priority: 'Active' })
  const [error, setError] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function submit() {
    if (!form.name.trim() || !form.value || !form.unit.trim() || !form.source.trim() || !form.effectiveDate) {
      setError(true)
      return
    }
    onSave(form)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-ink-900/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-surface-border">
          <h3 className="font-semibold text-ink-900">Add Factor</h3>
          <p className="text-xs text-ink-500 mt-0.5">Create a new calculation factor</p>
        </div>
        <div className="p-6 space-y-5">
          <p className="text-xs font-semibold text-brand-greenDark">Factor Details</p>
          <Field label="Factor Name" required><Input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Electricity grid Emissions" /></Field>
          <Field label="Category" required>
            <Select value={form.category} onChange={(e) => update('category', e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Factor value" required><Input value={form.value} onChange={(e) => update('value', e.target.value)} placeholder="0" /></Field>
            <Field label="Unit" required><Input value={form.unit} onChange={(e) => update('unit', e.target.value)} placeholder="eg. kgCO2e/kg" /></Field>
          </div>

          <p className="text-xs font-semibold text-brand-greenDark pt-2">Source & Region</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Source" required><Input value={form.source} onChange={(e) => update('source', e.target.value)} placeholder="eg. IPCC, DEFRA, EPA" /></Field>
            <Field label="Region" required>
              <Select value={form.region} onChange={(e) => update('region', e.target.value)}>
                <option>Global</option><option>India</option><option>EU</option><option>US</option>
              </Select>
            </Field>
          </div>

          <p className="text-xs font-semibold text-brand-greenDark pt-2">Effective Period</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Effective Date" required><Input type="date" value={form.effectiveDate} onChange={(e) => update('effectiveDate', e.target.value)} /></Field>
            <Field label="Expiry Date"><Input type="date" value={form.expiryDate} onChange={(e) => update('expiryDate', e.target.value)} /></Field>
          </div>

          <Field label="Description">
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Provide context on the factor's origin, applicability or methodology......"
              className="w-full px-3 py-2.5 rounded-md border border-surface-border text-[10px] placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-green/20"
            />
          </Field>
          {error && <p className="text-[10px] text-status-pending">Please fill in all required fields.</p>}
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-surface-border">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>Create Factor</Button>
        </div>
      </div>
    </div>
  )
}

function FactorDetailModal({ factor, onClose }) {
  return (
    <div className="fixed inset-0 bg-ink-900/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-surface-border">
          <h3 className="font-semibold text-ink-900">Factor Details</h3>
          <p className="text-xs text-ink-500 mt-0.5">{factor.name}</p>
          <div className="flex items-center justify-between mt-4">
            <div>
              <p className="text-xs text-ink-300">Factor Value</p>
              <p className="text-sm font-semibold text-ink-900">{factor.value} <span className="text-xs font-normal text-ink-500">{factor.unit}</span></p>
            </div>
            <div className="flex gap-2">
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-medium ${categoryColor[factor.category] || 'bg-blue-50 text-blue-600'}`}>{factor.category}</span>
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-medium ${sourceColor[factor.source] || 'bg-blue-50 text-blue-600'}`}>{factor.source}</span>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4 text-[10px]">
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-ink-300">Source</p><p className="text-ink-900">{factor.source}</p></div>
            <div><p className="text-ink-300">Region</p><p className="text-ink-900">{factor.region}</p></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-ink-300">Effective Date</p><p className="text-ink-900">{factor.effectiveDate}</p></div>
            <div><p className="text-ink-300">Expiry Date</p><p className="text-ink-900">{factor.expiryDate || '-'}</p></div>
          </div>
          <div>
            <p className="text-ink-300">Description</p>
            <p className="text-ink-700">{factor.description}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-surface-border">
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button variant="outline">Edit Factor</Button>
        </div>
      </div>
    </div>
  )
}
