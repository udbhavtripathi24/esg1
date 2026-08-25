import { statusTint } from '../data/mockData'

export function StatusPill({ status }) {
  const cls = statusTint[status] || 'bg-ink-100 text-ink-500'
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-medium whitespace-nowrap ${cls}`}>
      {status}
    </span>
  )
}

export function Card({ title, subtitle, action, icon: Icon, children, className = '', padded = true }) {
  const hasHeader = Boolean(title || action)
  return (
    <div className={`bg-white border border-surface-border rounded-lg ${className}`}>
      {hasHeader && (
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div>
            {title && (
              <h3 className="text-xs font-semibold text-ink-900 flex items-center gap-1.5">
                {Icon && <Icon size={13} className="text-brand-green shrink-0" />}
                {title}
              </h3>
            )}
            {subtitle && <p className="text-[10px] text-ink-500 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={padded ? `px-5 pb-5 ${hasHeader ? '' : 'pt-5'}` : ''}>{children}</div>
    </div>
  )
}

export function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed'
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-sm',
  }
  const variants = {
    primary: 'bg-brand-green text-white hover:bg-brand-greenDark',
    dark: 'bg-brand-dark text-white hover:bg-brand-darker',
    outline: 'border border-brand-green text-ink-900 hover:bg-brand-green/5',
    ghost: 'border border-surface-border text-ink-700 hover:bg-surface-muted',
    subtle: 'bg-brand-green/10 text-brand-greenDark hover:bg-brand-green/20',
  }
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}

export function Field({ label, required, optional, children }) {
  return (
    <div>
      {label && (
        <label className="block text-[8px] text-ink-700 mb-1.5">
          {label}
          {required && <span className="text-status-pending">*</span>}
          {optional && <span className="text-ink-300 text-[8px] ml-1">Optional</span>}
        </label>
      )}
      {children}
    </div>
  )
}

export function Input(props) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2 rounded-md border border-surface-border bg-white text-[10px] text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green ${props.className || ''}`}
    />
  )
}

export function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className={`w-full px-3 py-2 rounded-md border border-surface-border bg-white text-[10px] text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green ${props.className || ''}`}
    >
      {children}
    </select>
  )
}

export function ProgressBar({ pct, color = '#64BC44', track = 'bg-ink-100', height = 'h-1.5' }) {
  return (
    <div className={`w-full ${track} rounded-full ${height} overflow-hidden`}>
      <div className={`${height} rounded-full`} style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  )
}

export function KpiTile({ icon: Icon, label, value, unit, delta, trend, tint = 'green' }) {
  const tints = {
    green: 'bg-brand-green/10 text-brand-greenDark',
    purple: 'bg-purple-100 text-purple-600',
    blue: 'bg-blue-100 text-blue-600',
    gray: 'bg-ink-100 text-ink-500',
    amber: 'bg-amber-100 text-amber-600',
  }
  return (
    <div className="bg-white border border-surface-border rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className={`w-8 h-8 rounded-md flex items-center justify-center ${tints[tint]}`}>
          <Icon size={16} />
        </div>
        {delta && (
          <span className="text-xs font-medium text-status-approved">
            {trend === 'up' ? '↗' : '↘'} {delta}
          </span>
        )}
      </div>
      <div className="mt-3 text-2xl font-semibold text-ink-900">
        {value}
        {unit && <span className="text-sm font-normal text-ink-500 ml-1">{unit}</span>}
      </div>
      <div className="text-xs text-ink-500 mt-0.5">{label}</div>
    </div>
  )
}

export function Avatar({ name, size = 'w-8 h-8' }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
  return (
    <div className={`${size} rounded-full bg-ink-100 text-ink-700 text-xs font-medium flex items-center justify-center shrink-0`}>
      {initials}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 border border-dashed border-surface-border rounded-lg">
      {Icon && (
        <div className="w-10 h-10 rounded-md bg-surface-muted flex items-center justify-center text-ink-300 mb-3">
          <Icon size={20} />
        </div>
      )}
      {title && <p className="text-sm text-ink-500">{title}</p>}
      {subtitle && <p className="text-xs text-ink-300 mt-1">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}