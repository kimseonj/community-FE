import { endpoints } from './endpoints';

const DEFAULT_API_BASE =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? '/api'
    : 'https://hiking.monster/api';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE;

let refreshPromise = null;

export class ApiError extends Error {
  constructor(message, { status = 0, data = null, endpoint = '' } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.endpoint = endpoint;
  }
}

function joinUrl(endpoint) {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }

  return `${API_BASE_URL}${endpoint}`;
}

function shouldRefresh(status, data) {
  return status === 401 && data?.message === 'expiredAccessToken';
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  if (contentType.includes('text/')) {
    return response.text();
  }

  return null;
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = fetch(joinUrl(endpoints.auth.refresh), {
      method: 'GET',
      credentials: 'include',
    }).finally(() => {
      refreshPromise = null;
    });
  }

  const response = await refreshPromise;

  if (!response.ok) {
    throw new ApiError('로그인이 만료되었습니다.', { status: response.status, endpoint: endpoints.auth.refresh });
  }
}

export async function request(endpoint, options = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    retryOnAuth = true,
    raw = false,
  } = options;

  const isFormData = body instanceof FormData;
  const requestHeaders = isFormData
    ? { ...headers }
    : { 'Content-Type': 'application/json', ...headers };

  const response = await fetch(joinUrl(endpoint), {
    method,
    headers: requestHeaders,
    credentials: 'include',
    body: body == null ? undefined : isFormData ? body : JSON.stringify(body),
  });

  const data = await parseResponse(response);

  if (shouldRefresh(response.status, data) && retryOnAuth) {
    await refreshAccessToken();
    return request(endpoint, { ...options, retryOnAuth: false });
  }

  if (!response.ok) {
    throw new ApiError(data?.message || '요청에 실패했습니다.', {
      status: response.status,
      data,
      endpoint,
    });
  }

  return raw ? data : data?.data ?? data;
}

export const api = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body }),
  patch: (endpoint, body, options) => request(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
};

export function resolveAssetUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;

  if (url.startsWith('/uploads')) {
    const origin = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;
    return `${origin}${url}`;
  }

  if (url.startsWith('uploads/')) {
    const origin = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;
    return `${origin}/${url}`;
  }

  return url;
}
