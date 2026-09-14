import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, Download, FileDown, Sparkles, ChevronDown, ChevronUp, X, Eye,
} from 'lucide-react'
import PageHeader from '../../components/PageHeader.jsx'
import { Card, Button, ProgressBar } from '../../components/ui.jsx'

/**
 * Static, frontend-only prototype for manager review -- built from a
 * reference mockup. All data on this page (questions, participants,
 * the AI-generated insight text) is hardcoded/static, not wired to any
 * real backend. Backend implementation is deliberately deferred until
 * this prototype is approved.
 */

const QUESTIONS = [
  'Describe the primary physical climate risks that has your department has identified in the past 12 months.',
  'Has your department conducted a formal climate risk review this financial year?',
  'Which climate-related risks has your team formally identified? Select all that apply.',
  'Rate your team\u2019s current climate risk management maturity (1 = Early stage, 5 = Leading practice).',
  'Does your team have a documented climate risk mitigation plan in place?',
  'What additional resources or support would help your team better manage climate-related risks?',
  'Upload any supporting evidence such as risk registers, reports or previous assessments.',
]

const PARTICIPANTS = [
  { name: 'Michael Chen', email: 'michael.chen@company.com', dept: 'Operations', status: 'Completed', submitted: '12 Jun 2025', time: '15' },
  { name: 'Rachel Kim', email: 'rachel.kim@company.com', dept: 'Finance', status: 'Completed', submitted: '12 Jun 2025', time: '13' },
  { name: 'David Patel', email: 'david.patel@company.com', dept: 'Procurement', status: 'In Progress', submitted: '12 Jun 2025', time: '\u2014' },
]

const INSIGHT_QUESTIONS = [
  { q: 'Q1', label: 'Physical Climate Risks Identified', tag: 'Pattern Identified', tone: 'blue', score: '18/18' },
  { q: 'Q2', label: 'Formal Climate Risk Review Status', tag: 'Potential Gap', tone: 'amber', score: '18/18' },
  { q: 'Q3', label: 'Risk Categories Identified', tag: 'Strong Alignment', tone: 'green', score: '18/18' },
  { q: 'Q4', label: 'Climate Risk Management Maturity', tag: 'Pattern Identified', tone: 'blue', score: '18/18' },
  { q: 'Q5', label: 'Documented Mitigation Plan', tag: 'Pattern Identified', tone: 'blue', score: '18/18' },
  { q: 'Q6', label: 'Resource and Support Needs', tag: 'Pattern Identified', tone: 'blue', score: '18/18' },
  { q: 'Q7', label: 'Supporting Evidence Uploaded', tag: 'Pattern Identified', tone: 'blue', score: '18/18' },
]

const KEY_TAKEAWAYS = [
  'Strong climate risk awareness exists across the organization, with consistent identification of physical and supply-chain risks.',
  'Formal mitigation planning is absent in a majority of departments, including several with significant physical risk exposure.',
  'Self-assessed maturity is bifurcated: specialist functions report moderate-to-high maturity while enabling functions remain at early stage.',
  'Resource constraints \u2014 particularly tooling, templates and cross-functional access \u2014 are the primary barriers to maturity improvement.',
  'Supporting evidence was submitted by 14 of 18 participants; AI cross-check is complete and flagged two documents for review.',
]

const TAG_STYLES = {
  blue: 'text-blue-700 border-blue-300 bg-blue-50',
  amber: 'text-amber-700 border-amber-300 bg-amber-50',
  green: 'text-brand-greenDark border-brand-green/40 bg-brand-green/5',
}

