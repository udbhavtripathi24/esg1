import AssessmentModule from '../../components/AssessmentModule.jsx'
import { surveysData } from '../../data/mockData'

export default function Surveys() {
  return <AssessmentModule kind="survey" seedData={surveysData} />
}
