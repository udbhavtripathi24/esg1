export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">{title}</h1>
        {subtitle && <p className="text-xs text-ink-500 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}