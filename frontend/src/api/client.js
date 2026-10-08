const FALLBACK_PRODUCTION_API_URL = 'https://careconnect-wqts.onrender.com/api';

function resolveBaseUrl() {
  const envUrl = (import.meta.env.VITE_API_URL || '').trim();

  // If envUrl is unset, empty, or still set to a template placeholder, fallback
  if (
    !envUrl ||
    envUrl.includes('your-careconnect-render-url') ||
    envUrl.includes('placeholder') ||
    envUrl.includes('<') ||
    envUrl === 'undefined'
  ) {
    return import.meta.env.DEV ? '/api' : FALLBACK_PRODUCTION_API_URL;
  }

  // Strip trailing slashes
  let cleaned = envUrl.replace(/\/+$/, '');

  // Express API routes are mounted under /api, so ensure the base URL ends with /api
  if (cleaned.startsWith('http') && !cleaned.endsWith('/api')) {
    cleaned = `${cleaned}/api`;
  }

  return cleaned;
}

const BASE_URL = resolveBaseUrl();

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('careconnect_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  // If body is FormData, delete Content-Type to allow browser to set boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error.message);
    throw error;
  }
}

export const api = {
  get: (endpoint, options) => apiRequest(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) =>
    apiRequest(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options
    }),
  put: (endpoint, body, options) =>
    apiRequest(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options
    }),
  delete: (endpoint, options) => apiRequest(endpoint, { method: 'DELETE', ...options })
};
