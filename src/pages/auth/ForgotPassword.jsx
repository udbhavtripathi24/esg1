import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { KeyRound, MailCheck } from 'lucide-react'
import { Button, Field, Input } from '../../components/ui.jsx'
import { forgotPassword, getAuthConfig } from '../../api/auth.js'
import AuthShell from './AuthShell.jsx'

export default function ForgotPassword() {
  const config = useQuery({ queryKey: ['auth-config'], queryFn: getAuthConfig, staleTime: 5 * 60_000 })
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!email.trim() || !email.includes('@')) { setError('Enter the e-mail address you sign in with.'); return }
    setBusy(true)
    setError(null)
    try {
      await forgotPassword(email.trim())
      setSent(true)
    } catch (err) {
      if (err.status === 429) setError('Too many requests for this address. Please wait a while and try again.')
      else if (err.code === 'email_disabled') setError(err.message)
      else if (err.isNetworkError) setError('Could not reach the server. Check your connection and try again.')
      else setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <AuthShell icon={MailCheck} title="Check your e-mail"
        subtitle={`If an account exists for ${email.trim()}, we've sent a link to choose a new password.`}>
        <p className="text-xs text-ink-500 leading-relaxed">
          The link works once and expires in 30 minutes. Nothing arrived? Check your spam folder, or ask your company
          administrator to reset your password.
        </p>
      </AuthShell>
    )
  }

  const off = config.data && !config.data.email_enabled
  return (
    <AuthShell icon={KeyRound} title="Forgot your password?"
      subtitle="Enter the e-mail you sign in with and we'll send you a link to choose a new one.">
      {off ? (
        <p className="text-xs text-ink-700 bg-surface-muted rounded-md px-3 py-2">
          E-mail isn't switched on for this installation yet. Ask your company administrator (or your Deloitte
          contact) to reset your password from the Admin Console.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <p className="text-xs text-status-pending bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>}
          <Field label="E-mail" required>
            <Input type="email" autoComplete="email" value={email} autoFocus disabled={busy}
              onChange={(e) => { setEmail(e.target.value); setError(null) }} placeholder="you@company.com" />
          </Field>
          <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</Button>
        </form>
      )}
    </AuthShell>
  )
}
