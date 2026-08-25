import AssessmentModule from '../../components/AssessmentModule.jsx'
import { assessmentsData } from '../../data/mockData'

export default function PersonalizedAssessment() {
  return <AssessmentModule kind="assessment" seedData={assessmentsData} />
}
