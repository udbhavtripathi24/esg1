import { useState, useMemo } from 'react'
import { FileText, CheckCircle2, Search, Info } from 'lucide-react'
import PageHeader from './PageHeader.jsx'
import { Button, Card, Field, Select, StatusPill, EmptyState } from './ui.jsx'
import FileDropzone from './FileDropzone.jsx'
import LoadingState from './LoadingState.jsx'
import ErrorState from './ErrorState.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useCompanies } from '../hooks/useCompanies.js'
import { useUsers } from '../hooks/useUsers.js'
import {
  useDatasets, useCreateDataset, useUploadDatasetFile, useSubmitDatasetVersion,
  useDepartments,
} from '../hooks/useDatasets.js'
import { getDatasetVersions } from '../api/datasets.js'
import { domainGuidance, questionBank } from '../data/mockData'

const YEARS = ['2026', '2025']
const PERIODS = ['Q4 2026', 'Q3 2026', 'Q2 2026', 'Q1 2026']
const DOMAINS = Object.keys(domainGuidance)
const CATEGORIES = Object.keys(questionBank)

// Confirmed against the real seeded upload_types (scripts_seed_upload_types.py,
// whose own comment states "Aligned with stakeholder's MVP KPI scope: Waste,
// Energy, Emissions, Water") — a clean, direct, pre-existing mapping, not
// invented here.
const DOMAIN_TO_UPLOAD_TYPE_CODE = {
  Energy: 'energy_data',
  Water: 'water_data',
  Emissions: 'emissions_data',
  Waste: 'waste_data',
}

/**
 * Deterministic calendar-quarter → date-range conversion. "Q2 2026" already
 * fully encodes both quarter and year (the separate Year dropdown is
 * preserved for the existing UI layout, but the real payload is derived
 * from Period alone, since it's unambiguous). Standard calendar quarters —
 * not an invented convention.
 */
function periodToDateRange(periodLabel) {
  const [q, yearStr] = periodLabel.split(' ')
  const year = parseInt(yearStr, 10)
  const ranges = {
    Q1: ['01-01', '03-31'],
    Q2: ['04-01', '06-30'],
    Q3: ['07-01', '09-30'],
    Q4: ['10-01', '12-31'],
  }
  const [start, end] = ranges[q]
  return { reporting_period_start: `${year}-${start}`, reporting_period_end: `${year}-${end}` }
}

