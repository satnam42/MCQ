import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
  },
});

// Interceptor to add Bearer token to headers dynamically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Single-flight lock to prevent duplicate logout redirects when concurrent APIs return 401
let isSessionExpiring = false;

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    // Bypass login/register routes where 401 means invalid credentials
    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/register');

    if (status === 401 && !isAuthRoute) {
      if (!isSessionExpiring) {
        isSessionExpiring = true;
        console.warn('Session expired or 401 Unauthorized encountered. Cleaning authentication state...');

        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];

        // Dispatch global event for React AuthContext
        window.dispatchEvent(new CustomEvent('auth:session-expired'));

        // Redirect to login page cleanly if not already on /login
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          const redirectUrl = '/login?expired=1';
          window.location.href = redirectUrl;
        }

        setTimeout(() => {
          isSessionExpiring = false;
        }, 2000);
      }
    }

    return Promise.reject(error);
  }
);

// Content View Tracking
export const trackContentView = async (contentType, contentId) => {
  if (!contentId) return;
  try {
    await api.post('/content/view', { contentType, contentId });
  } catch (err) {
    // Fail silently in background to avoid disrupting user workflow
    console.debug('Failed to track content view:', err);
  }
};

// System Settings APIs
export const getSystemSettings = async () => {
  const res = await api.get('/settings');
  return res.data;
};

export const updateNewContentDurationDays = async (days) => {
  const res = await api.put('/settings', { new_content_duration_days: days });
  return res.data;
};

export default api;
