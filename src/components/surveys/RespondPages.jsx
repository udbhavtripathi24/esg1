import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { inAppTransport, publicTransport } from '../../api/surveys.js'
import SurveyForm from './SurveyForm.jsx'
import { useSurveysBase } from './util.js'

/** A signed-in user answering inside the app. */
export function RespondPage() {
  const { surveyId } = useParams()
  const base = useSurveysBase()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const transport = useMemo(() => {
    const t = inAppTransport(surveyId)
    // Keep the "To answer" list fresh after saving or submitting
    const refresh = (p) => p.then((r) => { qc.invalidateQueries({ queryKey: ['surveys', 'mine'] }); return r })
    return { ...t, save: (...a) => refresh(t.save(...a)), submit: (...a) => refresh(t.submit(...a)) }
  }, [surveyId, qc])
  return (
    <div className="max-w-3xl mx-auto">
      <Link to={`${base}?view=answer`} className="inline-flex items-center gap-1 text-[11px] text-ink-500 hover:text-ink-900 mb-3"><ArrowLeft size={13} /> Surveys</Link>
      <SurveyForm transport={transport} onClose={() => navigate(`${base}?view=answer`)} />
    </div>
  )
}

/** Anyone with a personal or public link — no login, no app chrome. */
export function PublicSurveyPage() {
  const { token } = useParams()
  const transport = useMemo(() => publicTransport(token), [token])
  return (
    <div className="min-h-screen bg-surface-muted">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <SurveyForm transport={transport} />
        <p className="text-center text-[10px] text-ink-300 mt-6">Powered by Deloitte VISTA · Your answers are sent securely to the organisation that asked you.</p>
      </div>
    </div>
  )
}
