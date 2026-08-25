import { useState } from 'react'
import { FileText, CheckCircle2, Download, Eye, MessageCircle, Search, Paperclip, Edit3, Info } from 'lucide-react'
import PageHeader from './PageHeader.jsx'
import { Button, Card, Field, Select, StatusPill } from './ui.jsx'
import FileDropzone from './FileDropzone.jsx'
import { datasets as datasetsSeed, domainGuidance, questionBank } from '../data/mockData'

const YEARS = ['2026', '2025']
const PERIODS = ['Q2 2026', 'Q1 2026']
const FRAMEWORKS = ['GRI', 'SASB', 'BRSR']
const DOMAINS = Object.keys(domainGuidance)
const DEPARTMENTS = ['All departments', 'Sustainability', 'Operations', 'Finance', 'Facilities']
const CATEGORIES = Object.keys(questionBank)

export default function UploadDataView({ currentUserName }) {
  const [tab, setTab] = useState('Quantitative')
  const [datasets, setDatasets] = useState(datasetsSeed)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)

  function pushToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3200)
  }

  function addDataset(row) {
    setDatasets((prev) => [row, ...prev])
  }

  const filteredDatasets = datasets.filter((d) => !search.trim() || d.name.toLowerCase().includes(search.toLowerCase()))

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
        <QuantitativeTab currentUserName={currentUserName} onSubmit={addDataset} pushToast={pushToast} />
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
        <div className="overflow-x-auto">
          <table className="w-full text-[8px]">
            <thead>
              <tr className="text-left text-[8px] text-ink-500 border-t border-surface-border">
                <th className="font-medium px-5 py-2.5">Dataset Name</th>
                <th className="font-medium px-2 py-2.5">KPI Domain</th>
                <th className="font-medium px-2 py-2.5">Period</th>
                <th className="font-medium px-2 py-2.5">Date</th>
                <th className="font-medium px-2 py-2.5">Uploaded By</th>
                <th className="font-medium px-2 py-2.5">Status</th>
                <th className="font-medium px-2 py-2.5">Docs</th>
                <th className="font-medium px-5 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDatasets.map((d) => (
                <tr key={d.id} className="border-t border-surface-border">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 text-ink-900 font-medium">
                      <FileText size={12} className="text-ink-300" /> {d.name}
                    </div>
                  </td>
                  <td className="px-2 py-3 text-ink-700">{d.domain}</td>
                  <td className="px-2 py-3 text-ink-500">{d.period}</td>
                  <td className="px-2 py-3 text-ink-500">{d.date}</td>
                  <td className="px-2 py-3 text-ink-700">{d.uploadedBy}</td>
                  <td className="px-2 py-3"><StatusPill status={d.status} /></td>
                  <td className="px-2 py-3 text-ink-500">
                    <span className="inline-flex items-center gap-1"><Paperclip size={11} /> {d.docs}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-3 text-ink-300">
                      <button className="hover:text-ink-700"><Edit3 size={13} /></button>
                      <button className="hover:text-ink-700"><Eye size={13} /></button>
                      <button className="hover:text-ink-700"><MessageCircle size={13} /></button>
                      <button className="hover:text-ink-700"><Download size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function QuantitativeTab({ currentUserName, onSubmit, pushToast }) {
  const [year, setYear] = useState(YEARS[0])
  const [period, setPeriod] = useState(PERIODS[0])
  const [framework, setFramework] = useState(FRAMEWORKS[0])
  const [domain, setDomain] = useState(DOMAINS[0])
  const [department, setDepartment] = useState(DEPARTMENTS[0])
  const [files, setFiles] = useState([])
  const [supportingDocs, setSupportingDocs] = useState([])
  const [errors, setErrors] = useState({})

  const guidance = domainGuidance[domain]

  function validate() {
    const e = {}
    if (files.length === 0) e.files = true
    return e
  }

  function reset() {
    setFiles([])
    setSupportingDocs([])
    setErrors({})
  }

  function submit(status) {
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length > 0) return

    const rows = files.map((f) => ({
      id: `d-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: f.name.replace(/\.[^.]+$/, ''),
      framework,
      domain,
      period,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      uploadedBy: currentUserName,
      status: 'Pending',
      docs: 1 + supportingDocs.length,
      company: 'Meridian Energy Corp',
      assignedReviewer: 'Sarah Chen',
    }))
    rows.forEach(onSubmit)
    pushToast(status === 'draft' ? 'Saved as draft.' : `Submitted ${files.length} file${files.length > 1 ? 's' : ''} for review.`)
    reset()
  }

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-4 mb-4">
      <div className="space-y-4">
        <Card>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Field label="Reporting Year"><Select value={year} onChange={(e) => setYear(e.target.value)}>{YEARS.map((y) => <option key={y}>{y}</option>)}</Select></Field>
            <Field label="Reporting Period"><Select value={period} onChange={(e) => setPeriod(e.target.value)}>{PERIODS.map((p) => <option key={p}>{p}</option>)}</Select></Field>
            <Field label="Reporting Framework"><Select value={framework} onChange={(e) => setFramework(e.target.value)}>{FRAMEWORKS.map((f) => <option key={f}>{f}</option>)}</Select></Field>
            <Field label="KPI Domain"><Select value={domain} onChange={(e) => setDomain(e.target.value)}>{DOMAINS.map((d) => <option key={d}>{d}</option>)}</Select></Field>
            <Field label="Department (Optional)"><Select value={department} onChange={(e) => setDepartment(e.target.value)}>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</Select></Field>
          </div>
        </Card>

        <Card>
          <p className="text-xs font-semibold text-ink-900 mb-1">Dataset Upload</p>
          <p className="text-[10px] text-ink-500 mb-2">Quantitative ESG data file for {period} · {framework} · {domain}</p>
          <FileDropzone
            files={files}
            onFilesChange={(f) => { setFiles(f); setErrors((er) => ({ ...er, files: false })) }}
            accept=".xlsx,.csv"
            hint="Excel (.xlsx) and CSV (.csv) — up to 50 MB per file"
          />
          {errors.files && <p className="text-[9px] text-status-pending mt-2">Attach at least one dataset file before submitting.</p>}
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
          <Button variant="ghost" onClick={() => pushToast('Preview not available in this demo.')}>Preview</Button>
          <Button onClick={() => submit('submit')}>Submit for Review</Button>
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
        <button onClick={() => pushToast('Template download not available in this demo.')} className="text-[10px] text-brand-green font-medium hover:underline">
          Download data template →
        </button>
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