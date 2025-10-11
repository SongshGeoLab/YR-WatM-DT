import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as api from '../services/api';

/**
 * Global Scenario Parameters Interface
 *
 * Manages all adjustable parameters across the application.
 * When parameters change, all pages will automatically update.
 */
export interface ScenarioParameters {
  // Climate scenario (Page 2)
  climateScenario: number | null; // 1, 2, 3

  // Demographics (Page 3)
  fertility: number | null; // 1.6, 1.65, 1.7, 1.75, 1.8
  dietPattern: number | null; // 1, 2, 3

  // Ecological water (Page 4)
  ecologicalFlow: number | null; // 0.2, 0.25, 0.3

  // Agriculture (Page 5)
  irrigationEfficiency: number | null; // 0.8, 0.85, 0.9, 0.95, 1.0
  fireGenerationShare: number | null; // 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4
}

/**
 * Scenario Context State
 */
interface ScenarioContextState {
  // Current parameters
  parameters: ScenarioParameters;

  // Resolved scenario name (null if multiple scenarios match)
  scenarioName: string | null;

  // Available parameter values from backend
  availableParams: Record<string, number[]> | null;

  // Loading state
  loading: boolean;

  // Error state
  error: string | null;

  // Update functions
  updateParameter: (key: keyof ScenarioParameters, value: number | null) => void;
  resetParameters: () => void;
  resolveScenario: () => Promise<void>;
}

const ScenarioContext = createContext<ScenarioContextState | undefined>(undefined);

/**
 * Default parameter values
 */
const DEFAULT_PARAMETERS: ScenarioParameters = {
  climateScenario: null,
  fertility: 1.7, // Default middle value
  dietPattern: 2, // Default moderate diet
  ecologicalFlow: 0.25, // Default middle value
  irrigationEfficiency: 0.9, // Default good efficiency
  fireGenerationShare: 0.25, // Default middle value
};

/**
 * Parameter name mapping (frontend → backend)
 */
const PARAMETER_MAPPING: Record<keyof ScenarioParameters, string> = {
  climateScenario: 'Climate change scenario switch for water yield',
  fertility: 'Fertility Variation',
  dietPattern: 'Diet change scenario switch',
  ecologicalFlow: 'Ecological water flow variable',
  irrigationEfficiency: 'water-saving irrigation efficiency ratio',
  fireGenerationShare: 'fire generation share province target',
};

/**
 * Scenario Provider Component
 *
 * Provides global parameter state management for all pages.
 * Automatically resolves scenarios when parameters change.
 */
export function ScenarioProvider({ children }: { children: React.ReactNode }) {
  const [parameters, setParameters] = useState<ScenarioParameters>(DEFAULT_PARAMETERS);
  const [scenarioName, setScenarioName] = useState<string | null>(null);
  const [availableParams, setAvailableParams] = useState<Record<string, number[]> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available parameters from backend on mount
  useEffect(() => {
    (async () => {
      try {
        console.log('🔄 Fetching available parameters from backend...');
        const params = await api.getParams();
        setAvailableParams(params);
        console.log('✅ Available parameters loaded:', Object.keys(params));
      } catch (err: any) {
        console.error('❌ Failed to load parameters:', err);
        setError(err.message);
      }
    })();
  }, []);

  /**
   * Resolve scenario based on current parameters
   *
   * Automatically called when parameters change.
   * Sets scenarioName to matched scenario or null if multiple matches.
   */
  const resolveScenario = useCallback(async () => {
    if (!availableParams) {
      console.log('⏳ Waiting for available parameters...');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build parameter values object for API call
      const values: Record<string, number> = {};

      // Add all parameters (use defaults for null values)
      Object.entries(PARAMETER_MAPPING).forEach(([frontendKey, backendKey]) => {
        const value = parameters[frontendKey as keyof ScenarioParameters];
        if (value !== null) {
          values[backendKey] = value;
        } else if (availableParams[backendKey] && availableParams[backendKey].length > 0) {
          // Use middle value from available params as default
          const available = availableParams[backendKey];
          values[backendKey] = available[Math.floor(available.length / 2)];
        }
      });

      console.log('🔍 Resolving scenario with parameters:', values);
      const result = await api.resolveScenario(values);

      setScenarioName(result.scenario_name);
      console.log(`✅ Scenario resolved: ${result.scenario_name}`);

    } catch (err: any) {
      console.error('❌ Failed to resolve scenario:', err);
      setError(err.message);
      setScenarioName(null);
    } finally {
      setLoading(false);
    }
  }, [parameters, availableParams]);

  // Auto-resolve scenario when parameters change
  useEffect(() => {
    resolveScenario();
  }, [resolveScenario]);

  /**
   * Update a single parameter
   */
  const updateParameter = useCallback((key: keyof ScenarioParameters, value: number | null) => {
    console.log(`🔧 Updating parameter: ${key} = ${value}`);
    setParameters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  /**
   * Reset all parameters to defaults
   */
  const resetParameters = useCallback(() => {
    console.log('🔄 Resetting all parameters to defaults');
    setParameters(DEFAULT_PARAMETERS);
  }, []);

  const contextValue: ScenarioContextState = {
    parameters,
    scenarioName,
    availableParams,
    loading,
    error,
    updateParameter,
    resetParameters,
    resolveScenario,
  };

  return (
    <ScenarioContext.Provider value={contextValue}>
      {children}
    </ScenarioContext.Provider>
  );
}

/**
 * Hook to access scenario context
 *
 * Usage in any component:
 * ```tsx
 * const { parameters, scenarioName, updateParameter } = useScenario();
 * ```
 */
export function useScenario() {
  const context = useContext(ScenarioContext);
  if (context === undefined) {
    throw new Error('useScenario must be used within a ScenarioProvider');
  }
  return context;
}

/**
 * Hook to fetch series data using current scenario
 *
 * Automatically re-fetches when scenario changes.
 *
 * @param variable - Variable name to fetch
 * @param options - Query options (start_step, end_step)
 * @returns Series data with loading and error states
 */
export function useScenarioSeries(
  variable: string,
  options?: { start_step?: number; end_step?: number }
) {
  const { scenarioName } = useScenario();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scenarioName) {
      console.log(`⏳ Waiting for scenario to be resolved for variable: ${variable}`);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(`📊 Fetching ${variable} for scenario ${scenarioName}...`);
        const result = await api.getSeries(variable, scenarioName, options);

        if (!cancelled) {
          setData(result);
          console.log(`✅ Loaded ${variable}: ${result.series.value.length} data points`);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error(`❌ Failed to load ${variable}:`, err);
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [scenarioName, variable, options?.start_step, options?.end_step]);

  return { data, loading, error };
}
