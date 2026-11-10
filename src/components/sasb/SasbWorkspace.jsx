import { AlertTriangle } from 'lucide-react'
import DisclosureWorkspace from '../gri/DisclosureWorkspace.jsx'

/** Upload Center → SASB: the chosen industries' metrics (the shared disclosure workspace). */
export default function SasbWorkspace({ pushToast }) {
  return (
    <div className="space-y-3">
      <StarterNote />
      <DisclosureWorkspace fw="sasb" pushToast={pushToast} />
    </div>
  )
}

export function StarterNote() {
  return (
    <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
      <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
      SASB starter set: metric codes and descriptions are VISTA's summary of the SASB Standards. Check them against the
      current Standards (IFRS Foundation) before a client report is issued.
    </p>
  )
}
