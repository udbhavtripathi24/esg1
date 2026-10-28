import { useMemo, useState } from 'react'
import { Users, X, Loader2, Plus, Trash2, Save } from 'lucide-react'
import { Button, Card, Select } from '../ui.jsx'
import LoadingState from '../LoadingState.jsx'
import ErrorState from '../ErrorState.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useUsers } from '../../hooks/useUsers.js'
import { useRoster, useSaveRoster } from '../../hooks/useBrsr.js'

/**
 * Who answers (SPOC) and who approves (reviewer) each department's BRSR
 * questions. People are this company's platform users, picked here; the
 * same person cannot be both for one department. Departments without a SPOC
 * can be answered by anyone allowed to edit the BRSR; without a reviewer, by
 * anyone with review rights.
 */
export default function DepartmentRoster({ companyId, departments, pushToast, onClose }) {
  const { user, hasPermission } = useAuth()
  const canManage = hasPermission('user:manage')
  const roster = useRoster(companyId)
  const cid = companyId || user?.company_id
  const usersQuery = useUsers({ page: 1, page_size: 100, ...(cid ? { company_id: cid } : {}) })
  const save = useSaveRoster(companyId)
  const [draft, setDraft] = useState(null) // {dept: {spoc: [ids], reviewer: [ids]}}

  const people = useMemo(
    () => (usersQuery.data?.items || []).filter((u) => u.portal_type === 'client' && u.is_active !== false
      && (!cid || u.company_id === Number(cid))),
    [usersQuery.data, cid])
  const nameOf = useMemo(() => Object.fromEntries(people.map((u) => [u.id, u.name])), [people])

  const current = useMemo(() => {
    const out = {}
    for (const d of roster.data?.departments || []) {
      out[d.department] = { spoc: d.spocs.map((p) => p.user_id), reviewer: d.reviewers.map((p) => p.user_id) }
    }
    return out
  }, [roster.data])
  const state = draft || current
  const counts = Object.fromEntries((roster.data?.departments || []).map((d) => [d.department, d.questions]))

  function edit(dept, role, ids) {
    setDraft((cur) => {
      const base = cur || current
      return { ...base, [dept]: { ...(base[dept] || { spoc: [], reviewer: [] }), [role]: ids } }
    })
  }

  function doSave() {
    const entries = []
    for (const [department, r] of Object.entries(state)) {
      for (const id of r.spoc || []) entries.push({ department, user_id: id, role: 'spoc' })
      for (const id of r.reviewer || []) entries.push({ department, user_id: id, role: 'reviewer' })
    }
    save.mutate(entries, {
      onSuccess: () => { setDraft(null); pushToast('SPOCs and reviewers saved.') },
      onError: (e) => pushToast(e?.message || 'Could not save.'),
    })
  }

  return (
    <Card title="Department SPOCs and reviewers" icon={Users} className="mb-4"
      subtitle="The SPOC answers the department's questions and sends each answer for review; the reviewer approves it. A department with nobody named here is open to anyone with the matching rights."
      action={<button type="button" onClick={onClose} className="text-ink-300 hover:text-ink-700" aria-label="Close"><X size={14} /></button>}>
      {roster.isLoading || usersQuery.isLoading ? <LoadingState label="Loading…" /> :
       roster.isError ? <ErrorState message="Could not load the roster." onRetry={() => roster.refetch()} /> : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="text-left text-ink-500 border-b border-surface-border">
                  <th className="font-medium py-2 pr-2">Department</th>
                  <th className="font-medium py-2 px-2 w-16 text-right">Questions</th>
                  <th className="font-medium py-2 px-2">SPOC (answers)</th>
                  <th className="font-medium py-2 px-2">Reviewer (approves)</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept) => {
                  const r = state[dept] || { spoc: [], reviewer: [] }
                  return (
                    <tr key={dept} className="border-b border-surface-border align-top">
                      <td className="py-2 pr-2 font-medium text-ink-900">{dept}</td>
                      <td className="py-2 px-2 text-right tabular-nums text-ink-500">{counts[dept] ?? '–'}</td>
                      <td className="py-2 px-2"><PeoplePicker ids={r.spoc} others={r.reviewer} people={people} nameOf={nameOf}
                        disabled={!canManage} onChange={(ids) => edit(dept, 'spoc', ids)} /></td>
                      <td className="py-2 px-2"><PeoplePicker ids={r.reviewer} others={r.spoc} people={people} nameOf={nameOf}
                        disabled={!canManage} onChange={(ids) => edit(dept, 'reviewer', ids)} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {canManage ? (
            <div className="flex justify-end gap-2 mt-3">
              {draft && <Button variant="ghost" size="sm" onClick={() => setDraft(null)}>Discard changes</Button>}
              <Button size="sm" disabled={!draft || save.isPending} onClick={doSave}>
                {save.isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
              </Button>
            </div>
          ) : (
            <p className="text-[9px] text-ink-500 mt-2">Only user administrators can change this list.</p>
          )}
        </>
      )}
    </Card>
  )
}

function PeoplePicker({ ids = [], others = [], people, nameOf, disabled, onChange }) {
  const [adding, setAdding] = useState('')
  const available = people.filter((p) => !ids.includes(p.id) && !others.includes(p.id))
  return (
    <div className="space-y-1 min-w-[180px]">
      {ids.map((id) => (
        <div key={id} className="flex items-center justify-between gap-2 bg-surface-muted rounded px-2 py-1">
          <span className="text-ink-900 truncate">{nameOf[id] || `User #${id}`}</span>
          {!disabled && (
            <button type="button" onClick={() => onChange(ids.filter((x) => x !== id))} className="text-ink-300 hover:text-status-pending" aria-label="Remove">
              <Trash2 size={11} />
            </button>
          )}
        </div>
      ))}
      {!disabled && available.length > 0 && (
        <div className="flex items-center gap-1">
          <Select value={adding} onChange={(e) => setAdding(e.target.value)}>
            <option value="">Add a person…</option>
            {available.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <button type="button" disabled={!adding} onClick={() => { onChange([...ids, Number(adding)]); setAdding('') }}
            className="p-1.5 rounded text-brand-green hover:bg-brand-green/10 disabled:opacity-40" aria-label="Add"><Plus size={12} /></button>
        </div>
      )}
      {ids.length === 0 && disabled && <span className="text-ink-300">Anyone with access</span>}
    </div>
  )
}
