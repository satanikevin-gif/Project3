const BASE_URL = import.meta.env.VITE_API_URL || '';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('mediflow_token');

  let headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  let body = options.body;
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    body = JSON.stringify(body);
  }
  if (body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const config = { credentials: 'include', ...options, headers, body };

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, config);
    let data = {};
    try {
      data = await res.json();
    } catch {
      data = { message: res.statusText || 'Unexpected server response.' };
    }

    if (!res.ok) {
      if (res.status === 401 && data.code === 'TOKEN_EXPIRED') {
        const refreshed = await refreshToken();
        if (refreshed) {
          config.headers.Authorization = `Bearer ${localStorage.getItem('mediflow_token')}`;
          const retryRes = await fetch(`${BASE_URL}${endpoint}`, config);
          const retryData = await retryRes.json();
          if (!retryRes.ok) throw { status: retryRes.status, ...retryData };
          return retryData;
        }
      }
      throw { status: res.status, ...data };
    }
    return data;
  } catch (error) {
    if (error.status) throw error;
    throw {
      message: 'Cannot reach server. Run npm start in the project root, then npm run dev in frontend.',
      status: 0
    };
  }
}

async function refreshToken() {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, { credentials: 'include' });
    const data = await res.json();
    if (res.ok && data.accessToken) {
      localStorage.setItem('mediflow_token', data.accessToken);
      return true;
    }
  } catch { /* ignore */ }
  localStorage.removeItem('mediflow_token');
  localStorage.removeItem('mediflow_user');
  return false;
}

export const api = {
  get: (endpoint, params = {}) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
    ).toString();
    return request(`${endpoint}${query ? '?' + query : ''}`);
  },
  post: (endpoint, body, headers = {}) => request(endpoint, { method: 'POST', body, headers }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body }),
  patch: (endpoint, body) => request(endpoint, { method: 'PATCH', body }),
  del: (endpoint) => request(endpoint, { method: 'DELETE' }),
  upload: (endpoint, formData) => request(endpoint, { method: 'POST', body: formData })
};

export function getStoredUser() {
  const raw = localStorage.getItem('mediflow_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem('mediflow_user');
    return null;
  }
}

export function saveSession(accessToken, user) {
  localStorage.setItem('mediflow_token', accessToken);
  localStorage.setItem('mediflow_user', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('mediflow_token');
  localStorage.removeItem('mediflow_user');
  localStorage.removeItem('mediflow_cart');
}

export function isLoggedIn() {
  return !!localStorage.getItem('mediflow_token');
}

export function resolveRedirect(role, redirectParam) {
  if (redirectParam) {
    const redirect = redirectParam.startsWith('/pages/')
      ? redirectParam.replace('/pages/', '/')
      : redirectParam;
    const isAdminTarget = redirect.includes('/admin');
    if (isAdminTarget && role !== 'admin') {
      return role === 'supplier' ? '/supplier' : '/shop';
    }
    return redirect.startsWith('/') ? redirect : `/${redirect}`;
  }
  if (role === 'admin') return '/admin';
  if (role === 'supplier') return '/supplier';
  return '/shop';
}
