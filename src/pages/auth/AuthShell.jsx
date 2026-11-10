import { Link } from 'react-router-dom'
import deloitteLogo from '../../assets/deloitte-logo.svg'

/** The plain centred card used by the password pages. */
export default function AuthShell({ icon: Icon, title, subtitle, children, footer = true }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-muted/40 px-4 py-10">
      <div className="flex items-center gap-2 mb-6">
        <img src={deloitteLogo} alt="Deloitte" className="h-6 w-auto" />
        <span className="text-ink-500 text-xl">ESG</span>
      </div>
      <div className="w-full max-w-sm bg-white border border-surface-border rounded-lg shadow-sm p-7">
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-brand-green flex items-center justify-center text-white mb-4">
            <Icon size={20} />
          </div>
        )}
        <h1 className="text-xl font-semibold text-ink-900">{title}</h1>
        {subtitle && <p className="text-sm text-ink-500 mt-1.5">{subtitle}</p>}
        <div className="mt-5">{children}</div>
      </div>
      {footer && (
        <Link to="/login" className="mt-5 text-xs text-brand-green hover:underline">Back to sign in</Link>
      )}
    </div>
  )
}
