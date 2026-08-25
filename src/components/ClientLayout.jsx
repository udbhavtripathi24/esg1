import { Outlet } from 'react-router-dom'
import {
  LayoutDashboard, UploadCloud, ListChecks, BarChart3, LineChart,
  FileText, ShieldCheck, ClipboardList, MessageSquare, UserCog, Settings,
} from 'lucide-react'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'
import { currentClientUser } from '../data/mockData'

const navItems = [
  { to: '/client/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/client/upload-center', label: 'Upload Center', icon: UploadCloud },
  { to: '/client/review-center', label: 'Review Center', icon: ListChecks },
  { to: '/client/benchmarking', label: 'Benchmarking', icon: BarChart3 },
  { to: '/client/analytics', label: 'Analytics', icon: LineChart },
  { to: '/client/reporting', label: 'Reporting', icon: FileText },
  { to: '/client/assurance', label: 'Assurance', icon: ShieldCheck },
  { to: '/client/personalized-assessment', label: 'Assessment', icon: ClipboardList },
  { to: '/client/surveys', label: 'Surveys', icon: MessageSquare },
]

const bottomItems = [
  { to: '/client/admin-console', label: 'Admin Console', icon: UserCog },
  { to: '/client/settings', label: 'Settings', icon: Settings },
]

export default function ClientLayout() {
  return (
    <div className="h-screen flex flex-col bg-surface-muted">
      <Topbar clientName={currentClientUser.company} user={currentClientUser} settingsPath="/client/settings" />
      <div className="flex flex-1 min-h-0">
        <Sidebar items={navItems} bottomItems={bottomItems} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto px-8 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
