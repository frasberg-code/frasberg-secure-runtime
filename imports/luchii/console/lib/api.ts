// API client utility
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

interface ApiConfig {
  headers?: Record<string, string>;
}

function getAuthToken() {
  return localStorage.getItem('auth_token');
}

async function request(method: string, endpoint: string, data?: any, config?: ApiConfig) {
  const url = `${API_BASE}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...config?.headers,
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  get: (endpoint: string, config?: ApiConfig) => request('GET', endpoint, undefined, config),
  post: (endpoint: string, data?: any, config?: ApiConfig) =>
    request('POST', endpoint, data, config),
  put: (endpoint: string, data?: any, config?: ApiConfig) =>
    request('PUT', endpoint, data, config),
  delete: (endpoint: string, config?: ApiConfig) => request('DELETE', endpoint, undefined, config),
};

export function setAuthToken(token: string) {
  localStorage.setItem('auth_token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('auth_token');
}
