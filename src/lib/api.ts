const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null' && !window.location.origin.startsWith('file://')) {
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

export const getGuestSessionId = () => {
  let sessionId = localStorage.getItem('grow_green_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    localStorage.setItem('grow_green_session_id', sessionId);
  }
  return sessionId;
};

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  const baseUrl = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${baseUrl}${cleanPath}`;

  const token = localStorage.getItem('grow_green_token');
  const sessionId = getGuestSessionId();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-session-id': sessionId,
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });

    let data: any = null;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text || `HTTP ${res.status} ${res.statusText}` };
      }
    }

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        data,
        error: data?.error || data?.message || `Request failed with status ${res.status}`
      };
    }

    return {
      ok: true,
      status: res.status,
      data
    };
  } catch (err: any) {
    console.error(`[API Network Error] ${path}:`, err);
    return {
      ok: false,
      status: 0,
      error: err?.message || 'Network request failed'
    };
  }
}
