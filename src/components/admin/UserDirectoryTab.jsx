import { useState } from 'react'
import { Download, FileUp, KeyRound, Loader2, Pencil, Search, UserCheck, UserPlus, UserX, Users } from 'lucide-react'
import { Button, EmptyState } from '../ui.jsx'
import LoadingState from '../LoadingState.jsx'
import ErrorState from '../ErrorState.jsx'
import {
  useAdminUsers, useCreateUser, useImportUsers, useResetPassword, useSetUserStatus, useUpdateUser,
} from '../../hooks/useAdmin.js'
import { Modal } from '../surveys/parts.jsx'
import { csvCell, inputCls, saveBlob } from '../surveys/util.js'
import { Chip, Initials, PasswordModal, Pager, RolePill, StatusDot, TableShell } from './parts.jsx'
import { td, th } from './util.js'

const PAGE = 10

export default function UserDirectoryTab({ companyId, canManage, toast }) {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [department, setDepartment] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(null)
  const q = useAdminUsers({ search: search || undefined, role: role || undefined, status: status || undefined,
    department: department || undefined, page, page_size: PAGE }, companyId)
  const setActive = useSetUserStatus(companyId)
  const reset = useResetPassword(companyId)

  const filter = (fn) => (e) => { fn(e.target.value); setPage(1) }
  if (q.isLoading) return <LoadingState label="Loading users…" />
  if (q.isError) return <ErrorState message={q.error?.message || 'Could not load users.'} onRetry={() => q.refetch()} />
  const d = q.data

  const toggleActive = async (u) => {
    const activate = u.status !== 'active'
    if (!activate && !window.confirm(`Deactivate ${u.name}? They won't be able to sign in until reactivated. Nothing they did is deleted.`)) return
    try {
      await setActive.mutateAsync({ id: u.id, active: activate })
      toast(`${u.name} ${activate ? 'reactivated' : 'deactivated'}`)
    } catch (e) { toast(e.message || 'Could not change the status') }
  }
  const resetPw = async (u) => {
    if (!window.confirm(`Reset ${u.name}'s password? Their current password stops working immediately.`)) return
    try {
      const r = await reset.mutateAsync(u.id)
      setModal({ kind: 'password', title: 'Password reset', name: u.name, email: r.email, password: r.temporary_password })
    } catch (e) { toast(e.message || 'Could not reset the password') }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-2 mb-3">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-300" />
          <input className={`${inputCls} !pl-7 !w-64 !py-2`} placeholder="Search name, e-mail or department" value={search} onChange={filter(setSearch)} />
        </div>
        <select className={`${inputCls} !w-auto !py-2`} value={role} onChange={filter(setRole)} aria-label="Role">
          <option value="">All roles</option>
          {d.roles.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
          <option value="none">No role</option>
        </select>
        <select className={`${inputCls} !w-auto !py-2`} value={status} onChange={filter(setStatus)} aria-label="Status">
          <option value="">Any status</option><option value="active">Active</option><option value="inactive">Inactive</option>
        </select>
        {d.departments.length > 0 && (
          <select className={`${inputCls} !w-auto !py-2`} value={department} onChange={filter(setDepartment)} aria-label="Department">
            <option value="">All departments</option>
            {d.departments.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        )}
        {canManage && (
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setModal({ kind: 'import' })}><FileUp size={13} /> Bulk import</Button>
            <Button size="sm" onClick={() => setModal({ kind: 'add' })}><UserPlus size={13} /> Add user</Button>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        <Chip label="users" value={d.counts.total} />
        <Chip label="active" value={d.counts.active} tone="green" />
        {d.counts.inactive > 0 && <Chip label="inactive" value={d.counts.inactive} tone="amber" />}
        <Chip label="administrators" value={d.counts.by_role['Client Administrator'] || 0} tone="blue" />
        {d.counts.no_role > 0 && <Chip label="without a role" value={d.counts.no_role} tone="red" onClick={() => { setRole('none'); setPage(1) }} active={role === 'none'} />}
      </div>

      {d.items.length === 0 ? (
        <EmptyState icon={Users} title={d.counts.total ? 'No users match these filters' : 'No users yet'}
          subtitle={d.counts.total ? undefined : 'Add your colleagues one by one or import a list.'} />
      ) : (
        <TableShell>
          <table className="w-full">
            <thead><tr className="bg-surface-muted/50">
              <th className={`${th} pl-5`}>Employee</th><th className={th}>E-mail</th><th className={th}>Department</th>
              <th className={th}>Role</th><th className={th}>Status</th>{canManage && <th className={`${th} text-right pr-5`}>Action</th>}
            </tr></thead>
            <tbody>
              {d.items.map((u) => (
                <tr key={u.id} className="border-t border-surface-border hover:bg-surface-muted/40">
                  <td className={`${td} pl-5`}>
                    <span className="flex items-center gap-2.5"><Initials name={u.name} />
                      <span className="font-medium text-ink-900">{u.name}</span>
                      {u.is_self && <span className="text-[9px] text-ink-500 bg-surface-muted px-1.5 py-0.5 rounded">You</span>}
                    </span>
                  </td>
                  <td className={`${td} text-ink-700`}>{u.email}</td>
                  <td className={`${td} text-ink-700`}>{u.department || <span className="text-ink-300">—</span>}</td>
                  <td className={td}><RolePill role={u.role} /></td>
                  <td className={td}><StatusDot active={u.status === 'active'} /></td>
                  {canManage && (
                    <td className={`${td} text-right pr-5 whitespace-nowrap`}>
                      <IconAction title="Edit name and department" onClick={() => setModal({ kind: 'edit', user: u })}><Pencil size={13} /></IconAction>
                      {!u.is_self && (
                        <>
                          <IconAction title="Reset password" onClick={() => resetPw(u)}><KeyRound size={13} /></IconAction>
                          <IconAction title={u.status === 'active' ? 'Deactivate' : 'Reactivate'} danger={u.status === 'active'} onClick={() => toggleActive(u)}>
                            {u.status === 'active' ? <UserX size={13} /> : <UserCheck size={13} />}
                          </IconAction>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      )}
      <Pager page={d.page} pageSize={d.page_size} total={d.total} onPage={setPage} />

      {modal?.kind === 'add' && <AddUserModal companyId={companyId} roles={d.roles} departments={d.departments}
        onClose={() => setModal(null)}
        onCreated={(r) => setModal({ kind: 'password', title: `${r.user.name} added`, name: r.user.name, email: r.user.email, password: r.temporary_password })} />}
      {modal?.kind === 'edit' && <EditUserModal companyId={companyId} user={modal.user} departments={d.departments}
        onClose={() => setModal(null)} onSaved={() => { setModal(null); toast('Saved') }} />}
      {modal?.kind === 'import' && <ImportModal companyId={companyId} onClose={() => setModal(null)} toast={toast} />}
      {modal?.kind === 'password' && <PasswordModal {...modal} onClose={() => setModal(null)} />}
    </div>
  )
}

function IconAction({ title, onClick, children, danger }) {
  return (
    <button type="button" title={title} aria-label={title} onClick={onClick}
      className={`p-1.5 rounded-md text-ink-500 ${danger ? 'hover:text-status-pending hover:bg-red-50' : 'hover:text-ink-900 hover:bg-surface-muted'}`}>
      {children}
    </button>
  )
}

function DeptInput({ value, onChange, departments }) {
  return (
    <>
      <input className={inputCls} list="admin-departments" value={value} onChange={(e) => onChange(e.target.value)} maxLength={80}
        placeholder="e.g. Sustainability" />
      <datalist id="admin-departments">{departments.map((x) => <option key={x} value={x} />)}</datalist>
    </>
  )
}

function Label({ children }) {
  return <span className="block text-[10px] font-medium text-ink-700 mb-1">{children}</span>
}

function AddUserModal({ companyId, roles, departments, onClose, onCreated }) {
  const create = useCreateUser(companyId)
  const [f, setF] = useState({ name: '', email: '', department: '', role_code: 'Client Uploader' })
  const [err, setErr] = useState(null)
  const submit = async () => {
    setErr(null)
    try { onCreated(await create.mutateAsync(f)) } catch (e) { setErr(e.message || 'Could not add the user') }
  }
  const role = roles.find((r) => r.code === f.role_code)
  return (
    <Modal title="Add user" subtitle="They get a temporary password to sign in with." onClose={onClose}
      footer={<><Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={submit} disabled={!f.name.trim() || !f.email.trim() || create.isPending}>
          {create.isPending && <Loader2 size={13} className="animate-spin" />} Add user</Button></>}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Full name</Label><input className={inputCls} value={f.name} autoFocus maxLength={120} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div><Label>E-mail</Label><input className={inputCls} type="email" value={f.email} maxLength={254} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
        </div>
        <div><Label>Department</Label><DeptInput value={f.department} departments={departments} onChange={(v) => setF({ ...f, department: v })} /></div>
        <div>
          <Label>Role</Label>
          <select className={inputCls} value={f.role_code} onChange={(e) => setF({ ...f, role_code: e.target.value })}>
            {roles.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
          </select>
          {role && <p className="text-[10px] text-ink-500 mt-1">{role.description}</p>}
        </div>
        {err && <p className="text-[11px] text-status-pending" role="alert">{err}</p>}
      </div>
    </Modal>
  )
}

function EditUserModal({ companyId, user, departments, onClose, onSaved }) {
  const update = useUpdateUser(companyId)
  const [name, setName] = useState(user.name)
  const [dept, setDept] = useState(user.department || '')
  const [err, setErr] = useState(null)
  const save = async () => {
    setErr(null)
    try { await update.mutateAsync({ id: user.id, body: { name, department: dept } }); onSaved() } catch (e) { setErr(e.message || 'Could not save') }
  }
  return (
    <Modal title={`Edit ${user.name}`} subtitle={`${user.email} · the e-mail is their sign-in and can't be changed here.`} onClose={onClose}
      footer={<><Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button><Button size="sm" onClick={save} disabled={!name.trim() || update.isPending}>Save</Button></>}>
      <div className="space-y-3">
        <div><Label>Full name</Label><input className={inputCls} value={name} maxLength={120} onChange={(e) => setName(e.target.value)} /></div>
        <div><Label>Department</Label><DeptInput value={dept} departments={departments} onChange={setDept} />
          <p className="text-[10px] text-ink-500 mt-1">Used for BRSR SPOCs and reviewers, and for inviting a department to a survey.</p></div>
        <p className="text-[10px] text-ink-500">Change the role in the <strong>Role Assignment</strong> tab.</p>
        {err && <p className="text-[11px] text-status-pending" role="alert">{err}</p>}
      </div>
    </Modal>
  )
}

function ImportModal({ companyId, onClose, toast }) {
  const imp = useImportUsers(companyId)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [done, setDone] = useState(null)
  const [err, setErr] = useState(null)

  const template = () => saveBlob(new Blob(['Name,Email,Department,Role\nAsha Verma,asha.verma@yourcompany.com,Sustainability,Approver\n'],
    { type: 'text/csv' }), 'users-import-template.csv')
  const check = async (f) => {
    setFile(f); setErr(null); setPreview(null)
    try { setPreview(await imp.mutateAsync({ file: f, dryRun: true })) } catch (e) { setErr(e.message || 'Could not read the file') }
  }
  const run = async () => {
    setErr(null)
    try {
      const r = await imp.mutateAsync({ file, dryRun: false })
      setDone(r.created)
      toast(`${r.created.length} users imported`)
    } catch (e) { setErr(e.message || 'Import failed') }
  }
  const download = () => {
    const rows = [['name', 'email', 'department', 'role', 'temporary_password'],
      ...done.map((u) => [u.name, u.email, u.department, u.role, u.temporary_password])]
    saveBlob(new Blob([rows.map((r) => r.map(csvCell).join(',')).join('\n')], { type: 'text/csv' }), 'new-users-passwords.csv')
  }

  if (done) {
    return (
      <Modal title={`${done.length} users imported`} wide onClose={onClose}
        subtitle="Download their temporary passwords now — they're shown only once."
        footer={<><Button size="sm" variant="ghost" onClick={onClose}>Done</Button><Button size="sm" onClick={download}><Download size={12} /> Download CSV with passwords</Button></>}>
        <div className="max-h-80 overflow-y-auto border border-surface-border rounded-md">
          <table className="w-full"><tbody>
            {done.map((u) => (
              <tr key={u.id} className="border-b border-surface-border last:border-0">
                <td className={td}>{u.name}</td><td className={`${td} text-ink-500`}>{u.email}</td>
                <td className={td}><RolePill role={u.role} /></td><td className={`${td} font-mono`}>{u.temporary_password}</td>
              </tr>))}
          </tbody></table>
        </div>
      </Modal>
    )
  }
  return (
    <Modal title="Bulk import users" wide onClose={onClose}
      subtitle="A CSV or Excel file with a header row: Name, Email, Department (optional), Role (Administrator, Approver, Reviewer or Uploader; blank = Uploader)."
      footer={<><Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={run} disabled={!preview || preview.with_errors > 0 || !preview.ok || imp.isPending}>
          {imp.isPending && <Loader2 size={13} className="animate-spin" />} Import {preview?.ok || ''} user{preview?.ok === 1 ? '' : 's'}</Button></>}>
      <div className="flex items-center gap-3 mb-3">
        <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-ink-300 text-[11px] text-ink-700 cursor-pointer hover:border-brand-green">
          <FileUp size={14} /> {file ? file.name : 'Choose a file'}
          <input type="file" className="hidden" accept=".csv,.xlsx,.txt" onChange={(e) => e.target.files?.[0] && check(e.target.files[0])} />
        </label>
        <button type="button" className="text-[11px] text-brand-greenDark hover:underline" onClick={template}>Download template</button>
      </div>
      {imp.isPending && !preview && <p className="text-[11px] text-ink-500 flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Checking…</p>}
      {err && <p className="text-[11px] text-status-pending mb-2" role="alert">{err}</p>}
      {preview && (
        <>
          <p className="text-[11px] mb-2">
            <span className="text-brand-greenDark">{preview.ok} ready</span>
            {preview.with_errors > 0 && <span className="text-status-pending"> · {preview.with_errors} with problems — fix them in the file and choose it again. Nothing is imported until every row is right.</span>}
          </p>
          <div className="max-h-80 overflow-y-auto border border-surface-border rounded-md">
            <table className="w-full">
              <thead><tr className="bg-surface-muted/60 sticky top-0"><th className={th}>Row</th><th className={th}>Name</th><th className={th}>E-mail</th><th className={th}>Department</th><th className={th}>Role</th><th className={th}>Check</th></tr></thead>
              <tbody>
                {preview.rows.map((r) => (
                  <tr key={r.row} className={`border-t border-surface-border ${r.errors.length ? 'bg-red-50/60' : ''}`}>
                    <td className={`${td} text-ink-300`}>{r.row}</td><td className={td}>{r.name || '—'}</td><td className={td}>{r.email || '—'}</td>
                    <td className={td}>{r.department || '—'}</td>
                    <td className={td}>{r.role ? <RolePill role={r.role} /> : '—'}{r.role_defaulted && <span className="text-[9px] text-ink-300 ml-1">(default)</span>}</td>
                    <td className={`${td} ${r.errors.length ? 'text-status-pending' : 'text-status-approved'}`}>{r.errors.length ? r.errors.join('; ') : 'OK'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Modal>
  )
}
