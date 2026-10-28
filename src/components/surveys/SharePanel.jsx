import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Bell, Building2, Copy, Download, EyeOff, Globe, Link2, Mail, RefreshCw, Search, Trash2, UserPlus, Users,
} from 'lucide-react'
import { Button } from '../ui.jsx'
import LoadingState from '../LoadingState.jsx'
import ErrorState from '../ErrorState.jsx'
import {
  useAddInvites, useAudience, usePublicLink, useRemind, useRemoveInvite, useRenewLinks, useUpdateSurvey,
} from '../../hooks/useSurveys.js'
import { surveyLink } from '../../api/surveys.js'
import { Modal, Toggle } from './parts.jsx'
import { copyText, csvCell, inputCls, saveBlob } from './util.js'
import { errText, fmtDate } from './logic.js'

const STATUS = {
  pending: { label: 'Not started', cls: 'bg-ink-100 text-ink-700' },
  started: { label: 'In progress', cls: 'bg-amber-100 text-amber-700' },
  submitted: { label: 'Submitted', cls: 'bg-brand-green/15 text-brand-greenDark' },
}

export default function SharePanel({ survey, toast }) {
  const aud = useAudience(survey.id)
  const [modal, setModal] = useState(null) // 'colleagues' | 'emails' | {links}
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const remind = useRemind(survey.id)
  const renew = useRenewLinks(survey.id)
  const remove = useRemoveInvite(survey.id)
  const readOnly = survey.status === 'archived'
  const closed = survey.status === 'closed'

  const invites = useMemo(() => {
    const all = aud.data?.invites || []
    const s = search.trim().toLowerCase()
    return all.filter((i) => (filter === 'all' || i.status === filter) &&
      (!s || [i.name, i.email, i.group].some((x) => (x || '').toLowerCase().includes(s))))
  }, [aud.data, filter, search])

  if (aud.isLoading) return <LoadingState label="Loading audience…" />
  if (aud.isError) return <ErrorState message={errText(aud.error, 'Could not load the audience.')} onRetry={() => aud.refetch()} />
  const { counts } = aud.data
  const emailOpen = (aud.data.invites || []).filter((i) => i.channel === 'email' && i.status !== 'submitted')

  const doRemind = async () => {
    try {
      const r = await remind.mutateAsync()
      toast(r.reminded
        ? `Reminder sent to ${r.reminded} ${r.reminded === 1 ? 'person' : 'people'} in the platform.${r.email_not_submitted ? ` ${r.email_not_submitted} invited by e-mail still need their link re-sent.` : ''}`
        : 'No one in the platform is waiting to answer.')
    } catch (e) { toast(errText(e, 'Could not send reminders')) }
  }

  const doRenew = async (ids, label) => {
    if (!window.confirm(`${label}\n\nThe previous links stop working. Answers people have already saved are kept.`)) return
    try {
      const r = await renew.mutateAsync(ids)
      setModal({ links: r.links, renewed: true })
    } catch (e) { toast(errText(e, 'Could not create new links')) }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Asked" value={counts.eligible} hint={survey.open_to_company ? 'everyone at the company + e-mail invitations' : `${counts.users} in the platform · ${counts.emails} by e-mail`} />
        <Stat label="Submitted" value={counts.submitted} hint={counts.response_rate !== null ? `${counts.response_rate}% response rate` : null} />
        <Stat label="In progress" value={counts.started} />
        <Stat label="Not started" value={Math.max(0, counts.eligible - counts.submitted - counts.started)} />
      </div>

      {survey.status === 'draft' && <p className="text-[11px] text-ink-500 bg-surface-muted rounded-md px-3 py-2">People you invite now are notified when you publish. Links work from the moment the survey opens.</p>}
      {survey.anonymous && <p className="flex items-center gap-1.5 text-[11px] text-ink-500"><EyeOff size={12} /> Anonymous survey: you can see who has answered, never what they answered.</p>}

      <div className="grid lg:grid-cols-3 gap-4">
        <AudienceCard icon={Users} title="Colleagues" text="People with a login. They get a notification and find it under “To answer”.">
          <EveryoneToggle survey={survey} disabled={readOnly} toast={toast} />
          <Button size="sm" variant="subtle" className="mt-3" disabled={readOnly || closed} onClick={() => setModal('colleagues')}><UserPlus size={13} /> Invite colleagues</Button>
        </AudienceCard>
        <AudienceCard icon={Mail} title="Suppliers and other people" text="Anyone without a login gets a personal link — they can save and come back to it. Send the links from your own e-mail.">
          <div className="flex flex-wrap gap-2 mt-3">
            <Button size="sm" variant="subtle" disabled={readOnly || closed} onClick={() => setModal('emails')}><Mail size={13} /> Add people</Button>
            {emailOpen.length > 0 && (
              <Button size="sm" variant="ghost" disabled={readOnly} onClick={() => doRenew(null, `Create new links for the ${emailOpen.length} people invited by e-mail who haven’t submitted?`)}>
                <Download size={13} /> Links (CSV)
              </Button>
            )}
          </div>
        </AudienceCard>
        <PublicLinkCard survey={survey} disabled={readOnly} toast={toast} />
      </div>

      <div className="bg-white border border-surface-border rounded-lg">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-surface-border">
          <p className="text-xs font-semibold text-ink-900 mr-2">Invitations</p>
          {['all', 'pending', 'started', 'submitted'].map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className={`text-[10px] px-2 py-1 rounded-full ${filter === f ? 'bg-ink-900 text-white' : 'text-ink-500 hover:bg-surface-muted'}`}>
              {f === 'all' ? 'All' : STATUS[f].label}
            </button>
          ))}
          <div className="relative ml-auto">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-300" />
            <input className={`${inputCls} !pl-6 !w-48`} placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button size="sm" variant="ghost" disabled={survey.status !== 'open' || remind.isPending} onClick={doRemind}
            title={survey.status !== 'open' ? 'Reminders can be sent while the survey is open' : 'Notify everyone in the platform who hasn’t submitted'}>
            <Bell size={13} /> Send reminder
          </Button>
        </div>
        {invites.length === 0 ? (
          <p className="text-[11px] text-ink-300 text-center py-8">
            {(aud.data.invites || []).length ? 'No invitations match.' : survey.open_to_company ? 'Everyone at the company can answer. Invite people outside the platform, or share the public link.' : 'No one invited yet.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-left text-[10px] text-ink-500 border-b border-surface-border">
                  <th className="px-4 py-2 font-medium">Person</th><th className="px-2 py-2 font-medium">Group</th>
                  <th className="px-2 py-2 font-medium">Via</th><th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Invited</th><th className="px-2 py-2 font-medium">Reminded</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {invites.map((i) => (
                  <tr key={i.id} className="border-b border-surface-border last:border-0 hover:bg-surface-muted/50">
                    <td className="px-4 py-2">
                      <span className="block text-ink-900">{i.name || i.email}</span>
                      {i.name && i.email && <span className="block text-[10px] text-ink-500">{i.email}</span>}
                    </td>
                    <td className="px-2 py-2 text-ink-700">{i.group || '—'}</td>
                    <td className="px-2 py-2 text-ink-500">{i.channel === 'user' ? 'Platform' : 'Personal link'}</td>
                    <td className="px-2 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] ${STATUS[i.status].cls}`}>{STATUS[i.status].label}</span></td>
                    <td className="px-2 py-2 text-ink-500">{fmtDate(i.invited_at)}</td>
                    <td className="px-2 py-2 text-ink-500">{i.last_reminded_at ? fmtDate(i.last_reminded_at) : '—'}</td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      {i.channel === 'email' && i.status !== 'submitted' && !readOnly && (
                        <button type="button" className="text-[10px] text-brand-greenDark hover:underline mr-3" onClick={() => doRenew([i.id], `Create a new link for ${i.email}?`)}>
                          <RefreshCw size={10} className="inline mr-0.5" /> New link
                        </button>
                      )}
                      {i.status === 'pending' && !readOnly && (
                        <button type="button" className="text-ink-300 hover:text-status-pending" aria-label={`Remove ${i.name || i.email}`}
                          onClick={async () => { try { await remove.mutateAsync(i.id) } catch (e) { toast(errText(e, 'Could not remove')) } }}>
                          <Trash2 size={12} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal === 'colleagues' && <ColleaguesModal survey={survey} audience={aud.data} onClose={() => setModal(null)} toast={toast} />}
      {modal === 'emails' && <EmailsModal survey={survey} onClose={() => setModal(null)} onLinks={(links) => setModal({ links })} toast={toast} />}
      {modal?.links && <LinksModal survey={survey} links={modal.links} renewed={modal.renewed} onClose={() => setModal(null)} />}
    </div>
  )
}

function Stat({ label, value, hint }) {
  return (
    <div className="bg-white border border-surface-border rounded-lg px-4 py-3">
      <p className="text-[10px] text-ink-500">{label}</p>
      <p className="text-xl font-semibold text-ink-900 tabular-nums">{value ?? '—'}</p>
      {hint && <p className="text-[10px] text-ink-300 mt-0.5">{hint}</p>}
    </div>
  )
}

function AudienceCard({ icon: Icon, title, text, children }) {
  return (
    <div className="bg-white border border-surface-border rounded-lg p-4 flex flex-col">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-900"><Icon size={14} className="text-brand-greenDark" />{title}</p>
      <p className="text-[10px] text-ink-500 mt-1 mb-3">{text}</p>
      <div className="mt-auto">{children}</div>
    </div>
  )
}

function EveryoneToggle({ survey, disabled, toast }) {
  const qc = useQueryClient()
  const update = useUpdateSurvey(survey.id)
  const change = async (v) => {
    const cur = qc.getQueryData(['surveys', 'one', survey.id]) || survey
    try { await update.mutateAsync({ revision: cur.revision, open_to_company: v }) } catch (e) { toast(errText(e, 'Could not change')) }
  }
  return <Toggle checked={survey.open_to_company} onChange={change} disabled={disabled || update.isPending}
    label="Everyone at the company" hint="Any user of this company can answer, without an invitation." />
}

function PublicLinkCard({ survey, disabled, toast }) {
  const pl = usePublicLink(survey.id)
  const url = survey.public_token ? surveyLink(survey.public_token) : null
  const set = async (enabled, regenerate = false) => {
    if (regenerate && !window.confirm('Create a new public link? The current one stops working.')) return
    try { await pl.mutateAsync({ enabled, regenerate }) } catch (e) { toast(errText(e, 'Could not change the link')) }
  }
  return (
    <AudienceCard icon={Globe} title="Public link" text="One link for anyone — for wide stakeholder or customer surveys. Respondents can add their name and organisation.">
      <Toggle checked={!!url} onChange={(v) => set(v)} disabled={disabled || pl.isPending} label={url ? 'On' : 'Off'} />
      {url && (
        <div className="mt-2.5">
          <div className="flex gap-1.5">
            <input className={`${inputCls} font-mono !text-[10px]`} readOnly value={url} onFocus={(e) => e.target.select()} aria-label="Public link" />
            <Button size="sm" variant="ghost" onClick={async () => toast((await copyText(url)) ? 'Link copied' : 'Copy failed — select the link and copy it')}><Copy size={12} /></Button>
          </div>
          <button type="button" className="text-[10px] text-ink-500 hover:underline mt-1.5" disabled={disabled} onClick={() => set(true, true)}>Replace with a new link</button>
        </div>
      )}
    </AudienceCard>
  )
}

function ColleaguesModal({ survey, audience, onClose, toast }) {
  const add = useAddInvites(survey.id)
  const already = new Set((audience.invites || []).filter((i) => i.user_id).map((i) => i.user_id))
  const [picked, setPicked] = useState(() => new Set())
  const [q, setQ] = useState('')
  const users = audience.users.filter((u) => !q || `${u.name} ${u.email} ${u.department || ''}`.toLowerCase().includes(q.toLowerCase()))
  const toggle = (id) => setPicked((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const pickDept = (d) => setPicked((p) => {
    const n = new Set(p)
    audience.users.filter((u) => u.department === d && !already.has(u.id)).forEach((u) => n.add(u.id))
    return n
  })
  const submit = async () => {
    try {
      const r = await add.mutateAsync({ user_ids: [...picked] })
      toast(`${r.added} invited${survey.status === 'open' ? ' and notified' : ''}`)
      onClose()
    } catch (e) { toast(errText(e, 'Could not invite')) }
  }
  return (
    <Modal title="Invite colleagues" subtitle="People with a login at this company" onClose={onClose}
      footer={<><Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button><Button size="sm" disabled={!picked.size || add.isPending} onClick={submit}>Invite {picked.size || ''}</Button></>}>
      {audience.departments.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] text-ink-500 mb-1.5 flex items-center gap-1"><Building2 size={11} /> Add a whole department</p>
          <div className="flex flex-wrap gap-1.5">
            {audience.departments.map((d) => (
              <button key={d.name} type="button" onClick={() => pickDept(d.name)}
                className="text-[10px] px-2 py-1 rounded-full border border-surface-border hover:border-brand-green">{d.name} <span className="text-ink-300">{d.users}</span></button>
            ))}
          </div>
        </div>
      )}
      <input className={inputCls} placeholder="Search by name, e-mail or department" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      <div className="mt-2 max-h-72 overflow-y-auto border border-surface-border rounded-md divide-y divide-surface-border">
        {users.length === 0 && <p className="text-[11px] text-ink-300 text-center py-6">No users found.</p>}
        {users.map((u) => {
          const done = already.has(u.id)
          return (
            <label key={u.id} className={`flex items-center gap-2.5 px-3 py-2 text-[11px] ${done ? 'opacity-50' : 'cursor-pointer hover:bg-surface-muted'}`}>
              <input type="checkbox" className="accent-brand-green" disabled={done} checked={done || picked.has(u.id)} onChange={() => toggle(u.id)} />
              <span className="flex-1"><span className="text-ink-900">{u.name}</span> <span className="text-ink-500">· {u.email}</span></span>
              <span className="text-[10px] text-ink-500">{done ? 'Invited' : u.department || ''}</span>
            </label>
          )
        })}
      </div>
    </Modal>
  )
}

const EMAIL_RE = /^[^@\s,;<>]+@[^@\s,;<>]+\.[^@\s,;<>]+$/

/** Lines of "email, name, group" — commas, semicolons or tabs (pasted from Excel). */
function parseEmailLines(text) {
  const ok = []
  const bad = []
  const seen = new Set()
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) continue
    const parts = line.split(/\t|;|,/).map((p) => p.trim())
    const emailIdx = parts.findIndex((p) => EMAIL_RE.test(p.replace(/^<|>$/g, '')))
    if (emailIdx < 0) { bad.push(line); continue }
    const email = parts[emailIdx].replace(/^<|>$/g, '').toLowerCase()
    if (seen.has(email)) continue
    seen.add(email)
    const rest = parts.filter((_, i) => i !== emailIdx)
    ok.push({ email, name: rest[0] || null, group: rest[1] || null })
  }
  return { ok, bad }
}

function EmailsModal({ survey, onClose, onLinks, toast }) {
  const add = useAddInvites(survey.id)
  const [text, setText] = useState('')
  const [group, setGroup] = useState('')
  const parsed = parseEmailLines(text)
  const submit = async () => {
    try {
      const r = await add.mutateAsync({ emails: parsed.ok.map((x) => ({ ...x, group: x.group || group || null })) })
      if (r.links.length) onLinks(r.links)
      else { toast(r.skipped ? 'Everyone listed was already invited' : 'No one added'); onClose() }
    } catch (e) { toast(errText(e, 'Could not add')) }
  }
  return (
    <Modal title="Add people by e-mail" subtitle="Each person gets a personal link. The platform doesn’t send e-mail — you’ll copy the links or download them as a CSV."
      onClose={onClose}
      footer={<><Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button><Button size="sm" disabled={!parsed.ok.length || add.isPending} onClick={submit}>Create {parsed.ok.length || ''} link{parsed.ok.length === 1 ? '' : 's'}</Button></>}>
      <textarea className={`${inputCls} font-mono`} rows={8} value={text} onChange={(e) => setText(e.target.value)} autoFocus
        placeholder={'One person per line: e-mail, name, group\nsales@supplier-one.com, Supplier One, Packaging\nops@supplier-two.com, Supplier Two, Logistics'} />
      <p className="text-[10px] text-ink-500 mt-1">You can paste columns straight from Excel. Name and group are optional; the group (e.g. supplier category or site) lets you compare results.</p>
      <div className="mt-3">
        <span className="block text-[10px] font-medium text-ink-700 mb-1">Group for lines without one <span className="font-normal text-ink-300">optional</span></span>
        <input className={inputCls} value={group} onChange={(e) => setGroup(e.target.value)} placeholder="e.g. Tier-1 suppliers" maxLength={120} />
      </div>
      {(parsed.ok.length > 0 || parsed.bad.length > 0) && (
        <p className="text-[11px] mt-3">
          <span className="text-brand-greenDark">{parsed.ok.length} ready</span>
          {parsed.bad.length > 0 && <span className="text-status-pending"> · {parsed.bad.length} line{parsed.bad.length === 1 ? '' : 's'} without a valid e-mail: {parsed.bad.slice(0, 3).join(' | ')}{parsed.bad.length > 3 ? '…' : ''}</span>}
        </p>
      )}
    </Modal>
  )
}

function LinksModal({ survey, links, renewed, onClose }) {
  const [copied, setCopied] = useState(null)
  const rows = links.map((l) => ({ ...l, url: surveyLink(l.token) }))
  const csv = () => {
    const head = ['email', 'name', 'group', 'link']
    const body = rows.map((r) => [r.email, r.name, r.group, r.url].map(csvCell).join(','))
    saveBlob(new Blob([[head.join(','), ...body].join('\n')], { type: 'text/csv' }), `${survey.title.replace(/[^\w -]+/g, '_').slice(0, 60)} - links.csv`)
  }
  const copy = async (key, text) => { if (await copyText(text)) { setCopied(key); setTimeout(() => setCopied(null), 1500) } }
  return (
    <Modal title={renewed ? 'New links' : `${rows.length} personal link${rows.length === 1 ? '' : 's'} created`} wide onClose={onClose}
      subtitle="Keep these now: for security, links are shown only once. You can always create new ones from the invitations list."
      footer={<><Button size="sm" variant="ghost" onClick={() => copy('all', rows.map((r) => `${r.name ? `${r.name} <${r.email}>` : r.email}\t${r.url}`).join('\n'))}><Copy size={12} /> {copied === 'all' ? 'Copied' : 'Copy all'}</Button>
        <Button size="sm" onClick={csv}><Download size={12} /> Download CSV</Button></>}>
      {survey.status === 'draft' && <p className="text-[10px] text-amber-700 bg-amber-50 rounded px-2 py-1.5 mb-3">The links start working when you publish the survey.</p>}
      <div className="max-h-80 overflow-y-auto border border-surface-border rounded-md divide-y divide-surface-border">
        {rows.map((r) => (
          <div key={r.invite_id} className="flex items-center gap-3 px-3 py-2 text-[11px]">
            <div className="w-56 shrink-0 min-w-0">
              <p className="truncate text-ink-900">{r.name || r.email}</p>
              {r.name && <p className="truncate text-[10px] text-ink-500">{r.email}</p>}
            </div>
            <code className="flex-1 truncate text-[10px] text-ink-500">{r.url}</code>
            <button type="button" className="text-[10px] text-brand-greenDark hover:underline shrink-0" onClick={() => copy(r.invite_id, r.url)}>
              <Link2 size={11} className="inline mr-0.5" />{copied === r.invite_id ? 'Copied' : 'Copy'}
            </button>
          </div>
        ))}
      </div>
    </Modal>
  )
}
