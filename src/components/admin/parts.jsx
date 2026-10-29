import { useState } from 'react'
import { AlertTriangle, ChevronLeft, ChevronRight, Copy, KeyRound } from 'lucide-react'
import { Button } from '../ui.jsx'
import { Modal } from '../surveys/parts.jsx'
import { copyText } from '../surveys/util.js'

const ROLE_STYLE = {
  'Client Administrator': 'text-blue-700 bg-blue-50',
  'Client Approver': 'text-brand-greenDark bg-brand-green/10',
  'Client Reviewer': 'text-purple-700 bg-purple-50',
  'Client Uploader': 'text-amber-700 bg-amber-50',
}

export function RolePill({ role }) {
  if (!role) return <span className="text-[10px] text-ink-300">No role</span>
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${ROLE_STYLE[role] || 'bg-ink-100 text-ink-700'}`}>
      {role.replace('Client ', '')}
    </span>
  )
}

export function StatusDot({ active }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium ${active ? 'text-status-approved' : 'text-amber-700'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-status-approved' : 'bg-amber-500'}`} />
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

export function Initials({ name }) {
  const s = (name || '?').split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  return <span className="w-7 h-7 rounded-full bg-ink-100 text-ink-700 text-[9px] font-semibold flex items-center justify-center shrink-0">{s}</span>
}

export function Chip({ label, value, tone = 'gray', active, onClick }) {
  const tones = {
    gray: 'bg-ink-100 text-ink-700', green: 'bg-brand-green/15 text-brand-greenDark', amber: 'bg-amber-100 text-amber-800',
    red: 'bg-red-100 text-red-700', blue: 'bg-blue-100 text-blue-700', purple: 'bg-purple-100 text-purple-700',
  }
  const Tag = onClick ? 'button' : 'span'
  return (
    <Tag type={onClick ? 'button' : undefined} onClick={onClick}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] ${tones[tone]} ${active ? 'ring-2 ring-offset-1 ring-ink-300' : ''}`}>
      <strong className="font-semibold tabular-nums">{value}</strong> {label}
    </Tag>
  )
}

/** Figma-style pager: ‹ page › with the total. */
export function Pager({ page, pageSize, total, onPage }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (total <= pageSize) return total ? <p className="text-[10px] text-ink-300 text-right mt-3">{total} shown</p> : null
  return (
    <div className="flex items-center justify-end gap-2 mt-4 text-[10px] text-ink-500">
      <span className="mr-2">{(page - 1) * pageSize + 1}–{Math.min(total, page * pageSize)} of {total}</span>
      <button type="button" onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Previous page"
        className="w-7 h-7 rounded-md bg-brand-green text-white flex items-center justify-center disabled:opacity-30"><ChevronLeft size={14} /></button>
      <span className="w-7 h-7 rounded-md border border-surface-border flex items-center justify-center text-ink-700">{page}</span>
      <button type="button" onClick={() => onPage(page + 1)} disabled={page >= pages} aria-label="Next page"
        className="w-7 h-7 rounded-md bg-brand-green text-white flex items-center justify-center disabled:opacity-30"><ChevronRight size={14} /></button>
    </div>
  )
}

/** Shows a one-time password with copy buttons; it can't be shown again. */
export function PasswordModal({ title, name, email, password, onClose }) {
  const [copied, setCopied] = useState(null)
  const signIn = `${window.location.origin}/login`
  const message = `Hello ${name || ''},\n\nYour Deloitte VISTA account is ready.\nSign in at ${signIn}\nE-mail: ${email}\nTemporary password: ${password}\n\nPlease change it after signing in (Settings → Security).`
  const copy = async (k, t) => { if (await copyText(t)) { setCopied(k); setTimeout(() => setCopied(null), 1500) } }
  return (
    <Modal title={title} onClose={onClose}
      footer={<Button size="sm" onClick={onClose}>Done</Button>}>
      <div className="flex gap-2 items-start text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-4">
        <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-px" />
        This password is shown only now. Copy it and give it to {name || 'the user'} securely — the platform doesn’t send e-mails yet.
      </div>
      <p className="text-[10px] text-ink-500">E-mail</p>
      <p className="text-[12px] text-ink-900 mb-3">{email}</p>
      <p className="text-[10px] text-ink-500">Temporary password</p>
      <div className="flex items-center gap-2 mt-0.5">
        <code className="flex-1 font-mono text-sm tracking-wider bg-surface-muted rounded-md px-3 py-2 select-all"><KeyRound size={13} className="inline mr-2 text-ink-300" />{password}</code>
        <Button size="sm" variant="ghost" onClick={() => copy('pw', password)}><Copy size={12} /> {copied === 'pw' ? 'Copied' : 'Copy'}</Button>
      </div>
      <button type="button" className="text-[11px] text-brand-greenDark hover:underline mt-4" onClick={() => copy('msg', message)}>
        {copied === 'msg' ? 'Copied the sign-in message' : 'Copy a sign-in message to send'}
      </button>
    </Modal>
  )
}

export function TableShell({ children }) {
  return <div className="bg-white border border-surface-border rounded-lg overflow-x-auto">{children}</div>
}