const PARTICIPANT_STATUS_STYLES = {
  Completed: 'bg-status-approved/10 text-status-approved',
  'In Progress': 'bg-blue-50 text-blue-600',
}
function ParticipantStatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-medium whitespace-nowrap ${PARTICIPANT_STATUS_STYLES[status] || 'bg-ink-100 text-ink-500'}`}>
      {status}
    </span>
  )
}

function InsightRow({ item }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="bg-surface-muted/40 rounded-md">
      <button onClick={() => setExpanded((e) => !e)} className="w-full flex items-center gap-3 px-3 py-2.5 text-left">
        <span className="w-8 h-8 shrink-0 rounded-md border border-surface-border flex items-center justify-center text-[10px] font-semibold text-ink-700">{item.q}</span>
        <span className="flex-1 text-xs text-ink-900 font-medium truncate">{item.label}</span>
        <span className={`hidden sm:inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border ${TAG_STYLES[item.tone]}`}>{item.tag}</span>
        <span className="text-[10px] text-ink-400 shrink-0">{item.score}</span>
        {expanded ? <ChevronUp size={14} className="text-ink-400 shrink-0" /> : <ChevronDown size={14} className="text-ink-400 shrink-0" />}
      </button>
      {expanded && (
        <div className="px-3 pb-3 -mt-1">
          <span className={`sm:hidden inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border mb-2 ${TAG_STYLES[item.tone]}`}>{item.tag}</span>
          <p className="text-[11px] text-ink-500">
            {item.score} responses referenced this theme consistently. This is a static prototype value \u2014 the real breakdown will be generated from actual participant responses once AI analysis is connected to live assessment data.
          </p>
        </div>
      )}
    </div>
  )
}

function AiInsightsPanel({ onClose }) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="fixed inset-0 bg-ink-900/30" onClick={onClose} />
      <div className="relative w-full sm:w-[420px] bg-white h-full shadow-xl flex flex-col">
        <div className="p-5 border-b border-surface-border">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-md bg-brand-green flex items-center justify-center text-white shrink-0">
              <Sparkles size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-ink-900 text-sm">AI Response Insights</h3>
                <span className="text-[10px] font-medium text-brand-greenDark bg-brand-green/10 px-2 py-0.5 rounded-full">Analysis Complete</span>
              </div>
              <p className="text-[11px] text-ink-500 mt-1">AI-generated analysis of participant responses to identify patterns, trends and key observations.</p>
            </div>
            <button onClick={onClose} className="text-ink-300 hover:text-ink-700 shrink-0"><X size={18} /></button>
          </div>
          <div className="flex gap-2 mt-3">
            <span className="text-[10px] border border-surface-border rounded-md px-2.5 py-1"><b>18</b> Responses analyzed</span>
            <span className="text-[10px] border border-surface-border rounded-md px-2.5 py-1"><b>7</b> Questions analyzed</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="bg-brand-green/5 border border-brand-green/30 rounded-lg p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-greenDark mb-2">
              <Sparkles size={12} /> Overall Assessment Insight
            </p>
            <p className="text-[11px] text-ink-600 leading-relaxed">
              Most participants demonstrate strong awareness of climate-related risks, with consistent identification of physical and transition risk categories. Governance ownership appears well-established in specialist functions. However, responses reveal a material gap in formal mitigation planning across operational and enabling departments \u2014 particularly in teams with direct physical climate exposure. Strengthening documentation practices and extending formal reviews beyond specialist functions should be prioritized before the next disclosure cycle.
            </p>
          </div>

          <div className="space-y-1.5">
            {INSIGHT_QUESTIONS.map((item) => <InsightRow key={item.q} item={item} />)}
          </div>

          <div className="bg-brand-green/5 border border-brand-green/30 rounded-lg p-4">
            <p className="text-xs font-semibold text-brand-greenDark mb-2">Key Takeaways</p>
            <ol className="space-y-1.5 list-decimal list-inside">
              {KEY_TAKEAWAYS.map((t, i) => <li key={i} className="text-[11px] text-ink-600 leading-relaxed">{t}</li>)}
            </ol>
          </div>

          <p className="text-[10px] text-ink-400 border border-surface-border rounded-md p-3 leading-relaxed">
            AI-generated insights are based on submitted participant responses and are intended to support review. They should be validated by the appropriate reviewer before being used for formal reporting or decision-making.
          </p>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-surface-border">
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button><Download size={14} /> Download Insights</Button>
        </div>
      </div>
    </div>
  )
}

export default function PersonalizedAssessment() {
  const [showInsights, setShowInsights] = useState(false)
  const completionPct = 75

  return (
    <div>
      <PageHeader
        title="Assessments"
        subtitle="Manage and track organization-specific ESG assessments"
        action={
          <div className="flex gap-2">
            <Button variant="ghost"><FileDown size={13} /> Export Responses</Button>
            <Button><FileDown size={13} /> Export Summary PDF</Button>
          </div>
        }
      />

      <Link to="/client/assessments" className="inline-flex items-center gap-1.5 text-[11px] text-ink-500 hover:text-ink-900 mb-4">
        <ArrowLeft size={12} /> Back to Assessments
      </Link>

      <Card className="mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-10 h-10 rounded-md bg-brand-green flex items-center justify-center text-white shrink-0">
            <Sparkles size={18} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-ink-900">Analyze Responses with AI</p>
              <span className="text-[10px] font-medium text-brand-greenDark bg-brand-green/10 px-2 py-0.5 rounded-full">AI Analysis Available</span>
            </div>
            <p className="text-[11px] text-ink-500 mt-0.5">Identify patterns, trends and key insights across participant responses.</p>
          </div>
          <Button onClick={() => setShowInsights(true)} className="shrink-0 w-full sm:w-auto justify-center">
            <Sparkles size={13} /> Analyze Responses
          </Button>
        </div>
      </Card>

      <Card className="mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="text-center sm:text-left shrink-0">
            <p className="text-2xl font-semibold text-ink-900">{completionPct}%</p>
            <p className="text-[10px] text-ink-400">Completion rate</p>
          </div>
          <div className="flex-1 w-full">
            <p className="text-[10px] text-ink-400 mb-1">18 of 24 responses received</p>
            <ProgressBar pct={completionPct} />
            <div className="flex flex-wrap gap-3 mt-1.5 text-[9px] text-ink-400">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-brand-green" /> Completed 75%</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> In Progress 17%</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-ink-200" /> Not Started 8%</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-[1fr_280px] gap-4 mb-5">
        <Card title={`Assessment Questions (${QUESTIONS.length})`} action={<button className="text-[10px] text-brand-green font-medium">Edit</button>}>
          <ul className="space-y-2.5">
            {QUESTIONS.map((q, i) => (
              <li key={i} className="text-[11px] text-ink-700 flex gap-1.5">
                <span className="shrink-0 text-ink-400">Q{i + 1}.</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Assessment Summary">
          <div className="space-y-3 text-[11px]">
            <div><p className="text-ink-400">Total questions</p><p className="text-ink-900 font-medium">{QUESTIONS.length}</p></div>
            <div><p className="text-ink-400">Estimated time for completion</p><p className="text-ink-900 font-medium">10 mins</p></div>
            <div><p className="text-ink-400">Assessment type</p><p className="text-ink-900 font-medium">Internal</p></div>
            <div><p className="text-ink-400">Response type</p><p className="text-ink-900 font-medium">Non-Anonymous</p></div>
            <div><p className="text-ink-400">Deadline</p><p className="text-ink-900 font-medium">30 Aug 2025</p></div>
          </div>
        </Card>
      </div>

      <Card title="Participant Responses" padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-left text-ink-500 border-b border-surface-border">
                <th className="font-medium px-4 py-2.5 whitespace-nowrap">Participant</th>
                <th className="font-medium px-3 py-2.5 whitespace-nowrap">Department</th>
                <th className="font-medium px-3 py-2.5 whitespace-nowrap">Status</th>
                <th className="font-medium px-3 py-2.5 whitespace-nowrap">Submitted</th>
                <th className="font-medium px-3 py-2.5 whitespace-nowrap">Time Taken (min)</th>
                <th className="font-medium px-4 py-2.5 whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody>
              {PARTICIPANTS.map((p) => (
                <tr key={p.email} className="border-b border-surface-border last:border-0">
                  <td className="px-4 py-2.5">
                    <p className="text-ink-900 font-medium whitespace-nowrap">{p.name}</p>
                    <p className="text-ink-300 text-[10px]">{p.email}</p>
                  </td>
                  <td className="px-3 py-2.5 text-ink-700 whitespace-nowrap">{p.dept}</td>
                  <td className="px-3 py-2.5"><ParticipantStatusBadge status={p.status} /></td>
                  <td className="px-3 py-2.5 text-ink-700 whitespace-nowrap">{p.submitted}</td>
                  <td className="px-3 py-2.5 text-ink-700 whitespace-nowrap">{p.time}</td>
                  <td className="px-4 py-2.5">
                    <button className="flex items-center gap-1 text-[10px] text-brand-green font-medium whitespace-nowrap">
                      <Eye size={11} /> View Response
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showInsights && <AiInsightsPanel onClose={() => setShowInsights(false)} />}
    </div>
  )
}
