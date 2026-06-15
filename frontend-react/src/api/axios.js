import axios from 'axios';

/** Same host as the page (works for localhost:3000 and LAN IP like 192.168.x.x:3000) */
function getApiBaseUrl() {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }
  return '/api';
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 120000,
  withCredentials: false,
});

const RETRYABLE_METHODS = new Set(['get', 'head', 'options']);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let healingState = 'healthy';

function emitHealing(status, detail = '') {
  if (status === 'healthy' && healingState === 'healthy') return;
  healingState = status;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('self-healing-status', { detail: { status, detail } }));
  }
}

function setHeader(config, key, value) {
  if (config.headers && typeof config.headers.set === 'function') {
    config.headers.set(key, value);
  } else {
    config.headers = config.headers || {};
    config.headers[key] = value;
  }
}

function deleteHeader(config, key) {
  if (config.headers && typeof config.headers.delete === 'function') {
    config.headers.delete(key);
  } else if (config.headers) {
    delete config.headers[key];
  }
}

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('netflix_token');
    if (token) {
      setHeader(config, 'Authorization', `Bearer ${token}`);
    }

    if (config.data instanceof FormData) {
      deleteHeader(config, 'Content-Type');
    } else {
      setHeader(config, 'Content-Type', 'application/json');
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    emitHealing('healthy');
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';
      const isAuthEndpoint = requestUrl.includes('/auth/');
      const onAdminUpload = requestUrl.includes('/movies/upload');

      if (!isAuthEndpoint && !onAdminUpload) {
        localStorage.removeItem('netflix_token');
        localStorage.removeItem('netflix_user');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
      }
    }

    const config = error.config || {};
    const method = String(config.method || 'get').toLowerCase();
    const status = error.response?.status;
    const retryableStatus = !status || status === 408 || status === 429 || status >= 500;
    const retryableMethod = RETRYABLE_METHODS.has(method);
    const retryCount = config.__retryCount || 0;

    if (retryableMethod && retryableStatus && retryCount < 2) {
      config.__retryCount = retryCount + 1;
      emitHealing('healing', `Retrying ${config.url || 'request'} (${config.__retryCount}/2)`);
      await wait(500 * config.__retryCount);
      return api(config);
    }

    if (retryableStatus) {
      emitHealing('failed', 'Backend connection needs attention');
    }
    return Promise.reject(error);
  }
);

const DIRECT_BACKEND = 'http://127.0.0.1:8080/api';

/**
 * Large file upload: try Vite proxy first, then direct to backend (CORS allowed).
 */
export async function uploadMultipart(path, formData) {
  const uploadConfig = {
    timeout: 600000,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  };

  try {
    return await api.post(path, formData, uploadConfig);
  } catch (err) {
    const isNetwork =
      !err.response &&
      (err.message === 'Network Error' ||
        err.code === 'ERR_NETWORK' ||
        err.code === 'ECONNABORTED');

    if (!isNetwork) {
      throw err;
    }

    const token = localStorage.getItem('netflix_token');
    const direct = axios.create({
      baseURL: DIRECT_BACKEND,
      timeout: 600000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return direct.post(path, formData, { headers });
  }
}

export default api;
