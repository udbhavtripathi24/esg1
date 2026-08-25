import { useState } from 'react'
import { Search, ChevronDown, Plus, Edit3, Eye, Trash2, ChevronLeft, GripVertical, X, Download } from 'lucide-react'
import PageHeader from './PageHeader.jsx'
import { Button, Field, Input, Select, StatusPill, ProgressBar } from './ui.jsx'
import { assessmentDetails } from '../data/mockData'

const TYPES = ['Climate Risk', 'Due Diligence', 'AWS', 'BRSR', 'Custom']
const QUESTION_TYPES = ['Scale', 'Long Text', 'Multiple Choice', 'Yes / No']

export default function AssessmentModule({ kind, seedData }) {
  const labels = kind === 'survey'
    ? {
        listTitle: 'Surveys',
        listSubtitle: 'Collect structured stakeholder feedback for ESG reporting',
        itemNoun: 'Survey',
        createLabel: 'Create Survey',
        builderTitle: 'Create Survey',
        builderSubtitle: 'Collect structured stakeholder feedback for ESG reporting',
        nameLabel: 'Assessment Name',
        typeLabel: 'Survey Type',
        countNoun: 'Assessments',
      }
    : {
        listTitle: 'Assessments',
        listSubtitle: 'Manage and track organization-specific ESG assessments',
        itemNoun: 'Assessment',
        createLabel: 'Create Assessment',
        builderTitle: 'Create Assessment',
        builderSubtitle: 'Build and configure your ESG assessment',
        nameLabel: 'Assessment Name',
        typeLabel: 'Assessment Type',
        countNoun: 'Assessments',
      }

  const [items, setItems] = useState(seedData)
  const [mode, setMode] = useState('list') // 'list' | 'builder' | 'detail'
  const [viewingId, setViewingId] = useState(null)

  function handlePublish(newItem) {
    setItems((prev) => [newItem, ...prev])
    setMode('list')
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  function viewItem(id) {
    setViewingId(id)
    setMode('detail')
  }

  if (mode === 'builder') {
    return <Builder labels={labels} onCancel={() => setMode('list')} onPublish={handlePublish} />
  }

  if (mode === 'detail') {
    const item = items.find((i) => i.id === viewingId)
    return <DetailView labels={labels} item={item} onBack={() => setMode('list')} />
  }

  return <ListView kind={kind} labels={labels} items={items} onCreate={() => setMode('builder')} onRemove={removeItem} onView={viewItem} />
}

function ListView({ kind, labels, items, onCreate, onRemove, onView }) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All Types')
  const [statusFilter, setStatusFilter] = useState('All Statuses')
  const [typeOpen, setTypeOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)

  const total = items.length
  const active = items.filter((i) => i.status === 'Active').length
  const inProgress = items.filter((i) => i.status === 'In Progress').length
  const completionRate = items.length
    ? Math.round((items.reduce((sum, i) => sum + i.responses / Math.max(i.participants, 1), 0) / items.length) * 100)
    : 0

  const filtered = items.filter((i) => {
    const matchesSearch = !search.trim() || i.name.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'All Types' || i.type === typeFilter
    const matchesStatus = statusFilter === 'All Statuses' || i.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  return (
    <div>
      <PageHeader title={labels.listTitle} subtitle={labels.listSubtitle} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="bg-white border border-surface-border rounded-lg p-4">
          <p className="text-sm font-bold text-blue-600">{total}</p>
          <p className="text-xs text-ink-500 mt-1">Total {labels.countNoun}</p>
          <p className="text-[10px] text-ink-400 mt-0.5">+2 this month</p>
        </div>
        <div className="bg-white border border-surface-border rounded-lg p-4">
          <p className="text-sm font-bold text-status-approved">{active}</p>
          <p className="text-xs text-ink-500 mt-1">Active</p>
        </div>
        <div className="bg-white border border-surface-border rounded-lg p-4">
          <p className="text-sm font-bold text-purple-600">{inProgress}</p>
          <p className="text-xs text-ink-500 mt-1">In progress</p>
        </div>
        <div className="bg-white border border-surface-border rounded-lg p-4">
          <p className="text-sm font-bold text-amber-600">{completionRate}%</p>
          <p className="text-xs text-ink-500 mt-1">Completion Rate</p>
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <Button onClick={onCreate}><Plus size={15} /> {labels.createLabel}</Button>
      </div>

      <div className="bg-white border border-surface-border rounded-lg">
        <div className="flex items-center gap-3 p-4 border-b border-surface-border">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search datasets......"
              className="w-full pl-9 pr-3 py-2 rounded-md border border-surface-border text-[10px] placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-green/20"
            />
          </div>
          <FilterDropdown label={typeFilter} options={['All Types', ...TYPES]} open={typeOpen} setOpen={setTypeOpen} onSelect={setTypeFilter} />
          <FilterDropdown label={statusFilter} options={['All Statuses', 'Active', 'In Progress', 'Completed']} open={statusOpen} setOpen={setStatusOpen} onSelect={setStatusFilter} />
          <span className="text-xs text-ink-500 ml-auto whitespace-nowrap">{filtered.length} {labels.countNoun}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="text-left text-xs text-ink-500">
                <th className="font-medium px-5 py-2.5">{kind === 'assessment' ? 'Assessment Title' : `${labels.itemNoun} Name`}</th>
                <th className="font-medium px-2 py-2.5">Type</th>
                <th className="font-medium px-2 py-2.5">Created By</th>
                <th className="font-medium px-2 py-2.5">Created On</th>
                <th className="font-medium px-2 py-2.5">Due Date</th>
                <th className="font-medium px-2 py-2.5">Participants</th>
                <th className="font-medium px-2 py-2.5">Status</th>
                <th className="font-medium px-2 py-2.5">Responses</th>
                <th className="font-medium px-5 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr key={i.id} className="border-t border-surface-border">
                  <td className="px-5 py-3 text-ink-900 font-medium">{i.name}</td>
                  <td className="px-2 py-3">
                    <span className="px-2 py-0.5 rounded-md border border-surface-border text-xs text-ink-700">{i.type}</span>
                  </td>
                  <td className="px-2 py-3 text-ink-700">{i.createdBy}</td>
                  <td className="px-2 py-3 text-ink-500">{i.createdOn}</td>
                  <td className="px-2 py-3 text-ink-500">{i.dueDate}</td>
                  <td className="px-2 py-3 text-ink-700">{i.participants}</td>
                  <td className="px-2 py-3"><StatusPill status={i.status} /></td>
                  <td className="px-2 py-3 w-28">
                    <div className="text-xs text-ink-500 mb-1">{i.responses}/{i.participants}</div>
                    <ProgressBar pct={(i.responses / Math.max(i.participants, 1)) * 100} color={i.status === 'Completed' ? '#2E9E4F' : '#64BC44'} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-3 text-ink-300">
                      <button className="hover:text-ink-700"><Edit3 size={14} /></button>
                      <button onClick={() => onView(i.id)} className="hover:text-ink-700"><Eye size={14} /></button>
                      <button onClick={() => onRemove(i.id)} className="hover:text-status-pending"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function FilterDropdown({ label, options, open, setOpen, onSelect }) {
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 px-3 py-2 rounded-md border border-surface-border text-[10px] text-ink-700 whitespace-nowrap">
        {label} <ChevronDown size={14} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-44 bg-white border border-surface-border rounded-md shadow-lg z-20 py-1">
            {options.map((opt) => (
              <button key={opt} onClick={() => { onSelect(opt); setOpen(false) }} className="w-full text-left px-3 py-2 text-[10px] text-ink-700 hover:bg-surface-muted">
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

let qCounter = 0
function newQuestion() {
  qCounter += 1
  return { id: `q-${Date.now()}-${qCounter}`, type: 'Long Text', text: '', required: false }
}

function Builder({ labels, onCancel, onPublish }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState([newQuestion(), newQuestion()])

  function updateQuestion(id, field, value) {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, [field]: value } : q)))
  }

  function removeQuestion(id) {
    setQuestions((prev) => prev.filter((q) => q.id !== id))
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, newQuestion()])
  }

  const requiredCount = questions.filter((q) => q.required).length

  function handlePublish() {
    if (!name.trim()) return
    onPublish({
      id: `new-${Date.now()}`,
      name: name.trim(),
      type: type || 'Custom',
      createdBy: 'You',
      createdOn: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      dueDate: endDate || '-',
      participants: 0,
      responses: 0,
      status: 'Active',
    })
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink-900 mb-1">{labels.builderTitle}</h1>
      <p className="text-sm text-ink-500 mb-3">{labels.builderSubtitle}</p>
      <div className="flex items-center justify-between mb-6">
        <button onClick={onCancel} className="flex items-center gap-1 text-xs text-ink-500 hover:text-ink-900">
          <ChevronLeft size={13} /> Back to {labels.listTitle}
        </button>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm">Preview</Button>
          <Button variant="ghost" size="sm">Save as draft</Button>
          <Button size="sm" onClick={handlePublish} disabled={!name.trim()}>Publish</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-4">
        <div>
          <div className="bg-white border border-surface-border rounded-lg p-5 mb-4">
            <p className="text-sm font-semibold text-ink-900 mb-4">
              {kindTitle(labels)}
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={labels.nameLabel} required>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="eg. Climate risk assessment Q3 2025" />
              </Field>
              <Field label={labels.typeLabel} required>
                <Select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="">Select type......</option>
                  {TYPES.map((t) => <option key={t}>{t}</option>)}
                </Select>
              </Field>
              <Field label="End Date" required>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="dd-mm-yyyy" />
              </Field>
              <Field label="Description" optional>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide context for the participants" />
              </Field>
            </div>
          </div>

          <div className="bg-white border border-surface-border rounded-lg p-5">
            <p className="text-sm font-semibold text-ink-900 mb-4">Question Builder</p>
            <div className="space-y-3 mb-3">
              {questions.map((q, idx) => (
                <div key={q.id} className="border border-surface-border rounded-lg p-3 bg-surface-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-2 text-xs text-ink-500">
                      <GripVertical size={13} className="text-ink-300" /> Q{idx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <select
                        value={q.type}
                        onChange={(e) => updateQuestion(q.id, 'type', e.target.value)}
                        className="px-2 py-1 rounded-md border border-surface-border text-xs"
                      >
                        {QUESTION_TYPES.map((t) => <option key={t}>{t}</option>)}
                      </select>
                      <label className="flex items-center gap-1 text-xs text-ink-500">
                        <input
                          type="checkbox"
                          checked={q.required}
                          onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                          className="rounded border-surface-border"
                        />
                        Required
                      </label>
                      <button onClick={() => removeQuestion(q.id)} className="text-status-pending"><X size={14} /></button>
                    </div>
                  </div>
                  <input
                    value={q.text}
                    onChange={(e) => updateQuestion(q.id, 'text', e.target.value)}
                    placeholder="Enter your question"
                    className="w-full px-3 py-2 rounded-md border border-surface-border text-sm placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-green/20 mb-2"
                  />
                  {q.type === 'Scale' && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-ink-500 px-2 py-1 rounded-md border border-surface-border">Not Important</span>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span key={n} className="w-6 h-6 rounded-full border border-surface-border text-xs flex items-center justify-center text-ink-500">{n}</span>
                      ))}
                      <span className="text-xs text-ink-500 px-2 py-1 rounded-md border border-surface-border">Important</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addQuestion} className="w-full py-2.5 rounded-md border border-dashed border-surface-border text-sm text-ink-500 hover:border-ink-300">
              Add Question +
            </button>
          </div>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-5 h-fit">
          <p className="text-sm font-semibold text-ink-900 mb-4">{labels.itemNoun} Summary</p>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-ink-500">Questions</span><span className="text-ink-900 font-medium">{questions.length}</span></div>
            <div className="flex justify-between"><span className="text-ink-500">Required</span><span className="text-ink-900 font-medium">{requiredCount}</span></div>
            <div className="flex justify-between"><span className="text-ink-500">Est. completion</span><span className="text-ink-900 font-medium">{questions.length * 3} mins</span></div>
            <div className="flex justify-between"><span className="text-ink-500">Status</span><span className="text-ink-900 font-medium">Draft</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}

function kindTitle(labels) {
  return labels.itemNoun === 'Survey' ? 'Survey Details' : 'Basic Information'
}

function DetailView({ labels, item, onBack }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Statuses')

  const detail = item ? assessmentDetails[item.id] : null

  function exportResponsesCsv() {
    if (!detail) return
    const header = ['Participant', 'Email', 'Department', 'Status', 'Submitted', 'Time Taken (min)']
    const rows = detail.responses.map((r) => [r.participant, r.email, r.department, r.status, r.submitted, r.timeTaken ?? ''])
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${item.name.replace(/[^a-z0-9]+/gi, '-')}-responses.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  function exportSummaryPdf() {
    window.print()
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-2">
        <PageHeader title={labels.listTitle} subtitle={labels.listSubtitle} />
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={exportResponsesCsv} disabled={!detail}><Download size={14} /> Export Responses</Button>
          <Button onClick={exportSummaryPdf} disabled={!detail}><Download size={14} /> Export Summary PDF</Button>
        </div>
      </div>

      <button onClick={onBack} className="flex items-center gap-1 text-xs text-ink-500 hover:text-ink-900 mb-4">
        <ChevronLeft size={14} /> Back to {labels.listTitle}
      </button>

      {!item ? (
        <div className="border-2 border-dashed border-surface-border rounded-xl py-16 text-center">
          <p className="text-sm font-semibold text-ink-700">Not found</p>
        </div>
      ) : !detail ? (
        <div className="border-2 border-dashed border-surface-border rounded-xl py-16 text-center">
          <p className="text-sm font-semibold text-ink-700">No detailed responses available yet</p>
          <p className="text-xs text-ink-500 mt-1 max-w-sm mx-auto">
            "{item.name}" hasn't collected response-level detail yet — check back once participants start responding.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white border border-surface-border rounded-lg p-5 flex items-center gap-6 mb-4">
            <div className="text-center shrink-0">
              <p className="text-2xl font-bold text-status-approved">{detail.completionRate}%</p>
              <p className="text-[10px] text-ink-500">Completion Rate</p>
            </div>
            <div className="flex-1">
              <p className="text-xs text-ink-500 mb-1.5">{detail.responsesReceived} of {detail.totalParticipants} responses received</p>
              <div className="h-2 rounded-full bg-surface-muted overflow-hidden flex">
                <div className="h-full bg-status-approved" style={{ width: `${detail.statusBreakdown.completed}%` }} />
                <div className="h-full bg-blue-500" style={{ width: `${detail.statusBreakdown.inProgress}%` }} />
              </div>
              <div className="flex items-center gap-4 mt-1.5 text-[10px] text-ink-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-status-approved" /> Completed {detail.statusBreakdown.completed}%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> In Progress {detail.statusBreakdown.inProgress}%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-ink-200" /> Not Started {detail.statusBreakdown.notStarted}%</span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_300px] gap-4 mb-4">
            <div className="bg-white border border-surface-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-ink-900">{labels.itemNoun} Questions ({detail.questions.length})</h3>
                <button className="flex items-center gap-1 text-xs text-ink-500 hover:text-ink-900">Edit <Edit3 size={12} /></button>
              </div>
              <div className="space-y-2.5">
                {detail.questions.map((q) => (
                  <div key={q.id} className="flex items-start gap-2 text-xs text-ink-700">
                    <span className="w-1 h-1 rounded-full bg-ink-300 mt-1.5 shrink-0" />
                    <span>Q{q.id}. {q.text}{q.required && <span className="text-status-pending">*</span>}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-surface-border rounded-lg p-5">
              <h3 className="text-xs font-semibold text-ink-900 mb-3">{labels.itemNoun} Summary</h3>
              <div className="space-y-3 text-xs">
                <div><p className="text-ink-300">Total questions</p><p className="text-ink-900 font-medium">{detail.summary.totalQuestions}</p></div>
                <div><p className="text-ink-300">Estimated time for completion</p><p className="text-ink-900 font-medium">{detail.summary.estCompletion}</p></div>
                <div><p className="text-ink-300">{labels.itemNoun} type</p><p className="text-ink-900 font-medium">{detail.summary.type}</p></div>
                <div><p className="text-ink-300">Response type</p><p className="text-ink-900 font-medium">{detail.summary.responseType}</p></div>
                <div><p className="text-ink-300">Deadline</p><p className="text-ink-900 font-medium">{detail.summary.deadline}</p></div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-surface-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-ink-900">Participant Responses</h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search participants......"
                    className="pl-3 pr-8 py-2 rounded-md border border-surface-border text-[10px] w-48 placeholder:text-ink-300 focus:outline-none"
                  />
                  <Search size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-300" />
                </div>
                <div className="w-32">
                  <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    {['All Statuses', 'Completed', 'In Progress'].map((s) => <option key={s}>{s}</option>)}
                  </Select>
                </div>
              </div>
            </div>
            <table className="w-full text-[10px]">
              <thead>
                <tr className="text-left text-xs text-ink-500 border-t border-surface-border">
                  <th className="font-medium py-2.5">Participant</th>
                  <th className="font-medium py-2.5">Department</th>
                  <th className="font-medium py-2.5">Status</th>
                  <th className="font-medium py-2.5">Submitted</th>
                  <th className="font-medium py-2.5">Time Taken(min)</th>
                  <th className="font-medium py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {detail.responses
                  .filter((r) => statusFilter === 'All Statuses' || r.status === statusFilter)
                  .filter((r) => !search.trim() || r.participant.toLowerCase().includes(search.toLowerCase()))
                  .map((r, i) => (
                    <tr key={i} className="border-t border-surface-border">
                      <td className="py-3">
                        <p className="text-ink-900 font-medium">{r.participant}</p>
                        <p className="text-ink-300">{r.email}</p>
                      </td>
                      <td className="py-3 text-ink-700">{r.department}</td>
                      <td className="py-3"><StatusPill status={r.status} /></td>
                      <td className="py-3 text-ink-500">{r.submitted}</td>
                      <td className="py-3 text-ink-500">{r.timeTaken ?? '-'}</td>
                      <td className="py-3 text-right">
                        {r.status === 'Completed' ? (
                          <button className="px-2.5 py-1 rounded-full border border-status-approved/30 text-status-approved text-[10px] font-medium">View response</button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
