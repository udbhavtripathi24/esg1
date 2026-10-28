import { useState } from 'react'
import { UserPlus, UserMinus, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react'
import { Button } from '../ui.jsx'
import { useCandidates } from '../../hooks/useAssurance.js'
import { ROLE_LABEL, errMessage, fmtDate } from './format.js'

function RolePicker({ c, onAdd, busy, taken }) {
  const roles = (c.can_sign ? ['partner', 'eqr', 'manager', 'practitioner'] : ['manager', 'practitioner'])
    .filter((r) => !taken.includes(r))
  const [role, setRole] = useState(roles[0] || 'practitioner')
  return (
    <div className="flex items-center gap-1.5">
      <select value={role} onChange={(e) => setRole(e.target.value)} aria-label={`Role for ${c.name}`}
        className="px-1.5 py-1 rounded border border-surface-border bg-white text-[10px]">
        {roles.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
      </select>
      <Button size="sm" variant="ghost" disabled={busy} onClick={() => onAdd(role)}><UserPlus size={12} /> Add</Button>
    </div>
  )
}

export default function TeamPanel({ eng, actions, pushToast }) {
  const manage = eng.can_manage && ['planning', 'fieldwork'].includes(eng.status)
  const cands = useCandidates(eng.public_id, manage)
  const add = actions.addMember
  const remove = actions.removeMember
  const taken = eng.team.filter((t) => ['partner', 'eqr'].includes(t.role)).map((t) => t.role)

  return (
    <div className="space-y-4">
      <div className="bg-white border border-surface-border rounded-lg overflow-hidden">
        <table className="w-full text-[10px]">
          <thead><tr className="bg-surface-muted text-left text-ink-700">
            <th className="px-3 py-2 font-semibold">Name</th><th className="px-3 py-2 font-semibold">Role</th>
            <th className="px-3 py-2 font-semibold">Independence</th><th className="px-3 py-2" />
          </tr></thead>
          <tbody>
            {eng.team.length === 0 && <tr><td colSpan={4} className="px-3 py-4 text-ink-500">No one on the team yet.</td></tr>}
            {eng.team.map((m) => (
              <tr key={m.user_id} className="border-t border-surface-border">
                <td className="px-3 py-2 font-medium text-ink-900">{m.name}</td>
                <td className="px-3 py-2 text-ink-700">{ROLE_LABEL[m.role]}</td>
                <td className="px-3 py-2">
                  {m.independence_declared_at
                    ? <span className="inline-flex items-center gap-1 text-status-approved"><ShieldCheck size={11} /> Declared {fmtDate(m.independence_declared_at)}</span>
                    : <span className="text-amber-700">Not yet declared</span>}
                </td>
                <td className="px-3 py-2 text-right">
                  {manage && (
                    <button type="button" className="inline-flex items-center gap-1 text-ink-500 hover:text-status-pending"
                      disabled={remove.isPending}
                      onClick={() => remove.mutate(m.user_id, { onError: (e) => pushToast(errMessage(e, 'Could not remove.')) })}>
                      <UserMinus size={12} /> Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {manage && (
        <div className="bg-white border border-surface-border rounded-lg p-4">
          <h3 className="text-[11px] font-semibold text-ink-900">Add to the team</h3>
          <p className="text-[9px] text-ink-500 mb-3">
            Only people independent of this BRSR can be added. Anyone who prepared, submitted or approved its data, uploaded its evidence,
            or advises this client is shown with the reason and cannot be selected.
          </p>
          {cands.isLoading ? <p className="text-[10px] text-ink-500"><Loader2 size={11} className="inline animate-spin" /> Checking independence…</p>
            : cands.isError ? <p className="text-[10px] text-status-pending">{errMessage(cands.error, 'Could not load assurance staff.')}</p>
              : cands.data.filter((c) => !c.on_team_as).length === 0
                ? <p className="text-[10px] text-ink-500">Everyone holding an assurance role is already on the team. Create users with the Assurance Partner or Assurance Practitioner role in Control Center.</p>
                : (
                  <ul className="divide-y divide-surface-border border border-surface-border rounded-md">
                    {cands.data.filter((c) => !c.on_team_as).map((c) => (
                      <li key={c.user_id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                        <div className="min-w-0">
                          <p className="text-[10px] font-medium text-ink-900">{c.name} <span className="text-ink-500 font-normal">· {c.job_role}</span></p>
                          {!c.eligible && (
                            <p className="flex items-start gap-1 text-[9px] text-status-pending"><ShieldAlert size={10} className="mt-px shrink-0" />Not independent: {c.conflicts.join('; ')}</p>
                          )}
                        </div>
                        {c.eligible && (
                          <RolePicker c={c} taken={taken} busy={add.isPending}
                            onAdd={(role) => add.mutate({ userId: c.user_id, role }, {
                              onSuccess: () => pushToast(`${c.name} added as ${ROLE_LABEL[role].toLowerCase()}.`),
                              onError: (e) => pushToast(errMessage(e, 'Could not add.')),
                            })} />
                        )}
                      </li>
                    ))}
                  </ul>
                )}
        </div>
      )}
    </div>
  )
}
