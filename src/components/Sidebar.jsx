import { NavLink } from 'react-router-dom'

export default function Sidebar({ items, bottomItems = [] }) {
  const linkCls = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
      isActive ? 'text-brand-green bg-brand-green/8 font-medium' : 'text-ink-700 hover:bg-surface-muted'
    }`

  return (
    <aside className="w-60 border-r border-surface-border bg-white flex flex-col shrink-0 h-full">
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} className={linkCls} end={item.end}>
            <item.icon size={18} className="shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      {bottomItems.length > 0 && (
        <div className="px-3 py-4 border-t border-surface-border space-y-1">
          {bottomItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkCls}>
              <item.icon size={18} className="shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </aside>
  )
}
