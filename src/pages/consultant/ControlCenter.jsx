import { useState, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search, ChevronDown, Plus, Check, Eye } from 'lucide-react'
import PageHeader from '../../components/PageHeader.jsx'
import { Button, Avatar, EmptyState, Select } from '../../components/ui.jsx'
import LoadingState from '../../components/LoadingState.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import AddUserModal from './AddUserModal.jsx'
import AssignRbacRoleModal from './AssignRbacRoleModal.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useCompanies } from '../../hooks/useCompanies.js'
import { useAssignRole } from '../../hooks/useAssignments.js'
import { userDirectory, companies as companiesSeed, roleOptions, auditLogs, logFilters } from '../../data/mockData'

const roleColors = {
  Administrator: 'text-blue-600',
  Consultant: 'text-purple-600',
  Reviewer: 'text-status-approved',
  Support: 'text-status-review',
}

const TABS = ['User Directory', 'Role Assignment', 'Client Pool', 'Logs']

export default function ControlCenter() {
  const location = useLocation()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const [tab, setTab] = useState(location.state?.tab || 'User Directory')
  const [showAddUser, setShowAddUser] = useState(false)

  // User Directory state
  const [users, setUsers] = useState(userDirectory)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All roles')
  const [roleFilterOpen, setRoleFilterOpen] = useState(false)

  // Role Assignment state
  const [companies, setCompanies] = useState(companiesSeed)
  const [selectedCompanyId, setSelectedCompanyId] = useState(companiesSeed[0].id)
  const [companyPickerOpen, setCompanyPickerOpen] = useState(false)
  const [showAssignUser, setShowAssignUser] = useState(false)
  const [editingMemberId, setEditingMemberId] = useState(null)

  // RBAC role assignment state — genuinely separate from ConsultantAssignment staffing above
  const [showAssignRbacRole, setShowAssignRbacRole] = useState(false)
  const [assignRoleError, setAssignRoleError] = useState(null)
  const assignRoleMutation = useAssignRole()

  // Client Pool state — backed by real GET /companies.
  // Backend has no `plan` query parameter and `search` only covers
  // name/country (verified in app/api/routes/companies.py), so at the
  // stated small scale we fetch one full page and refine client-side over
  // that already tenant-scoped result — not tenant filtering, just UI-level
  // search/plan refinement of data the backend already authorized.
  const [poolSearch, setPoolSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('All plans')
  const [planFilterOpen, setPlanFilterOpen] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState(null)

  const companiesQuery = useCompanies({ page: 1, page_size: 100, sort: 'name', order: 'asc' })
  const clientPool = useMemo(() => companiesQuery.data?.items || [], [companiesQuery.data])

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        !search.trim() ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.department.toLowerCase().includes(search.toLowerCase())
      const matchesRole = roleFilter === 'All roles' || u.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [users, search, roleFilter])

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId) || companies[0]

  const filteredClients = useMemo(() => {
    return clientPool.filter((c) => {
      const matchesSearch =
        !poolSearch.trim() ||
        c.name.toLowerCase().includes(poolSearch.toLowerCase()) ||
        (c.industry || '').toLowerCase().includes(poolSearch.toLowerCase())
      const matchesPlan = planFilter === 'All plans' || c.plan === planFilter
      return matchesSearch && matchesPlan
    })
  }, [poolSearch, planFilter, clientPool])

  const selectedClient =
    clientPool.find((c) => c.id === selectedClientId) || filteredClients[0] || null

  function handleAddUser(user) {
    setUsers((prev) => [user, ...prev])
  }

  function handleAssignUser(user) {
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === selectedCompanyId
          ? { ...c, team: [{ id: user.id, name: user.name, email: user.email, role: user.role }, ...c.team] }
          : c
      )
    )
  }

  function updateMemberRole(memberId, newRole) {
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === selectedCompanyId
          ? { ...c, team: c.team.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)) }
          : c
      )
    )
    setEditingMemberId(null)
  }

  async function handleAssignRbacRole(userId, newRoleCode) {
    setAssignRoleError(null)
    try {
      // Assign the new RBAC role
      await assignRoleMutation.mutateAsync({ 
        user_id: userId, 
        role_code: newRoleCode, 
        company_id: null 
      })
      setShowAssignRbacRole(false)
    } catch (err) {
      if (err.status === 422 && err.code === 'duplicate_role') {
        setAssignRoleError('This user already has this role.')
      } else if (err.status === 422 && err.code === 'invalid_role') {
        setAssignRoleError('Unrecognized role.')
      } else if (err.status === 404) {
        setAssignRoleError('User or role not found.')
      } else if (err.status === 403) {
        setAssignRoleError('You do not have permission to assign RBAC roles.')
      } else if (err.isNetworkError) {
        setAssignRoleError('Could not reach the server. Check your connection and try again.')
      } else {
        setAssignRoleError(err.message || 'Something went wrong while assigning this role.')
      }
    }
  }

  return (
    <div>
      <PageHeader title="Control Center" subtitle="Manage users, roles and client organizations in one place." />

      <div className="flex items-center gap-6 border-b border-surface-border mb-5">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 text-[10px] -mb-px border-b-2 transition-colors ${
              tab === t ? 'border-brand-green text-brand-green font-medium' : 'border-transparent text-ink-500 hover:text-ink-900'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'User Directory' && (
        <UserDirectoryTab
          users={filteredUsers}
          search={search}
          setSearch={setSearch}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          roleFilterOpen={roleFilterOpen}
          setRoleFilterOpen={setRoleFilterOpen}
          onAddUser={() => setShowAddUser(true)}
        />
      )}

      {tab === 'Role Assignment' && (
        <RoleAssignmentTab
          companies={companies}
          selectedCompany={selectedCompany}
          companyPickerOpen={companyPickerOpen}
          setCompanyPickerOpen={setCompanyPickerOpen}
          onSelectCompany={(id) => {
            setSelectedCompanyId(id)
            setCompanyPickerOpen(false)
            setEditingMemberId(null)
          }}
          editingMemberId={editingMemberId}
          setEditingMemberId={setEditingMemberId}
          updateMemberRole={updateMemberRole}
          onAssignNew={() => setShowAssignUser(true)}
          onAssignRbacRole={() => setShowAssignRbacRole(true)}
        />
      )}

      {tab === 'Client Pool' && (
        <ClientPoolTab
          clients={filteredClients}
          selectedClient={selectedClient}
          selectedClientId={selectedClientId}
          setSelectedClientId={setSelectedClientId}
          poolSearch={poolSearch}
          setPoolSearch={setPoolSearch}
          planFilter={planFilter}
          setPlanFilter={setPlanFilter}
          planFilterOpen={planFilterOpen}
          setPlanFilterOpen={setPlanFilterOpen}
          onAddClient={() => navigate('/consultant/control-center/new-client')}
          isLoading={companiesQuery.isLoading}
          isError={companiesQuery.isError}
          error={companiesQuery.error}
          onRetry={() => companiesQuery.refetch()}
          canManageCompanies={hasPermission('company:manage')}
        />
      )}

      {tab === 'Logs' && <LogsTab />}

      {showAddUser && <AddUserModal onClose={() => setShowAddUser(false)} onAdd={handleAddUser} />}
      {showAssignUser && (
        <AddUserModal
          onClose={() => setShowAssignUser(false)}
          onAdd={handleAssignUser}
          title="Assign New Deloitte User"
          subtitle={`Add a Deloitte team member to ${selectedCompany.name}`}
        />
      )}
      {showAssignRbacRole && (
        <AssignRbacRoleModal
          onClose={() => { setShowAssignRbacRole(false); setAssignRoleError(null); }}
          onAssign={handleAssignRbacRole}
          error={assignRoleError}
        />
      )}
    </div>
  )
}

