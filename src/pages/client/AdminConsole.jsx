import { useSearchParams } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import PageHeader from '../../components/PageHeader.jsx'
import { EmptyState } from '../../components/ui.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { Toast } from '../../components/assurance/parts.jsx'
import { useToast } from '../../components/assurance/format.js'
import UserDirectoryTab from '../../components/admin/UserDirectoryTab.jsx'
import RoleAssignmentTab from '../../components/admin/RoleAssignmentTab.jsx'
import TargetsTab from '../../components/admin/TargetsTab.jsx'
import ApprovalHistoryTab from '../../components/admin/ApprovalHistoryTab.jsx'
import FactorsTab from '../../components/admin/FactorsTab.jsx'
import IntegrationsTab from '../../components/admin/IntegrationsTab.jsx'
import AuditTrail from '../../components/admin/AuditTrail.jsx'

/**
 * Admin Console (client portal) — the Figma's six tabs plus the audit log:
 * User Directory · Role Assignment · Targets · Approval History · Factors ·
 * Directory / API · Audit Logs. Each tab appears only with the permission
 * its API needs; the API enforces the same rules.
 */
const TABS = [
  { key: 'users', label: 'User Directory', perm: 'user:read' },
  { key: 'roles', label: 'Role Assignment', perm: 'user:read' },
  { key: 'targets', label: 'Targets', perm: 'dataset:read' },
  { key: 'approvals', label: 'Approval History', perm: 'audit:read' },
  { key: 'factors', label: 'Factors', perm: 'dataset:read' },
  { key: 'directory', label: 'Directory / API', perm: 'integration:manage' },
  { key: 'audit', label: 'Audit Logs', perm: 'audit:read' },
]

export default function AdminConsole() {
  const { hasPermission } = useAuth()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const tabs = TABS.filter((t) => hasPermission(t.perm))
  const tab = tabs.find((t) => t.key === params.get('tab'))?.key || tabs[0]?.key
  const canUsers = hasPermission('user:manage')

  return (
    <div>
      <PageHeader title="Admin Console" subtitle="Manage users, roles and organizational settings" />
      {tabs.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="You don't have access to the Admin Console" subtitle="Ask your company administrator." />
      ) : (
        <>
          <div className="flex items-center gap-6 border-b border-surface-border mb-5 overflow-x-auto" role="tablist">
            {tabs.map((t) => (
              <button key={t.key} type="button" role="tab" aria-selected={tab === t.key}
                onClick={() => setParams({ tab: t.key }, { replace: true })}
                className={`pb-3 text-sm -mb-px border-b-2 whitespace-nowrap transition-colors ${
                  tab === t.key ? 'border-brand-green text-brand-green font-medium' : 'border-transparent text-ink-500 hover:text-ink-900'}`}>
                {t.label}
              </button>
            ))}
          </div>
          {tab === 'users' && <UserDirectoryTab canManage={canUsers} toast={toast.push} />}
          {tab === 'roles' && <RoleAssignmentTab canManage={canUsers} toast={toast.push} />}
          {tab === 'targets' && <TargetsTab canManage={hasPermission('admin:manage')} toast={toast.push} />}
          {tab === 'approvals' && <ApprovalHistoryTab />}
          {tab === 'factors' && <FactorsTab toast={toast.push} />}
          {tab === 'directory' && <IntegrationsTab toast={toast.push} />}
          {tab === 'audit' && <AuditTrail />}
        </>
      )}
      <Toast msg={toast.msg} />
    </div>
  )
}
