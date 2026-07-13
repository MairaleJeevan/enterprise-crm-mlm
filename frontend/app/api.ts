import axios from 'axios';

/**
 * Determine the backend API base URL:
 *   1. If NEXT_PUBLIC_API_URL env var is set (e.g. in production), use that.
 *   2. Otherwise, auto-detect: use the same hostname the browser is on, port 3001.
 *      This way mobile devices on the same network reach the backend automatically.
 */
function getBaseURL(): string {
  // Env var always wins (set this in .env.local or deployment platform)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // On the server (SSR / build), fall back to localhost
  if (typeof window === 'undefined') {
    return 'http://localhost:3001';
  }

  // In the browser: use the same hostname the user is viewing the site on
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:3001`;
}

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;

