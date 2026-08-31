import { useState, useMemo } from 'react'
import { Search, UserPlus, X } from 'lucide-react'
import { Button, Avatar, Field, Input } from '../../components/ui.jsx'
import LoadingState from '../../components/LoadingState.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import { useUsers } from '../../hooks/useUsers.js'

/**
 * Picks an EXISTING Deloitte user to staff onto a company's account team.
 * Deliberately separate from AddUserModal — this component never creates a
 * user, never asks for a password, never collects first/last name for
 * account creation, and never calls POST /users.
 *
 * GET /users has no portal_type query parameter (confirmed against the
 * actual route signature — only search/role/company_id exist). Following
 * the same already-approved pattern used for Client Pool's plan filter:
 * fetch one authorized page and refine client-side for portal_type, rather
 * than inventing a backend parameter. This is UI-level refinement of an
 * already tenant/permission-scoped result, not a security mechanism.
 */
export default function AssignConsultantModal({
  onClose, onAssign, excludeUserIds = [], companyName, isSubmitting = false, submitError = null,
}) {
  const [search, setSearch] = useState('')
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [roleOnAccount, setRoleOnAccount] = useState('')

  const usersQuery = useUsers({ page: 1, page_size: 100 })

  const availableUsers = useMemo(() => {
    const all = usersQuery.data?.items || []
    const excludeSet = new Set(excludeUserIds)
    return all.filter((u) =>
      u.portal_type === 'deloitte' &&
      u.is_active &&
      !excludeSet.has(u.id) &&
      (!search.trim() ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()))
    )
  }, [usersQuery.data, excludeUserIds, search])

  const selectedUser = availableUsers.find((u) => u.id === selectedUserId)

  function handleConfirm() {
    if (!selectedUserId) return
    onAssign(selectedUserId, roleOnAccount.trim() || undefined)
  }

  return (
    <div className="fixed inset-0 bg-ink-900/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 p-6 border-b border-surface-border">
          <div className="w-10 h-10 rounded-md bg-brand-green flex items-center justify-center text-white shrink-0">
            <UserPlus size={18} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-ink-900">Assign Deloitte User</h3>
            <p className="text-xs text-ink-500 mt-0.5">
              {companyName ? `Add an existing Deloitte team member to ${companyName}` : 'Add an existing Deloitte team member to this account'}
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

          <div className="border border-surface-border rounded-lg max-h-56 overflow-y-auto">
            {usersQuery.isLoading ? (
              <LoadingState label="Loading Deloitte users…" />
            ) : usersQuery.isError ? (
              <ErrorState
                message={usersQuery.error?.message || 'Could not load users.'}
                onRetry={() => usersQuery.refetch()}
              />
            ) : availableUsers.length === 0 ? (
              <p className="text-xs text-ink-300 text-center py-8 px-4">
                {search.trim()
                  ? 'No matching Deloitte users found.'
                  : 'No available Deloitte users to assign — everyone active is already on this account.'}
              </p>
            ) : (
              <ul>
                {availableUsers.map((u) => (
                  <li key={u.id}>
                    <button
                      onClick={() => setSelectedUserId(u.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left border-b border-surface-border last:border-b-0 ${
                        selectedUserId === u.id ? 'bg-brand-green/5' : 'hover:bg-surface-muted'
                      }`}
                    >
                      <Avatar name={u.name} size="w-7 h-7" />
                      <div className="min-w-0">
                        <div className="text-[10px] font-medium text-ink-900 truncate">{u.name}</div>
                        <div className="text-xs text-ink-500 truncate">{u.email}</div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {selectedUser && (
            <Field label="Role on this account" optional>
              <Input
                placeholder="e.g. Lead, Support"
                value={roleOnAccount}
                onChange={(e) => setRoleOnAccount(e.target.value)}
              />
            </Field>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-surface-border">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!selectedUserId || isSubmitting}>
            {isSubmitting ? 'Assigning…' : 'Assign'}
          </Button>
        </div>
      </div>
    </div>
  )
}
