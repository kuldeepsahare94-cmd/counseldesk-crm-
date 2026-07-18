// In local dev, Vite proxies /api to localhost:4000 (see vite.config.js).
// In production (Vercel), set VITE_API_BASE_URL to your Render backend URL,
// e.g. https://counseldesk-api.onrender.com
const API_ROOT = import.meta.env.VITE_API_BASE_URL || '';
const BASE = `${API_ROOT}/api`;

async function req(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || res.statusText);
  return data;
}

export const api = {
  // institutions
  listInstitutions: () => req('GET', '/institutions'),
  getInstitution: (id) => req('GET', `/institutions/${id}`),
  createInstitution: (body) => req('POST', '/institutions', body),
  updateInstitution: (id, body) => req('PUT', `/institutions/${id}`, body),
  deleteInstitution: (id) => req('DELETE', `/institutions/${id}`),
  institutionCounselings: (id) => req('GET', `/institutions/${id}/counselings`),

  // inquiries
  listInquiries: (status) => req('GET', '/inquiries' + (status ? `?status=${status}` : '')),
  getInquiry: (id) => req('GET', `/inquiries/${id}`),
  createInquiry: (body) => req('POST', '/inquiries', body),
  updateInquiry: (id, body) => req('PUT', `/inquiries/${id}`, body),
  deleteInquiry: (id) => req('DELETE', `/inquiries/${id}`),
  linkInstitution: (inquiryId, body) => req('POST', `/inquiries/${inquiryId}/institutions`, body),
  updateLink: (linkId, body) => req('PUT', `/inquiries/institutions/${linkId}`, body),
  removeLink: (linkId) => req('DELETE', `/inquiries/institutions/${linkId}`),
  convertInquiry: (id) => req('POST', `/inquiries/${id}/convert`),
  addFollowup: (id, body) => req('POST', `/inquiries/${id}/followups`, body),

  // students
  listStudents: () => req('GET', '/students'),
  getStudent: (id) => req('GET', `/students/${id}`),
  updateStudent: (id, body) => req('PUT', `/students/${id}`, body),

  // enrollments
  listEnrollments: () => req('GET', '/enrollments'),
  createEnrollment: (body) => req('POST', '/enrollments', body),
  updateEnrollment: (id, body) => req('PUT', `/enrollments/${id}`, body),
  deleteEnrollment: (id) => req('DELETE', `/enrollments/${id}`),

  // reports
  summary: () => req('GET', '/reports/summary'),
  institutionCounselingReport: () => req('GET', '/reports/institution-counseling'),
  revenueByInstitution: () => req('GET', '/reports/revenue-by-institution'),
  funnel: () => req('GET', '/reports/funnel'),
};
