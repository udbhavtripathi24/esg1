import { Outlet } from 'react-router-dom'
import { LayoutDashboard, SlidersHorizontal, UploadCloud, ListChecks, ShieldCheck, ClipboardList } from 'lucide-react'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const navItems = [
  { to: '/consultant/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/consultant/control-center', label: 'Control Center', icon: SlidersHorizontal, clientWork: true },
  { to: '/consultant/upload-center', label: 'Upload Center', icon: UploadCloud, clientWork: true },
  { to: '/consultant/review-center', label: 'Review Center', icon: ListChecks, clientWork: true },
  { to: '/consultant/surveys', label: 'Surveys & Assessments', icon: ClipboardList, perm: 'assessment:manage', clientWork: true },
  { to: '/consultant/assurance', label: 'Assurance', icon: ShieldCheck, perm: 'assurance:read' },
]

export default function ConsultantLayout() {
  const { user, logout, hasPermission } = useAuth()
  // Independent assurance staff do not prepare or review client data, so
  // the client-work screens are hidden from them (the API refuses them anyway).
  const assuranceOnly = hasPermission('assurance:perform') && !hasPermission('dataset:create') &&
    !hasPermission('dataset:review')
  const items = navItems.filter((i) => (!i.perm || hasPermission(i.perm)) && !(assuranceOnly && i.clientWork))

  return (
    <div className="h-screen flex flex-col bg-surface-muted">
      <Topbar user={user} logout={logout} />
      <div className="flex flex-1 min-h-0">
        <Sidebar items={items} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto px-8 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
