import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import PageHeader from '../../components/PageHeader.jsx'
import { Card, EmptyState, Select, Field } from '../../components/ui.jsx'
import LoadingState from '../../components/LoadingState.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import EngagementView from '../../components/assurance/EngagementView.jsx'
import { Chip, Toast } from '../../components/assurance/parts.jsx'
import { errMessage, useToast } from '../../components/assurance/format.js'
import { useEngagements } from '../../hooks/useAssurance.js'

/**
 * Client view of independent assurance on their BRSR: where it stands,
 * the evidence the assurer has asked for (answer it here), findings to
 * respond to, who tested what, and — once signed — the statement, the
 * sign-off register and the full assurance pack.
 */
export default function Assurance() {
  const list = useEngagements()
  const [selected, setSelected] = useState(null)
  const toast = useToast()
  const items = list.data || []
  const active = items.find((e) => e.public_id === selected) || items.find((e) => e.status !== 'withdrawn') || items[0]

  return (
    <div>
      <PageHeader title="Assurance" subtitle="Independent assurance of your BRSR — answer the assurer's requests and findings, and see who reviewed and signed what" />
      {list.isLoading ? <Card><LoadingState label="Loading assurance…" /></Card>
        : list.isError ? <Card><ErrorState message={errMessage(list.error, 'Could not load assurance.')} onRetry={() => list.refetch()} /></Card>
          : items.length === 0 ? (
            <Card>
              <EmptyState icon={ShieldCheck} title="No assurance engagement yet"
                subtitle="When your assurance provider opens an engagement on your BRSR, its requests, findings and sign-off appear here." />
            </Card>
          ) : (
            <div className="space-y-4">
              {items.length > 1 && (
                <Card>
                  <div className="flex flex-wrap items-end gap-4">
                    <div className="w-64">
                      <Field label="Engagement">
                        <Select value={active.public_id} onChange={(e) => setSelected(e.target.value)}>
                          {items.map((e) => <option key={e.public_id} value={e.public_id}>FY {e.financial_year} · {e.provider_name} · {e.status}</option>)}
                        </Select>
                      </Field>
                    </div>
                    <Chip status={active.status} />
                  </div>
                </Card>
              )}
              <EngagementView key={active.public_id} id={active.public_id} pushToast={toast.push} />
            </div>
          )}
      <Toast msg={toast.msg} />
    </div>
  )
}
