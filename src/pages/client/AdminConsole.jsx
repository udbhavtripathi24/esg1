import { useState } from 'react'
import {
  Wifi, WifiOff, AlertCircle, Plus, ChevronLeft, ChevronRight, X,
  ClipboardList, PlugZap, Target, History, Beaker,
} from 'lucide-react'
import PageHeader from '../../components/PageHeader.jsx'
import { Card, Button, Field, Input, Select, EmptyState } from '../../components/ui.jsx'
import LoadingState from '../../components/LoadingState.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import { useAuditLogs, useIntegrations, useCreateIntegration, useUpdateIntegration } from '../../hooks/useAdminConsole.js'

/**
 * Admin Console V1 -- real Audit Logs and real Integration Configuration
 * only. See the Admin Console readiness investigation and implementation
 * report for the full backend tracing.
 *
 * REMOVED ENTIRELY, not rebuilt: the old "User Directory" and "Role
 * Assignment" tabs were 100% mock local-state, never connected to any
 * real backend. IMPORTANT CORRECTION found during implementation: these
 * do NOT simply duplicate Control Center's real User Directory, because
 * Control Center is a CONSULTANT-only route (pages/consultant/
 * ControlCenter.jsx) -- a client-portal user can never reach it. There
 * is currently no dedicated client-facing self-service user-management
 * screen anywhere in this application, even though Client Administrator
 * genuinely holds the user:manage permission. Rather than link to a page
 * this actor cannot access, the banner below states this honestly
 * instead of pointing anywhere.
 *
 * DEFERRED, honestly, not fabricated: Targets (ESG methodology),
 * Factors (emission-factor administration), and Approval History (its
 * old "Framework" column has no real backend source, and building a
 * partial real version was explicitly left for separate, later
 * consideration, not bundled into this pass).
 */

const TABS = ['Audit Logs', 'Integration Configuration', 'Targets', 'Approval History', 'Factors']

export default function AdminConsole() {
  const [tab, setTab] = useState('Audit Logs')

  return (
    <div>
      <PageHeader title="Admin Console" subtitle="Audit history and integration configuration" />

      <div className="bg-surface-muted/60 border border-surface-border rounded-lg px-4 py-3 mb-5 text-[10px] text-ink-500">
        User and role management for your organization is handled by your Deloitte team today — there isn't yet a dedicated
        self-service screen here for managing your own company's users. The previous "User Directory" and "Role Assignment"
        tabs on this page were placeholder mockups, not a real feature, and have been removed rather than kept as non-functional UI.
      </div>

      <div className="flex items-center gap-6 border-b border-surface-border mb-5 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 text-sm -mb-px border-b-2 whitespace-nowrap transition-colors ${
              tab === t ? 'border-brand-green text-brand-green font-medium' : 'border-transparent text-ink-500 hover:text-ink-900'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Audit Logs' && <AuditLogsTab />}
      {tab === 'Integration Configuration' && <IntegrationConfigTab />}
      {tab === 'Targets' && <DeferredTab icon={Target} title="ESG Targets" note="Target-setting methodology is a manager/product decision that hasn't been made yet. This section will become available once that methodology is approved." />}
      {tab === 'Approval History' && <DeferredTab icon={History} title="Approval History" note="A real version of this view is possible using existing review decision data, but has not yet been built as part of this pass." />}
      {tab === 'Factors' && <DeferredTab icon={Beaker} title="Emission Factors" note="Emission-factor methodology and administration is blocked pending a manager/product decision." />}
    </div>
  )
}

function DeferredTab({ icon: Icon, title, note }) {
  return <EmptyState icon={Icon} title={`${title} -- not yet available`} subtitle={note} />
}

const PAGE_SIZE = 10

function Pagination({ page, setPage, hasMore }) {
  return (
    <div className="flex items-center justify-end gap-2 mt-4">
      <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
        className="w-7 h-7 rounded-md border border-brand-green text-brand-green flex items-center justify-center disabled:opacity-40">
        <ChevronLeft size={14} />
      </button>
      <span className="w-7 h-7 rounded-md border border-surface-border flex items-center justify-center text-[10px] text-ink-700">{page}</span>
      <button onClick={() => setPage((p) => p + 1)} disabled={!hasMore}
        className="w-7 h-7 rounded-md border border-brand-green text-brand-green flex items-center justify-center disabled:opacity-40">
        <ChevronRight size={14} />
      </button>
    </div>
  )
}

