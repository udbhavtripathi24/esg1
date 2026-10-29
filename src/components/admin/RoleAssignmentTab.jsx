import { useState } from 'react'
import { Loader2, Search, ShieldCheck } from 'lucide-react'
import LoadingState from '../LoadingState.jsx'
import ErrorState from '../ErrorState.jsx'
import { useAdminUsers, useSetUserRole } from '../../hooks/useAdmin.js'
import { inputCls } from '../surveys/util.js'
import { Initials, Pager, RolePill, TableShell } from './parts.jsx'
import { td, th } from './util.js'

const PAGE = 15

export default function RoleAssignmentTab({ companyId, canManage, toast }) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [draft, setDraft] = useState({})
  const [saving, setSaving] = useState(null)
  const q = useAdminUsers({ search: search || undefined, page, page_size: PAGE }, companyId)
  const setRole = useSetUserRole(companyId)

  if (q.isLoading) return <LoadingState label="Loading users…" />
  if (q.isError) return <ErrorState message={q.error?.message || 'Could not load users.'} onRetry={() => q.refetch()} />
  const d = q.data

  const save = async (u) => {
    const role = draft[u.id]
    setSaving(u.id)
    try {
      await setRole.mutateAsync({ id: u.id, role })
      setDraft(({ [u.id]: _done, ...rest }) => rest)
      toast(`${u.name} is now ${role.replace('Client ', '').toLowerCase()}`)
    } catch (e) {
      toast(e.message || 'Could not change the role')
    } finally { setSaving(null) }
  }

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-2">
        {d.roles.map((r) => (
          <div key={r.code} className="bg-white border border-surface-border rounded-lg px-3 py-2.5">
            <div className="flex items-center justify-between"><RolePill role={r.code} />
              <span className="text-[10px] text-ink-500 tabular-nums">{d.counts.by_role[r.code] ?? 0} user{(d.counts.by_role[r.code] ?? 0) === 1 ? '' : 's'}</span></div>
            <p className="text-[10px] text-ink-500 mt-1.5 leading-snug">{r.description}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-300" />
          <input className={`${inputCls} !pl-7 !w-64 !py-2`} placeholder="Search name, e-mail or department" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <p className="text-[10px] text-ink-500 flex items-center gap-1"><ShieldCheck size={12} /> Each person has one role. You can’t change your own, and the company always keeps at least one administrator.</p>
      </div>

      <TableShell>
        <table className="w-full">
          <thead><tr className="bg-surface-muted/50">
            <th className={`${th} pl-5`}>Name</th><th className={th}>E-mail</th><th className={th}>Department</th>
            <th className={th}>Role</th>{canManage && <th className={`${th} text-right pr-5`}>Action</th>}
          </tr></thead>
          <tbody>
            {d.items.map((u) => {
              const value = draft[u.id] ?? u.role ?? ''
              const changed = draft[u.id] && draft[u.id] !== u.role
              return (
                <tr key={u.id} className="border-t border-surface-border">
                  <td className={`${td} pl-5`}><span className="flex items-center gap-2.5"><Initials name={u.name} />
                    <span className="font-medium text-ink-900">{u.name}</span>
                    {u.status !== 'active' && <span className="text-[9px] text-amber-700">inactive</span>}</span></td>
                  <td className={`${td} text-ink-700`}>{u.email}</td>
                  <td className={`${td} text-ink-700`}>{u.department || <span className="text-ink-300">—</span>}</td>
                  <td className={td}>
                    {canManage && !u.is_self ? (
                      <select className={`${inputCls} !w-44 !py-1.5`} value={value} aria-label={`Role for ${u.name}`}
                        onChange={(e) => setDraft((p) => ({ ...p, [u.id]: e.target.value }))}>
                        {!u.role && <option value="" disabled>Choose a role…</option>}
                        {d.roles.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
                      </select>
                    ) : (
                      <span className="flex items-center gap-2"><RolePill role={u.role} />{u.is_self && <span className="text-[9px] text-ink-300">your own role</span>}</span>
                    )}
                  </td>
                  {canManage && (
                    <td className={`${td} text-right pr-5`}>
                      {!u.is_self && (
                        <button type="button" disabled={!changed || saving === u.id} onClick={() => save(u)}
                          className={`px-3 py-1 rounded-md text-[10px] font-medium ${changed ? 'bg-brand-green text-white hover:bg-brand-greenDark' : 'bg-brand-green/15 text-brand-greenDark/60'} disabled:cursor-not-allowed`}>
                          {saving === u.id ? <Loader2 size={11} className="animate-spin inline" /> : 'Save'}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </TableShell>
      <Pager page={d.page} pageSize={d.page_size} total={d.total} onPage={setPage} />
    </div>
  )
}
