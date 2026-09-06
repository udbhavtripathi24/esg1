import { useState, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search, ChevronDown, Plus, Check, Eye, UserX } from 'lucide-react'
import PageHeader from '../../components/PageHeader.jsx'
import { Button, Avatar, EmptyState, Select } from '../../components/ui.jsx'
import LoadingState from '../../components/LoadingState.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import AddUserModal from './AddUserModal.jsx'
import CreateClientUserModal from './CreateClientUserModal.jsx'
import AssignConsultantModal from './AssignConsultantModal.jsx'
import AssignRbacRoleModal from './AssignRbacRoleModal.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useCompanies, useUpdateCompany } from '../../hooks/useCompanies.js'
import { useUsers, useCreateUser, useDeactivateUser, useUpdateUser } from '../../hooks/useUsers.js'
import { useConsultantAssignments, useCreateConsultantAssignment, useUpdateConsultantAssignment, useAssignRole, useRemoveRole } from '../../hooks/useAssignments.js'
import { roleOptions, auditLogs, logFilters } from '../../data/mockData'

// UI role display names map 1-to-1 to backend role_code (confirmed against
// the actual seeded RBAC roles: Administrator, Consultant, Reviewer,
// Support). Kept as an explicit mapping rather than passing the display
// string straight through, so the two concerns don't silently drift apart
// if either side ever changes independently.
const ROLE_TO_ROLE_CODE = {
  Administrator: 'Administrator',
  Consultant: 'Consultant',
  Reviewer: 'Reviewer',
  Support: 'Support',
}

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

  // User Directory state — backed by real GET /users.
  // search and role BOTH map directly to real backend query params
  // (verified in app/api/routes/users.py) — unlike Client Pool's plan
  // filter, no client-side refinement is needed here.
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All roles')
  const [roleFilterOpen, setRoleFilterOpen] = useState(false)

  const usersQuery = useUsers({
    search: search.trim() || undefined,
    role: roleFilter === 'All roles' ? undefined : roleFilter,
    page: 1,
    page_size: 100, // matches Client Pool's documented small-scale approach
  })
  const users = useMemo(() => usersQuery.data?.items || [], [usersQuery.data])
  const createUser = useCreateUser()
  const deactivateUser = useDeactivateUser()

  // Role Assignment state — company list reuses the SAME real GET /companies
  // data already fetched below for Client Pool (companiesQuery/clientPool),
  // per instruction not to duplicate that query or touch ClientPoolTab.
  const [selectedCompanyId, setSelectedCompanyId] = useState(null)
  const [companyPickerOpen, setCompanyPickerOpen] = useState(false)
  const [showAssignUser, setShowAssignUser] = useState(false)
  const [removeAssignmentTarget, setRemoveAssignmentTarget] = useState(null)
  const [assignError, setAssignError] = useState(null)
  const [removeError, setRemoveError] = useState(null)

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

  // Role Assignment: real staffing data for the selected company.
  const selectedCompanyForAssignment = clientPool.find((c) => c.id === selectedCompanyId) || clientPool[0] || null
  const assignmentsQuery = useConsultantAssignments(
    { company_id: selectedCompanyForAssignment?.id, active_only: true, page: 1, page_size: 100 },
    { enabled: !!selectedCompanyForAssignment }
  )
  const activeAssignments = useMemo(() => assignmentsQuery.data?.items || [], [assignmentsQuery.data])
  // Resolve consultant_user_id -> {name, email} using the already-fetched
  // real users list (no N+1 requests, no new backend endpoint).
  const assignmentTeam = useMemo(() => {
    const userById = new Map(users.map((u) => [u.id, u]))
    return activeAssignments.map((a) => {
      const u = userById.get(a.consultant_user_id)
      return {
        assignmentId: a.id,
        consultantUserId: a.consultant_user_id,
        name: u?.name || `User #${a.consultant_user_id}`,
        email: u?.email || '—',
        roleOnAccount: a.role_on_account,
      }
    })
  }, [activeAssignments, users])

  const createConsultantAssignment = useCreateConsultantAssignment()
  const updateConsultantAssignment = useUpdateConsultantAssignment()

  // RBAC role assignment — genuinely separate from ConsultantAssignment
  // staffing above. No backend endpoint lists a specific user's current
  // UserRole rows, so we use the existing (non-authoritative) User.role
  // display-hint field as the best-available "current role" signal, and
  // keep it in sync via the existing useUpdateUser hook after a successful
  // RBAC mutation — using only already-existing capability, no new
  // endpoints, no modification to users.js/useUsers.js.
  const [showAssignRole, setShowAssignRole] = useState(false)
  const [assignRoleError, setAssignRoleError] = useState(null)
  const assignRole = useAssignRole()
  const removeRoleMutation = useRemoveRole()
  const updateUserDisplayRole = useUpdateUser()

  const currentRoleByUserId = useMemo(() => {
    const map = {}
    for (const u of users) {
      if (u.portal_type === 'deloitte') map[u.id] = u.role
    }
    return map
  }, [users])

  async function handleAssignRbacRole(userId, newRoleCode) {
    setAssignRoleError(null)
    const priorRole = currentRoleByUserId[userId]
    // Tracks whether the DELETE step actually completed, so error messages
    // below can say precisely what happened rather than guessing — the
    // original single try/catch could misattribute which step failed
    // (e.g. reporting "previous role could not be removed" when it actually
    // WAS removed and the new assignment failed instead). Fixed per review.
    let priorRoleRemoved = false
    // Tracks WHICH step actually threw, so a genuine DELETE failure (not the
    // tolerated-404 case) gets its own accurate message (CASE C) distinct
    // from a POST failure after a successful removal (CASE D) — both used
    // to fall through the same generic status-based branches below.
    let failedStep = null // 'remove' | 'assign' | null
    try {
      // Best-effort remove of the role-on-record if it differs from the new
      // one. Tolerate 404 — the display hint may be stale/never actually
      // backed by a real UserRole (e.g. seeded directly, or already
      // out of sync from a prior PATCH /users/{id} that only touched the
      // display field). Not atomic — DELETE and POST are two separate
      // requests; if POST fails after a successful DELETE, the error below
      // says so explicitly rather than hiding it.
      if (priorRole && priorRole !== newRoleCode) {
        try {
          await removeRoleMutation.mutateAsync({ user_id: userId, role_code: priorRole, company_id: null })
          priorRoleRemoved = true
        } catch (err) {
          if (err.status !== 404) {
            failedStep = 'remove' // CASE C — genuine removal failure, not tolerated
            throw err // stop before assigning the new role
          }
          // 404 tolerated (nothing to remove) — priorRoleRemoved stays false,
          // which is accurate: no role was actually removed. This is NOT a
          // failure, so failedStep stays null and execution continues to POST.
        }
      }
      failedStep = 'assign' // if the POST below throws, CASE D applies
      await assignRole.mutateAsync({ user_id: userId, role_code: newRoleCode, company_id: null })
      // Keep the display-hint in sync using the existing, already-approved
      // User Directory update path — not a new capability.
      await updateUserDisplayRole.mutateAsync({ id: userId, body: { role: newRoleCode } })
      setShowAssignRole(false)
    } catch (err) {
      if (failedStep === 'remove') {
        // CASE C: the DELETE itself genuinely failed (not the tolerated 404).
        // Must explicitly say the previous role could not be removed, and
        // must NOT claim the new role was assigned — it never was attempted.
        if (err.isNetworkError) {
          setAssignRoleError('Could not remove the previous role — could not reach the server. The new role was NOT assigned. Please retry.')
        } else {
          setAssignRoleError(`Could not remove the previous role (${err.message || 'unknown error'}). The new role was NOT assigned. Please retry.`)
        }
        return
      }

      // failedStep === 'assign': the POST failed. If priorRoleRemoved is
      // true, this is CASE D — the user may now hold NO role — and every
      // branch below must say so explicitly, not just the generic ones.
      const removalNote = priorRoleRemoved
        ? `The previous role (${priorRole}) was already removed. This user currently has NO RBAC role. `
        : ''
      if (err.status === 422 && err.code === 'duplicate_role') {
        setAssignRoleError(removalNote + 'This user already has this role.')
      } else if (err.status === 422 && err.code === 'invalid_role') {
        setAssignRoleError(removalNote + 'Unrecognized role.')
      } else if (err.status === 404) {
        setAssignRoleError(removalNote || 'User or role not found.')
      } else if (err.status === 403) {
        setAssignRoleError(removalNote + 'You do not have permission to assign RBAC roles.')
      } else if (err.isNetworkError) {
        setAssignRoleError(removalNote + 'Could not reach the server. Check your connection and try again.')
      } else {
        setAssignRoleError(removalNote + (err.message || 'Something went wrong while assigning this role.'))
      }
    }
  }

  async function handleAssignConsultant(consultantUserId, roleOnAccount) {
    if (!selectedCompanyForAssignment) return
    setAssignError(null)
    try {
      await createConsultantAssignment.mutateAsync({
        company_id: selectedCompanyForAssignment.id,
        consultant_user_id: consultantUserId,
        role_on_account: roleOnAccount,
      })
      setShowAssignUser(false)
    } catch (err) {
      if (err.status === 422 && err.code === 'duplicate_assignment') {
        setAssignError('This consultant is already assigned to this company.')
      } else if (err.status === 422 && err.code === 'invalid_consultant') {
        setAssignError('This user cannot be assigned as a consultant.')
      } else if (err.status === 404) {
        setAssignError('Company not found or not accessible.')
      } else if (err.status === 403) {
        setAssignError('You do not have permission to assign consultants.')
      } else if (err.isNetworkError) {
        setAssignError('Could not reach the server. Check your connection and try again.')
      } else {
        setAssignError(err.message || 'Something went wrong while assigning this consultant.')
      }
    }
  }

  async function confirmRemoveAssignment() {
    if (!removeAssignmentTarget) return
    setRemoveError(null)
    try {
      await updateConsultantAssignment.mutateAsync({
        id: removeAssignmentTarget.assignmentId,
        body: { is_active: false },
      })
      setRemoveAssignmentTarget(null)
    } catch (err) {
      setRemoveError(err.message || 'Could not remove this consultant. Please try again.')
    }
  }

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

  const [createUserError, setCreateUserError] = useState(null)

  async function handleAddUser(formPayload) {
    // formPayload comes from AddUserModal: {name, email, department, role, password}
    // Map to POST /users' exact expected shape. portal_type is hardcoded to
    // 'deloitte' — confirmed as the correct literal value (matches
    // RequireAuth.jsx's docstring and Login.jsx's own portal mapping) and
    // locked as this task's scope: User Directory creates Deloitte/team
    // users only, never client-portal users.
    setCreateUserError(null)
    try {
      await createUser.mutateAsync({
        name: formPayload.name,
        email: formPayload.email,
        portal_type: 'deloitte',
        role: formPayload.role,
        department: formPayload.department,
        password: formPayload.password,
        role_code: ROLE_TO_ROLE_CODE[formPayload.role],
      })
    } catch (err) {
      if (err.status === 422 && err.field === 'email') {
        setCreateUserError('A user with this email already exists.')
      } else if (err.status === 422 && err.field === 'role_code') {
        setCreateUserError('Unrecognized role. Please pick a valid role and try again.')
      } else if (err.status === 403) {
        setCreateUserError('You do not have permission to create a new user.')
      } else if (err.isNetworkError) {
        setCreateUserError('Could not reach the server. Check your connection and try again.')
      } else {
        setCreateUserError(err.message || 'Something went wrong while creating the user.')
      }
      throw err // re-throw so the modal knows submission failed and stays open
    }
  }

  const [showCreateClientUser, setShowCreateClientUser] = useState(false)
  const [createClientUserError, setCreateClientUserError] = useState(null)

  async function handleCreateClientUser(payload) {
    // payload is already in POST /users' exact expected shape --
    // constructed directly by CreateClientUserModal itself, unlike
    // handleAddUser above which needs to translate a display-name role
    // into a role_code. Client roles ARE already role codes.
    setCreateClientUserError(null)
    try {
      await createUser.mutateAsync(payload)
    } catch (err) {
      if (err.status === 422 && err.field === 'email') {
        setCreateClientUserError('A user with this email already exists.')
      } else if (err.status === 422 && err.field === 'role_code') {
        setCreateClientUserError('Unrecognized role. Please pick a valid role and try again.')
      } else if (err.status === 403) {
        setCreateClientUserError('You do not have permission to create a user for this company.')
      } else if (err.isNetworkError) {
        setCreateClientUserError('Could not reach the server. Check your connection and try again.')
      } else {
        setCreateClientUserError(err.message || 'Something went wrong while creating the user.')
      }
      throw err
    }
  }

  const [deactivateTargetId, setDeactivateTargetId] = useState(null)
  const [deactivateError, setDeactivateError] = useState(null)

  async function confirmDeactivate() {
    setDeactivateError(null)
    try {
      await deactivateUser.mutateAsync(deactivateTargetId)
      setDeactivateTargetId(null)
    } catch (err) {
      // Includes the backend's real self-deactivation block (422
      // self_deactivate) — surfaced here, never bypassed.
      setDeactivateError(err.message || 'Could not deactivate this user. Please try again.')
    }
  }

  // NOTE: no reactivate handler. The backend's soft-delete architecture
  // makes reactivation impossible with current capabilities: deleted_at is
  // set on deactivation, list_users() excludes rows where deleted_at is set
  // (so a deactivated user can never be seen again to act on), and
  // update_user() explicitly 404s any user with deleted_at set (confirmed
  // via direct API test). Adding a "Reactivate" action here would expose UI
  // for something the backend cannot do — intentionally not implemented.

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
          users={users}
          search={search}
          setSearch={setSearch}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          roleFilterOpen={roleFilterOpen}
          setRoleFilterOpen={setRoleFilterOpen}
          onAddUser={() => setShowAddUser(true)}
          isLoading={usersQuery.isLoading}
          isError={usersQuery.isError}
          error={usersQuery.error}
          onRetry={() => usersQuery.refetch()}
          canManageUsers={hasPermission('user:manage')}
          onDeactivate={(id) => setDeactivateTargetId(id)}
        />
      )}

      {deactivateTargetId && (
        <ConfirmDeactivateDialog
          onCancel={() => { setDeactivateTargetId(null); setDeactivateError(null) }}
          onConfirm={confirmDeactivate}
          isSubmitting={deactivateUser.isPending}
          error={deactivateError}
        />
      )}

      {tab === 'Role Assignment' && (
        <RoleAssignmentTab
          companies={clientPool}
          selectedCompany={selectedCompanyForAssignment}
          companyPickerOpen={companyPickerOpen}
          setCompanyPickerOpen={setCompanyPickerOpen}
          onSelectCompany={(id) => {
            setSelectedCompanyId(id)
            setCompanyPickerOpen(false)
          }}
          team={assignmentTeam}
          isLoading={companiesQuery.isLoading || assignmentsQuery.isLoading}
          isError={assignmentsQuery.isError}
          error={assignmentsQuery.error}
          onRetry={() => assignmentsQuery.refetch()}
          canManageAssignments={hasPermission('user:manage')}
          onAssignNew={() => setShowAssignUser(true)}
          onRemove={(assignmentId, name) => setRemoveAssignmentTarget({ assignmentId, name })}
          canManageRbac={hasPermission('user:manage')}
          onAssignRole={() => setShowAssignRole(true)}
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
          canManageUsers={hasPermission('user:manage')}
          onCreateClientUser={() => setShowCreateClientUser(true)}
        />
      )}

      {showCreateClientUser && selectedClient && (
        <CreateClientUserModal
          companyId={selectedClient.id}
          companyName={selectedClient.name}
          onClose={() => { setShowCreateClientUser(false); setCreateClientUserError(null) }}
          onCreate={handleCreateClientUser}
          isSubmitting={createUser.isPending}
          submitError={createClientUserError}
        />
      )}

      {tab === 'Logs' && <LogsTab />}

      {showAddUser && (
        <AddUserModal
          onClose={() => { setShowAddUser(false); setCreateUserError(null) }}
          onAdd={handleAddUser}
          requirePassword
          isSubmitting={createUser.isPending}
          submitError={createUserError}
        />
      )}
      {showAssignUser && selectedCompanyForAssignment && (
        <AssignConsultantModal
          onClose={() => { setShowAssignUser(false); setAssignError(null) }}
          onAssign={handleAssignConsultant}
          excludeUserIds={assignmentTeam.map((m) => m.consultantUserId)}
          companyName={selectedCompanyForAssignment.name}
          isSubmitting={createConsultantAssignment.isPending}
          submitError={assignError}
        />
      )}
      {showAssignRole && (
        <AssignRbacRoleModal
          onClose={() => { setShowAssignRole(false); setAssignRoleError(null) }}
          onAssign={handleAssignRbacRole}
          currentRoleByUserId={currentRoleByUserId}
          isSubmitting={assignRole.isPending || removeRoleMutation.isPending || updateUserDisplayRole.isPending}
          submitError={assignRoleError}
        />
      )}
      {removeAssignmentTarget && (
        <ConfirmRemoveAssignmentDialog
          name={removeAssignmentTarget.name}
          onCancel={() => { setRemoveAssignmentTarget(null); setRemoveError(null) }}
          onConfirm={confirmRemoveAssignment}
          isSubmitting={updateConsultantAssignment.isPending}
          error={removeError}
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

function UserDirectoryTab({
  users, search, setSearch, roleFilter, setRoleFilter, roleFilterOpen, setRoleFilterOpen, onAddUser,
  isLoading, isError, error, onRetry, canManageUsers, onDeactivate,
}) {
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
            {/* Frontend permission check is UX only — the backend enforces
                user:manage on POST /users regardless of this. */}
            {canManageUsers && (
              <Button onClick={onAddUser}>Add User <Plus size={15} /></Button>
            )}
          </div>
        }
      />

      {isLoading ? (
        <div className="bg-white border border-surface-border rounded-lg">
          <LoadingState label="Loading users…" />
        </div>
      ) : isError ? (
        <div className="bg-white border border-surface-border rounded-lg">
          <ErrorState
            message={error?.message || 'Could not load users. Please try again.'}
            onRetry={onRetry}
          />
        </div>
      ) : (
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
                  <th className="font-medium px-2 py-3">Status</th>
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
                    <td className="px-2 py-3 text-ink-700">{u.department || '—'}</td>
                    <td className={`px-2 py-3 font-medium ${roleColors[u.role] || 'text-ink-700'}`}>{u.role}</td>
                    <td className="px-2 py-3">
                      <span className={u.is_active ? 'text-status-approved' : 'text-ink-300'}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {/* Every row reaching this list is guaranteed active —
                          the backend's soft-delete excludes deactivated
                          users from GET /users entirely, so there is no
                          reachable "inactive" state to show a Reactivate
                          action for. Reactivation is intentionally not
                          supported (see ControlCenter's top-level note). */}
                      {canManageUsers ? (
                        <button
                          onClick={() => onDeactivate(u.id)}
                          className="text-status-pending text-xs font-medium hover:underline inline-flex items-center gap-1"
                        >
                          <UserX size={13} /> Deactivate
                        </button>
                      ) : (
                        <span className="text-ink-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

function ConfirmDeactivateDialog({ onCancel, onConfirm, isSubmitting, error }) {
  return (
    <div className="fixed inset-0 bg-ink-900/40 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-lg w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold text-ink-900 mb-2">Deactivate this user?</h3>
        <p className="text-sm text-ink-500 mb-4">
          Are you sure you want to deactivate this user? They will lose access immediately. This can be reversed later.
        </p>
        {error && (
          <p className="text-xs text-status-pending bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-4">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Deactivating…' : 'Deactivate'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function RoleAssignmentTab({
  companies, selectedCompany, companyPickerOpen, setCompanyPickerOpen, onSelectCompany,
  team, isLoading, isError, error, onRetry, canManageAssignments, onAssignNew, onRemove,
  canManageRbac, onAssignRole,
}) {
  if (!selectedCompany) {
    return (
      <div className="bg-white border border-surface-border rounded-lg">
        {isLoading ? <LoadingState label="Loading companies…" /> : (
          <div className="p-6">
            <EmptyState title="No companies available" subtitle="Companies will appear here once they exist." />
          </div>
        )}
      </div>
    )
  }

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

        {isLoading ? (
          <div className="bg-white border border-surface-border rounded-lg">
            <LoadingState label="Loading assigned team…" />
          </div>
        ) : isError ? (
          <div className="bg-white border border-surface-border rounded-lg">
            <ErrorState message={error?.message || 'Could not load the assigned team.'} onRetry={onRetry} />
          </div>
        ) : (
          <div className="bg-white border border-surface-border rounded-lg overflow-hidden">
            {team.length === 0 ? (
              <div className="p-6">
                <EmptyState title="No Deloitte team assigned yet" subtitle="Assign a consultant to start working with this client." />
              </div>
            ) : (
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="text-left text-xs text-ink-500 bg-surface-muted/50">
                    <th className="font-medium px-5 py-3">Name</th>
                    <th className="font-medium px-2 py-3">Email Id</th>
                    <th className="font-medium px-2 py-3">Role on Account</th>
                    <th className="font-medium px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {team.map((m) => (
                    <tr key={m.assignmentId} className="border-t border-surface-border">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={m.name} size="w-7 h-7" />
                          <span className="text-ink-900 font-medium">{m.name}</span>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-ink-500">{m.email}</td>
                      {/* This is ConsultantAssignment.role_on_account — a free-text
                          note about this person's role on THIS account (e.g. "Lead").
                          It is a DIFFERENT concept from RBAC permissions (UserRole),
                          which is managed in the separate "RBAC Roles" section below —
                          never conflate the two. */}
                      <td className="px-2 py-3 text-ink-700">{m.roleOnAccount || '—'}</td>
                      <td className="px-5 py-3 text-right">
                        {canManageAssignments ? (
                          <button
                            onClick={() => onRemove(m.assignmentId, m.name)}
                            className="text-status-pending text-xs font-medium hover:underline"
                          >
                            Remove
                          </button>
                        ) : (
                          <span className="text-ink-300">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {canManageAssignments && (
          <div className="flex justify-end mt-4">
            <Button onClick={onAssignNew}>Assign New Deloitte User <Plus size={15} /></Button>
          </div>
        )}
      </div>

      {/* Genuinely separate concern from staffing above: RBAC permission
          roles (UserRole), not company-account staffing (ConsultantAssignment).
          Kept visually distinct — different heading, different color accent,
          different action — so the two are never confused. */}
      <div className="border-t border-surface-border pt-5 mt-8">
        <h3 className="text-lg font-semibold text-ink-900 mb-1">RBAC Roles</h3>
        <p className="text-[10px] text-ink-500 mb-4">
          Set a Deloitte user's real permission/authorization role. This is separate from
          the account staffing above — a person can be staffed on this account without
          holding any particular RBAC role, and vice versa.
        </p>
        {canManageRbac && (
          <Button onClick={onAssignRole} variant="ghost">
            Assign / Change RBAC Role
          </Button>
        )}
      </div>
    </div>
  )
}

function ConfirmRemoveAssignmentDialog({ name, onCancel, onConfirm, isSubmitting, error }) {
  return (
    <div className="fixed inset-0 bg-ink-900/40 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-lg w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold text-ink-900 mb-2">Remove this consultant?</h3>
        <p className="text-sm text-ink-500 mb-4">
          {name ? `Remove ${name} from this account's team? ` : 'Remove this consultant from the account? '}
          They will lose access to this company. This can be reversed by assigning them again later.
        </p>
        {error && (
          <p className="text-xs text-status-pending bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-4">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Removing…' : 'Remove'}
          </Button>
        </div>
      </div>
    </div>
  )
}

/** One real table row, with real Approve/Reject actions for a Pending
 * company. A separate component (not inline in .map()) specifically so
 * useUpdateCompany -- which binds to one company id -- can be called
 * safely per row, respecting the Rules of Hooks. Calls the exact same
 * real PATCH /companies/{id} endpoint already used elsewhere; no new
 * backend endpoint was needed for this. */
/** Real, editable plan selector for the selected client's detail panel.
 * A separate component (like ClientPoolRow above) specifically so
 * useUpdateCompany can be called safely, bound to whichever company is
 * currently selected. Calls the exact same real PATCH /companies/{id}
 * endpoint already used for Approve/Reject -- CompanyUpdate already
 * supports a plan field, so no backend change was needed for this. */
function PlanSelector({ company }) {
  const updateCompany = useUpdateCompany(company.id)
  return (
    <select
      value={company.plan}
      onChange={(e) => updateCompany.mutate({ plan: e.target.value })}
      disabled={updateCompany.isPending}
      className="text-[10px] border border-surface-border rounded-md px-2 py-1 text-ink-900 bg-white"
    >
      <option value="Basic">Basic</option>
      <option value="Professional">Professional</option>
      <option value="Enterprise">Enterprise</option>
    </select>
  )
}

function ClientPoolRow({ company, selected, onSelect, canManageCompanies }) {
  const updateCompany = useUpdateCompany(company.id)

  return (
    <tr
      onClick={onSelect}
      className={`border-t border-surface-border cursor-pointer ${selected ? 'bg-surface-muted/60' : 'hover:bg-surface-muted/40'}`}
    >
      <td className="px-5 py-3 text-ink-900 font-medium">{company.name}</td>
      <td className="px-2 py-3 text-ink-700">{company.industry || '—'}</td>
      <td className="px-2 py-3 text-ink-700">{company.plan}</td>
      <td className="px-2 py-3 text-ink-700">{company.status}</td>
      <td className="px-2 py-3 text-ink-500">{company.country || '—'}</td>
      <td className="px-5 py-3">
        {canManageCompanies && company.status === 'Pending' ? (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => updateCompany.mutate({ status: 'Approved' })}
              disabled={updateCompany.isPending}
              className="text-[10px] font-medium text-brand-green hover:underline"
            >
              Approve
            </button>
            <button
              onClick={() => updateCompany.mutate({ status: 'Rejected' })}
              disabled={updateCompany.isPending}
              className="text-[10px] font-medium text-status-pending hover:underline"
            >
              Reject
            </button>
          </div>
        ) : (
          <span className="text-[10px] text-ink-300">—</span>
        )}
      </td>
    </tr>
  )
}

function ClientPoolTab({
  clients, selectedClient, selectedClientId, setSelectedClientId,
  poolSearch, setPoolSearch, planFilter, setPlanFilter, planFilterOpen, setPlanFilterOpen, onAddClient,
  isLoading, isError, error, onRetry, canManageCompanies, canManageUsers, onCreateClientUser,
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
                    <th className="font-medium px-2 py-3">Country</th>
                    <th className="font-medium px-5 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <ClientPoolRow
                      key={c.id} company={c}
                      selected={selectedClientId === c.id}
                      onSelect={() => setSelectedClientId(c.id)}
                      canManageCompanies={canManageCompanies}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {detail && (
            <div className="bg-white border border-surface-border rounded-lg p-5 h-fit">
              <div className="flex items-start justify-between mb-1">
                <h4 className="font-semibold text-ink-900">{detail.name}</h4>
                {canManageUsers && (
                  <button
                    onClick={onCreateClientUser}
                    className="text-[10px] font-medium text-brand-green hover:underline whitespace-nowrap"
                  >
                    + Create Client User
                  </button>
                )}
              </div>
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
                <div>
                  <div className="text-xs text-ink-300 mb-1">Plan</div>
                  {canManageCompanies ? (
                    <PlanSelector company={detail} />
                  ) : (
                    <div className="text-ink-900">{detail.plan}</div>
                  )}
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
