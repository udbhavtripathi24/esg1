import { Outlet } from 'react-router-dom'
import {
  LayoutDashboard, UploadCloud, ListChecks, BarChart3, LineChart,
  FileText, ShieldCheck, ClipboardList, UserCog, Settings,
} from 'lucide-react'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useCompanies } from '../hooks/useCompanies.js'

const navItems = [
  { to: '/client/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/client/upload-center', label: 'Upload Center', icon: UploadCloud },
  { to: '/client/review-center', label: 'Review Center', icon: ListChecks },
  { to: '/client/benchmarking', label: 'Benchmarking', icon: BarChart3 },
  { to: '/client/analytics', label: 'Analytics', icon: LineChart },
  { to: '/client/reporting', label: 'Reporting', icon: FileText },
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
  // A client user sees exactly one company: their own
  const companies = useCompanies({ page: 1, page_size: 1 })
  const companyName = companies.data?.items?.find((c) => c.id === user?.company_id)?.name

  return (
    <div className="h-screen flex flex-col bg-surface-muted">
      <Topbar 
        clientName={companyName || null}
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
