import { Outlet } from 'react-router-dom'
import { LayoutDashboard, SlidersHorizontal, UploadCloud, ListChecks } from 'lucide-react'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'
import { currentConsultant } from '../data/mockData'

const navItems = [
  { to: '/consultant/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/consultant/control-center', label: 'Control Center', icon: SlidersHorizontal },
  { to: '/consultant/upload-center', label: 'Upload Center', icon: UploadCloud },
  { to: '/consultant/review-center', label: 'Review Center', icon: ListChecks },
]

export default function ConsultantLayout() {
  return (
    <div className="h-screen flex flex-col bg-surface-muted">
      <Topbar user={currentConsultant} />
      <div className="flex flex-1 min-h-0">
        <Sidebar items={navItems} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto px-8 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