export default function UploadDataView() {
  const { user } = useAuth()
  const [tab, setTab] = useState('Quantitative')
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)

  function pushToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3200)
  }

  // Real datasets — replaces the mock quantitative table entirely.
  const datasetsQuery = useDatasets({ page: 1, page_size: 100 })
  const datasets = useMemo(() => datasetsQuery.data?.items || [], [datasetsQuery.data])
  const filteredDatasets = useMemo(
    () => datasets.filter((d) => !search.trim() ||
      (d.notes || '').toLowerCase().includes(search.toLowerCase()) ||
      d.status.toLowerCase().includes(search.toLowerCase())),
    [datasets, search]
  )

  // Resolve created_by -> user name via a Map over the already-fetched real
  // users list — no N+1 requests, same pattern as Role Assignment's picker.
  const usersQuery = useUsers({ page: 1, page_size: 100 })
  const userNameById = useMemo(() => {
    const map = new Map()
    for (const u of usersQuery.data?.items || []) map.set(u.id, u.name)
    return map
  }, [usersQuery.data])

  // GENUINE GAP, discovered during implementation (not caught in the
  // readiness report): GET /upload-types (UploadTypeRead) exposes only
  // `code`, never an `id` — so Dataset.upload_type_id (an internal integer
  // FK) cannot be resolved to a human-readable display_name from any
  // existing endpoint. This does NOT block dataset creation (which
  // correctly uses upload_type_code, a real field that IS available) —
  // it only affects the read-side table's display. Applying the same
  // honest-fallback pattern already sanctioned for unresolvable
  // created_by values below, rather than inventing a backend field or
  // silently guessing. Flagged in the implementation report for your
  // decision on whether to add `id` to UploadTypeRead as a follow-up.

  return (
    <div>
      <PageHeader title="Upload Data" subtitle="Submit ESG datasets and supporting evidence for review" />

      {toast && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-md bg-brand-green/10 text-brand-greenDark text-xs mb-4">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      <div className="flex items-center gap-6 border-b border-surface-border mb-5">
        {['Quantitative', 'Qualitative'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 text-xs -mb-px border-b-2 transition-colors ${
              tab === t ? 'border-brand-green text-brand-green font-medium' : 'border-transparent text-ink-500 hover:text-ink-900'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Quantitative' && (
        <QuantitativeTab user={user} pushToast={pushToast} />
      )}
      {tab === 'Qualitative' && (
        <QualitativeTab pushToast={pushToast} />
      )}

      <Card title="Uploaded Datasets" action={
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search datasets......"
            className="w-full pl-8 pr-3 py-2 rounded-md border border-surface-border text-[10px] placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-green/20"
          />
        </div>
      } padded={false} className="mt-4">
        {datasetsQuery.isLoading ? (
          <LoadingState label="Loading datasets…" />
        ) : datasetsQuery.isError ? (
          <ErrorState
            message={datasetsQuery.error?.message || 'Could not load datasets.'}
            onRetry={() => datasetsQuery.refetch()}
          />
        ) : filteredDatasets.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No datasets yet" subtitle="Datasets you upload will appear here." />
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[8px]">
            <thead>
              <tr className="text-left text-[8px] text-ink-500 border-t border-surface-border">
                <th className="font-medium px-5 py-2.5">Dataset</th>
                <th className="font-medium px-2 py-2.5">Period</th>
                <th className="font-medium px-2 py-2.5">Date Created</th>
                <th className="font-medium px-2 py-2.5">Uploaded By</th>
                <th className="font-medium px-5 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredDatasets.map((d) => (
                <tr key={d.public_id} className="border-t border-surface-border">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 text-ink-900 font-medium">
                      <FileText size={12} className="text-ink-300" /> Upload Type #{d.upload_type_id}
                    </div>
                  </td>
                  <td className="px-2 py-3 text-ink-500">{d.reporting_period_start} – {d.reporting_period_end}</td>
                  <td className="px-2 py-3 text-ink-500">{new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td className="px-2 py-3 text-ink-700">{userNameById.get(d.created_by) || `User #${d.created_by}`}</td>
                  <td className="px-5 py-3"><StatusPill status={d.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </Card>
    </div>
  )
}

function QuantitativeTab({ user, pushToast }) {
  const isDeloitte = user?.portal_type === 'deloitte'

  const [companyId, setCompanyId] = useState('')
  const [year, setYear] = useState(YEARS[0])
  const [period, setPeriod] = useState(PERIODS[0])
  const [domain, setDomain] = useState(DOMAINS[0])
  const [departmentPublicId, setDepartmentPublicId] = useState('')
  const [files, setFiles] = useState([])
  const [supportingDocs, setSupportingDocs] = useState([])
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const guidance = domainGuidance[domain]

  // Company selector — Deloitte actors only. Client actors' company_id is
  // always taken from their own account server-side; the frontend never
  // supplies or overrides it for them.
  const companiesQuery = useCompanies({ page: 1, page_size: 100, sort: 'name', order: 'asc' })
  const companies = companiesQuery.data?.items || []

  // Departments — gated until a Deloitte actor has picked a company, so we
  // never show a premature unfiltered list. Client actors are always
  // enabled (backend auto-scopes to their own company).
  const departmentsQuery = useDepartments(
    { company_id: isDeloitte ? (companyId || undefined) : undefined, page: 1, page_size: 100 },
    { enabled: isDeloitte ? !!companyId : true }
  )
  const departments = departmentsQuery.data?.items || []

  const createDataset = useCreateDataset()
  const uploadFile = useUploadDatasetFile()
  const submitVersion = useSubmitDatasetVersion()

  function validate(requireDataFile) {
    const e = {}
    if (requireDataFile && files.length === 0) e.files = true
    if (isDeloitte && !companyId) e.company = true
    return e
  }

  function reset() {
    setFiles([])
    setSupportingDocs([])
    setErrors({})
    setSubmitError(null)
  }

  /**
   * Real orchestration, per the approved sequence:
   * 1. Create Dataset (backend creates v1 automatically)
   * 2. Upload the data file (if any)
   * 3. Upload evidence file(s), if any
   * 4. If submitting: call submit — only after uploads succeed
   *
   * Tracks exactly which stage failed so the error message never
   * misattributes the failure, and never claims success unless the whole
   * requested sequence actually completed.
   */
  async function handleAction(action) {
    // action: 'draft' | 'submit'
    const e = validate(action === 'submit')
    setErrors(e)
    if (Object.keys(e).length > 0) return

    setSubmitError(null)
    setIsSubmitting(true)
    let stage = 'create'
    try {
      const { reporting_period_start, reporting_period_end } = periodToDateRange(period)
      const dataset = await createDataset.mutateAsync({
        company_id: isDeloitte ? Number(companyId) : undefined,
        department_public_id: departmentPublicId || undefined,
        upload_type_code: DOMAIN_TO_UPLOAD_TYPE_CODE[domain],
        reporting_period_start,
        reporting_period_end,
        reporting_frequency: 'quarterly',
      })
      // POST /datasets already creates v1 — never call createDatasetVersion
      // here. The version's public_id isn't in DatasetRead directly, but
      // the dataset's current_version_id maps 1:1 to the v1 we just made;
      // fetch it once to get the version's public_id for the file uploads.
      const versions = await getDatasetVersions(dataset.public_id)
      const v1 = versions[0]

      stage = 'upload-data'
      for (const f of files) {
        await uploadFile.mutateAsync({ publicId: dataset.public_id, versionPublicId: v1.public_id, file: f, role: 'data' })
      }
      stage = 'upload-evidence'
      for (const f of supportingDocs) {
        await uploadFile.mutateAsync({ publicId: dataset.public_id, versionPublicId: v1.public_id, file: f, role: 'evidence' })
      }

      if (action === 'submit') {
        stage = 'submit'
        await submitVersion.mutateAsync({ publicId: dataset.public_id, versionPublicId: v1.public_id })
        pushToast(`Submitted for review.`)
      } else {
        pushToast('Saved as draft.')
      }
      reset()
    } catch (err) {
      const stageLabel = {
        create: 'creating the dataset',
        'upload-data': 'uploading the data file',
        'upload-evidence': 'uploading a supporting document',
        submit: 'submitting for review',
      }[stage]
      // The dataset itself may already exist as a draft even if a later
      // stage failed — say so honestly rather than implying nothing happened.
      const partialNote = stage !== 'create'
        ? 'The dataset was created and saved as a draft, but '
        : ''
      if (err.status === 422 && err.code === 'no_data_file') {
        setSubmitError('This version has no data file yet — attach one before submitting.')
      } else if (err.status === 409 && err.code === 'version_locked') {
        setSubmitError(`${partialNote}this version is locked and can no longer accept files. Refresh and start a new version if needed.`)
      } else if (err.status === 409 && err.code === 'version_open') {
        setSubmitError('An earlier version of this dataset is still open. Complete or cancel it first.')
      } else if (err.status === 400) {
        setSubmitError(`${partialNote}${err.message || 'the file was rejected by validation.'}`)
      } else if (err.status === 403) {
        setSubmitError(`${partialNote}you do not have permission to complete this step.`)
      } else if (err.isNetworkError) {
        setSubmitError(`${partialNote}could not reach the server while ${stageLabel}. Please retry.`)
      } else {
        setSubmitError(`${partialNote}something went wrong while ${stageLabel}. ${err.message || ''}`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-4 mb-4">
      <div className="space-y-4">
        {submitError && (
          <p className="text-xs text-status-pending bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {submitError}
          </p>
        )}

        <Card>
          <div className={`grid sm:grid-cols-2 gap-4 ${isDeloitte ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
            {isDeloitte && (
              <Field label="Company" required>
                {companiesQuery.isLoading ? (
                  <p className="text-[10px] text-ink-300 py-2">Loading companies…</p>
                ) : companiesQuery.isError ? (
                  <p className="text-[10px] text-status-pending py-2">Could not load companies.</p>
                ) : (
                  <Select
                    value={companyId}
                    onChange={(e) => { setCompanyId(e.target.value); setDepartmentPublicId('') }}
                    className={errors.company ? '!border-status-pending' : ''}
                  >
                    <option value="">Select a company</option>
                    {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                )}
              </Field>
            )}
            <Field label="Reporting Year"><Select value={year} onChange={(e) => setYear(e.target.value)}>{YEARS.map((y) => <option key={y}>{y}</option>)}</Select></Field>
            <Field label="Reporting Period"><Select value={period} onChange={(e) => setPeriod(e.target.value)}>{PERIODS.map((p) => <option key={p}>{p}</option>)}</Select></Field>
            <Field label="KPI Domain"><Select value={domain} onChange={(e) => setDomain(e.target.value)}>{DOMAINS.map((d) => <option key={d}>{d}</option>)}</Select></Field>
            <Field label="Department (Optional)">
              {(isDeloitte && !companyId) ? (
                <p className="text-[10px] text-ink-300 py-2">Select a company first</p>
              ) : departmentsQuery.isLoading ? (
                <p className="text-[10px] text-ink-300 py-2">Loading departments…</p>
              ) : departmentsQuery.isError ? (
                <p className="text-[10px] text-status-pending py-2">Could not load departments.</p>
              ) : departments.length === 0 ? (
                <p className="text-[10px] text-ink-300 py-2">No departments available</p>
              ) : (
                <Select value={departmentPublicId} onChange={(e) => setDepartmentPublicId(e.target.value)}>
                  <option value="">All departments</option>
                  {departments.map((d) => <option key={d.public_id} value={d.public_id}>{d.name}</option>)}
                </Select>
              )}
            </Field>
          </div>
        </Card>

        <Card>
          <p className="text-xs font-semibold text-ink-900 mb-1">Dataset Upload</p>
          <p className="text-[10px] text-ink-500 mb-2">Quantitative ESG data file for {period} · {domain}</p>
          <FileDropzone
            files={files}
            onFilesChange={(f) => { setFiles(f); setErrors((er) => ({ ...er, files: false })) }}
            accept=".xlsx,.csv"
            hint="Excel (.xlsx) and CSV (.csv) — up to 25 MB per file"
            multiple={false}
          />
          {errors.files && <p className="text-[9px] text-status-pending mt-2">Attach a dataset file before submitting.</p>}
        </Card>

        <Card>
          <p className="text-xs font-semibold text-ink-900 mb-1">Supporting Documents</p>
          <p className="text-[10px] text-ink-500 mb-2">Optional — utility bills, meter certifications, audit evidence</p>
          <FileDropzone
            files={supportingDocs}
            onFilesChange={setSupportingDocs}
            accept=".pdf,.doc,.docx"
            hint="PDF and Word documents"
            compact
          />
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => handleAction('draft')} disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save as draft'}
          </Button>
          <Button onClick={() => handleAction('submit')} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting…' : 'Submit for Review'}
          </Button>
        </div>
      </div>

      <Card title="Dataset Guidance" icon={Info}>
        <p className="text-[10px] font-medium text-ink-900 mb-2">KPI Domain</p>
        <span className="inline-block px-2.5 py-1 rounded-md border border-brand-green/30 text-brand-greenDark text-[10px] font-medium mb-3">{domain}</span>
        <p className="text-[8px] text-ink-700 mb-4 leading-relaxed">{guidance.description}</p>
        <p className="text-[10px] font-medium text-ink-900 mb-2">Required Columns</p>
        <ul className="space-y-1.5 text-[8px] text-ink-700 list-disc pl-4 mb-4">
          {guidance.columns.map((c) => <li key={c}>{c}</li>)}
        </ul>
      </Card>
    </div>
  )
}

function QualitativeTab({ pushToast }) {
  const [category, setCategory] = useState(CATEGORIES[0])
  const [selectedQuestion, setSelectedQuestion] = useState(0)
  const [response, setResponse] = useState('')
  const [supportingDocs, setSupportingDocs] = useState([])

  const bank = questionBank[category]

  function handleCategoryChange(newCategory) {
    setCategory(newCategory)
    setSelectedQuestion(0)
    setResponse('')
  }

  function submit(status) {
    pushToast(status === 'draft' ? 'Saved as draft.' : 'Qualitative response submitted for review.')
    setResponse('')
    setSupportingDocs([])
  }

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-4 mb-4">
      <div className="space-y-4">
        <Card>
          <div className="max-w-sm mb-5">
            <Field label="Question Category">
              <Select value={category} onChange={(e) => handleCategoryChange(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </Select>
            </Field>
          </div>

          <p className="text-[8px] font-medium text-ink-900 mb-2">Select Question</p>
          <div className="space-y-2">
            {bank.questions.map((q, i) => (
              <button
                key={i}
                onClick={() => setSelectedQuestion(i)}
                className={`w-full text-left px-4 py-3 rounded-md border text-[10px] transition-colors ${
                  selectedQuestion === i ? 'border-brand-green bg-brand-green/5 text-ink-900' : 'border-surface-border text-ink-700 hover:border-ink-300'
                }`}
              >
                {i + 1}. {q}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-xs font-semibold text-ink-900 mb-1">Your Response</p>
          <p className="text-[10px] text-ink-500 mb-2">{bank.questions[selectedQuestion]}</p>
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={5}
            placeholder="Enter your narrative response here. Reference specific programs, data or governance structure where applicable......."
            className="w-full px-3 py-2.5 rounded-md border border-surface-border text-sm placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-green/20"
          />
          <p className="text-[9px] text-ink-300 mt-1">{response.length} characters</p>
        </Card>

        <Card>
          <p className="text-xs font-semibold text-ink-900 mb-1">Supporting Documents</p>
          <p className="text-[10px] text-ink-500 mb-2">Optional — utility bills, meter certifications, audit evidence</p>
          <FileDropzone
            files={supportingDocs}
            onFilesChange={setSupportingDocs}
            accept=".pdf,.doc,.docx,.jpg,.png,.zip"
            hint="PDF, Word, images and ZIP — up to 100 MB total"
            compact
          />
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => submit('draft')}>Save as draft</Button>
          <Button onClick={() => submit('submit')}>Submit for Review</Button>
        </div>
      </div>

      <Card title="Response Guidance" icon={Info}>
        <p className="text-[10px] font-medium text-ink-900 mb-2">Category</p>
        <span className="inline-block px-2.5 py-1 rounded-md border border-brand-green/30 text-brand-greenDark text-[10px] font-medium mb-3">{category}</span>
        <p className="text-[8px] text-ink-700 mb-4 leading-relaxed">{bank.guidance}</p>
        <p className="text-[10px] font-medium text-ink-900 mb-2">Tips for strong responses</p>
        <ul className="space-y-1.5 text-[8px] text-ink-700 list-disc pl-4">
          {bank.tips.map((t) => <li key={t}>{t}</li>)}
        </ul>
      </Card>
    </div>
  )
}