const BASE_URL = window.location.protocol === 'file:'
  ? 'http://localhost:5000'
  : window.location.origin;

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

    const config = {
      credentials: 'include',
      ...options,
      headers,
      body
    };

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
      throw {
        message: 'Cannot reach server. Start the app with npm start, then open http://localhost:5000',
        status: 0
      };
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
    window.location.href = this.pageUrl('customer/login.html');
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
  },

  getPageArea() {
    const loc = decodeURIComponent(window.location.href).replace(/\\/g, '/').toLowerCase();
    if (loc.includes('/pages/admin/')) return 'admin';
    if (loc.includes('/pages/supplier/')) return 'supplier';
    if (loc.includes('/pages/customer/')) return 'customer';
    return 'root';
  },

  pageUrl(target) {
    let path = String(target || '');
    if (path.startsWith('/pages/')) path = path.slice('/pages/'.length);
    else if (path.startsWith('/')) path = path.slice(1);
    else if (path.startsWith('../')) path = path.slice(3);

    if (!path.endsWith('.html')) path += '.html';

    const parts = path.split('/');
    let area;
    let file;
    if (parts.length >= 2) {
      area = parts[0];
      file = parts.slice(1).join('/');
    } else {
      area = 'customer';
      file = parts[0];
    }

    const current = this.getPageArea();
    if (current === area) return file;
    if (current === 'root') return `pages/${area}/${file}`;
    return `../${area}/${file}`;
  },

  resolveRedirect(redirectParam) {
    if (!redirectParam) return null;
    if (redirectParam.startsWith('/pages/')) return '..' + redirectParam.slice('/pages'.length);
    if (redirectParam.startsWith('pages/')) return '../' + redirectParam.slice('pages/'.length);
    return redirectParam;
  },

  goToLogin(returnPage) {
    const area = this.getPageArea();
    let redirectFromCustomer;
    if (returnPage.includes('/')) {
      redirectFromCustomer = '../' + returnPage.replace(/^\/+/, '');
    } else if (area === 'admin' || area === 'supplier') {
      redirectFromCustomer = `../${area}/${returnPage}`;
    } else {
      redirectFromCustomer = returnPage;
    }
    if (!redirectFromCustomer.endsWith('.html')) redirectFromCustomer += '.html';
    window.location.href = this.pageUrl('customer/login.html')
      + '?redirect=' + encodeURIComponent(redirectFromCustomer);
  },

  goAfterLogin(role, redirectParam) {
    const redirect = this.resolveRedirect(redirectParam);
    if (redirect) {
      const isAdminTarget = redirect.includes('admin');
      if (isAdminTarget && role !== 'admin') {
        window.location.href = role === 'supplier'
          ? this.pageUrl('supplier/dashboard.html')
          : this.pageUrl('customer/shop.html');
        return;
      }
      window.location.href = redirect;
      return;
    }
    if (role === 'admin') window.location.href = this.pageUrl('admin/dashboard.html');
    else if (role === 'supplier') window.location.href = this.pageUrl('supplier/dashboard.html');
    else window.location.href = this.pageUrl('customer/shop.html');
  }
};
