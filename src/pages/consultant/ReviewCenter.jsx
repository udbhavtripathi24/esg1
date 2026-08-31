import ReviewCenterView from '../../components/ReviewCenterView.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

export default function ReviewCenter() {
  const { user } = useAuth()
  return <ReviewCenterView currentUserName={user?.name || 'User'} reviewerName="Daniel Walsh" />
}