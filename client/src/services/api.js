/**
 * Centralized API Service for Hive using native Fetch API.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

let onUnauthorizedCallback = null;

export function registerUnauthorizedCallback(callback) {
  onUnauthorizedCallback = callback;
}

async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('hive_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    // Handle 401 Unauthorized
    if (response.status === 401) {
      localStorage.removeItem('hive_token');
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = data.message || `Request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (!error.status) {
      // Network error or unexpected failure
      console.error('[API Service Error]', error.message);
    }
    throw error;
  }
}

export const api = {
  get: (endpoint, options = {}) => request(endpoint, { method: 'GET', ...options }),

  post: (endpoint, body, options = {}) =>
    request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options,
    }),

  patch: (endpoint, body, options = {}) =>
    request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
      ...options,
    }),

  delete: (endpoint, options = {}) => request(endpoint, { method: 'DELETE', ...options }),
};

export default api;
