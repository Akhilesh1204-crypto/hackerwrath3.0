'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, errorMessage } from '@/lib/api/client';

interface QueryState<T> {
  data: T | null;
  error: string | null;
  errorCode: string | null;
  loading: boolean;
}

export function useApiQuery<T>(
  loader: () => Promise<T>,
  deps: unknown[] = [],
  options: { enabled?: boolean } = {},
) {
  const { enabled = true } = options;
  const [state, setState] = useState<QueryState<T>>({
    data: null,
    error: null,
    errorCode: null,
    loading: enabled,
  });
  const [nonce, setNonce] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    if (!enabled) {
      setState((current) => ({ ...current, loading: false }));
      return;
    }
    let alive = true;
    setState((current) => ({ ...current, loading: true, error: null, errorCode: null }));

    loaderRef
      .current()
      .then((data) => {
        if (alive) setState({ data, error: null, errorCode: null, loading: false });
      })
      .catch((error: unknown) => {
        if (!alive) return;
        setState({
          data: null,
          error: errorMessage(error),
          errorCode: error instanceof ApiError ? error.code : 'UNKNOWN',
          loading: false,
        });
      });

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, nonce, ...deps]);

  const refresh = useCallback(() => setNonce((value) => value + 1), []);
  const setData = useCallback((updater: T | ((current: T | null) => T | null)) => {
    setState((current) => ({
      ...current,
      data:
        typeof updater === 'function'
          ? (updater as (value: T | null) => T | null)(current.data)
          : updater,
    }));
  }, []);

  return { ...state, refresh, setData };
}

export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
