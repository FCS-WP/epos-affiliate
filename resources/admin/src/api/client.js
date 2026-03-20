/**
 * REST API client for the admin app.
 *
 * Uses the `eposAffiliate` global injected by wp_localize_script().
 * Sends the WP REST nonce with every request.
 */

const getConfig = () => window.eposAffiliate || {};

async function request(endpoint, options = {}) {
  const { apiBase, nonce } = getConfig();
  const url = `${apiBase}${endpoint}`;

  const headers = {
    'X-WP-Nonce': nonce,
    ...options.headers,
  };

  // Only set Content-Type for requests with a body.
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `Request failed: ${res.status}`);
  }

  // Handle CSV / blob responses.
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

  post: (endpoint, data) =>
    request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  put: (endpoint, data) =>
    request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (endpoint) =>
    request(endpoint, { method: 'DELETE' }),

  /**
   * Trigger a CSV download from a GET endpoint.
   */
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
