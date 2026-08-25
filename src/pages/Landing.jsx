import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, ChevronDown, Check, Cloud, UserCheck, Route as RouteIcon, ShieldCheck,
  TrendingUp, Clock, Database, BarChart3, ClipboardCheck, Zap, Building2,
  Landmark, Factory, Home, Wrench, ShoppingBag,
} from 'lucide-react'
import { securityFeatures, faqItems, testimonials, pricingTiers, industries } from '../data/mockData'
import deloitteLogo from '../assets/deloitte-logo.svg'

const iconMap = { cloud: Cloud, 'user-check': UserCheck, route: RouteIcon, 'shield-check': ShieldCheck, 'trending-up': TrendingUp, clock: Clock }
const industryIconMap = { Energy: Zap, 'Financial Services': Landmark, Manufacturing: Factory, 'Real Estate': Home, Infrastructure: Wrench, Consumer: ShoppingBag }

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between gap-4 px-4 sm:px-8 lg:px-16 py-4 sm:py-6 border-b border-surface-border sticky top-0 bg-white z-30">
        <div className="flex items-center gap-2 shrink-0">
          <img src={deloitteLogo} alt="Deloitte" className="h-7 w-auto" />
          <span className="text-ink-700 font-medium text-xl tracking-wide uppercase">Vista</span>
        </div>

        <nav className="hidden lg:flex items-center gap-8 text-ink-700 text-[15px]">
          <a href="#why" className="hover:text-ink-900">Features</a>
          <span className="text-ink-300">|</span>
          <a href="#pricing" className="hover:text-ink-900">Pricing</a>
          <span className="text-ink-300">|</span>
          <a href="#contact" className="hover:text-ink-900">Contact</a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button onClick={() => navigate('/login')} className="px-3 sm:px-5 py-2 rounded-md border border-brand-green text-ink-900 text-xs sm:text-sm font-medium hover:bg-brand-green/5 transition-colors whitespace-nowrap">
            Log In
          </button>
          <a href="#contact" className="px-3 sm:px-5 py-2 rounded-md bg-brand-dark text-white text-xs sm:text-sm font-medium hover:bg-brand-darker transition-colors whitespace-nowrap">
            Contact us
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="grid md:grid-cols-2 gap-10 md:gap-12 items-center px-4 sm:px-8 lg:px-16 py-12 md:py-20 max-w-[1440px] mx-auto">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-[44px] leading-[1.15] font-normal text-ink-900">
            Simplify ESG Data Management, Reporting and Insights
          </h1>
          <p className="mt-6 text-ink-500 text-[15px] leading-relaxed max-w-md">
            Manage ESG data, reporting, benchmarking and assessments through a
            Deloitte-managed platform designed to reduce cost, effort and
            implementation complexity.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
            <button onClick={() => navigate('/login')} className="flex items-center gap-2 px-6 py-3 rounded-md bg-brand-green text-white text-sm font-medium hover:bg-brand-greenDark transition-colors">
              Get Started
              <ArrowRight size={16} />
            </button>
            <a href="#contact" className="px-6 py-3 rounded-md border border-brand-green text-ink-900 text-sm font-medium hover:bg-brand-green/5 transition-colors">
              Request Demo
            </a>
          </div>
        </div>

        <div className="relative aspect-[8/5] border border-ink-900 bg-white overflow-hidden">
          <svg viewBox="0 0 400 250" className="w-full h-full">
            <rect x="0" y="0" width="400" height="250" fill="#FAFAF8" />

            {/* orbiting data-point rings, representing connected ESG frameworks */}
            <circle cx="200" cy="125" r="95" fill="none" stroke="#E5E5E0" strokeWidth="1" />
            <circle cx="200" cy="125" r="70" fill="none" stroke="#E5E5E0" strokeWidth="1" />

            {/* globe */}
            <circle cx="200" cy="125" r="52" fill="#64BC44" fillOpacity="0.08" />
            <circle cx="200" cy="125" r="52" fill="none" stroke="#0F1E0A" strokeWidth="1.5" />
            <ellipse cx="200" cy="125" rx="52" ry="20" fill="none" stroke="#0F1E0A" strokeOpacity="0.35" strokeWidth="1" />
            <ellipse cx="200" cy="125" rx="24" ry="52" fill="none" stroke="#0F1E0A" strokeOpacity="0.35" strokeWidth="1" />
            <path d="M155,110 Q175,95 200,100 Q220,103 215,120 Q205,135 180,130 Q160,128 155,110 Z" fill="#64BC44" fillOpacity="0.55" />
            <path d="M210,140 Q230,135 240,150 Q238,165 220,163 Q205,158 210,140 Z" fill="#64BC44" fillOpacity="0.4" />
            <path d="M170,145 Q185,150 182,165 Q170,172 160,162 Q158,150 170,145 Z" fill="#64BC44" fillOpacity="0.4" />

            {/* small growth leaf accent at the top */}
            <path d="M196,55 C196,40 214,34 222,34 C222,48 210,58 196,55 Z" fill="#64BC44" />
            <path d="M196,55 C196,45 184,40 176,41 C177,52 186,59 196,55 Z" fill="#64BC44" fillOpacity="0.7" />
            <line x1="200" y1="73" x2="196" y2="55" stroke="#0F1E0A" strokeWidth="1.5" />

            {/* orbiting nodes for E / S / G */}
            <style>{`
              @keyframes esgNodePulse {
                0%, 100% { r: 5; opacity: 1; }
                50% { r: 8; opacity: 0.55; }
              }
              .esg-node { animation: esgNodePulse 2.4s ease-in-out infinite; transform-origin: center; }
            `}</style>
            <circle cx="200" cy="30" r="5" fill="#64BC44" className="esg-node" style={{ animationDelay: '0s' }} />
            <circle cx="325" cy="125" r="5" fill="#3B82F6" className="esg-node" style={{ animationDelay: '0.5s' }} />
            <circle cx="88" cy="180" r="5" fill="#8B5CF6" className="esg-node" style={{ animationDelay: '1s' }} />
            <line x1="200" y1="30" x2="200" y2="73" stroke="#64BC44" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="2 3" />
            <line x1="325" y1="125" x2="252" y2="125" stroke="#3B82F6" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="2 3" />
            <line x1="88" y1="180" x2="163" y2="150" stroke="#8B5CF6" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="2 3" />

            <text x="200" y="16" textAnchor="middle" fontSize="9" fill="#0F1E0A" fillOpacity="0.6">Environmental</text>
            <text x="325" y="112" textAnchor="middle" fontSize="9" fill="#0F1E0A" fillOpacity="0.6">Social</text>
            <text x="88" y="196" textAnchor="middle" fontSize="9" fill="#0F1E0A" fillOpacity="0.6">Governance</text>
          </svg>
        </div>
      </section>

      {/* Why this platform */}
      <section id="why" className="px-4 sm:px-8 lg:px-16 py-16 md:py-24 bg-surface-muted/40">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-normal text-ink-900">Why This Platform?</h2>
          <p className="mt-4 text-ink-500 text-[15px]">Enterprise ESG management simplified through Deloitte expertise</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {[
            { icon: Database, title: 'Centralized Data Management', desc: 'One platform for all ESG data collection, validation and storage across your organization.' },
            { icon: BarChart3, title: 'Benchmarking Insights', desc: 'Real-time comparisons against industry peers and best-in-class performers.' },
            { icon: ClipboardCheck, title: 'Due Diligence Assessments', desc: 'Structured assessments for materiality, maturity, climate risk and supplier due diligence.' },
            { icon: ShieldCheck, title: 'Deloitte-Verified Assurance', desc: 'Every dataset is reviewed and verified by Deloitte ESG specialists before reporting.' },
          ].map((f) => (
            <div key={f.title} className="bg-white border border-surface-border rounded-lg p-5">
              <div className="w-10 h-10 rounded-md bg-brand-green/10 text-brand-greenDark flex items-center justify-center mb-3">
                <f.icon size={18} />
              </div>
              <h3 className="font-semibold text-ink-900 text-sm">{f.title}</h3>
              <p className="text-xs text-ink-500 mt-1.5 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Industries */}
      <section className="px-4 sm:px-8 lg:px-16 py-16 md:py-20">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl sm:text-4xl font-normal text-ink-900">Built for Every Industry</h2>
          <p className="mt-4 text-ink-500 text-[15px]">Tailored KPI catalogues and frameworks for your sector</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
          {industries.map((ind) => {
            const Icon = industryIconMap[ind] || Building2
            return (
              <div key={ind} className="border border-surface-border rounded-lg p-4 text-center hover:border-brand-green/40 transition-colors">
                <div className="w-9 h-9 rounded-md bg-surface-muted flex items-center justify-center mx-auto mb-2 text-ink-700">
                  <Icon size={16} />
                </div>
                <p className="text-sm font-medium text-ink-900">{ind}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-4 sm:px-8 lg:px-16 py-16 md:py-24 bg-surface-muted/40">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-normal text-ink-900">Simple, Transparent Pricing</h2>
          <p className="mt-4 text-ink-500 text-[15px]">Choose the plan that fits your organization's ESG maturity</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`group bg-white rounded-lg p-6 flex flex-col h-full transition-colors ${
                tier.mostPopular
                  ? 'border-2 border-brand-green shadow-md'
                  : 'border border-surface-border hover:border-brand-green hover:bg-brand-green/5'
              }`}
            >
              {tier.mostPopular && (
                <span className="self-start mb-3 px-2.5 py-1 rounded-full bg-brand-green text-white text-[10px] font-semibold">Most Popular</span>
              )}
              <h3 className="text-2xl font-medium text-ink-900">{tier.name}</h3>
              <p className="text-sm text-ink-500 mt-1 mb-5">{tier.tagline}</p>
              <ul className="space-y-2.5 mb-6 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ink-700">
                    <Check size={15} className="text-status-approved shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <a
                href="#contact"
                className={`w-full py-2.5 rounded-md text-sm font-medium transition-colors text-center inline-block ${
                  tier.mostPopular
                    ? 'bg-brand-green text-white hover:bg-brand-greenDark'
                    : 'border border-surface-border text-ink-900 group-hover:bg-brand-green group-hover:text-white group-hover:border-brand-green'
                }`}
              >
                Contact us for pricing
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Security */}
      <section className="px-4 sm:px-8 lg:px-16 py-16 md:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-normal text-ink-900">Enterprise-Grade Security</h2>
          <p className="mt-4 text-ink-500 text-[15px]">Your ESG data is protected with the highest security standards</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {securityFeatures.map((s) => {
            const Icon = iconMap[s.icon]
            return (
              <div key={s.title} className="bg-white border border-surface-border rounded-lg p-5">
                <div className="w-10 h-10 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <Icon size={18} />
                </div>
                <h3 className="font-semibold text-ink-900 text-sm">{s.title}</h3>
                <p className="text-xs text-ink-500 mt-1.5 leading-relaxed">{s.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 sm:px-8 lg:px-16 py-16 md:py-20 bg-surface-muted/40">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-normal text-ink-900">Results That Matter</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {testimonials.map((t) => {
            const Icon = iconMap[t.icon]
            return (
              <div key={t.title} className="bg-white border border-surface-border rounded-lg p-6">
                <div className="w-10 h-10 rounded-md bg-brand-green/10 text-brand-greenDark flex items-center justify-center mb-3">
                  <Icon size={18} />
                </div>
                <h3 className="font-semibold text-ink-900">{t.title}</h3>
                <p className="text-sm text-ink-500 mt-2 leading-relaxed">{t.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 sm:px-8 lg:px-16 py-16 md:py-20">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl sm:text-4xl font-normal text-ink-900">Common Questions</h2>
        </div>
        <div className="max-w-3xl mx-auto space-y-3">
          {faqItems.map((item, i) => (
            <FaqRow key={i} item={item} defaultOpen={i === 0} />
          ))}
        </div>
      </section>

      {/* Contact / Request Demo */}
      <section id="contact" className="px-4 sm:px-8 lg:px-16 py-16 md:py-24 bg-brand-dark text-white">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-3xl sm:text-4xl font-normal">Speak with an ESG Specialist</h2>
            <p className="mt-4 text-white/70 text-[15px] leading-relaxed">
              Tell us about your organization and reporting needs — a Deloitte ESG consultant will follow up to schedule a personalized walkthrough.
            </p>
          </div>
          <ContactForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 sm:px-8 lg:px-16 py-10 border-t border-surface-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={deloitteLogo} alt="Deloitte" className="h-5 w-auto brightness-0 invert" />
            <span className="text-white/70 font-medium text-base tracking-wide uppercase">Vista</span>
          </div>
          <p className="text-xs text-ink-300">© 2026 Deloitte. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function FaqRow({ item, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-surface-border rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left">
        <span className="text-sm font-medium text-ink-900">{item.q}</span>
        <ChevronDown size={16} className={`text-ink-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="px-5 pb-4 text-sm text-ink-500 leading-relaxed">{item.a}</p>}
    </div>
  )
}

function ContactForm() {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-lg p-6 text-ink-900">
        <p className="font-semibold">Thanks — we'll be in touch shortly.</p>
        <p className="text-sm text-ink-500 mt-1">A Deloitte ESG consultant will reach out within 1-2 business days.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <input required placeholder="John Doe*" className="px-3 py-2.5 rounded-md border border-surface-border text-sm placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-green/20" />
        <input required placeholder="Company Name*" className="px-3 py-2.5 rounded-md border border-surface-border text-sm placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-green/20" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input required placeholder="Head of Sustainability*" className="px-3 py-2.5 rounded-md border border-surface-border text-sm placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-green/20" />
        <input required type="email" placeholder="john.doe@xyz.com*" className="px-3 py-2.5 rounded-md border border-surface-border text-sm placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-green/20" />
      </div>
      <input required placeholder="+91 919191xxxx*" className="w-full px-3 py-2.5 rounded-md border border-surface-border text-sm placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-green/20" />
      <input placeholder="Eg: AWS, SASB, GRI" className="w-full px-3 py-2.5 rounded-md border border-surface-border text-sm placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-green/20" />
      <button type="submit" className="w-full py-3 rounded-md bg-brand-green text-white text-sm font-medium hover:bg-brand-greenDark transition-colors">
        Submit
      </button>
    </form>
  )
}
