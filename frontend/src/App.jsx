import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inquiries from './pages/Inquiries';
import InquiryDetail from './pages/InquiryDetail';
import Institutions from './pages/Institutions';
import InstitutionDetail from './pages/InstitutionDetail';
import Students from './pages/Students';
import StudentDetail from './pages/StudentDetail';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inquiries" element={<Inquiries />} />
          <Route path="/inquiries/:id" element={<InquiryDetail />} />
          <Route path="/institutions" element={<Institutions />} />
          <Route path="/institutions/:id" element={<InstitutionDetail />} />
          <Route path="/students" element={<Students />} />
          <Route path="/students/:id" element={<StudentDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
