import { Paperclip } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useSectionEvidence } from '../../hooks/useAssurance.js'
import { downloadEvidence } from '../../api/assurance.js'
import { EvidenceList, EvidenceUploader } from '../assurance/parts.jsx'
import { errMessage } from '../assurance/format.js'

/**
 * Supporting documents for one BRSR section (payroll extracts, bills,
 * policies). Attached while the section is being prepared; the assurer and
 * Deloitte's reviewer see them alongside the figures, and they go into the
 * assurance pack with their checksums.
 */
export default function SectionEvidence({ setId, code, detail, questions, pushToast }) {
  const { user, hasPermission } = useAuth()
  const ev = useSectionEvidence(setId, code)
  const canUpload = detail.editable && hasPermission('file:upload')
  const files = detail.evidence || []
  const picker = questions.filter((q) => !q.helper).map((q) => ({
    id: q.id,
    label: `${q.number && q.number !== '—' ? `Q${q.number}` : q.id} — ${String(q.prompt).slice(0, 60)}`,
  }))

  return (
    <div id={`evidence-${code}`} className="bg-white border border-surface-border rounded-lg p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h3 className="text-[11px] font-semibold text-ink-900 flex items-center gap-1.5">
          <Paperclip size={12} /> Supporting evidence <span className="font-normal text-ink-500">({files.length})</span>
        </h3>
        {!canUpload && files.length > 0 && <span className="text-[9px] text-ink-500">Locked while the section is under review</span>}
      </div>
      <EvidenceList files={files}
        empty={canUpload ? 'Attach the documents behind these figures — they are what the reviewer and the assurer will check.' : 'No evidence attached.'}
        onDownload={(f) => downloadEvidence(f, { setId }).catch((e) => pushToast(errMessage(e, 'Download failed.')))}
        canWithdraw={(f) => canUpload && f.uploaded_by_id === user?.id && !f.for_assurance_request}
        onWithdraw={(f) => ev.withdraw.mutate(f.public_id, {
          onSuccess: () => pushToast(`Withdrew ${f.filename}.`),
          onError: (e) => pushToast(errMessage(e, 'Could not withdraw.')),
        })} />
      {canUpload && (
        <div className="mt-2">
          <EvidenceUploader questions={picker}
            onUpload={({ file, questionId }) => ev.upload.mutateAsync({ file, questionId }).then((r) => pushToast(`Attached ${r.filename}.`))} />
        </div>
      )}
    </div>
  )
}
