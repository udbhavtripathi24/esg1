import { useState } from 'react'
import PageHeader from '../../components/PageHeader.jsx'
import { Card, Button, Field, Input } from '../../components/ui.jsx'
import { currentClientUser } from '../../data/mockData'

const TABS = ['Profile', 'Notifications', 'Security']

export default function Settings() {
  const [tab, setTab] = useState('Profile')
  const [emailNotifs, setEmailNotifs] = useState({ tasks: true, deadlines: true, comments: true, weekly: false })

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your account and workspace preferences." />

      <div className="flex items-center gap-6 border-b border-surface-border mb-5">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 text-sm -mb-px border-b-2 transition-colors ${
              tab === t ? 'border-brand-green text-brand-green font-medium' : 'border-transparent text-ink-500 hover:text-ink-900'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Profile' && (
        <Card className="max-w-lg">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name"><Input defaultValue={currentClientUser.name} /></Field>
            <Field label="Title"><Input defaultValue={currentClientUser.role} /></Field>
          </div>
          <div className="mt-4">
            <Field label="Email"><Input defaultValue={currentClientUser.email} /></Field>
          </div>
          <div className="mt-4">
            <Field label="Company"><Input defaultValue={currentClientUser.company} disabled /></Field>
          </div>
          <div className="flex justify-end mt-5">
            <Button>Save changes</Button>
          </div>
        </Card>
      )}

      {tab === 'Notifications' && (
        <Card className="max-w-lg">
          <p className="text-sm font-medium text-ink-900 mb-3">Email Notifications</p>
          <div className="space-y-3">
            {[
              { key: 'tasks', label: 'New task assignments' },
              { key: 'deadlines', label: 'Upcoming reporting deadlines' },
              { key: 'comments', label: 'Reviewer comments' },
              { key: 'weekly', label: 'Weekly summary digest' },
            ].map((n) => (
              <label key={n.key} className="flex items-center justify-between text-sm text-ink-700">
                {n.label}
                <input
                  type="checkbox"
                  checked={emailNotifs[n.key]}
                  onChange={() => setEmailNotifs((s) => ({ ...s, [n.key]: !s[n.key] }))}
                  className="rounded border-surface-border w-4 h-4"
                />
              </label>
            ))}
          </div>
        </Card>
      )}

      {tab === 'Security' && (
        <Card className="max-w-lg">
          <p className="text-sm font-medium text-ink-900 mb-3">Change Password</p>
          <div className="space-y-4">
            <Field label="Current Password"><Input type="password" placeholder="••••••••" /></Field>
            <Field label="New Password"><Input type="password" placeholder="••••••••" /></Field>
            <Field label="Confirm New Password"><Input type="password" placeholder="••••••••" /></Field>
          </div>
          <div className="flex justify-end mt-5">
            <Button>Update password</Button>
          </div>
        </Card>
      )}
    </div>
  )
}
