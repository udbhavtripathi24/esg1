import { AlertTriangle } from 'lucide-react'
import { Button } from './ui.jsx'

/**
 * Reusable error display. Color convention (status-pending text, red-50/
 * red-100 background/border) matches the existing auth-error styling
 * already used in Login.jsx, kept consistent rather than inventing a new
 * error palette.
 */
export default function ErrorState({
  message = 'Something went wrong. Please try again.',
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 border border-red-100 bg-red-50 rounded-lg">
      <div className="w-10 h-10 rounded-md bg-white flex items-center justify-center text-status-pending mb-3">
        <AlertTriangle size={20} />
      </div>
      <p className="text-sm text-status-pending">{message}</p>
      {onRetry && (
        <div className="mt-4">
          <Button variant="ghost" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  )
}
