const BASE_URL = 'http://localhost:5000';

const api = {
  async request(endpoint, options = {}) {
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

    const config = { ...options, headers, body };

    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, config);
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401 && data.code === 'TOKEN_EXPIRED') {
          const refreshed = await api.refresh();
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
      throw { message: 'Network error. Please check your connection.', status: 0 };
    }
  },

  async refresh() {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/refresh`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.accessToken) {
        localStorage.setItem('mediflow_token', data.accessToken);
        return true;
      }
    } catch { }
    localStorage.removeItem('mediflow_token');
    localStorage.removeItem('mediflow_user');
    return false;
  },

  get(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`${endpoint}${query ? '?' + query : ''}`);
  },

  post(endpoint, body, headers = {}) {
    return this.request(endpoint, { method: 'POST', body, headers });
  },

  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body });
  },

  patch(endpoint, body) {
    return this.request(endpoint, { method: 'PATCH', body });
  },

  del(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  upload(endpoint, formData) {
    return this.request(endpoint, { method: 'POST', body: formData });
  },

  logout() {
    localStorage.removeItem('mediflow_token');
    localStorage.removeItem('mediflow_user');
    localStorage.removeItem('mediflow_cart');
    this.post('/api/auth/logout').catch(() => { });
    window.location.href = '/pages/customer/login.html';
  },

  getUser() {
    const u = localStorage.getItem('mediflow_user');
    if (!u) return null;

    try {
      return JSON.parse(u);
    } catch (error) {
      console.warn('Invalid stored user data. Clearing it.');
      localStorage.removeItem('mediflow_user');
      return null;
    }
  },

  isLoggedIn() {
    return !!localStorage.getItem('mediflow_token');
  },

  isAdmin() {
    const u = this.getUser();
    return u && u.role === 'admin';
  }
};
