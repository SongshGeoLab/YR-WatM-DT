/**
 * Custom React hooks for fetching data from backend API.
 * Provides loading states, error handling, and caching.
 */

import { useState, useEffect } from 'react';
import * as api from '../services/api';

/**
 * Hook for fetching variable names.
 */
export function useVariables() {
  const [data, setData] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    api.getVariables()
      .then((variables) => {
        if (mounted) {
          setData(variables);
          setError(null);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => { mounted = false; };
  }, []);

  return { data, loading, error };
}

/**
 * Hook for fetching parameter options.
 */
export function useParams() {
  const [data, setData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    api.getParams()
      .then((params) => {
        if (mounted) {
          setData(params);
          setError(null);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => { mounted = false; };
  }, []);

  return { data, loading, error };
}

/**
 * Hook for fetching time series data.
 *
 * @param variable - Variable name
 * @param scenario - Scenario name
 * @param options - Optional time window filters
 */
export function useSeries(
  variable: string | null,
  scenario: string | null,
  options?: { start_step?: number; end_step?: number }
) {
  const [data, setData] = useState<api.SeriesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!variable || !scenario) {
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);

    api.getSeries(variable, scenario, options)
      .then((series) => {
        if (mounted) {
          setData(series);
          setError(null);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => { mounted = false; };
  }, [variable, scenario, options?.start_step, options?.end_step]);

  return { data, loading, error, refetch: () => setLoading(true) };
}

/**
 * Hook for resolving scenario from parameter values.
 */
export function useScenarioResolution() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const resolve = async (values: api.ParameterValues) => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.resolveScenario(values);
      return result.scenario_name;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { resolve, loading, error };
}

/**
 * Hook for checking API health.
 */
export function useApiHealth() {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    api.healthCheck()
      .then((healthy) => {
        if (mounted) {
          setIsHealthy(healthy);
        }
      })
      .finally(() => {
        if (mounted) {
          setChecking(false);
        }
      });

    return () => { mounted = false; };
  }, []);

  const recheck = () => {
    setChecking(true);
    api.healthCheck()
      .then(setIsHealthy)
      .finally(() => setChecking(false));
  };

  return { isHealthy, checking, recheck };
}
