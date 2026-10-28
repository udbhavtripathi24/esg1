import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Download, Upload, CheckCircle2, AlertCircle, AlertTriangle, Loader2, Table2, X, FileSpreadsheet,
} from 'lucide-react'
import { Button, Card, Field, Select, ProgressBar, EmptyState } from '../ui.jsx'
import FileDropzone from '../FileDropzone.jsx'
import LoadingState from '../LoadingState.jsx'
import ErrorState from '../ErrorState.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useCompanies } from '../../hooks/useCompanies.js'
import { useDataSheets, useCoverage, useCheckDataSheet } from '../../hooks/useDatasheets.js'
import { useCreateDataset, useUploadDatasetFile, useSubmitDatasetVersion } from '../../hooks/useDatasets.js'
import { getDatasetVersions } from '../../api/datasets.js'
import { downloadTemplate, downloadFormulaSheet } from '../../api/datasheets.js'
import { financialYearOptions } from '../brsr/format.js'
import { useQueryClient } from '@tanstack/react-query'

function errMessage(err, fallback) {
  return err?.message || fallback
}

/**
 * Data sheets — the engagement's 27 templates (Energy, Diversity, Finance…).
 *
 * Each department fills its sheets month by month and uploads them here.
 * A file is checked against its template before anything is stored (every
 * problem listed by row and column), then goes through the normal review.
 * Once approved, its figures build the quantitative BRSR tables.
 */
