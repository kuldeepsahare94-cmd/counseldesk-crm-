// In local dev, Vite proxies /api to localhost:4000 (see vite.config.js).
// In production (Vercel), set VITE_API_BASE_URL to your Render backend URL,
// e.g. https://counseldesk-api.onrender.com
const API_ROOT = import.meta.env.VITE_API_BASE_URL || '';
const BASE = `${API_ROOT}/api`;

async function req(method, path, body) {
  const token = localStorage.getItem('cd_token');
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    localStorage.removeItem('cd_token');
    localStorage.removeItem('cd_user');
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    throw new Error('Session expired, please log in again');
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || res.statusText);
  return data;
}

export const api = {
  // auth
  login: (username, password) => req('POST', '/auth/login', { username, password }),

  // users
  listUsers: () => req('GET', '/users'),
  createUser: (body) => req('POST', '/users', body),
  updateUser: (id, body) => req('PUT', `/users/${id}`, body),
  deleteUser: (id) => req('DELETE', `/users/${id}`),

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

  // follow-ups (call log)
  listFollowups: (params) => {
    const q = new URLSearchParams(params || {}).toString();
    return req('GET', '/followups' + (q ? `?${q}` : ''));
  },
  updateFollowup: (id, body) => req('PUT', `/followups/${id}`, body),
  deleteFollowup: (id) => req('DELETE', `/followups/${id}`),
  followupsSummary: () => req('GET', '/reports/followups-summary'),

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

  // master data
  listCountries: () => req('GET', '/master-data/countries'),
  createCountry: (body) => req('POST', '/master-data/countries', body),
  deleteCountry: (id) => req('DELETE', `/master-data/countries/${id}`),

  listStates: (countryId) => req('GET', `/master-data/states${countryId ? `?country_id=${countryId}` : ''}`),
  createState: (body) => req('POST', '/master-data/states', body),
  deleteState: (id) => req('DELETE', `/master-data/states/${id}`),

  listCities: (stateId) => req('GET', `/master-data/cities${stateId ? `?state_id=${stateId}` : ''}`),
  createCity: (body) => req('POST', '/master-data/cities', body),
  deleteCity: (id) => req('DELETE', `/master-data/cities/${id}`),

  listUniversities: () => req('GET', '/master-data/universities'),
  createUniversity: (body) => req('POST', '/master-data/universities', body),
  updateUniversity: (id, body) => req('PUT', `/master-data/universities/${id}`, body),
  deleteUniversity: (id) => req('DELETE', `/master-data/universities/${id}`),

  listCourses: (universityId) => req('GET', `/master-data/courses${universityId ? `?university_id=${universityId}` : ''}`),
  createCourse: (body) => req('POST', '/master-data/courses', body),
  updateCourse: (id, body) => req('PUT', `/master-data/courses/${id}`, body),
  deleteCourse: (id) => req('DELETE', `/master-data/courses/${id}`),

  listIntakes: () => req('GET', '/master-data/intakes'),
  createIntake: (body) => req('POST', '/master-data/intakes', body),
  deleteIntake: (id) => req('DELETE', `/master-data/intakes/${id}`),

  listOptions: (listType) => req('GET', `/master-data/options?list_type=${listType}`),
  createOption: (body) => req('POST', '/master-data/options', body),
  updateOption: (id, body) => req('PUT', `/master-data/options/${id}`, body),
  deleteOption: (id) => req('DELETE', `/master-data/options/${id}`),

  // applications
  listApplications: (params) => {
    const q = new URLSearchParams(params || {}).toString();
    return req('GET', '/applications' + (q ? `?${q}` : ''));
  },
  getApplication: (id) => req('GET', `/applications/${id}`),
  createApplication: (body) => req('POST', '/applications', body),
  updateApplication: (id, body) => req('PUT', `/applications/${id}`, body),
  deleteApplication: (id) => req('DELETE', `/applications/${id}`),
  convertApplication: (id, body) => req('POST', `/applications/${id}/convert`, body),

  // documents
  listDocuments: (params) => {
    const q = new URLSearchParams(params || {}).toString();
    return req('GET', '/documents' + (q ? `?${q}` : ''));
  },
  createDocument: (body) => req('POST', '/documents', body),
  updateDocument: (id, body) => req('PUT', `/documents/${id}`, body),
  deleteDocument: (id) => req('DELETE', `/documents/${id}`),

  // tasks
  listTasks: (params) => {
    const q = new URLSearchParams(params || {}).toString();
    return req('GET', '/tasks' + (q ? `?${q}` : ''));
  },
  createTask: (body) => req('POST', '/tasks', body),
  updateTask: (id, body) => req('PUT', `/tasks/${id}`, body),
  deleteTask: (id) => req('DELETE', `/tasks/${id}`),

  // payments
  listPayments: (params) => {
    const q = new URLSearchParams(params || {}).toString();
    return req('GET', '/payments' + (q ? `?${q}` : ''));
  },
  createPayment: (body) => req('POST', '/payments', body),
  deletePayment: (id) => req('DELETE', `/payments/${id}`),
  paymentSummary: (enrollmentId) => req('GET', `/payments/enrollment/${enrollmentId}/summary`),

  tasksSummary: () => req('GET', '/reports/tasks-summary'),

  // notifications
  listNotifications: () => req('GET', '/notifications'),
  markNotificationRead: (key) => req('POST', `/notifications/${key}/read`),
  markAllNotificationsRead: () => req('POST', '/notifications/read-all'),
};
