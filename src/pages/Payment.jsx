import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, Lock, CheckCircle2 } from 'lucide-react'
import { pricingTiers } from '../data/mockData'
import deloitteLogo from '../assets/deloitte-logo.svg'

export default function Payment() {
  const location = useLocation()
  const navigate = useNavigate()
  const planName = location.state?.plan || 'Professional'
  const plan = pricingTiers.find((p) => p.name === planName) || pricingTiers[1]

  const [billingCycle, setBillingCycle] = useState('Annual')
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', company: '', card: '', expiry: '', cvc: '' })

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-muted px-4">
        <div className="bg-white border border-surface-border rounded-lg p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 rounded-full bg-brand-green/10 text-brand-greenDark flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={24} />
          </div>
          <h1 className="text-xl font-semibold text-ink-900">Request received</h1>
          <p className="text-sm text-ink-500 mt-2 leading-relaxed">
            Thanks — a Deloitte account manager will reach out to confirm your {plan.name} plan and finalize billing details before any charge is made.
          </p>
          <button onClick={() => navigate('/')} className="mt-6 px-5 py-2.5 rounded-md bg-brand-green text-white text-sm font-medium hover:bg-brand-greenDark transition-colors">
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-muted">
      <header className="bg-white border-b border-surface-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={deloitteLogo} alt="Deloitte" className="h-6 w-auto" />
          <span className="text-ink-700 font-normal text-xl">ESG</span>
        </div>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900">
          <ChevronLeft size={15} /> Back
        </button>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="bg-white border border-surface-border rounded-lg p-6">
          <h1 className="text-xl font-semibold text-ink-900 mb-1">Confirm your plan</h1>
          <p className="text-sm text-ink-500 mb-6">Enter your details below. Our team will confirm final pricing before any payment is processed.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full Name" required>
                <Input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="John Doe" />
              </Field>
              <Field label="Company Name" required>
                <Input value={form.company} onChange={(e) => update('company', e.target.value)} placeholder="Acme Holdings" />
              </Field>
            </div>
            <Field label="Work Email" required>
              <Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="john.doe@company.com" />
            </Field>

            <div>
              <label className="block text-sm text-ink-700 mb-1.5">Billing Cycle</label>
              <div className="grid grid-cols-2 gap-3">
                {['Annual', 'Monthly'].map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setBillingCycle(c)}
                    className={`px-3 py-2.5 rounded-md border text-sm transition-colors ${
                      billingCycle === c ? 'border-brand-green bg-brand-green/5 text-brand-greenDark font-medium' : 'border-surface-border text-ink-500'
                    }`}
                  >
                    {c} {c === 'Annual' && <span className="text-xs text-status-approved ml-1">Save 15%</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-surface-border pt-5">
              <p className="text-sm font-medium text-ink-900 mb-3 flex items-center gap-2"><Lock size={14} className="text-ink-300" /> Payment details</p>
              <div className="space-y-4">
                <Field label="Card Number" required>
                  <Input value={form.card} onChange={(e) => update('card', e.target.value)} placeholder="4242 4242 4242 4242" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Expiry" required>
                    <Input value={form.expiry} onChange={(e) => update('expiry', e.target.value)} placeholder="MM/YY" />
                  </Field>
                  <Field label="CVC" required>
                    <Input value={form.cvc} onChange={(e) => update('cvc', e.target.value)} placeholder="123" />
                  </Field>
                </div>
              </div>
            </div>

            <button type="submit" className="w-full py-3 rounded-md bg-brand-green text-white text-sm font-medium hover:bg-brand-greenDark transition-colors">
              Request {plan.name} Plan
            </button>
            <p className="text-xs text-ink-300 text-center">No charge is made until a Deloitte account manager confirms your quote.</p>
          </form>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-6 h-fit">
          <p className="text-xs text-ink-500 font-medium mb-1">Selected Plan</p>
          <h2 className="text-2xl font-medium text-ink-900 mb-1">{plan.name}</h2>
          <p className="text-sm text-ink-500 mb-5">{plan.tagline}</p>
          <ul className="space-y-2.5">
            {plan.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-ink-700">
                <CheckCircle2 size={14} className="text-status-approved shrink-0 mt-0.5" /> {f}
              </li>
            ))}
          </ul>
          <div className="border-t border-surface-border mt-5 pt-5 flex items-center justify-between">
            <span className="text-sm text-ink-500">Billing</span>
            <span className="text-sm font-medium text-ink-900">{billingCycle}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm text-ink-700 mb-1.5">
        {label}{required && <span className="text-status-pending">*</span>}
      </label>
      {children}
    </div>
  )
}

function Input(props) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2.5 rounded-md border border-surface-border bg-white text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
    />
  )
}
