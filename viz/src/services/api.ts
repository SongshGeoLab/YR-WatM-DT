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

/**
 * Multi-scenario query interfaces (new /series/multi endpoint)
 */

export interface MultiSeriesFilters {
  [parameterName: string]: number | number[];
}

export interface FilterSummary {
  requested: number | number[] | 'any';
  matched: number[] | string;
}

export interface MultiSeriesAggregateResponse {
  variable: string;
  n_scenarios: number;
  filter_summary: Record<string, FilterSummary>;
  series: {
    time: number[];
    mean: number[];
    std: number[];
    ci_lower: number[];
    ci_upper: number[];
    min: number[];
    max: number[];
    p05: number[];
    p95: number[];
  };
}

export interface ScenarioWithData {
  scenario_name: string;
  parameters: Record<string, number>;
  series: {
    time: number[];
    value: number[];
  };
}

export interface MultiSeriesRawResponse {
  variable: string;
  n_scenarios: number;
  scenarios: ScenarioWithData[];
}

/**
 * Fetch time series data for multiple scenarios matching flexible parameter filters.
 *
 * This endpoint supports the "Any" logic:
 * - Single value: exact match
 * - Array of values: match any value in the array
 * - Omit parameter: no constraint (matches all values)
 *
 * @param variable - Variable name to query
 * @param filters - Parameter filters (supports single values or arrays)
 * @param options - Query options
 * @returns Multi-scenario data (aggregated or raw depending on aggregate flag)
 */
export async function getSeriesMulti(
  variable: string,
  filters: MultiSeriesFilters,
  options?: {
    start_year?: number;
    end_year?: number;
    aggregate?: boolean;
  }
): Promise<MultiSeriesAggregateResponse | MultiSeriesRawResponse> {
  const params = new URLSearchParams({
    variable,
    filters: JSON.stringify(filters),
    ...(options?.start_year !== undefined && { start_year: String(options.start_year) }),
    ...(options?.end_year !== undefined && { end_year: String(options.end_year) }),
    ...(options?.aggregate !== undefined && { aggregate: String(options.aggregate) }),
  });

  const response = await fetch(`${API_BASE_URL}/series/multi?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch multi-scenario series: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Helper function to convert ScenarioParameters to API filters.
 * Omits null values (which represent "Any" in the frontend).
 *
 * @param parameters - Frontend parameter state
 * @returns API-compatible filter object
 */
export function parametersToFilters(parameters: {
  climateScenario: number | null;
  fertility: number | null;
  dietPattern: number | null;
  ecologicalFlow: number | null;
  irrigationEfficiency: number | null;
  fireGenerationShare: number | null;
}): MultiSeriesFilters {
  const filters: MultiSeriesFilters = {};

  if (parameters.climateScenario !== null) {
    filters['Climate change scenario switch for water yield'] = parameters.climateScenario;
  } else {
    // When climateScenario is null (Any), only consider RCP2.6 and RCP4.5 (values 1 and 2)
    // Both scenarios now use RCP4.5 for consistency
    filters['Climate change scenario switch for water yield'] = [1, 2];
  }
  if (parameters.fertility !== null) {
    filters['Fertility Variation'] = parameters.fertility;
  }
  if (parameters.dietPattern !== null) {
    filters['Diet change scenario switch'] = parameters.dietPattern;
  }
  if (parameters.ecologicalFlow !== null) {
    filters['Ecological water flow variable'] = parameters.ecologicalFlow;
  }
  if (parameters.irrigationEfficiency !== null) {
    filters['water saving irrigation efficiency ratio'] = parameters.irrigationEfficiency;
  }
  if (parameters.fireGenerationShare !== null) {
    filters['fire generation share province target'] = parameters.fireGenerationShare;
  }

  return filters;
}
