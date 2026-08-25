import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, LogOut, Settings, ChevronDown, CheckCircle2, AlertCircle, FileText, Settings as SettingsIcon, TrendingUp } from 'lucide-react'
import { Avatar } from './ui.jsx'
import { notifications as notificationsSeed } from '../data/mockData'
import deloitteLogo from '../assets/deloitte-logo.svg'

const notificationIcons = {
  'check-circle': CheckCircle2,
  'alert-circle': AlertCircle,
  'file-text': FileText,
  'settings': SettingsIcon,
  'trending-up': TrendingUp,
}

const notificationColors = {
  review: 'text-status-approved',
  action: 'text-status-pending',
  info: 'text-blue-600',
  system: 'text-ink-500',
}

export default function Topbar({ clientName, user, placeholder = 'Search clients, consultants........', settingsPath }) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState(notificationsSeed)

  const unreadCount = notifications.filter(n => !n.read).length

  function handleLogout() {
    setMenuOpen(false)
    navigate('/login')
  }

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  function markOneAsRead(id) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  return (
    <header className="h-16 border-b border-surface-border bg-white flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-2 shrink-0">
        <img src={deloitteLogo} alt="Deloitte" className="h-6 w-auto" />
        <span className="text-ink-700 font-normal text-lg">VISTA</span>
        {clientName && (
          <>
            <span className="text-ink-300 font-normal mx-1">|</span>
            <span className="text-ink-700 font-normal text-base">{clientName}</span>
          </>
        )}
      </div>

      <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            placeholder={placeholder}
            className="w-full pl-9 pr-3 py-2 rounded-md border border-surface-border bg-surface-muted text-sm placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-green/20"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <div className="relative">
          <button 
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative text-ink-700 hover:text-ink-900"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-green text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 mt-2 w-96 bg-white border border-surface-border rounded-md shadow-lg z-40 max-h-[500px] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-ink-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-xs text-ink-500">{unreadCount} unread</span>
                  )}
                </div>
                <div className="overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell size={32} className="mx-auto text-ink-300 mb-2" />
                      <p className="text-sm text-ink-500">No notifications</p>
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      const Icon = notificationIcons[notif.icon] || Bell
                      const colorClass = notificationColors[notif.type] || 'text-ink-500'
                      
                      return (
                        <div
                          key={notif.id}
                          className={`px-4 py-3 border-b border-surface-border hover:bg-surface-muted cursor-pointer transition-colors ${
                            !notif.read ? 'bg-brand-green/5' : ''
                          }`}
                          onClick={() => markOneAsRead(notif.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 ${colorClass}`}>
                              <Icon size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p className={`text-xs font-semibold ${!notif.read ? 'text-ink-900' : 'text-ink-700'}`}>
                                  {notif.title}
                                </p>
                                {!notif.read && (
                                  <span className="w-2 h-2 rounded-full bg-brand-green shrink-0 mt-1" />
                                )}
                              </div>
                              <p className="text-[10px] text-ink-500 leading-relaxed mb-1">
                                {notif.message}
                              </p>
                              <p className="text-[9px] text-ink-300">{notif.time}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="px-4 py-2.5 border-t border-surface-border">
                    <button
                      onClick={markAllAsRead}
                      disabled={unreadCount === 0}
                      className="text-xs text-brand-green hover:text-brand-greenDark font-medium w-full text-center disabled:text-ink-300 disabled:cursor-not-allowed"
                    >
                      Mark all as read
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2">
            <span className="text-sm text-ink-900 hidden sm:inline">{user.name}</span>
            <Avatar name={user.name} />
            <ChevronDown size={14} className={`text-ink-400 transition-transform hidden sm:block ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white border border-surface-border rounded-md shadow-lg z-40 py-1">
                <div className="px-4 py-3 border-b border-surface-border">
                  <p className="text-sm font-medium text-ink-900">{user.name}</p>
                  {user.email && <p className="text-xs text-ink-500 truncate">{user.email}</p>}
                  {user.role && <p className="text-xs text-ink-300 mt-0.5">{user.role}</p>}
                </div>
                {settingsPath && (
                  <button
                    onClick={() => { setMenuOpen(false); navigate(settingsPath) }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-ink-700 hover:bg-surface-muted"
                  >
                    <Settings size={14} /> Settings
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-status-pending hover:bg-surface-muted"
                >
                  <LogOut size={14} /> Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}