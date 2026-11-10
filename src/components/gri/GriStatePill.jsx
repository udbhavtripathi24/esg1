import { GRI_STATE } from './format.js'

export default function GriStatePill({ state }) {
  const s = GRI_STATE[state] || GRI_STATE.todo
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium whitespace-nowrap ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
      {s.label}
    </span>
  )
}
