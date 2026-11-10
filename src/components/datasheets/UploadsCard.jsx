import { useState } from 'react'
import { History, Loader2, MapPin, RotateCcw, Undo2, Upload } from 'lucide-react'
import { Button, Card } from '../ui.jsx'
import LoadingState from '../LoadingState.jsx'
import ErrorState from '../ErrorState.jsx'
import { Modal } from '../surveys/parts.jsx'
import { inputCls } from '../surveys/util.js'
import KpiChanges from '../review/KpiChanges.jsx'
import { useRevertPreview, useRevertUpload, useUploads, useWithdrawUpload } from '../../hooks/useDatasheets.js'

const TINT = {
  draft: 'bg-ink-100 text-ink-700',
  submitted: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-amber-100 text-amber-800',
  approved: 'bg-brand-green/15 text-brand-greenDark',
  rejected: 'bg-red-100 text-red-700',
  withdrawn: 'bg-ink-100 text-ink-500',
  reverted: 'bg-purple-100 text-purple-700',
}
const when = (s) => (s ? new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '')
const month = (d) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })

/**
 * Upload Center → Data sheets → Uploads: every upload of the year, and a way back from a wrong file.
 * Withdraw before approval (nothing reached the figures); Revert after approval (the figures go back to what
 * they were, with a reason). The correct file is then uploaded as usual (backend: app/datasheets/uploads.py).
 */
