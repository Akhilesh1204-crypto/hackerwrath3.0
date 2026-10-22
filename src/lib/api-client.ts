export async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
  userId?: string
): Promise<{ success: boolean; data?: T; error?: { code: string; message: string; details?: any }; meta?: any }> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (userId) {
    headers.set('x-user-id', userId);
  }

  try {
    const res = await fetch(url, { ...options, headers });
    const json = await res.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: err.message || 'Network communication failed',
      },
    };
  }
}
