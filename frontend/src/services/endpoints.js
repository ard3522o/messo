import api from './api';

export const authApi = {
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data.data),
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data.data),
  me: () => api.get('/auth/me').then((r) => r.data.data.user),
  updateProfile: (payload) => api.patch('/auth/profile', payload).then((r) => r.data.data.user),
  changePassword: (payload) => api.patch('/auth/password', payload),
};

export const studentApi = {
  list: (params) => api.get('/students', { params }).then((r) => r.data),
  get: (id) => api.get(`/students/${id}`).then((r) => r.data.data),
  create: (payload) => api.post('/students', payload).then((r) => r.data.data),
  update: (id, payload) => api.patch(`/students/${id}`, payload).then((r) => r.data.data),
  remove: (id) => api.delete(`/students/${id}`),
  updateMe: (payload) => api.patch('/students/me', payload).then((r) => r.data.data),
  filters: () => api.get('/students/meta/filters').then((r) => r.data.data),
};

export const menuApi = {
  week: (start) => api.get('/menus/week', { params: { start } }).then((r) => r.data.data),
  range: (params) => api.get('/menus', { params }).then((r) => r.data.data),
  today: (date) => api.get('/menus/today', { params: date ? { date } : {} }).then((r) => r.data.data),
  create: (payload) => api.post('/menus', payload).then((r) => r.data.data),
  update: (id, payload) => api.patch(`/menus/${id}`, payload).then((r) => r.data.data),
  remove: (id) => api.delete(`/menus/${id}`),
  setAvailability: (id, meal, isAvailable) =>
    api.patch(`/menus/${id}/meals/${meal}/availability`, { isAvailable }).then((r) => r.data.data),
  copyWeek: (fromStart, toStart) => api.post('/menus/copy', { fromStart, toStart }).then((r) => r.data.data),
};

export const attendanceApi = {
  myMonth: (month) => api.get('/attendance/me', { params: { month } }).then((r) => r.data.data),
  myToday: () => api.get('/attendance/me/today').then((r) => r.data.data),
  checkIn: (token) => api.post('/attendance/check-in', { token }).then((r) => r.data.data),
  list: (params) => api.get('/attendance', { params }).then((r) => r.data),
  summary: (date) => api.get('/attendance/summary', { params: { date } }).then((r) => r.data.data),
  trend: (days = 14) => api.get('/attendance/trend', { params: { days } }).then((r) => r.data.data),
  generateQr: (meal, date) => api.post('/attendance/qr', { meal, date }).then((r) => r.data.data),
  mark: (payload) => api.post('/attendance', payload).then((r) => r.data.data),
  remove: (id) => api.delete(`/attendance/${id}`),
  requirements: (date) => api.get('/attendance/requirements', { params: { date } }).then((r) => r.data.data),
};

export const paymentApi = {
  list: (params) => api.get('/payments', { params }).then((r) => r.data),
  mine: () => api.get('/payments/me').then((r) => r.data.data),
  summary: (month) => api.get('/payments/summary', { params: { month } }).then((r) => r.data.data),
  create: (payload) => api.post('/payments', payload).then((r) => r.data.data),
  generate: (month) => api.post('/payments/generate', { month }).then((r) => r.data.data),
  pay: (id, payload) => api.post(`/payments/${id}/pay`, payload).then((r) => r.data.data),
  update: (id, payload) => api.patch(`/payments/${id}`, payload).then((r) => r.data.data),
  remove: (id) => api.delete(`/payments/${id}`),
};

export const complaintApi = {
  mine: () => api.get('/complaints/me').then((r) => r.data.data),
  list: (params) => api.get('/complaints', { params }).then((r) => r.data),
  stats: () => api.get('/complaints/stats').then((r) => r.data.data),
  create: (formData) =>
    api.post('/complaints', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data),
  update: (id, payload) => api.patch(`/complaints/${id}`, payload).then((r) => r.data.data),
  remove: (id) => api.delete(`/complaints/${id}`),
};

export const feedbackApi = {
  mine: () => api.get('/feedback/me').then((r) => r.data.data),
  list: (params) => api.get('/feedback', { params }).then((r) => r.data),
  summary: (days = 30) => api.get('/feedback/summary', { params: { days } }).then((r) => r.data.data),
  submit: (payload) => api.post('/feedback', payload).then((r) => r.data.data),
  remove: (id) => api.delete(`/feedback/${id}`),
};

export const inventoryApi = {
  list: (params) => api.get('/inventory', { params }).then((r) => r.data),
  summary: (month) => api.get('/inventory/summary', { params: { month } }).then((r) => r.data.data),
  create: (payload) => api.post('/inventory', payload).then((r) => r.data.data),
  update: (id, payload) => api.patch(`/inventory/${id}`, payload).then((r) => r.data.data),
  remove: (id) => api.delete(`/inventory/${id}`),
  recordStock: (id, payload) => api.post(`/inventory/${id}/stock`, payload).then((r) => r.data.data),
  logs: (params) => api.get('/inventory/logs', { params }).then((r) => r.data),
};

export const announcementApi = {
  list: (params) => api.get('/announcements', { params }).then((r) => r.data),
  create: (payload) => api.post('/announcements', payload).then((r) => r.data.data),
  update: (id, payload) => api.patch(`/announcements/${id}`, payload).then((r) => r.data.data),
  remove: (id) => api.delete(`/announcements/${id}`),
};

export const analyticsApi = {
  admin: (params) => api.get('/analytics/admin/overview', { params }).then((r) => r.data.data),
  manager: (params) => api.get('/analytics/manager/overview', { params }).then((r) => r.data.data),
  student: () => api.get('/analytics/student/overview').then((r) => r.data.data),
};

export const subscriptionApi = {
  list: (params) => api.get('/subscriptions', { params }).then((r) => r.data),
  create: (payload) => api.post('/subscriptions', payload).then((r) => r.data.data),
  update: (id, payload) => api.patch(`/subscriptions/${id}`, payload).then((r) => r.data.data),
  remove: (id) => api.delete(`/subscriptions/${id}`),
};

export const reportApi = {
  download: (type, params) => `/reports/${type}`,
};
