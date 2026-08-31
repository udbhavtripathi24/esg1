import { useState, useMemo } from 'react'
import { Search, ShieldCheck, X } from 'lucide-react'
import { Button, Avatar } from '../../components/ui.jsx'
import LoadingState from '../../components/LoadingState.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import { useUsers } from '../../hooks/useUsers.js'
import { useRoles } from '../../hooks/useAssignments.js'

/**
 * Assigns a real RBAC role (UserRole) to an existing Deloitte user.
 *
 * Deliberately a SEPARATE component from AssignConsultantModal — that modal
 * assigns ConsultantAssignment.role_on_account (free text, company staffing);
 * this one assigns UserRole.role_code (real backend RBAC roles). Conflating
 * them into one UI would blur exactly the distinction the backend itself
 * keeps strict.
 *
 * Roles come from real GET /rbac/roles, filtered client-side to
 * scope === 'deloitte' — never hardcoded, per instructions.
 */
export default function AssignRbacRoleModal({
  onClose, onAssign, currentRoleByUserId = {}, isSubmitting = false, submitError = null,
}) {
  const [search, setSearch] = useState('')
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [selectedRoleCode, setSelectedRoleCode] = useState('')

  const usersQuery = useUsers({ page: 1, page_size: 100 })
  const rolesQuery = useRoles()

  const deloitteUsers = useMemo(() => {
    const all = usersQuery.data?.items || []
    return all.filter((u) =>
      u.portal_type === 'deloitte' &&
      u.is_active &&
      (!search.trim() ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()))
    )
  }, [usersQuery.data, search])

  const deloitteRoles = useMemo(
    () => (rolesQuery.data || []).filter((r) => r.scope === 'deloitte'),
    [rolesQuery.data]
  )

  const selectedUser = deloitteUsers.find((u) => u.id === selectedUserId)

  function handleConfirm() {
    if (!selectedUserId || !selectedRoleCode) return
    onAssign(selectedUserId, selectedRoleCode)
  }

  return (
    <div className="fixed inset-0 bg-ink-900/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 p-6 border-b border-surface-border">
          <div className="w-10 h-10 rounded-md bg-purple-500 flex items-center justify-center text-white shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-ink-900">Assign RBAC Role</h3>
            <p className="text-xs text-ink-500 mt-0.5">
              Set a Deloitte user's real permission role. This is separate from account staffing.
            </p>
          </div>
          <button onClick={onClose} className="text-ink-300 hover:text-ink-700">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          {submitError && (
            <p className="text-xs text-status-pending bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {submitError}
            </p>
          )}

          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
            <input
              placeholder="Search by name or email........"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-md border border-surface-border text-[10px] placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-green/20"
            />
          </div>

          <div className="border border-surface-border rounded-lg max-h-48 overflow-y-auto">
            {usersQuery.isLoading ? (
              <LoadingState label="Loading Deloitte users…" />
            ) : usersQuery.isError ? (
              <ErrorState message={usersQuery.error?.message || 'Could not load users.'} onRetry={() => usersQuery.refetch()} />
            ) : deloitteUsers.length === 0 ? (
              <p className="text-xs text-ink-300 text-center py-8 px-4">No matching Deloitte users found.</p>
            ) : (
              <ul>
                {deloitteUsers.map((u) => (
                  <li key={u.id}>
                    <button
                      onClick={() => setSelectedUserId(u.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left border-b border-surface-border last:border-b-0 ${
                        selectedUserId === u.id ? 'bg-purple-50' : 'hover:bg-surface-muted'
                      }`}
                    >
                      <Avatar name={u.name} size="w-7 h-7" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-medium text-ink-900 truncate">{u.name}</div>
                        <div className="text-xs text-ink-500 truncate">{u.email}</div>
                      </div>
                      {currentRoleByUserId[u.id] && (
                        <span className="text-xs text-ink-300 shrink-0">{currentRoleByUserId[u.id]}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {selectedUser && (
            <div>
              <label className="text-sm text-ink-700 block mb-1.5">RBAC Role<span className="text-status-pending">*</span></label>
              {rolesQuery.isLoading ? (
                <LoadingState label="Loading roles…" />
              ) : rolesQuery.isError ? (
                <ErrorState message="Could not load roles." onRetry={() => rolesQuery.refetch()} />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {deloitteRoles.map((r) => (
                    <button
                      key={r.code}
                      onClick={() => setSelectedRoleCode(r.code)}
                      className={`px-3 py-2 rounded-md border text-[10px] font-medium ${
                        selectedRoleCode === r.code
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-surface-border text-ink-700'
                      }`}
                    >
                      {r.code}
                    </button>
                  ))}
                </div>
              )}
              {currentRoleByUserId[selectedUser.id] && (
                <p className="text-xs text-ink-300 mt-2">
                  Current role on record: {currentRoleByUserId[selectedUser.id]}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-surface-border">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!selectedUserId || !selectedRoleCode || isSubmitting}>
            {isSubmitting ? 'Assigning…' : 'Assign Role'}
          </Button>
        </div>
      </div>
    </div>
  )
}
