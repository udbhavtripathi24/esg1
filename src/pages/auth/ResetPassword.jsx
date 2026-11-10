import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { KeyRound, Link2Off, Loader2 } from 'lucide-react'
import { Button, Field, Input } from '../../components/ui.jsx'
import { checkResetLink, getAuthConfig, resetPassword } from '../../api/auth.js'
import { useAuth } from '../../context/AuthContext.jsx'
import AuthShell from './AuthShell.jsx'

/** Set a password from a one-time link: "forgot password" e-mails and new-user invitations (?invite=1). */
export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const invite = params.get('invite') === '1'
  const navigate = useNavigate()
  const { startSession } = useAuth()
  const link = useQuery({ queryKey: ['reset-link', token], queryFn: () => checkResetLink(token), enabled: !!token,
    retry: false, staleTime: Infinity })
  const config = useQuery({ queryKey: ['auth-config'], queryFn: getAuthConfig, staleTime: 5 * 60_000 })
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const min = config.data?.min_password_length || 10

  if (!token || link.isError || (link.data && !link.data.valid)) {
    return (
      <AuthShell icon={Link2Off} title="This link doesn't work any more"
        subtitle="Links for setting a password work once and expire after a while.">
        <p className="text-xs text-ink-700 leading-relaxed">
          {invite
            ? 'Ask your administrator to send a new invitation, or use "Forgot password" on the sign-in page with the e-mail address you were invited with.'
            : 'Request a new link and use the most recent e-mail.'}
        </p>
        <Link to="/forgot-password" className="inline-block mt-4 text-sm text-brand-green hover:underline">Request a new link</Link>
      </AuthShell>
    )
  }
  if (link.isLoading) {
    return <AuthShell title="Checking your link…"><Loader2 className="animate-spin text-ink-300" size={20} /></AuthShell>
  }

  const isInvite = link.data.purpose === 'invite'

  async function submit(e) {
    e.preventDefault()
    if (pw.length < min) { setError(`Use at least ${min} characters.`); return }
    if (pw !== pw2) { setError("The two passwords don't match."); return }
    setBusy(true)
    setError(null)
    try {
      const data = await resetPassword(token, pw)
      const u = startSession(data)
      navigate(u.portal_type === 'deloitte' ? '/consultant/dashboard' : '/client/dashboard', { replace: true })
    } catch (err) {
      if (err.code === 'invalid_link') setError('This link has expired or was already used. Request a new one.')
      else if (err.status === 422) setError(err.message)
      else if (err.status === 429) setError('Too many attempts. Please wait a few minutes.')
      else setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell icon={KeyRound} title={isInvite ? `Welcome to VISTA, ${link.data.name?.split(' ')[0] || ''}`.trim() : 'Choose a new password'}
      subtitle={isInvite ? 'Choose a password to finish setting up your account.' : `For ${link.data.email}`}
      footer={!isInvite}>
      <form onSubmit={submit} className="space-y-4">
        {isInvite && <p className="text-xs text-ink-500">You'll sign in with <span className="font-medium text-ink-900">{link.data.email}</span>.</p>}
        {error && <p className="text-xs text-status-pending bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>}
        <Field label="New password" required>
          <Input type="password" autoComplete="new-password" value={pw} autoFocus disabled={busy}
            onChange={(e) => { setPw(e.target.value); setError(null) }} />
        </Field>
        <Field label="Repeat the password" required>
          <Input type="password" autoComplete="new-password" value={pw2} disabled={busy}
            onChange={(e) => { setPw2(e.target.value); setError(null) }} />
        </Field>
        <p className="text-[11px] text-ink-500">{config.data?.password_rules || `At least ${min} characters.`} A short sentence works well.</p>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? 'Saving…' : isInvite ? 'Set password and sign in' : 'Save and sign in'}
        </Button>
      </form>
    </AuthShell>
  )
}
