import { useState } from 'react'
import { UserPlus, X, Copy, Check, AlertTriangle, KeyRound } from 'lucide-react'
import { Button, Field, Input, Select } from '../../components/ui.jsx'
import { getUsers } from '../../api/users.js'
import { useResetUserPassword } from '../../hooks/useUsers.js'

/**
 * Creates a company's first (or additional) client-portal user.
 *
 * Deliberately a SEPARATE component from AddUserModal, not a reuse or
 * a modification of it -- AddUserModal is heavily specialized for
 * Deloitte-side users (hardcoded "Deloitte email id" label, Deloitte
 * departments, a decorative CSV-import section that has no real
 * backend behind it). Building a new, purpose-built modal for this
 * genuinely different case avoids any risk of regressing that
 * existing, working component.
 *
 * The real client-portal roles (confirmed against app/rbac/
 * definitions.py): Client Administrator, Client Reviewer, Client
 * Uploader, Client Approver. No role is invented here.
 *
 * PASSWORD GENERATION: done client-side using the Web Crypto API
 * (crypto.getRandomValues), which is a real cryptographically-secure
 * random source -- not Math.random(), which is not safe for this
 * purpose. The generated password is shown exactly once, with a
 * "copy" affordance and an explicit warning that it will not be
 * shown again, since this system has no invite-email or
 * password-reset capability (a known, disclosed limitation, not
 * something this modal pretends to solve).
 */

const CLIENT_ROLES = ['Client Administrator', 'Client Reviewer', 'Client Uploader', 'Client Approver']

function generateSecurePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%'
  const bytes = new Uint32Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

export default function CreateClientUserModal({ companyId, companyName, onClose, onCreate, isSubmitting = false, submitError = null }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState(CLIENT_ROLES[0])
  const [errors, setErrors] = useState({})
  const [generatedPassword, setGeneratedPassword] = useState(null)
  const [copied, setCopied] = useState(false)
  const [existingUserId, setExistingUserId] = useState(null)
  const [wasReset, setWasReset] = useState(false)
  const resetPasswordMutation = useResetUserPassword()

  function validate() {
    const e = {}
    if (!firstName.trim()) e.firstName = true
    if (!lastName.trim()) e.lastName = true
    if (!email.trim() || !email.includes('@')) e.email = true
    return e
  }

  async function handleSubmit() {
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length > 0) return

    const password = generateSecurePassword()
    const payload = {
      name: `${firstName.trim()} ${lastName.trim()}`,
      email: email.trim(),
      portal_type: 'client',
      company_id: companyId,
      role,
      role_code: role,
      password,
    }
    try {
      await onCreate(payload)
      setWasReset(false)
      setGeneratedPassword(password)  // only shown after real, confirmed success
    } catch (err) {
      // If the real reason is "this email already exists", look up the
      // real existing user (reusing the existing, real /users search
      // endpoint) so we can offer a genuine reset instead of a dead end.
      if (err.status === 422 && err.field === 'email') {
        try {
          const existing = await getUsers({ search: email.trim(), company_id: companyId, page_size: 1 })
          if (existing.items?.length > 0) setExistingUserId(existing.items[0].id)
        } catch {
          // If the lookup itself fails, the caller's own error message
          // (already set via onCreate's rejection) still displays --
          // this lookup is a bonus, not a requirement for correctness.
        }
      }
    }
  }

  async function handleResetInstead() {
    const password = generateSecurePassword()
    try {
      await resetPasswordMutation.mutateAsync({ id: existingUserId, newPassword: password })
      setWasReset(true)
      setGeneratedPassword(password)
    } catch {
      // resetPasswordMutation.error is rendered below
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(generatedPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-ink-900/40 flex items-center justify-center z-50 p-4" onClick={generatedPassword ? undefined : onClose}>
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 p-6 border-b border-surface-border">
          <div className="w-10 h-10 rounded-md bg-brand-green flex items-center justify-center text-white shrink-0">
            <UserPlus size={18} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-ink-900">{generatedPassword ? (wasReset ? 'Password Reset' : 'User Created') : 'Create Client User'}</h3>
            <p className="text-xs text-ink-500 mt-0.5">{companyName}</p>
          </div>
          {!generatedPassword && (
            <button onClick={onClose} className="text-ink-300 hover:text-ink-700">
              <X size={18} />
            </button>
          )}
        </div>

        {generatedPassword ? (
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md px-3 py-2.5">
              <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-[11px] text-amber-800">
                This password is shown only once and cannot be retrieved again. Copy it now and share it with the
                client through a secure channel — this system does not send it by email.
              </p>
            </div>
            <div>
              <label className="text-[10px] text-ink-500 mb-1 block">Email</label>
              <p className="text-sm text-ink-900 font-medium">{email.trim()}</p>
            </div>
            <div>
              <label className="text-[10px] text-ink-500 mb-1 block">Temporary Password</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-surface-muted rounded-md px-3 py-2 text-sm font-mono text-ink-900">{generatedPassword}</code>
                <button onClick={handleCopy} className="p-2 rounded-md border border-surface-border hover:bg-surface-muted/60">
                  {copied ? <Check size={15} className="text-status-approved" /> : <Copy size={15} className="text-ink-500" />}
                </button>
              </div>
            </div>
            <p className="text-[10px] text-ink-400">
              The client should change this password after their first login.
            </p>
            <div className="flex justify-end pt-2">
              <Button onClick={onClose}>Done</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-6 space-y-5">
              {submitError && (
                <div className="text-xs text-status-pending bg-red-50 border border-red-100 rounded-md px-3 py-2">
                  <p>{submitError}</p>
                  {existingUserId && (
                    <button
                      onClick={handleResetInstead}
                      disabled={resetPasswordMutation.isPending}
                      className="flex items-center gap-1.5 mt-2 text-brand-green font-medium hover:underline"
                    >
                      <KeyRound size={12} />
                      {resetPasswordMutation.isPending ? 'Generating…' : 'Reset their password instead'}
                    </button>
                  )}
                  {resetPasswordMutation.isError && (
                    <p className="mt-2 text-status-pending">Could not reset the password. Please try again.</p>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <Field label="First Name" required>
                  <Input placeholder="Jane" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                    className={errors.firstName ? '!border-status-pending' : ''} />
                </Field>
                <Field label="Last Name" required>
                  <Input placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)}
                    className={errors.lastName ? '!border-status-pending' : ''} />
                </Field>
              </div>
              <Field label="Email" required>
                <Input placeholder="jane.doe@company.com" value={email} onChange={(e) => setEmail(e.target.value)}
                  className={errors.email ? '!border-status-pending' : ''} />
              </Field>
              <div>
                <label className="block text-sm text-ink-700 mb-1.5">Role</label>
                <Select value={role} onChange={(e) => setRole(e.target.value)}>
                  {CLIENT_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </Select>
              </div>
              <p className="text-[10px] text-ink-400">
                A secure temporary password will be generated automatically and shown once you create this user.
              </p>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-surface-border">
              <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Creating…' : 'Create User'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
