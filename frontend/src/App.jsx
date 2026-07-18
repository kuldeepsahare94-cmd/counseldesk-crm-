import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inquiries from './pages/Inquiries';
import InquiryDetail from './pages/InquiryDetail';
import FollowUps from './pages/FollowUps';
import Institutions from './pages/Institutions';
import InstitutionDetail from './pages/InstitutionDetail';
import Students from './pages/Students';
import StudentDetail from './pages/StudentDetail';
import Settings from './pages/Settings';
import Users from './pages/Users';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inquiries" element={<Inquiries />} />
            <Route path="/inquiries/:id" element={<InquiryDetail />} />
            <Route path="/followups" element={<FollowUps />} />
            <Route path="/institutions" element={<Institutions />} />
            <Route path="/institutions/:id" element={<InstitutionDetail />} />
            <Route path="/students" element={<Students />} />
            <Route path="/students/:id" element={<StudentDetail />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/users" element={<Users />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
