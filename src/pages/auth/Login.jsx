import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Fingerprint } from 'lucide-react'
import { Button, Field, Input } from '../../components/ui.jsx'
import deloitteLogo from '../../assets/deloitte-logo.svg'

// ─── Credentials ─────────────────────────────────────────────────────────────
// Consultant portal — Deloitte team
const CONSULTANT_USERS = [
  { email: 'james.whitfield@deloitte.com', password: 'Deloitte@2026', name: 'James Whitfield' },
  { email: 'sarah.jacob@deloitte.com',     password: 'Deloitte@2026', name: 'Sarah Jacob' },
]

// Client portal — ABC Holdings team
const CLIENT_USERS = [
  { email: 'john.doe@abcholding.com', password: 'ABCHolding@2026', name: 'John Doe' },
  { email: 'neha.sharma@abc.com',     password: 'ABCHolding@2026', name: 'Neha Sharma' },
]

export default function Login() {
  const navigate = useNavigate()
  const [role, setRole] = useState('consultant') // 'consultant' | 'client'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})

  const roleCopy = {
    consultant: {
      emailPlaceholder: 'you@deloitte.com',
      hint: 'james.whitfield@deloitte.com · Deloitte@2026',
      dest: '/consultant/dashboard',
    },
    client: {
      emailPlaceholder: 'you@company.com',
      hint: 'john.doe@abcholding.com · ABCHolding@2026',
      dest: '/client/dashboard',
    },
  }

  function handleSubmit(e) {
    e.preventDefault()
    const e2 = {}
    if (!email.trim() || !email.includes('@')) e2.email = 'Enter a valid email'
    if (!password.trim()) e2.password = 'Password is required'
    if (Object.keys(e2).length > 0) { setErrors(e2); return }

    // Validate against the correct user list for the selected portal
    const users = role === 'consultant' ? CONSULTANT_USERS : CLIENT_USERS
    const match = users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
    )

    if (!match) {
      setErrors({ auth: 'Incorrect email or password. Please try again.' })
      return
    }

    setErrors({})
    navigate(roleCopy[role].dest)
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-white">
      {/* Left panel */}
      <div className="relative hidden md:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-dark to-brand-darker text-white p-12">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <svg width="100%" height="100%" viewBox="0 0 600 800" fill="none">
            <polygon points="300,140 380,190 380,270 300,320 220,270 220,190" stroke="white" strokeWidth="1" fill="none" />
            <circle cx="480" cy="180" r="70" stroke="white" strokeWidth="1" fill="none" />
            <line x1="30" y1="500" x2="560" y2="640" stroke="white" strokeWidth="0.5" />
            <line x1="30" y1="640" x2="560" y2="500" stroke="white" strokeWidth="0.5" />
          </svg>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <img src={deloitteLogo} alt="Deloitte" className="h-7 w-auto brightness-0 invert" />
            <span className="text-white/70 font-normal text-2xl">ESG</span>
          </div>

          <div className="mt-24">
            <p className="text-brand-green text-sm mb-3">— ESG Reporting platform</p>
            <h1 className="text-4xl font-normal leading-tight">
              Transparent reporting.
              <br />
              <span className="text-brand-green">Verifiable impact.</span>
            </h1>
            <p className="mt-5 text-white/70 max-w-sm text-[15px] leading-relaxed">
              End-to-end ESG data management, verification, and multi-framework reporting — built for the
              organizations that matter.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {['Environmental', 'Social', 'Governance'].map((tag) => (
                <span key={tag} className="px-3 py-1.5 rounded-md border border-white/25 text-xs text-white/80">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-white/50 mb-3">Supported frameworks</p>
          <div className="flex flex-wrap gap-2">
            {['GRI', 'IFRS S1', 'IFRS S2', 'SASB', 'BRSR'].map((fw) => (
              <span key={fw} className="px-2.5 py-1 rounded-full bg-white/10 text-white/70 text-xs">
                {fw}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="w-11 h-11 rounded-lg bg-brand-green flex items-center justify-center text-white mb-5">
            <Fingerprint size={22} />
          </div>
          <h2 className="text-2xl font-semibold text-ink-900">Welcome back</h2>
          <p className="text-sm text-ink-500 mt-2">Sign in to access the Deloitte ESG Management Platform.</p>

          <div className="grid grid-cols-2 gap-2 mt-6 p-1 rounded-md bg-surface-muted">
            <button
              type="button"
              onClick={() => { setRole('consultant'); setEmail(''); setPassword(''); setErrors({}) }}
              className={`py-2 rounded-md text-sm font-medium transition-colors ${
                role === 'consultant' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'
              }`}
            >
              Deloitte Consultant
            </button>
            <button
              type="button"
              onClick={() => { setRole('client'); setEmail(''); setPassword(''); setErrors({}) }}
              className={`py-2 rounded-md text-sm font-medium transition-colors ${
                role === 'client' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'
              }`}
            >
              Client User
            </button>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            {/* Auth-level error */}
            {errors.auth && (
              <p className="text-xs text-status-pending bg-red-50 border border-red-100 rounded-md px-3 py-2">
                {errors.auth}
              </p>
            )}

            <Field label="Email / User ID" required>
              <Input
                type="text"
                placeholder={roleCopy[role].emailPlaceholder}
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((er) => ({ ...er, email: null, auth: null })) }}
                className={errors.email ? '!border-status-pending' : ''}
              />
              {errors.email && <p className="text-xs text-status-pending mt-1">{errors.email}</p>}
            </Field>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm text-ink-700">
                  Password<span className="text-status-pending">*</span>
                </label>
                <a href="#" className="text-xs text-brand-green hover:underline">Forgot password?</a>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((er) => ({ ...er, password: null, auth: null })) }}
                className={errors.password ? '!border-status-pending' : ''}
              />
              {errors.password && <p className="text-xs text-status-pending mt-1">{errors.password}</p>}
            </div>

            <label className="flex items-center gap-2 text-sm text-ink-500">
              <input type="checkbox" className="rounded border-surface-border" />
              Remember me
            </label>

            <Button type="submit" className="w-full" size="lg">Sign in</Button>

            <div className="flex items-center gap-3 text-xs text-ink-300">
              <div className="flex-1 h-px bg-surface-border" />
              or
              <div className="flex-1 h-px bg-surface-border" />
            </div>

            <Button type="button" variant="ghost" className="w-full" size="lg">
              Sign in with Microsoft SSO
            </Button>
          </form>

          <p className="mt-8 text-xs text-ink-300 leading-relaxed">
            This platform is restricted to authorized Deloitte personnel and their client organizations. All access attempts are logged and monitored.
          </p>
        </div>
      </div>
    </div>
  )
}
