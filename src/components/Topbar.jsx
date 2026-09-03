import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, LogOut, Settings, ChevronDown, CheckCircle2, AlertCircle, FileText } from 'lucide-react'
import { Avatar } from './ui.jsx'
import LoadingState from './LoadingState.jsx'
import ErrorState from './ErrorState.jsx'
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '../hooks/useNotifications.js'
import deloitteLogo from '../assets/deloitte-logo.svg'

// Real event_type values, confirmed exhaustively via grep across the
// backend (not guessed) — new_assignment, data_approved, data_rejected,
// changes_requested. Same mapping pattern as roleColors/statusTint
// elsewhere in this app for real backend enums.
const eventTypeIcons = {
  new_assignment: FileText,
  data_approved: CheckCircle2,
  data_rejected: AlertCircle,
  changes_requested: AlertCircle,
}

const eventTypeColors = {
  new_assignment: 'text-blue-600',
  data_approved: 'text-status-approved',
  data_rejected: 'text-status-pending',
  changes_requested: 'text-status-pending',
}

function formatRelativeTime(isoString) {
  const then = new Date(isoString)
  const diffMs = Date.now() - then.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 30) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Topbar({ clientName, user, logout, placeholder = 'Search clients, consultants........', settingsPath }) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  const notificationsQuery = useNotifications({ page: 1, page_size: 20 })
  const notifications = notificationsQuery.data?.items || []
  // A dedicated, accurate unread count independent of pagination — the main
  // list above is capped at page_size:20 for display, but the unread badge
  // must reflect the TRUE total, so this queries unread_only with a minimal
  // page_size and reads the real .total the backend computes.
  const unreadCountQuery = useNotifications({ unread_only: true, page: 1, page_size: 1 })
  const unreadCount = unreadCountQuery.data?.total ?? 0

  const markOneRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  function handleLogout() {
    setMenuOpen(false)
    if (logout) {
      logout()
    }
    navigate('/login')
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
                  {notificationsQuery.isLoading ? (
                    <LoadingState label="Loading notifications…" />
                  ) : notificationsQuery.isError ? (
                    <ErrorState
                      message={notificationsQuery.error?.message || 'Could not load notifications.'}
                      onRetry={() => notificationsQuery.refetch()}
                    />
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell size={32} className="mx-auto text-ink-300 mb-2" />
                      <p className="text-sm text-ink-500">No notifications</p>
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      const Icon = eventTypeIcons[notif.event_type] || Bell
                      const colorClass = eventTypeColors[notif.event_type] || 'text-ink-500'

                      return (
                        <div
                          key={notif.id}
                          className={`px-4 py-3 border-b border-surface-border hover:bg-surface-muted cursor-pointer transition-colors ${
                            !notif.is_read ? 'bg-brand-green/5' : ''
                          }`}
                          onClick={() => { if (!notif.is_read) markOneRead.mutate(notif.id) }}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 ${colorClass}`}>
                              <Icon size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p className={`text-xs font-semibold ${!notif.is_read ? 'text-ink-900' : 'text-ink-700'}`}>
                                  {notif.title}
                                </p>
                                {!notif.is_read && (
                                  <span className="w-2 h-2 rounded-full bg-brand-green shrink-0 mt-1" />
                                )}
                              </div>
                              {notif.body && (
                                <p className="text-[10px] text-ink-500 leading-relaxed mb-1">
                                  {notif.body}
                                </p>
                              )}
                              <p className="text-[9px] text-ink-300">{formatRelativeTime(notif.created_at)}</p>
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
                      onClick={() => markAllRead.mutate()}
                      disabled={unreadCount === 0 || markAllRead.isPending}
                      className="text-xs text-brand-green hover:text-brand-greenDark font-medium w-full text-center disabled:text-ink-300 disabled:cursor-not-allowed"
                    >
                      {markAllRead.isPending ? 'Marking…' : 'Mark all as read'}
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