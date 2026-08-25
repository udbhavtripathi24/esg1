import { Construction } from 'lucide-react'
import PageHeader from './PageHeader.jsx'

export default function ComingSoon({ title, subtitle }) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />
      <div className="flex flex-col items-center justify-center text-center py-24 border border-dashed border-surface-border rounded-lg bg-white">
        <div className="w-12 h-12 rounded-md bg-surface-muted flex items-center justify-center text-ink-300 mb-3">
          <Construction size={22} />
        </div>
        <p className="text-sm text-ink-500">This screen is being built next.</p>
      </div>
    </div>
  )
}
