import { Outlet } from 'react-router-dom'
import {
  LayoutDashboard, UploadCloud, ListChecks, BarChart3, LineChart,
  FileText, ShieldCheck, ClipboardList, UserCog, Settings, Leaf,
} from 'lucide-react'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const navItems = [
  { to: '/client/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/client/upload-center', label: 'Upload Center', icon: UploadCloud },
  { to: '/client/review-center', label: 'Review Center', icon: ListChecks },
  { to: '/client/benchmarking', label: 'Benchmarking', icon: BarChart3 },
  { to: '/client/analytics', label: 'Analytics', icon: LineChart },
  { to: '/client/reporting', label: 'Reporting', icon: FileText },
  { to: '/client/esg-demo-dashboard', label: 'ESG Dashboard (Demo)', icon: Leaf },
  { to: '/client/assurance', label: 'Assurance', icon: ShieldCheck },
  { to: '/client/surveys', label: 'Surveys & Assessments', icon: ClipboardList },
]

const bottomItems = [
  { to: '/client/admin-console', label: 'Admin Console', icon: UserCog, anyOf: ['user:read', 'audit:read', 'integration:manage'] },
  { to: '/client/settings', label: 'Settings', icon: Settings },
]

export default function ClientLayout() {
  const { user, logout, hasAnyPermission } = useAuth()
  // Admin Console only for people who can use one of its tabs
  const bottom = bottomItems.filter((i) => !i.anyOf || hasAnyPermission(...i.anyOf))

  return (
    <div className="h-screen flex flex-col bg-surface-muted">
      <Topbar 
        clientName={user?.company_id ? `Company ${user.company_id}` : null} 
        user={user} 
        logout={logout}
        settingsPath="/client/settings" 
      />
      <div className="flex flex-1 min-h-0">
        <Sidebar items={navItems} bottomItems={bottom} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto px-8 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
