import { useAuth } from '../../context/AuthContext.jsx'
import { API_ORIGIN } from '../../api/client.js'

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

/**
 * Downloads a file from a signed URL the API handed out.
 * Locally the URL is a path on the API ("/api/v1/files/signed/…"), so it must
 * be resolved against the API's address, not the web app's: opened as is, it
 * would land on the web app (localhost:5173) and show nothing. In the cloud
 * it is already a full https:// address. An <a download> click also works
 * after an await, where window.open would be stopped by the pop-up blocker.
 */
export function openSignedFile(url, filename) {
  const a = document.createElement('a')
  a.href = fileHref(url)
  if (filename) a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/** A signed link as a full address: local links are paths on the API. */
export function fileHref(url) {
  return /^https?:\/\//.test(url) ? url : `${API_ORIGIN}${url}`
}

/**
 * Opens a file in a new tab. The tab is opened during the click, which the
 * pop-up blocker allows, and is pointed at the signed link once the API has
 * answered. If the API says the file can't be shown, the tab closes and the
 * file downloads instead.
 */
export async function showFileInTab(getLink) {
  const tab = window.open('', '_blank')
  if (tab) {
    tab.opener = null
    try {
      tab.document.title = 'Opening…'
      tab.document.body.textContent = 'Opening the file…'
    } catch { /* not ours to write to: fine */ }
  }
  try {
    const r = await getLink()
    if (r.inline && tab) {
      tab.location.replace(fileHref(r.url))
      return
    }
    tab?.close()
    openSignedFile(r.url, r.filename)
  } catch (e) {
    tab?.close()
    throw e
  }
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