function SearchBar({ placeholder, value, onChange, right }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="relative flex-1 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
        <input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 rounded-md border border-surface-border text-[10px] placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-green/20"
        />
      </div>
      {right}
    </div>
  )
}

function Dropdown({ options, value, open, setOpen, onSelect }) {
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2.5 rounded-md border border-surface-border text-[10px] text-ink-700 min-w-[120px] justify-between"
      >
        {value} <ChevronDown size={14} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-44 bg-white border border-surface-border rounded-md shadow-lg z-20 py-1">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => onSelect(opt)}
                className="w-full text-left px-3 py-2 text-[10px] text-ink-700 hover:bg-surface-muted flex items-center justify-between"
              >
                {opt}
                {value === opt && <Check size={14} className="text-brand-green" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function UserDirectoryTab({ users, search, setSearch, roleFilter, setRoleFilter, roleFilterOpen, setRoleFilterOpen, onAddUser }) {
  return (
    <div>
      <SearchBar
        placeholder="Search by name, email, department........"
        value={search}
        onChange={setSearch}
        right={
          <div className="flex items-center gap-3">
            <Dropdown
              label="Role"
              options={['All roles', ...roleOptions.map((r) => (r === 'Admin' ? 'Administrator' : r))]}
              value={roleFilter}
              open={roleFilterOpen}
              setOpen={setRoleFilterOpen}
              onSelect={(v) => {
                setRoleFilter(v)
                setRoleFilterOpen(false)
              }}
            />
            <Button onClick={onAddUser}>Add User <Plus size={15} /></Button>
          </div>
        }
      />
      <div className="bg-white border border-surface-border rounded-lg overflow-hidden">
        {users.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No users match your search" subtitle="Try a different name, email or role filter." />
          </div>
        ) : (
          <table className="w-full text-[10px]">
            <thead>
              <tr className="text-left text-xs text-ink-500 bg-surface-muted/50">
                <th className="font-medium px-5 py-3">Name</th>
                <th className="font-medium px-2 py-3">Email Id</th>
                <th className="font-medium px-2 py-3">Department</th>
                <th className="font-medium px-2 py-3">Role</th>
                <th className="font-medium px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-surface-border">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={u.name} size="w-7 h-7" />
                      <span className="text-ink-900 font-medium">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-ink-500">{u.email}</td>
                  <td className="px-2 py-3 text-ink-700">{u.department}</td>
                  <td className={`px-2 py-3 font-medium ${roleColors[u.role]}`}>{u.role}</td>
                  <td className="px-5 py-3 text-right text-ink-300">-</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function RoleAssignmentTab({
  companies, selectedCompany, companyPickerOpen, setCompanyPickerOpen, onSelectCompany,
  editingMemberId, setEditingMemberId, updateMemberRole, onAssignNew, onAssignRbacRole,
}) {
  return (
    <div>
      <div className="mb-6 relative inline-block">
        <button
          onClick={() => setCompanyPickerOpen(!companyPickerOpen)}
          className="flex items-center justify-between gap-2 w-72 px-3 py-2.5 rounded-md border border-surface-border text-[10px] text-ink-700"
        >
          {selectedCompany.name} <ChevronDown size={14} />
        </button>
        {companyPickerOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setCompanyPickerOpen(false)} />
            <div className="absolute left-0 mt-1 w-72 bg-white border border-surface-border rounded-md shadow-lg z-20 py-1">
              {companies.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelectCompany(c.id)}
                  className="w-full text-left px-3 py-2 text-[10px] text-ink-700 hover:bg-surface-muted flex items-center justify-between"
                >
                  {c.name}
                  {selectedCompany.id === c.id && <Check size={14} className="text-brand-green" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="border-t border-surface-border pt-5">
        <h3 className="text-lg font-semibold text-ink-900 mb-1">{selectedCompany.name}</h3>
        <p className="text-[10px] text-ink-500 mb-4">Assigned Deloitte Team</p>

        <div className="bg-white border border-surface-border rounded-lg overflow-hidden">
          {selectedCompany.team.length === 0 ? (
            <div className="p-6">
              <EmptyState title="No Deloitte team assigned yet" subtitle="Assign a consultant to start working with this client." />
            </div>
          ) : (
            <table className="w-full text-[10px]">
              <thead>
                <tr className="text-left text-xs text-ink-500 bg-surface-muted/50">
                  <th className="font-medium px-5 py-3">Name</th>
                  <th className="font-medium px-2 py-3">Email Id</th>
                  <th className="font-medium px-2 py-3">Role</th>
                  <th className="font-medium px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {selectedCompany.team.map((m) => (
                  <tr key={m.id} className="border-t border-surface-border">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={m.name} size="w-7 h-7" />
                        <span className="text-ink-900 font-medium">{m.name}</span>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-ink-500">{m.email}</td>
                    <td className="px-2 py-3">
                      {editingMemberId === m.id ? (
                        <select
                          autoFocus
                          defaultValue={m.role}
                          onChange={(e) => updateMemberRole(m.id, e.target.value)}
                          onBlur={() => setEditingMemberId(null)}
                          className="px-2 py-1 rounded-md border border-surface-border text-xs focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                        >
                          {['Administrator', 'Consultant', 'Reviewer', 'Support'].map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`font-medium ${roleColors[m.role]}`}>{m.role}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => setEditingMemberId(editingMemberId === m.id ? null : m.id)}
                        className="text-brand-green text-xs font-medium hover:underline"
                      >
                        {editingMemberId === m.id ? 'DONE' : 'EDIT'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={onAssignNew}>Assign New Deloitte User <Plus size={15} /></Button>
        </div>
      </div>

      {/* Genuinely separate concern from staffing above: RBAC permission
          roles, not company-account staffing. Kept visually distinct. */}
      <div className="border-t border-surface-border pt-5 mt-8">
        <h3 className="text-lg font-semibold text-ink-900 mb-1">RBAC Roles</h3>
        <p className="text-[10px] text-ink-500 mb-4">
          Set a Deloitte user's real permission/authorization role. This is separate from
          the account staffing above — a person can be staffed on this account without
          holding any particular RBAC role, and vice versa.
        </p>
        <Button onClick={onAssignRbacRole}>
          Assign / Change RBAC Role
        </Button>
      </div>
    </div>
  )
}

function ClientPoolTab({
  clients, selectedClient, selectedClientId, setSelectedClientId,
  poolSearch, setPoolSearch, planFilter, setPlanFilter, planFilterOpen, setPlanFilterOpen, onAddClient,
  isLoading, isError, error, onRetry, canManageCompanies,
}) {
  const detail = selectedClient

  return (
    <div>
      <SearchBar
        placeholder="Search organization, industry........"
        value={poolSearch}
        onChange={setPoolSearch}
        right={
          <div className="flex items-center gap-3">
            <Dropdown
              options={['All plans', 'Basic', 'Professional', 'Enterprise']}
              value={planFilter}
              open={planFilterOpen}
              setOpen={setPlanFilterOpen}
              onSelect={(v) => {
                setPlanFilter(v)
                setPlanFilterOpen(false)
              }}
            />
            {/* Frontend permission check is UX only — the backend enforces
                company:manage on POST /companies regardless of this. */}
            {canManageCompanies && (
              <Button onClick={onAddClient}>Add New Client <Plus size={15} /></Button>
            )}
          </div>
        }
      />

      {isLoading ? (
        <div className="bg-white border border-surface-border rounded-lg">
          <LoadingState label="Loading clients…" />
        </div>
      ) : isError ? (
        <div className="bg-white border border-surface-border rounded-lg">
          <ErrorState
            message={error?.message || 'Could not load clients. Please try again.'}
            onRetry={onRetry}
          />
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_320px] gap-4">
          <div className="bg-white border border-surface-border rounded-lg overflow-hidden overflow-x-auto">
            {clients.length === 0 ? (
              <div className="p-6">
                <EmptyState title="No clients match your search" subtitle="Try a different name, industry or plan filter." />
              </div>
            ) : (
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="text-left text-xs text-ink-500 bg-surface-muted/50">
                    <th className="font-medium px-5 py-3">Name</th>
                    <th className="font-medium px-2 py-3">Industry</th>
                    <th className="font-medium px-2 py-3">Plan</th>
                    <th className="font-medium px-2 py-3">Reg. Status</th>
                    <th className="font-medium px-5 py-3">Country</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedClientId(c.id)}
                      className={`border-t border-surface-border cursor-pointer ${
                        selectedClientId === c.id ? 'bg-surface-muted/60' : 'hover:bg-surface-muted/40'
                      }`}
                    >
                      <td className="px-5 py-3 text-ink-900 font-medium">{c.name}</td>
                      <td className="px-2 py-3 text-ink-700">{c.industry || '—'}</td>
                      <td className="px-2 py-3 text-ink-700">{c.plan}</td>
                      <td className="px-2 py-3 text-ink-700">{c.status}</td>
                      <td className="px-5 py-3 text-ink-500">{c.country || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {detail && (
            <div className="bg-white border border-surface-border rounded-lg p-5 h-fit">
              <h4 className="font-semibold text-ink-900">{detail.name}</h4>
              <p className="text-xs text-ink-500 mb-4">{detail.country || '—'}</p>

              <p className="text-xs text-ink-500 font-medium mb-2">Company Information</p>
              <div className="grid grid-cols-2 gap-3 text-[10px] mb-4">
                <div>
                  <div className="text-xs text-ink-300">Industry</div>
                  <div className="text-ink-900">{detail.industry || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-ink-300">Sector</div>
                  <div className="text-ink-900">{detail.sector || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-ink-300">Structure</div>
                  <div className="text-ink-900">{detail.structure || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-ink-300">Registration Date</div>
                  <div className="text-ink-900">{detail.registration_date || '—'}</div>
                </div>
              </div>

              {/* The fields below are NOT part of the Company backend model
                  (confirmed in app/models/company.py — subscription, contact
                  person, frameworks, and progress% are explicitly deferred).
                  Showing an honest "not available yet" state rather than the
                  old mock values, per the approved Phase 2 scope. */}
              <p className="text-xs text-ink-500 font-medium mb-2">Primary Contact</p>
              <p className="text-xs text-ink-300 mb-4">Not available yet — contact details are not yet part of the client record.</p>

              <p className="text-xs text-ink-500 font-medium mb-2">Subscription details</p>
              <p className="text-xs text-ink-300 mb-4">Not available yet — subscription tracking is coming in a later phase.</p>

              <p className="text-xs text-ink-500 font-medium mb-2">Assigned Consultants</p>
              <p className="text-xs text-ink-300 mb-4">Not available yet — consultant assignment details are coming in a later phase.</p>

              <p className="text-xs text-ink-500 font-medium mb-2">Reporting Frameworks</p>
              <p className="text-xs text-ink-300 mb-4">Not available yet — reporting frameworks are coming in a later phase.</p>

              <p className="text-xs text-ink-500 font-medium mb-2">Reporting Progress</p>
              <p className="text-xs text-ink-300">Not available yet — reporting progress is coming in a later phase.</p>
            </div>
          )}
        </div>
      )}
    </div>
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

      <div className="bg-white border border-surface-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="text-xs font-semibold text-ink-900">Audit Trail</h3>
          <span className="text-xs text-ink-400">Read-only</span>
        </div>
        <div className="overflow-x-auto">
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
        </div>
      </div>
    </div>
  )
}