function AuditLogsTab() {
  const [page, setPage] = useState(1)
  const [entityType, setEntityType] = useState('')
  const query = useAuditLogs({ page, page_size: PAGE_SIZE, ...(entityType ? { entity_type: entityType } : {}) })

  return (
    <div>
      <div className="grid sm:grid-cols-[1fr_200px] gap-4 mb-5">
        <div />
        <div>
          <label className="text-xs text-ink-700 mb-1 block">Entity type</label>
          <Select value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(1) }}>
            <option value="">All entity types</option>
            <option value="dataset">Dataset</option>
            <option value="dataset_version">Dataset Version</option>
            <option value="site">Site</option>
            <option value="department">Department</option>
            <option value="business_unit">Business Unit</option>
            <option value="upload_type">Upload Type</option>
            <option value="integration">Integration</option>
          </Select>
        </div>
      </div>

      {query.isLoading ? <LoadingState label="Loading audit log…" /> :
       query.isError ? <ErrorState message="Could not load the audit log." onRetry={() => query.refetch()} /> :
       query.data.items.length === 0 ? <EmptyState icon={ClipboardList} title="No audit events" subtitle="No recorded actions match this filter yet." /> : (
        <>
          <Card title="Audit Trail" action={<span className="text-xs text-ink-400">Read-only</span>} padded={false}>
            <table className="w-full text-[10px]">
              <thead>
                <tr className="text-left text-xs text-ink-500 bg-surface-muted/50">
                  <th className="font-medium px-5 py-3">Action</th>
                  <th className="font-medium px-2 py-3">Entity</th>
                  <th className="font-medium px-2 py-3">Actor</th>
                  <th className="font-medium px-2 py-3">Company</th>
                  <th className="font-medium px-2 py-3">Timestamp</th>
                  <th className="font-medium px-5 py-3">Request ID</th>
                </tr>
              </thead>
              <tbody>
                {query.data.items.map((l) => (
                  <tr key={l.id} className="border-t border-surface-border">
                    <td className="px-5 py-3 text-ink-900 font-medium">{l.action}</td>
                    <td className="px-2 py-3 text-ink-700">{l.entity_type} #{l.entity_id}</td>
                    <td className="px-2 py-3 text-ink-500">{l.actor_user_id ?? 'System'}</td>
                    <td className="px-2 py-3 text-ink-500">{l.company_id ?? '—'}</td>
                    <td className="px-2 py-3 text-ink-500">{new Date(l.occurred_at).toLocaleString()}</td>
                    <td className="px-5 py-3 text-ink-300">{l.request_id ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Pagination page={page} setPage={setPage} hasMore={query.data.items.length === PAGE_SIZE} />
        </>
      )}
    </div>
  )
}

const statusIcon = { configured: Wifi, disabled: WifiOff, error: AlertCircle }
const statusColor = { configured: 'text-status-approved', disabled: 'text-ink-300', error: 'text-status-pending' }

function IntegrationConfigTab() {
  const query = useIntegrations({ page: 1, page_size: 50 })
  const createMutation = useCreateIntegration()
  const updateMutation = useUpdateIntegration()
  const [showNew, setShowNew] = useState(false)

  return (
    <div>
      <p className="text-[10px] text-ink-500 mb-4">
        Record which external systems your organization uses and their configuration status. This is a configuration record, not a live connection — no data is actually synchronized by this screen.
      </p>

      <div className="flex items-center justify-end mb-4">
        <Button onClick={() => setShowNew(true)}><Plus size={15} /> Add Integration</Button>
      </div>

      {query.isLoading ? <LoadingState label="Loading integrations…" /> :
       query.isError ? <ErrorState message="Could not load integrations." onRetry={() => query.refetch()} /> :
       query.data.items.length === 0 ? <EmptyState icon={PlugZap} title="No integrations configured" subtitle="Add one to record that your organization uses a given system." /> : (
        <Card padded={false}>
          <table className="w-full text-[10px]">
            <thead>
              <tr className="text-left text-xs text-ink-500 bg-surface-muted/50">
                <th className="font-medium px-5 py-3">Type</th>
                <th className="font-medium px-2 py-3">Status</th>
                <th className="font-medium px-2 py-3">Last Sync</th>
                <th className="font-medium px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {query.data.items.map((s) => {
                const Icon = statusIcon[s.status] || AlertCircle
                return (
                  <tr key={s.id} className="border-t border-surface-border">
                    <td className="px-5 py-3 text-ink-900 font-medium capitalize">{s.type}</td>
                    <td className="px-2 py-3">
                      <span className={`inline-flex items-center gap-1.5 font-medium capitalize ${statusColor[s.status] || 'text-ink-500'}`}>
                        <Icon size={12} /> {s.status}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-ink-500">{s.last_sync_at ? new Date(s.last_sync_at).toLocaleString() : 'Never'}</td>
                    <td className="px-5 py-3 text-right">
                      {s.status !== 'disabled' ? (
                        <button
                          onClick={() => updateMutation.mutate({ id: s.id, body: { status: 'disabled' } })}
                          className="text-ink-500 hover:text-status-pending font-medium"
                        >
                          Disable
                        </button>
                      ) : (
                        <button
                          onClick={() => updateMutation.mutate({ id: s.id, body: { status: 'configured' } })}
                          className="text-brand-green hover:underline font-medium"
                        >
                          Re-enable
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}

      {showNew && (
        <NewIntegrationModal
          onClose={() => setShowNew(false)}
          onSave={(body) => { createMutation.mutate(body); setShowNew(false) }}
        />
      )}
    </div>
  )
}

const INTEGRATION_TYPES = ['sap', 'oracle', 'workday', 'other']

function NewIntegrationModal({ onClose, onSave }) {
  const [type, setType] = useState(INTEGRATION_TYPES[0])
  const [note, setNote] = useState('')

  function submit() {
    // config deliberately never includes a secret/API-key field -- the
    // real backend model excludes secrets by design (see
    // app/models/integration.py). A free-text note is the only
    // optional configuration detail this form collects.
    onSave({ type, config: note.trim() ? { note: note.trim() } : undefined })
  }

  return (
    <div className="fixed inset-0 bg-ink-900/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-surface-border">
          <h3 className="font-semibold text-ink-900">Add Integration</h3>
          <button onClick={onClose} className="text-ink-300 hover:text-ink-700"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <Field label="System type" required>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              {INTEGRATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Note (optional)">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Any internal note about this system" />
          </Field>
          <p className="text-[9px] text-ink-300">This records that your organization uses this system — it does not establish a live connection, and no credentials are collected here.</p>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-surface-border">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>Add Integration</Button>
        </div>
      </div>
    </div>
  )
}
