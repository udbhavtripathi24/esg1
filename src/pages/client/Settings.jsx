import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { CheckCircle2 } from 'lucide-react'
import PageHeader from '../../components/PageHeader.jsx'
import { Card, Button, Field, Input } from '../../components/ui.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useCompanies } from '../../hooks/useCompanies.js'
import { changeOwnPassword, getAuthConfig, updatePreferences } from '../../api/auth.js'

const TABS = ['Profile', 'Notifications', 'Security']

export default function Settings() {
  const [tab, setTab] = useState('Profile')
  const { user, replaceToken, updateUser } = useAuth()
  const config = useQuery({ queryKey: ['auth-config'], queryFn: getAuthConfig, staleTime: 5 * 60_000 })
  const minLength = config.data?.min_password_length || 10
  const [emailPref, setEmailPref] = useState(null) // optimistic: null = follow the signed-in user
  const prefs = useMutation({
    mutationFn: (body) => updatePreferences(body),
    onSuccess: (data) => { updateUser(data); setEmailPref(null) },
    onError: () => setEmailPref(null),
  })
  const emailOnForMe = emailPref ?? (user?.email_notifications !== false)
  const companies = useCompanies({ page: 1, page_size: 1 })
  const companyName = companies.data?.items?.[0]?.name

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordFormError, setPasswordFormError] = useState(null)
  const [passwordChangedAt, setPasswordChangedAt] = useState(null)

  const changePasswordMutation = useMutation({
    mutationFn: () => changeOwnPassword(currentPassword, newPassword),
    onSuccess: (data) => {
      // Changing the password signs out every other session; this one continues with the fresh token.
      if (data?.access_token) replaceToken(data.access_token)
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      setPasswordFormError(null)
      setPasswordChangedAt(Date.now())
    },
    onError: (err) => {
      if (err.status === 403) setPasswordFormError('Current password is incorrect.')
      else if (err.status === 422) setPasswordFormError(err.message || `Use at least ${minLength} characters.`)
      else setPasswordFormError(err.message || 'Could not update your password. Please try again.')
    },
  })

  function handleChangePassword() {
    setPasswordFormError(null)
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordFormError('Please fill in all three fields.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordFormError('New password and confirmation do not match.')
      return
    }
    if (newPassword.length < minLength) {
      setPasswordFormError(`Use at least ${minLength} characters.`)
      return
    }
    changePasswordMutation.mutate()
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your account and workspace preferences." />

      <div className="flex items-center gap-6 border-b border-surface-border mb-5">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 text-sm -mb-px border-b-2 transition-colors ${
              tab === t ? 'border-brand-green text-brand-green font-medium' : 'border-transparent text-ink-500 hover:text-ink-900'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Profile' && (
        <Card className="max-w-lg">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name"><Input value={user?.name || ''} disabled readOnly /></Field>
            <Field label="Role"><Input value={(user?.role || '').replace('Client ', '')} disabled readOnly /></Field>
          </div>
          <div className="mt-4">
            <Field label="Email"><Input value={user?.email || ''} disabled readOnly /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Field label="Department"><Input value={user?.department || '—'} disabled readOnly /></Field>
            <Field label="Company"><Input value={companyName || ''} disabled readOnly /></Field>
          </div>
          <p className="text-[11px] text-ink-500 mt-4">
            Your name, department and role are managed by your company administrator in the Admin Console.
            Your e-mail is your sign-in. You can change your password under Security.
          </p>
        </Card>
      )}

      {tab === 'Notifications' && (
        <Card className="max-w-lg">
          <p className="text-sm font-medium text-ink-900 mb-2">Notifications</p>
          <p className="text-xs text-ink-700">
            You get in-app notifications (the bell at the top) for review decisions, assignments, BRSR answers waiting
            for you, and surveys you're asked to complete.
          </p>
          {config.data?.email_enabled ? (
            <label className="mt-4 flex items-start gap-2.5 text-sm text-ink-900 cursor-pointer">
              <input type="checkbox" className="mt-0.5 rounded border-surface-border accent-brand-green"
                checked={emailOnForMe}
                onChange={(e) => { setEmailPref(e.target.checked); prefs.mutate({ email_notifications: e.target.checked }) }} />
              <span>
                Also send them to me by e-mail
                <span className="block text-[11px] text-ink-500 mt-0.5">
                  Sent to {user?.email}. Password and invitation e-mails are always sent.
                </span>
              </span>
            </label>
          ) : (
            <p className="text-xs text-ink-500 mt-3">
              E-mail isn't switched on for this installation, so notifications are shown in the app only.
            </p>
          )}
          {prefs.isError && <p className="text-xs text-status-pending mt-2">Could not save. Please try again.</p>}
        </Card>
      )}

      {tab === 'Security' && (
        <Card className="max-w-lg">
          <p className="text-sm font-medium text-ink-900 mb-3">Change Password</p>
          {passwordChangedAt && (
            <div className="flex items-center gap-2 bg-status-approved/10 text-status-approved text-xs rounded-md px-3 py-2 mb-4">
              <CheckCircle2 size={14} /> Your password was updated successfully.
            </div>
          )}
          {passwordFormError && (
            <p className="text-xs text-status-pending bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-4">
              {passwordFormError}
            </p>
          )}
          <div className="space-y-4">
            <Field label="Current Password">
              <Input type="password" placeholder="••••••••" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </Field>
            <Field label="New Password">
              <Input type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </Field>
            <Field label="Confirm New Password">
              <Input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </Field>
          </div>
          <p className="text-[11px] text-ink-500 mt-3">
            {config.data?.password_rules || `At least ${minLength} characters.`} Changing your password signs you out
            on your other devices.
          </p>
          <div className="flex justify-end mt-5">
            <Button onClick={handleChangePassword} disabled={changePasswordMutation.isPending}>
              {changePasswordMutation.isPending ? 'Updating…' : 'Update password'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
