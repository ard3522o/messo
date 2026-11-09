import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../services/api';

/**
 * Runs an async API call and tracks loading / error / data.
 * Pass a memoized request function plus the dependency list that should trigger refetch.
 */
export function useApi(request, deps = [], { immediate = true, initialData = null } = {}) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const requestRef = useRef(request);
  requestRef.current = request;
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async (options = {}) => {
    if (!options.silent) setLoading(true);
    setError(null);
    try {
      const result = await requestRef.current();
      if (mountedRef.current) {
        setData(result);
        return result;
      }
      return result;
    } catch (err) {
      if (mountedRef.current) {
        setError(getErrorMessage(err));
        setData((current) => (options.keepData ? current : current));
      }
      return null;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (immediate) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refetch: load, setData };
}

export default useApi;
