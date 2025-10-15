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

export interface SeriesStatistics {
  variable: string;
  scenario: string;
  year_range: {
    start: number;
    end: number;
  };
  peak: {
    value: number;
    year: number;
  };
  valley: {
    value: number;
    year: number;
  };
  mean: number;
  std: number;
  trend: number;
  range: number;
  data_points: number;
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
 * Fetch statistics for a time series including peak and valley values.
 *
 * @param variable - Variable name (e.g., "YRB WSI")
 * @param scenario - Scenario name (e.g., "sc_0")
 * @param options - Optional year range for analysis
 */
export async function getSeriesStatistics(
  variable: string,
  scenario: string,
  options?: {
    start_year?: number;
    end_year?: number;
  }
): Promise<SeriesStatistics> {
  const params = new URLSearchParams({
    variable,
    scenario,
    ...(options?.start_year !== undefined && { start_year: String(options.start_year) }),
    ...(options?.end_year !== undefined && { end_year: String(options.end_year) }),
  });

  const response = await fetch(`${API_BASE_URL}/series/statistics?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch series statistics: ${response.statusText}`);
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

/**
 * Climate data interfaces
 */
export interface ClimateScenarioData {
  years: number[];
  values: number[];
}

export interface ClimateData {
  precipitation: Record<string, ClimateScenarioData>;
  temperature: Record<string, ClimateScenarioData>;
}

/**
 * Fetch climate scenario data for RCP pathways.
 */
export async function getClimateData(): Promise<ClimateData> {
  const response = await fetch(`${API_BASE_URL}/climate-data`);
  if (!response.ok) {
    throw new Error(`Failed to fetch climate data: ${response.statusText}`);
  }
  return response.json();
}

export interface YellowRiverBasinData {
  type: string;
  features: Array<{
    type: string;
    properties: Record<string, any>;
    geometry: {
      type: string;
      coordinates: any;
    };
  }>;
}

export async function getYellowRiverBasin(): Promise<YellowRiverBasinData> {
  // Try frontend public assets first (most reliable)
  try {
    const response = await fetch('/yellow_river_basin.geojson');
    if (response.ok) {
      return response.json();
    }
  } catch (error) {
    console.warn('Failed to fetch from frontend public assets, trying backend static file:', error);
  }

  // Try backend static file
  try {
    const response = await fetch(`${API_BASE_URL}/static/yellow_river_basin.geojson`);
    if (response.ok) {
      return response.json();
    }
  } catch (error) {
    console.warn('Failed to fetch from backend static file, trying API endpoint:', error);
  }

  // Fallback to API endpoint
  const response = await fetch(`${API_BASE_URL}/yellow-river-basin`);
  if (!response.ok) {
    throw new Error(`Failed to fetch Yellow River Basin data: ${response.statusText}`);
  }
  return response.json();
}
