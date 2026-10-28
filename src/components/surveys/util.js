import { useAuth } from '../../context/AuthContext.jsx'

export const inputCls = 'w-full px-2.5 py-1.5 rounded-md border border-surface-border bg-white text-[11px] text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green disabled:bg-surface-muted disabled:text-ink-500'

/** Downloads a Blob as a file. */
export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function csvCell(v) {
  const s = v === null || v === undefined ? '' : String(v)
  // Neutralise spreadsheet formulas in exported text
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/** Where the Surveys & Assessments screens live for the signed-in portal. */
export function useSurveysBase() {
  const { user } = useAuth()
  return user?.portal_type === 'deloitte' ? '/consultant/surveys' : '/client/surveys'
}
