import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Users
  getUser: (email) => apiClient.get(`/api/users/me?email=${email}`),
  registerUser: (data) => apiClient.post('/api/users/register', data),
  
  // Contacts
  getContacts: (userEmail) => apiClient.get(`/api/contacts?user_email=${userEmail}`),
  createContact: (data) => apiClient.post('/api/contacts', data),
  updateContact: (id, data) => apiClient.put(`/api/contacts/${id}`, data),
  deleteContact: (id) => apiClient.delete(`/api/contacts/${id}`),
  
  // Calls
  getCallHistory: (userEmail) => apiClient.get(`/api/calls?user_email=${userEmail}`),
  logCall: (data) => apiClient.post('/api/calls', data),
  
  // Songs/Music
  getSongs: (userEmail) => apiClient.get(userEmail ? `/api/songs?user_email=${userEmail}` : '/api/songs'),
  createSong: (data) => apiClient.post('/api/songs', data),
  
  // Properties
  getProperties: (status) => apiClient.get(status ? `/api/properties?status=${status}` : '/api/properties'),
  createProperty: (data) => apiClient.post('/api/properties', data),
  
  // Subscriptions
  getSubscriptions: (userEmail) => apiClient.get(`/api/subscriptions?user_email=${userEmail}`),
  createSubscription: (data) => apiClient.post('/api/subscriptions', data),
  
  // Workspaces
  getWorkspaces: (userEmail) => apiClient.get(`/api/workspaces?user_email=${userEmail}`),
  createWorkspace: (data) => apiClient.post('/api/workspaces', data),
  
  // Notifications
  getNotifications: (userEmail) => apiClient.get(`/api/notifications?user_email=${userEmail}`),
  createNotification: (data) => apiClient.post('/api/notifications', data),
  markNotificationRead: (id) => apiClient.put(`/api/notifications/${id}/read`),
  
  // Crypto
  getWallets: (userEmail) => apiClient.get(`/api/crypto/wallets?user_email=${userEmail}`),
  getTransactions: (userEmail) => apiClient.get(`/api/crypto/transactions?user_email=${userEmail}`),
};

export default apiClient;