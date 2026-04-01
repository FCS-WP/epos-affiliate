/**
 * REST API client for the frontend dashboard app.
 *
 * Uses the `eposAffiliate` global injected by wp_localize_script().
 */

const getConfig = () => window.eposAffiliate || {};

async function request(endpoint, options = {}) {
  const { apiBase, nonce } = getConfig();
  const url = `${apiBase}${endpoint}`;

  const headers = {
    'X-WP-Nonce': nonce,
    ...options.headers,
  };

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    // Session expired — redirect to login.
    if (res.status === 401 || res.status === 403) {
      const { homeUrl } = getConfig();
      window.location.href = `${homeUrl || ''}/my/login/`;
      return;
    }
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `Request failed: ${res.status}`);
  }

  const contentType = res.headers.get('Content-Type') || '';
  if (contentType.includes('text/csv') || contentType.includes('application/octet-stream')) {
    return res.blob();
  }

  return res.json();
}

const api = {
  get: (endpoint, params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    return request(url);
  },

  put: (endpoint, data) => request(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  post: (endpoint, data) => request(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  delete: (endpoint) => request(endpoint, {
    method: 'DELETE',
  }),

  uploadFile: (endpoint, formData) => request(endpoint, {
    method: 'POST',
    body: formData,
  }),

  download: async (endpoint, params = {}, filename = 'export.csv') => {
    const blob = await api.get(endpoint, params);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};

export default api;
