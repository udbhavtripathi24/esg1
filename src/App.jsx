import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Payment from './pages/Payment.jsx'
import Login from './pages/auth/Login.jsx'
import ConsultantLayout from './components/ConsultantLayout.jsx'
import ClientLayout from './components/ClientLayout.jsx'
import { ClientPoolProvider } from './context/ClientPoolContext.jsx'
import ConsultantDashboard from './pages/consultant/Dashboard.jsx'
import ControlCenter from './pages/consultant/ControlCenter.jsx'
import NewClientRegistration from './pages/consultant/NewClientRegistration.jsx'
import ConsultantUploadCenter from './pages/consultant/UploadCenter.jsx'
import ConsultantReviewCenter from './pages/consultant/ReviewCenter.jsx'
import ClientDashboard from './pages/client/Dashboard.jsx'
import ClientUploadCenter from './pages/client/UploadCenter.jsx'
import ClientReviewCenter from './pages/client/ReviewCenter.jsx'
import Analytics from './pages/client/Analytics.jsx'
import Benchmarking from './pages/client/Benchmarking.jsx'
import Reporting from './pages/client/Reporting.jsx'
import Assurance from './pages/client/Assurance.jsx'
import PersonalizedAssessment from './pages/client/PersonalizedAssessment.jsx'
import Surveys from './pages/client/Surveys.jsx'
import AdminConsole from './pages/client/AdminConsole.jsx'
import Settings from './pages/client/Settings.jsx'

function App() {
  return (
    <ClientPoolProvider>
      <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/payment" element={<Payment />} />
      <Route path="/login" element={<Login />} />

      {/* Deloitte consultant portal */}
      <Route path="/consultant" element={<ConsultantLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ConsultantDashboard />} />
        <Route path="control-center" element={<ControlCenter />} />
        <Route path="control-center/new-client" element={<NewClientRegistration />} />
        <Route path="upload-center" element={<ConsultantUploadCenter />} />
        <Route path="review-center" element={<ConsultantReviewCenter />} />
      </Route>

      {/* Client portal */}
      <Route path="/client" element={<ClientLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ClientDashboard />} />
        <Route path="upload-center" element={<ClientUploadCenter />} />
        <Route path="review-center" element={<ClientReviewCenter />} />
        <Route path="benchmarking" element={<Benchmarking />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="reporting" element={<Reporting />} />
        <Route path="assurance" element={<Assurance />} />
        <Route path="personalized-assessment" element={<PersonalizedAssessment />} />
        <Route path="surveys" element={<Surveys />} />
        <Route path="admin-console" element={<AdminConsole />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ClientPoolProvider>
  )
}

export default App
