import { X } from 'lucide-react'
import { STATUS_META } from './logic.js'

export function Modal({ title, subtitle, onClose, children, footer, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-4 overflow-y-auto" onMouseDown={onClose}>
      <div className={`w-full ${wide ? 'max-w-4xl' : 'max-w-lg'} bg-white rounded-lg shadow-xl my-10`} onMouseDown={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-label={title}>
        <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-surface-border">
          <div>
            <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
            {subtitle && <p className="text-[11px] text-ink-500 mt-0.5">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="text-ink-300 hover:text-ink-700" aria-label="Close"><X size={16} /></button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-surface-border flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}

export function Drawer({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20" onMouseDown={onClose}>
      <div className="w-full max-w-xl h-full bg-white shadow-xl overflow-y-auto" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
          <button type="button" onClick={onClose} className="text-ink-300 hover:text-ink-700" aria-label="Close"><X size={16} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function Toggle({ checked, onChange, disabled, label, hint }) {
  return (
    <label className={`flex items-start gap-3 ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
      <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)}
        className={`mt-0.5 w-8 h-[18px] rounded-full shrink-0 transition-colors relative ${checked ? 'bg-brand-green' : 'bg-ink-100'}`}>
        <span className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-all ${checked ? 'left-[16px]' : 'left-[2px]'}`} />
      </button>
      <span>
        <span className="block text-[11px] font-medium text-ink-900">{label}</span>
        {hint && <span className="block text-[10px] text-ink-500 mt-0.5">{hint}</span>}
      </span>
    </label>
  )
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex gap-1 border-b border-surface-border mb-5 overflow-x-auto" role="tablist">
      {tabs.map((t) => (
        <button key={t.key} type="button" role="tab" aria-selected={value === t.key} onClick={() => onChange(t.key)}
          className={`px-3.5 py-2 text-xs font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
            value === t.key ? 'border-brand-green text-ink-900' : 'border-transparent text-ink-500 hover:text-ink-900'}`}>
          {t.label}
          {t.count !== undefined && t.count !== null && <span className="ml-1.5 text-[10px] text-ink-300">{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.draft
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${m.cls}`}>{m.label}</span>
}

export function KindBadge({ kind }) {
  return kind === 'assessment'
    ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-700">Assessment</span>
    : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-sky-50 text-sky-700">Survey</span>
}

export function Label({ children, hint }) {
  return (
    <span className="block text-[10px] font-medium text-ink-700 mb-1">
      {children}{hint && <span className="font-normal text-ink-300 ml-1">{hint}</span>}
    </span>
  )
}

