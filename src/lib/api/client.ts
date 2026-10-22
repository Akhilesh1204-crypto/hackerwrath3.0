import { ApiError } from '@/lib/api/errors';
import { demoRequest } from '@/lib/demo/api';
import { isDemoMode } from '@/lib/demo/store';
import { getSupabase } from '@/lib/supabase';
import type { ApiMeta } from '@/lib/types';

const configuredBase = (process.env.NEXT_PUBLIC_API_BASE_URL || '/api').replace(/\/+$/, '');
const baseUrl = configuredBase.startsWith('http') ? configuredBase : `${configuredBase}`;

interface RequestOptions {
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** Skip the Authorization header (public endpoints). */
  anonymous?: boolean;
}

export interface ApiResult<T> {
  data: T;
  meta?: ApiMeta;
}

export async function getAccessToken(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

function buildUrl(path: string) {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${suffix}`;
}

export async function apiRequest<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<ApiResult<T>> {
  if (typeof window !== 'undefined' && isDemoMode()) {
    return demoRequest<T>(method, path, options.body);
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options.headers,
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (!options.anonymous) {
    const token = await getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
      cache: 'no-store',
    });
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') throw error;
    throw new ApiError(
      'NETWORK_ERROR',
      'Could not reach the SwapStay API. Check that the backend is running and BACKEND_URL points to it.',
      0,
    );
  }

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : null;

  if (!response.ok || !payload || payload.success === false) {
    const errorBody = payload && typeof payload === 'object' ? payload.error : null;
    if (errorBody?.message) {
      throw new ApiError(
        errorBody.code ?? 'INTERNAL_ERROR',
        errorBody.message,
        response.status,
        errorBody.details,
      );
    }
    if (payload === null && response.status === 404) {
      throw new ApiError(
        'BACKEND_UNAVAILABLE',
        'The API route was not found. Point BACKEND_URL at the SwapStay backend, or enable demo mode to preview the app.',
        response.status,
      );
    }
    throw new ApiError('INTERNAL_ERROR', `Request failed with status ${response.status}.`, response.status);
  }

  return { data: payload.data as T, meta: payload.meta };
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => apiRequest<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
    apiRequest<T>('POST', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
    apiRequest<T>('PATCH', path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) => apiRequest<T>('DELETE', path, options),
};

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

export { ApiError };