export default function DataSheetsTab({ pushToast }) {
  const { user } = useAuth()
  const isDeloitte = user?.portal_type === 'deloitte'
  const fyOptions = financialYearOptions(5)
  const [fy, setFy] = useState(fyOptions[1])
  const [companyId, setCompanyId] = useState('')
  const [dept, setDept] = useState('')
  const [open, setOpen] = useState(null) // sheet code being uploaded

  const companiesQuery = useCompanies({ page: 1, page_size: 100, sort: 'name', order: 'asc' })
  const sheetsQuery = useDataSheets()
  const coverageQuery = useCoverage(fy, isDeloitte ? companyId : null, { enabled: !isDeloitte || !!companyId })

  const sheets = useMemo(() => sheetsQuery.data?.sheets || [], [sheetsQuery.data])
  const departments = useMemo(() => [...new Set(sheets.flatMap((s) => s.departments))].sort(), [sheets])
  const shown = sheets.filter((s) => !dept || s.departments.includes(dept))
  const coverage = coverageQuery.data?.coverage || {}
  const warnings = (coverageQuery.data?.warnings || []).filter((w) => !dept || shown.some((s) => s.code === w.sheet))
  const sheetByCode = Object.fromEntries(sheets.map((s) => [s.code, s]))
  const complete = shown.filter((s) => (coverage[s.code]?.months || 0) >= 12).length

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-end gap-4">
          {isDeloitte && (
            <div className="w-64">
              <Field label="Client company" required>
                <Select value={companyId} onChange={(e) => { setCompanyId(e.target.value); setOpen(null) }}>
                  <option value="">Select a company…</option>
                  {(companiesQuery.data?.items || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </Field>
            </div>
          )}
          <div className="w-40">
            <Field label="Financial year">
              <Select value={fy} onChange={(e) => setFy(e.target.value)}>
                {fyOptions.map((o) => <option key={o} value={o}>FY {o}</option>)}
              </Select>
            </Field>
          </div>
          <div className="w-56">
            <Field label="Department">
              <Select value={dept} onChange={(e) => setDept(e.target.value)}>
                <option value="">All departments</option>
                {departments.map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
            </Field>
          </div>
          <p className="text-[10px] text-ink-500 flex-1 min-w-[240px]">
            One row per month and location. Download the template, fill it in, and upload it — the file is checked
            before anything is saved. Once approved, the figures build the quantitative BRSR tables.
          </p>
          <Button variant="ghost" size="sm" title="How each BRSR figure is calculated from these sheets — for review and sign-off"
            onClick={() => downloadFormulaSheet().catch((e) => pushToast(errMessage(e, 'Download failed.')))}>
            <FileSpreadsheet size={12} /> Formula sheet
          </Button>
        </div>
      </Card>

      {isDeloitte && !companyId ? (
        <Card><EmptyState icon={Table2} title="Choose a company" subtitle="Select the client whose data sheets you want to see." /></Card>
      ) : sheetsQuery.isLoading || coverageQuery.isLoading ? (
        <Card><LoadingState label="Loading data sheets…" /></Card>
      ) : sheetsQuery.isError || coverageQuery.isError ? (
        <Card><ErrorState message="Could not load the data sheets." onRetry={() => { sheetsQuery.refetch(); coverageQuery.refetch() }} /></Card>
      ) : (
        <>
          {open && sheetByCode[open] && (
            <UploadPanel sheet={sheetByCode[open]} companyId={isDeloitte ? companyId : null} fy={fy}
              onClose={() => setOpen(null)} pushToast={pushToast} />
          )}

          {warnings.length > 0 && (
            <Card title={`Data gaps for FY ${fy}`} icon={AlertTriangle}
              subtitle="Tables built from these sheets show blank cells until the data is approved.">
              <ul className="space-y-1 max-h-48 overflow-y-auto">
                {warnings.map((w, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[10px] text-ink-700">
                    <AlertTriangle size={11} className="mt-px text-status-review shrink-0" />{w.message}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card title="Data sheets" icon={FileSpreadsheet} padded={false}
            subtitle={`${complete} of ${shown.length} sheets have all 12 months of FY ${fy} approved`}>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="text-left text-ink-500 border-t border-surface-border">
                    <th className="font-medium px-5 py-2.5">Sheet</th>
                    <th className="font-medium px-2 py-2.5">Owner</th>
                    <th className="font-medium px-2 py-2.5 w-48">Approved months ({`FY ${fy}`})</th>
                    <th className="font-medium px-2 py-2.5">Locations</th>
                    <th className="font-medium px-5 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((s) => {
                    const c = coverage[s.code] || { months: 0, locations: [] }
                    const pct = Math.min(100, Math.round((c.months / 12) * 100))
                    return (
                      <tr key={s.code} className={`border-t border-surface-border ${open === s.code ? 'bg-brand-green/5' : ''}`}>
                        <td className="px-5 py-2.5">
                          <p className="font-medium text-ink-900">{s.title}</p>
                          {s.has_category && <p className="text-[9px] text-ink-500">Rows for Employees and Workers</p>}
                        </td>
                        <td className="px-2 py-2.5 text-ink-700">{s.departments.join(', ')}</td>
                        <td className="px-2 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1"><ProgressBar pct={pct} color={c.months >= 12 ? '#64BC44' : c.months ? '#F5A623' : '#E5E7EB'} /></div>
                            <span className="tabular-nums text-ink-700 w-10 text-right">{c.months}/12</span>
                          </div>
                          {c.stale_locations?.length > 0 && (
                            <p className="text-[9px] text-status-review mt-0.5">Last month missing: {c.stale_locations.join(', ')}</p>
                          )}
                        </td>
                        <td className="px-2 py-2.5 text-ink-500">{c.locations?.length ? c.locations.join(', ') : '–'}</td>
                        <td className="px-5 py-2.5">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => downloadTemplate(s.code, s.title).catch((e) => pushToast(errMessage(e, 'Download failed.')))}>
                              <Download size={12} /> Template
                            </Button>
                            <Button variant="subtle" size="sm" disabled={!s.available} onClick={() => setOpen(s.code)}
                              title={s.available ? '' : 'This sheet is not enabled on the server yet'}>
                              <Upload size={12} /> Upload
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

function fyBounds(fy) {
  const s = Number(fy.slice(0, 4))
  return { start: `${s}-04-01`, end: `${s + 1}-03-31` }
}

/** Check → upload → submit, with every row problem shown before anything is stored. */
function UploadPanel({ sheet, companyId, fy, onClose, pushToast }) {
  const qc = useQueryClient()
  const ref = useRef(null)
  // The Upload button may be far down the list: bring the panel into view.
  useEffect(() => { ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, [sheet.code])
  const [files, setFiles] = useState([])
  const [evidence, setEvidence] = useState([])
  const [result, setResult] = useState(null) // check summary
  const [busy, setBusy] = useState(null) // 'check' | 'draft' | 'submit'
  const [error, setError] = useState(null)
  const check = useCheckDataSheet()
  const createDataset = useCreateDataset()
  const uploadFile = useUploadDatasetFile()
  const submitVersion = useSubmitDatasetVersion()

  async function pick(next) {
    setFiles(next)
    setResult(null)
    setError(null)
    if (!next.length) return
    setBusy('check')
    try {
      setResult(await check.mutateAsync({ code: sheet.code, file: next[0] }))
    } catch (e) {
      setError(errMessage(e, 'Could not check the file.'))
    } finally {
      setBusy(null)
    }
  }

  async function send(action) {
    setBusy(action)
    setError(null)
    let stage = 'create'
    try {
      const fyb = fyBounds(fy)
      const ds = await createDataset.mutateAsync({
        company_id: companyId ? Number(companyId) : undefined,
        upload_type_code: sheet.upload_type_code,
        reporting_period_start: result?.period_start || fyb.start,
        reporting_period_end: result?.period_end || fyb.end,
        reporting_frequency: 'monthly',
        notes: `${sheet.title} — ${files[0].name}`,
      })
      const [v1] = await getDatasetVersions(ds.public_id)
      stage = 'upload'
      await uploadFile.mutateAsync({ publicId: ds.public_id, versionPublicId: v1.public_id, file: files[0], role: 'data' })
      for (const f of evidence) {
        await uploadFile.mutateAsync({ publicId: ds.public_id, versionPublicId: v1.public_id, file: f, role: 'evidence' })
      }
      if (action === 'submit') {
        stage = 'submit'
        await submitVersion.mutateAsync({ publicId: ds.public_id, versionPublicId: v1.public_id })
      }
      qc.invalidateQueries({ queryKey: ['datasheets', 'coverage'] })
      pushToast(action === 'submit'
        ? `${sheet.title} submitted for review. Its figures reach the BRSR once approved.`
        : `${sheet.title} saved as a draft.`)
      onClose()
    } catch (e) {
      if (e?.code === 'datasheet_invalid' && e.details) {
        setResult(e.details)
        setError('The server found problems in the file. Fix them and upload again.')
      } else {
        const where = { create: 'creating the upload', upload: 'uploading the file', submit: 'submitting for review' }[stage]
        setError(`${stage !== 'create' ? 'The upload was saved as a draft, but ' : ''}something went wrong while ${where}: ${errMessage(e, '')}`)
      }
    } finally {
      setBusy(null)
    }
  }

  const ok = result?.ok
  return (
    <div ref={ref} className="scroll-mt-4">
    <Card title={`Upload · ${sheet.title}`} icon={Upload}
      subtitle={`Owner: ${sheet.departments.join(', ')} · Excel (.xlsx) or CSV in the template's layout`}
      action={<button type="button" onClick={onClose} className="text-ink-300 hover:text-ink-700" aria-label="Close"><X size={14} /></button>}>
      <div className="grid lg:grid-cols-[1fr_280px] gap-4">
        <div className="space-y-3 min-w-0">
          <FileDropzone files={files} onFilesChange={pick} accept=".xlsx,.csv" multiple={false}
            hint="The file is checked against the template before anything is saved" />
          {busy === 'check' && <p className="flex items-center gap-1.5 text-[10px] text-ink-500"><Loader2 size={12} className="animate-spin" /> Checking the file…</p>}
          {error && <p className="text-[10px] text-status-pending bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>}
          {result && <CheckResult result={result} />}
          {ok && (
            <>
              <div>
                <p className="text-[10px] font-medium text-ink-900 mb-1">Supporting documents <span className="font-normal text-ink-500">(optional — bills, registers, certificates)</span></p>
                <FileDropzone files={evidence} onFilesChange={setEvidence} accept=".pdf,.doc,.docx" hint="PDF and Word documents" compact />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" disabled={!!busy} onClick={() => send('draft')}>
                  {busy === 'draft' ? <Loader2 size={12} className="animate-spin" /> : null} Save as draft
                </Button>
                <Button size="sm" disabled={!!busy} onClick={() => send('submit')}>
                  {busy === 'submit' ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Submit for review
                </Button>
              </div>
            </>
          )}
        </div>
        <div className="text-[10px] text-ink-700 bg-surface-muted rounded-md p-3 space-y-2 h-fit">
          <p className="font-semibold text-ink-900">How this sheet is used</p>
          <p>Each row is one month (Start_Date to End_Date) for one location{sheet.has_category ? ', separately for Employees and Workers' : ''}.</p>
          <p>Several months can be in one file. A month already in another file of the same upload is refused, so nothing is counted twice.</p>
          <p>Blank cells count as 0. Leave the header row exactly as in the template.</p>
          <Button variant="ghost" size="sm" onClick={() => downloadTemplate(sheet.code, sheet.title).catch((e) => pushToast(errMessage(e, 'Download failed.')))}>
            <Download size={12} /> Download template
          </Button>
        </div>
      </div>
    </Card>
    </div>
  )
}

function CheckResult({ result }) {
  const [showAll, setShowAll] = useState(false)
  const errors = result.errors || []
  const warnings = result.warnings || []
  const list = showAll ? errors : errors.slice(0, 15)
  return (
    <div className="space-y-2">
      {result.ok ? (
        <p className="flex items-center gap-1.5 text-[10px] text-status-approved bg-status-approved/10 rounded px-3 py-2">
          <CheckCircle2 size={12} /> {result.rows} row{result.rows === 1 ? '' : 's'} ready
          {result.period_start && <> · {result.period_start} to {result.period_end}</>}
        </p>
      ) : (
        <div className="border border-status-pending/30 rounded-md overflow-hidden">
          <p className="flex items-center gap-1.5 text-[10px] text-status-pending bg-status-pending/10 px-3 py-2 font-medium">
            <AlertCircle size={12} /> {result.error_count || errors.length} problem{(result.error_count || errors.length) === 1 ? '' : 's'} — nothing was saved
          </p>
          <table className="w-full text-[10px]">
            <thead>
              <tr className="text-left text-ink-500 bg-surface-muted"><th className="px-3 py-1.5 w-14">Row</th><th className="px-2 py-1.5">Column</th><th className="px-2 py-1.5">Problem</th></tr>
            </thead>
            <tbody>
              {list.map((e, i) => (
                <tr key={i} className="border-t border-surface-border">
                  <td className="px-3 py-1.5 tabular-nums text-ink-700">{e.row ?? '–'}</td>
                  <td className="px-2 py-1.5 text-ink-700 break-all">{e.column ?? '–'}</td>
                  <td className="px-2 py-1.5 text-ink-900">{e.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {errors.length > 15 && !showAll && (
            <button type="button" onClick={() => setShowAll(true)} className="w-full text-[10px] text-brand-green py-1.5 border-t border-surface-border">
              Show all {errors.length}
            </button>
          )}
        </div>
      )}
      {warnings.length > 0 && (
        <ul className="space-y-1">
          {warnings.slice(0, 10).map((w, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[10px] text-status-review">
              <AlertTriangle size={11} className="mt-px shrink-0" />{w.row ? `Row ${w.row}: ` : ''}{w.message}
            </li>
          ))}
          {warnings.length > 10 && <li className="text-[9px] text-ink-500">…and {warnings.length - 10} more</li>}
        </ul>
      )}
    </div>
  )
}

