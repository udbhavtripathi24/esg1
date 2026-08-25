import { useRef, useState } from 'react'
import { UploadCloud, FileText, X } from 'lucide-react'

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function FileDropzone({
  files,
  onFilesChange,
  accept = '.csv,.xlsx,.xls',
  hint = 'Supports CSV and Excel (.xlsx) files up to 25MB',
  compact = false,
  multiple = true,
}) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  function addFiles(fileList) {
    const incoming = Array.from(fileList)
    onFilesChange(multiple ? [...files, ...incoming] : incoming.slice(0, 1))
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }

  function removeFile(idx) {
    onFilesChange(files.filter((_, i) => i !== idx))
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border border-dashed rounded-lg flex flex-col items-center text-center cursor-pointer transition-colors ${
          compact ? 'py-6' : 'py-10'
        } ${dragOver ? 'border-brand-green bg-brand-green/5' : 'border-surface-border hover:border-ink-300'}`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <div className={`rounded-md bg-surface-muted flex items-center justify-center text-ink-300 mb-2 ${compact ? 'w-8 h-8' : 'w-10 h-10 mb-3'}`}>
          <UploadCloud size={compact ? 16 : 20} />
        </div>
        <p className={compact ? 'text-[8px] text-ink-700' : 'text-[8px] text-ink-700'}>
          Drop your file{multiple ? 's' : ''} here, or <span className="text-brand-green font-medium">browse</span>
        </p>
        <p className="text-[9px] text-ink-300 mt-1">{hint}</p>
      </div>

      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((f, i) => (
            <div key={`${f.name}-${i}`} className="flex items-center justify-between px-3 py-2 rounded-md border border-surface-border bg-surface-muted/40">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={14} className="text-ink-300 shrink-0" />
                <span className="text-xs text-ink-900 truncate">{f.name}</span>
                <span className="text-[9px] text-ink-300 shrink-0">{formatSize(f.size)}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                className="text-ink-300 hover:text-status-pending shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}