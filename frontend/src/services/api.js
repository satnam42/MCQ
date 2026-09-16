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

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
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
