import { SECTION_STATUS } from './format.js'

export default function StatusBadge({ status }) {
  const s = SECTION_STATUS[status] || SECTION_STATUS.draft
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium whitespace-nowrap ${s.cls}`}>
      {s.label}
    </span>
  )
}
