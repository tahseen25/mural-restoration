// src/services/api.js
import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 120_000,
});

// ── Response interceptor — surface errors globally ────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg  = err.response?.data?.error || err.message || 'An error occurred';
    const code = err.response?.status;

    // Token expired → log out
    if (code === 401 && typeof window !== 'undefined') {
      const { default: useAuthStore } = require('@/store/authStore');
      useAuthStore.getState().logout();
      window.location.href = '/login?session=expired';
      return Promise.reject(err);
    }

    // Don't toast on every error — let components decide
    // But do toast on 5xx server errors
    if (code >= 500) {
      toast.error('Server error. Please try again.');
    }

    return Promise.reject(err);
  }
);

// ── Named helpers ─────────────────────────────────────────────

/** Upload an image file, returns image metadata */
export const uploadImage = async (file) => {
  const form = new FormData();
  form.append('image', file);
  const { data } = await api.post('/images/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.image;
};

/** Start a restoration job */
export const startRestoration = async ({ imageId, damageType, mode }) => {
  const { data } = await api.post('/restorations', { imageId, damageType, mode });
  return data.job;
};

/** Poll until job is completed or failed */
export const pollRestoration = async (jobId, onProgress) => {
  const MAX_POLLS = 120; // 4 min at 2s interval
  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const { data } = await api.get(`/restorations/${jobId}`);
    onProgress?.(data.job);
    if (['completed','failed'].includes(data.job.status)) return data.job;
  }
  throw new Error('Restoration timed out.');
};

/** Get a served image URL (auth is in header, not URL) */
export const imageFileUrl  = (id, size) => `/api/images/${id}/file${size ? `?size=${size}` : ''}`;
export const restoredUrl   = (id, size) => `/api/restorations/${id}/restored${size ? `?size=${size}` : ''}`;
export const maskUrl       = (id)       => `/api/restorations/${id}/mask`;

export default api;
