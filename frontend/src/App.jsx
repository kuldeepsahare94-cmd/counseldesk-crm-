import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inquiries from './pages/Inquiries';
import InquiryDetail from './pages/InquiryDetail';
import FollowUps from './pages/FollowUps';
import Tasks from './pages/Tasks';
import Institutions from './pages/Institutions';
import InstitutionDetail from './pages/InstitutionDetail';
import Students from './pages/Students';
import StudentDetail from './pages/StudentDetail';
import Applications from './pages/Applications';
import Settings from './pages/Settings';
import Users from './pages/Users';
import Reports from './pages/Reports';
import MasterData from './pages/MasterData';
import Appearance from './pages/Appearance';

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/inquiries" element={<Inquiries />} />
              <Route path="/inquiries/:id" element={<InquiryDetail />} />
              <Route path="/followups" element={<FollowUps />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/institutions" element={<Institutions />} />
              <Route path="/institutions/:id" element={<InstitutionDetail />} />
              <Route path="/students" element={<Students />} />
              <Route path="/students/:id" element={<StudentDetail />} />
              <Route path="/applications" element={<Applications />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/master-data" element={<MasterData />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/appearance" element={<Appearance />} />
              <Route path="/users" element={<Users />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}
