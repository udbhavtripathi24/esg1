import { useState } from 'react'
import { Zap, Droplet, Wind, Recycle, Database, CheckCircle2, X } from 'lucide-react'
import PageHeader from '../../components/PageHeader.jsx'
import { Card, Button, ProgressBar } from '../../components/ui.jsx'
import FileDropzone from '../../components/FileDropzone.jsx'
import { clientKpiOverview, frameworkStatus, myTasks as myTasksSeed, reportingCalendar } from '../../data/mockData'

const iconMap = { zap: Zap, droplet: Droplet, cloud: Wind, recycle: Recycle, database: Database }

const kpiTint = {
  zap: { bg: 'bg-amber-100', text: 'text-amber-500', chart: '#F5A623' },
  droplet: { bg: 'bg-blue-100', text: 'text-blue-500', chart: '#3B82F6' },
  cloud: { bg: 'bg-ink-100', text: 'text-ink-400', chart: '#9CA3AF' },
  recycle: { bg: 'bg-blue-100', text: 'text-blue-500', chart: '#3B82F6' },
  database: { bg: 'bg-purple-100', text: 'text-purple-500', chart: '#A855F7' },
}

export default function ClientDashboard() {
  const [tasks, setTasks] = useState(myTasksSeed.map((t, i) => ({ ...t, id: i })))
  const [uploadTask, setUploadTask] = useState(null)
  const [toast, setToast] = useState(null)
  const [expandedFramework, setExpandedFramework] = useState(null)

  function completeTask(taskId) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    setToast('Dataset uploaded and submitted for review.')
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div>
      <PageHeader title="Dashboard." subtitle="Q2 2026 reporting period · Meridian Energy Corp" />

      {toast && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-md bg-brand-green/10 text-brand-greenDark text-xs mb-4">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      <h3 className="text-xs font-semibold text-ink-900 mb-3">ESG Performance Overview</h3>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {clientKpiOverview.map((k) => {
          const Icon = iconMap[k.icon]
          const tint = kpiTint[k.icon]
          return (
            <div key={k.label} className="bg-white border border-surface-border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className={`w-9 h-9 rounded-md flex items-center justify-center ${tint.bg} ${tint.text}`}>
                  <Icon size={17} />
                </div>
                <span className="text-[11px] font-medium text-status-approved">↗ {k.delta}</span>
              </div>
              <div className="mt-3 text-sm font-semibold text-ink-900">
                {k.value} <span className="text-[10px] font-normal text-ink-500">{k.unit}</span>
              </div>
              <div className="text-xs text-ink-500 mt-0.5">{k.label}</div>
              <AreaSparkline color={tint.chart} />
              <div className="text-[8px] text-ink-300 mt-1">
                {k.label === 'Data collection' ? 'vs last month' : 'Q2 2026 vs Q1 2026'}
              </div>
            </div>
          )
        })}
      </div>

      <h3 className="text-xs font-semibold text-ink-900 mb-3">Framework Status</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 items-start">
        {frameworkStatus.map((f) => {
          const expanded = expandedFramework === f.code
          return (
            <div
              key={f.code}
              onClick={() => setExpandedFramework(expanded ? null : f.code)}
              className={`bg-white border rounded-lg p-4 cursor-pointer transition-colors ${
                expanded ? 'border-brand-green' : 'border-surface-border hover:border-ink-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold" style={{ backgroundColor: `${f.color}1A`, color: f.color }}>
                  {f.code}
                </span>
                <span className="text-[8px] font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">{f.stage}</span>
                <span className="text-sm font-semibold text-ink-900">{f.pct}%</span>
              </div>
              <p className="text-[8px] text-ink-500 mb-3">{f.name}</p>
              <ProgressBar pct={f.pct} color={f.color} />
              {expanded ? (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[8px]">
                    <span className="text-ink-300">Due date</span>
                    <span className="text-ink-900 font-medium">{f.dueDate}</span>
                  </div>
                  <div className="flex items-center justify-between text-[8px]">
                    <span className="text-ink-300">Last updated</span>
                    <span className="text-ink-900 font-medium">2 days ago</span>
                  </div>
                  <div className="flex items-center justify-between text-[8px]">
                    <span className="text-ink-300">Owner</span>
                    <span className="text-ink-900 font-medium">{f.owner}</span>
                  </div>
                  {f.openIssues > 0 && (
                    <div className="mt-2 px-2 py-1.5 rounded-md bg-status-pending/10 text-status-pending text-[8px] font-medium">
                      {f.openIssues} open issue{f.openIssues > 1 ? 's' : ''} require attention
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[8px] text-ink-300 mt-1.5">Updated 2 days ago</div>
              )}
            </div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <Card title="My Tasks" padded={false}>
          {tasks.length === 0 ? (
            <p className="text-xs text-ink-300 px-5 py-6">All caught up — no pending uploads.</p>
          ) : (
            <div className="divide-y divide-surface-border">
              {tasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-ink-900">{t.title}</span>
                      <span className="px-2 py-0.5 rounded-full bg-status-pending/10 text-status-pending text-[8px] font-medium">{t.priority}</span>
                    </div>
                    <p className="text-[8px] text-ink-500 mt-1">{t.desc}</p>
                    <p className="text-[9px] text-ink-300 mt-1 flex items-center gap-1.5">
                      Updated on {t.updated}
                      <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[9px] font-medium">{t.status}</span>
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setUploadTask(t)}>Upload</Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Reporting Calendar">
          <div className="space-y-4">
            {reportingCalendar.map((r, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-surface-muted flex flex-col items-center justify-center shrink-0">
                  <span className="text-[9px] text-ink-500 leading-none">{r.month}</span>
                  <span className="text-[10px] font-semibold text-ink-900 leading-none mt-0.5">{r.date}</span>
                </div>
                <p className="text-[10px] text-ink-700 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-pending shrink-0" />
                  {r.label}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {uploadTask && (
        <UploadTaskModal
          task={uploadTask}
          onClose={() => setUploadTask(null)}
          onComplete={() => { completeTask(uploadTask.id); setUploadTask(null) }}
        />
      )}
    </div>
  )
}

function UploadTaskModal({ task, onClose, onComplete }) {
  const [files, setFiles] = useState([])
  const [error, setError] = useState(false)

  function handleSubmit() {
    if (files.length === 0) {
      setError(true)
      return
    }
    onComplete()
  }

  return (
    <div className="fixed inset-0 bg-ink-900/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-surface-border">
          <div>
            <h3 className="font-semibold text-ink-900">{task.title}</h3>
            <p className="text-xs text-ink-500 mt-0.5">{task.desc}</p>
          </div>
          <button onClick={onClose} className="text-ink-300 hover:text-ink-700"><X size={18} /></button>
        </div>
        <div className="p-6">
          <FileDropzone
            files={files}
            onFilesChange={(f) => { setFiles(f); setError(false) }}
            accept=".xlsx,.csv,.pdf"
            hint="Excel, CSV or PDF — up to 25MB"
          />
          {error && <p className="text-xs text-status-pending mt-2">Attach a file before submitting.</p>}
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-surface-border">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Submit</Button>
        </div>
      </div>
    </div>
  )
}

function AreaSparkline({ color }) {
  const gradId = `spark-${color.replace('#', '')}`
  return (
    <svg viewBox="0 0 100 40" className="w-full h-12 mt-2" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0,24 C12,10 22,8 33,18 C44,28 52,30 62,20 C72,10 82,6 100,14 L100,40 L0,40 Z"
        fill={`url(#${gradId})`}
      />
      <path
        d="M0,24 C12,10 22,8 33,18 C44,28 52,30 62,20 C72,10 82,6 100,14"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}