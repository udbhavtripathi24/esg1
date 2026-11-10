import { Download, ExternalLink, Paperclip } from 'lucide-react'
import { fileDownload } from '../../api/surveys.js'
import { openSignedFile, showFileInTab } from './util.js'
import { errText } from './logic.js'

/**
 * One uploaded survey file.
 * - The name opens a PDF or image in a new browser tab; other types
 *   (Word, Excel, CSV) download, because browsers can't show them.
 * - The download icon always downloads.
 * ``onError`` receives a message, or null when a new attempt starts.
 */
export default function FileLink({ surveyId, file, onError }) {
  const download = async () => {
    onError?.(null)
    try {
      const r = await fileDownload(surveyId, file.id)
      openSignedFile(r.url, r.filename || file.filename)
    } catch (e) {
      onError?.(errText(e, 'Could not download the file'))
    }
  }
  const open = async () => {
    if (!file.viewable) return download()
    onError?.(null)
    try {
      await showFileInTab(() => fileDownload(surveyId, file.id, { inline: true }))
    } catch (e) {
      onError?.(errText(e, 'Could not open the file'))
    }
  }
  return (
    <span className="inline-flex items-center gap-1.5 min-w-0 max-w-full">
      <Paperclip size={12} className="text-ink-300 shrink-0" aria-hidden />
      <button type="button" className="text-brand-greenDark hover:underline truncate text-left" onClick={open}
              title={file.viewable ? 'Open in a new tab' : 'Download'}>
        {file.filename}
      </button>
      {file.viewable && <ExternalLink size={10} className="text-ink-300 shrink-0" aria-hidden />}
      <button type="button" onClick={download} aria-label={`Download ${file.filename}`} title="Download"
              className="p-0.5 rounded text-ink-500 hover:text-ink-900 hover:bg-surface-muted shrink-0">
        <Download size={12} />
      </button>
    </span>
  )
}
