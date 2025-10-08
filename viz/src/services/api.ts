/**
 * API client for communicating with the FastAPI backend.
 *
 * Base URL defaults to localhost:8000 in development.
 * All endpoints are type-safe with TypeScript interfaces.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Type definitions matching backend responses
export interface TimePoint {
  step: number;
  time: number;
}

export interface SeriesData {
  variable: string;
  scenario: string;
  series: {
    time: number[];
    value: number[];
  };
}

export interface ScenarioResolution {
  scenario_name: string;
}

export interface ParameterValues {
  [key: string]: string | number | boolean;
}

/**
 * Fetch available variable names (excluding TIME).
 */
export async function getVariables(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/variables`);
  if (!response.ok) {
    throw new Error(`Failed to fetch variables: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch parameter options for scenario selection.
 * Returns a mapping of parameter name -> unique values.
 */
export async function getParams(): Promise<Record<string, any[]>> {
  const response = await fetch(`${API_BASE_URL}/params`);
  if (!response.ok) {
    throw new Error(`Failed to fetch params: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Resolve scenario name from parameter values.
 *
 * @param values - Object mapping parameter names to their selected values
 * @returns The matching scenario name
 */
export async function resolveScenario(
  values: ParameterValues
): Promise<ScenarioResolution> {
  const response = await fetch(`${API_BASE_URL}/resolve_scenario`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ values }),
  });
  if (!response.ok) {
    throw new Error(`Failed to resolve scenario: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch time vector data.
 */
export async function getTime(): Promise<TimePoint[]> {
  const response = await fetch(`${API_BASE_URL}/time`);
  if (!response.ok) {
    throw new Error(`Failed to fetch time: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch time series data for a specific variable and scenario.
 *
 * @param variable - Variable name (e.g., "YRB WSI")
 * @param scenario - Scenario name (e.g., "sc_0")
 * @param options - Optional time window filters
 */
export async function getSeries(
  variable: string,
  scenario: string,
  options?: {
    start_step?: number;
    end_step?: number;
  }
): Promise<SeriesData> {
  const params = new URLSearchParams({
    variable,
    scenario,
    ...(options?.start_step !== undefined && { start_step: String(options.start_step) }),
    ...(options?.end_step !== undefined && { end_step: String(options.end_step) }),
  });

  const response = await fetch(`${API_BASE_URL}/series?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch series: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Check API health status.
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    return response.ok;
  } catch {
    return false;
  }
}
