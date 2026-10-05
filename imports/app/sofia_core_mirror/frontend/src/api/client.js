import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('emerald_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('emerald_token');
      localStorage.removeItem('emerald_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  me: (email) => api.get(`/api/auth/me?email=${email}`),
  updateMe: (email, data) => api.put(`/api/auth/me?email=${email}`, null, { params: data }),
};

// Contacts API
export const contactsAPI = {
  list: (userEmail) => api.get(`/api/contacts?user_email=${userEmail}`),
  create: (data, userEmail) => api.post(`/api/contacts?user_email=${userEmail}`, data),
  update: (id, data) => api.put(`/api/contacts/${id}`, data),
  delete: (id) => api.delete(`/api/contacts/${id}`),
};

// Properties API
export const propertiesAPI = {
  list: (params) => api.get('/api/properties', { params }),
  get: (id) => api.get(`/api/properties/${id}`),
  create: (data, userEmail) => api.post(`/api/properties?user_email=${userEmail}`, data),
  update: (id, data) => api.put(`/api/properties/${id}`, data),
  delete: (id) => api.delete(`/api/properties/${id}`),
};

// Subscriptions API
export const subscriptionsAPI = {
  list: (userEmail) => api.get(`/api/subscriptions?user_email=${userEmail}`),
  listAll: () => api.get('/api/subscriptions/all'),
  update: (id, data) => api.put(`/api/subscriptions/${id}`, data),
};

// Messages API
export const messagesAPI = {
  list: (userEmail, otherEmail) => api.get(`/api/messages?user_email=${userEmail}&other_email=${otherEmail}`),
  send: (data, userEmail) => api.post(`/api/messages?user_email=${userEmail}`, data),
};

// Users API
export const usersAPI = {
  list: () => api.get('/api/users'),
};

// Presence API
export const presenceAPI = {
  list: () => api.get('/api/presence'),
  update: (userEmail, status) => api.post(`/api/presence?user_email=${userEmail}&status=${status}`),
};

// Notifications API
export const notificationsAPI = {
  list: (userEmail) => api.get(`/api/notifications?user_email=${userEmail}`),
  create: (data) => api.post('/api/notifications', data),
  markRead: (id) => api.put(`/api/notifications/${id}/read`),
};

// Crypto API
export const cryptoAPI = {
  wallets: (userEmail) => api.get(`/api/crypto/wallets?user_email=${userEmail}`),
  createWallet: (data) => api.post('/api/crypto/wallets', data),
  transactions: (userEmail) => api.get(`/api/crypto/transactions?user_email=${userEmail}`),
  createTransaction: (data) => api.post('/api/crypto/transactions', data),
};

// Support API
export const supportAPI = {
  tickets: (userEmail) => api.get(`/api/support/tickets?user_email=${userEmail}`),
  createTicket: (data) => api.post('/api/support/tickets', data),
  interactions: (userEmail) => api.get(`/api/support/interactions?user_email=${userEmail}`),
};

// Collaboration API
export const collaborationAPI = {
  sessions: (userEmail) => api.get(`/api/collaboration/sessions?user_email=${userEmail}`),
  createSession: (data) => api.post('/api/collaboration/sessions', data),
  updateSession: (id, data) => api.put(`/api/collaboration/sessions/${id}`, data),
};
