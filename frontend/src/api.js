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
  listInquiries: (params) => {
    const q = new URLSearchParams(params || {}).toString();
    return req('GET', '/inquiries' + (q ? `?${q}` : ''));
  },
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
  trend: () => req('GET', '/reports/trend'),

  // custom fields
  listCustomFields: (entityType) => req('GET', `/custom-fields?entity_type=${entityType}`),
  createCustomField: (body) => req('POST', '/custom-fields', body),
  updateCustomField: (id, body) => req('PUT', `/custom-fields/${id}`, body),
  deleteCustomField: (id) => req('DELETE', `/custom-fields/${id}`),
  getCustomValues: (entityType, recordId) => req('GET', `/custom-fields/values/${entityType}/${recordId}`),
  saveCustomValues: (entityType, recordId, values) => req('POST', `/custom-fields/values/${entityType}/${recordId}`, { values }),
};
