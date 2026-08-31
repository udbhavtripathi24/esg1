import UploadDataView from '../../components/UploadDataView.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

export default function UploadCenter() {
  const { user } = useAuth()
  return <UploadDataView currentUserName={user?.name || 'User'} />
}