export default function UploadsCard({ fy, companyId, sheets, pushToast, onUpload }) {
  const q = useUploads(fy, companyId)
  const [withdrawing, setWithdrawing] = useState(null)
  const [reverting, setReverting] = useState(null)
  const shown = (q.data?.items || []).filter((i) => !sheets || sheets.has(i.sheet))
  return (
    <Card title="Uploads" icon={History} padded={false}
      subtitle={`Every data sheet upload for FY ${fy}. Uploaded the wrong file? Withdraw it before approval, or revert it after.`}>
      {q.isLoading ? <div className="px-5 pb-4"><LoadingState label="Loading uploads…" /></div>
        : q.isError ? <div className="px-5 pb-4"><ErrorState message="Could not load the uploads." onRetry={() => q.refetch()} /></div>
          : shown.length === 0 ? <p className="px-5 pb-4 text-[11px] text-ink-500">No uploads for FY {fy} yet.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="text-left text-ink-500 border-t border-surface-border">
                    <th className="font-medium px-5 py-2.5">Data sheet</th>
                    <th className="font-medium px-2 py-2.5">File</th>
                    <th className="font-medium px-2 py-2.5">Period</th>
                    <th className="font-medium px-2 py-2.5">Uploaded by</th>
                    <th className="font-medium px-2 py-2.5">Status</th>
                    <th className="font-medium px-5 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((u) => {
                    const ended = u.state === 'withdrawn' || u.state === 'reverted'
                    return (
                      <tr key={u.public_id} className={`border-t border-surface-border align-top ${ended ? 'text-ink-500' : ''}`}>
                        <td className={`px-5 py-2.5 font-medium ${ended ? 'text-ink-500' : 'text-ink-900'}`}>{u.sheet_title}</td>
                        <td className={`px-2 py-2.5 break-all max-w-[220px] ${ended ? 'line-through decoration-ink-300' : 'text-ink-700'}`}>{u.file || '—'}</td>
                        <td className="px-2 py-2.5 whitespace-nowrap">{month(u.period_start)} – {month(u.period_end)}</td>
                        <td className="px-2 py-2.5">{u.uploaded_by}<span className="block text-[9px] text-ink-300">{when(u.uploaded_at)}</span></td>
                        <td className="px-2 py-2.5 max-w-[240px]">
                          <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${TINT[u.state] || TINT.draft}`}>{u.state_label}</span>
                          {u.state === 'approved' && u.reviewed_by && <span className="block text-[9px] text-ink-300 mt-0.5">by {u.reviewed_by}</span>}
                          {ended && (
                            <span className="block text-[9px] text-ink-500 mt-0.5">
                              by {u.ended_by} · {when(u.ended_at)}{u.ended_note ? <> · “{u.ended_note}”</> : null}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-2.5">
                          <div className="flex justify-end gap-2">
                            {u.can_withdraw && (
                              <Button variant="ghost" size="sm" onClick={() => setWithdrawing(u)}
                                title="Take the upload back. Nothing has reached the figures yet.">
                                <Undo2 size={12} /> Withdraw
                              </Button>
                            )}
                            {u.can_revert && (
                              <Button variant="ghost" size="sm" onClick={() => setReverting(u)}
                                title="Stop counting this approved upload: figures go back to what they were before it.">
                                <RotateCcw size={12} /> Revert
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
      {withdrawing && (
        <WithdrawModal u={withdrawing} onClose={() => setWithdrawing(null)}
          onDone={() => { setWithdrawing(null); pushToast(`${withdrawing.sheet_title}: upload withdrawn. Upload the correct file when ready.`); onUpload?.(withdrawing.sheet) }} />
      )}
      {reverting && (
        <RevertModal u={reverting} onClose={() => setReverting(null)}
          onDone={() => { setReverting(null); pushToast(`${reverting.sheet_title}: approved data reverted. The figures are back to what they were.`); onUpload?.(reverting.sheet) }} />
      )}
    </Card>
  )
}

function WithdrawModal({ u, onClose, onDone }) {
  const m = useWithdrawUpload()
  const [note, setNote] = useState('')
  const [err, setErr] = useState(null)
  const go = async () => {
    setErr(null)
    try { await m.mutateAsync({ publicId: u.public_id, note: note.trim() }); onDone() } catch (e) { setErr(e.message || 'Could not withdraw') }
  }
  return (
    <Modal title={`Withdraw ${u.sheet_title} upload`} subtitle={`${u.file || 'File'} · ${u.state_label}`} onClose={onClose}
      footer={<>
        <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={go} disabled={m.isPending}>{m.isPending ? <Loader2 size={13} className="animate-spin" /> : <Undo2 size={13} />} Withdraw</Button>
      </>}>
      <div className="space-y-3 text-[11px] text-ink-700">
        <p>The upload is cancelled{u.state !== 'draft' ? ' and taken out of the reviewer’s queue' : ''}. It was never approved, so no figure changes.
          The file stays in the audit trail. You can then upload the correct file.</p>
        <label className="block"><span className="text-[10px] font-medium text-ink-500">Reason <span className="font-normal">(optional, shown to the reviewer)</span></span>
          <input className={`${inputCls} mt-1`} value={note} maxLength={500} placeholder="e.g. Uploaded the Pune file by mistake" onChange={(e) => setNote(e.target.value)} aria-label="Reason" /></label>
        {err && <p className="text-[10px] text-status-pending">{err}</p>}
      </div>
    </Modal>
  )
}

function RevertModal({ u, onClose, onDone }) {
  const p = useRevertPreview(u.public_id)
  const m = useRevertUpload()
  const [note, setNote] = useState('')
  const [err, setErr] = useState(null)
  const go = async () => {
    setErr(null)
    if (note.trim().length < 5) { setErr('Say why the data is reverted (at least 5 characters).'); return }
    try { await m.mutateAsync({ publicId: u.public_id, note: note.trim() }); onDone() } catch (e) { setErr(e.message || 'Could not revert') }
  }
  const d = p.data
  return (
    <Modal title={`Revert ${u.sheet_title} upload`} subtitle={`${u.file || 'File'} · approved${u.reviewed_by ? ` by ${u.reviewed_by}` : ''}`} onClose={onClose} wide
      footer={<>
        <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={go} disabled={m.isPending || !d}>{m.isPending ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />} Revert</Button>
      </>}>
      <div className="space-y-4 text-[11px] text-ink-700">
        {p.isLoading ? <LoadingState label="Working out what changes…" />
          : p.isError ? <ErrorState message={p.error?.message || 'Could not work out the change.'} onRetry={() => p.refetch()} /> : (
            <div className="rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-white p-4">
              <p className="text-[11px] font-semibold text-ink-900 mb-1">If you revert: FY {d.fy}</p>
              <p className="text-[10px] text-ink-500 mb-3">
                Removes {d.rows} row{d.rows === 1 ? '' : 's'}
                {d.locations.length > 0 && <> · <MapPin size={10} className="inline -mt-px" /> {d.locations.join(', ')}</>}
                {d.restored > 0 && <> · an earlier approved upload covers {d.restored} of these months again</>}
                {' '}· {d.changed} KPI{d.changed === 1 ? '' : 's'} change{d.changed === 1 ? 's' : ''}
              </p>
              {d.items.length > 0 ? <KpiChanges items={d.items} divide="divide-purple-100" />
                : <p className="text-[11px]">These rows do not change any figure (another approved upload already covers them).</p>}
            </div>
          )}
        <p>The upload stops counting at once on the dashboard, Analytics, the KPI catalogue, BRSR, GRI and SASB. Its file and rows
          stay in the audit trail, and the uploader and the sheet’s reviewers are told. Upload the correct file afterwards; it goes through review as usual.</p>
        <label className="block"><span className="text-[10px] font-medium text-ink-500">Reason (required, kept in the audit log)</span>
          <input className={`${inputCls} mt-1`} value={note} maxLength={500} placeholder="e.g. Figures were in MWh but the template asks for kWh" onChange={(e) => setNote(e.target.value)} aria-label="Reason" /></label>
        {err && <p className="text-[10px] text-status-pending">{err}</p>}
        <p className="flex items-center gap-1 text-[10px] text-ink-500"><Upload size={11} /> Then upload the correct file from the {u.sheet_title} row (the upload panel opens for the sheet’s uploaders).</p>
      </div>
    </Modal>
  )
}
