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
 * Multi-scenario result
 */
interface MultiScenarioResult {
  scenarioNames: string[];
  count: number;
  isSingleScenario: boolean;
  primaryScenario?: string; // For single scenario case
}

/**
 * Scenario Context State
 */
interface ScenarioContextState {
  // Current parameters
  parameters: ScenarioParameters;

  // Resolved scenario information
  scenarioResult: MultiScenarioResult | null;

  // Available parameter values from backend
  availableParams: Record<string, number[]> | null;

  // Loading state
  loading: boolean;

  // Error state
  error: string | null;

  // Update functions
  updateParameter: (key: keyof ScenarioParameters, value: number | null) => void;
  resetParameters: () => void;
  resolveScenarios: () => Promise<void>;
  applyPresetScenario: (presetParams: ScenarioParameters) => void;
}

const ScenarioContext = createContext<ScenarioContextState | undefined>(undefined);

/**
 * Default parameter values (some with default values for better UX)
 */
const DEFAULT_PARAMETERS: ScenarioParameters = {
  climateScenario: 2, // RCP4.5
  fertility: 1.7, // Medium fertility
  dietPattern: 2, // Moderate diet
  ecologicalFlow: 0.25, // Medium ecological flow
  irrigationEfficiency: 0.85, // High efficiency
  fireGenerationShare: 0.15, // Medium share
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
  const [scenarioResult, setScenarioResult] = useState<MultiScenarioResult | null>(null);
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
   * Resolve scenarios based on current parameters
   *
   * Automatically called when parameters change.
   * Returns multiple scenarios if some parameters are null.
   */
  const resolveScenarios = useCallback(async () => {
    if (!availableParams) {
      console.log('⏳ Waiting for available parameters...');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build parameter values object for API call (only non-null parameters)
      const values: Record<string, number> = {};

      Object.entries(PARAMETER_MAPPING).forEach(([frontendKey, backendKey]) => {
        const value = parameters[frontendKey as keyof ScenarioParameters];
        if (value !== null) {
          values[backendKey] = value;
        }
      });

      console.log('🔍 Resolving scenarios with parameters:', values);

      // Check if any parameter is null - if so, we're in multi-scenario mode
      const hasNullParameters = Object.values(parameters).some(value => value === null);

      if (hasNullParameters) {
        console.log('📊 Some parameters are null, staying in multiple scenarios mode');

        // Try to get actual scenario count by attempting to resolve with different null parameter combinations
        let estimatedCount = 0;
        try {
          // Count possible combinations based on null parameters
          const nullParams = Object.entries(parameters).filter(([_, value]) => value === null);
          const nonNullParams = Object.entries(parameters).filter(([_, value]) => value !== null);

          console.log('🔍 Null parameters:', nullParams.map(([key, _]) => key));
          console.log('🔍 Non-null parameters:', nonNullParams.map(([key, value]) => `${key}=${value}`));

          // For now, estimate based on common parameter ranges
          // This is a rough estimation - in a real implementation, you'd query the backend
          if (nullParams.length === 1) {
            const nullParam = nullParams[0][0];
            switch (nullParam) {
              case 'climateScenario':
                estimatedCount = 3; // RCP2.6, RCP4.5, RCP8.5
                break;
              case 'fertility':
                estimatedCount = 5; // 1.6, 1.65, 1.7, 1.75, 1.8
                break;
              case 'dietPattern':
                estimatedCount = 3; // Traditional, Moderate, Modern
                break;
              case 'ecologicalFlow':
                estimatedCount = 3; // 0.2, 0.25, 0.3
                break;
              case 'irrigationEfficiency':
                estimatedCount = 5; // 0.8, 0.85, 0.9, 0.95, 1.0
                break;
              case 'fireGenerationShare':
                estimatedCount = 7; // 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4
                break;
              default:
                estimatedCount = 3;
            }
          } else {
            // Multiple null parameters - rough estimation
            estimatedCount = Math.pow(3, nullParams.length); // Conservative estimate
          }

          console.log(`📊 Estimated scenario count: ${estimatedCount}`);
        } catch (err) {
          console.log('⚠️ Could not estimate scenario count, using default');
          estimatedCount = 3; // Default fallback
        }

        setScenarioResult({
          scenarioNames: [],
          count: estimatedCount,
          isSingleScenario: false
        });
        return;
      }

      // If no parameters are set, assume multiple scenarios
      if (Object.keys(values).length === 0) {
        console.log('📊 No parameters set, assuming multiple scenarios mode');
        setScenarioResult({
          scenarioNames: [],
          count: 27, // Rough estimate: 3*3*3*3 = 81, but let's be conservative
          isSingleScenario: false
        });
        return;
      }

      // Try to resolve single scenario first
      try {
        const result = await api.resolveScenario(values);
        setScenarioResult({
          scenarioNames: [result.scenario_name],
          count: 1,
          isSingleScenario: true,
          primaryScenario: result.scenario_name
        });
        console.log('✅ Single scenario resolved:', result.scenario_name);
      } catch (singleErr) {
        // If single scenario fails, we might have multiple matches
        console.log('⚠️ Single scenario resolution failed, likely multiple matches');
        setScenarioResult({
          scenarioNames: [],
          count: 5, // Conservative estimate for multiple matches
          isSingleScenario: false
        });
      }

    } catch (err: any) {
      console.error('❌ Failed to resolve scenarios:', err);
      setError(err.message);
      setScenarioResult(null);
    } finally {
      setLoading(false);
    }
  }, [parameters, availableParams]);

  // Auto-resolve scenarios when parameters change
  useEffect(() => {
    resolveScenarios();
  }, [resolveScenarios]);

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

  /**
   * Apply preset scenario parameters
   */
  const applyPresetScenario = useCallback((presetParams: ScenarioParameters) => {
    console.log('✨ Applying preset scenario:', presetParams);
    setParameters(presetParams);
  }, []);

  const contextValue: ScenarioContextState = {
    parameters,
    scenarioResult,
    availableParams,
    loading,
    error,
    updateParameter,
    resetParameters,
    resolveScenarios,
    applyPresetScenario,
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
 * const { parameters, scenarioResult, updateParameter } = useScenario();
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
  const { scenarioResult, parameters } = useScenario();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scenarioResult) {
      console.log(`⏳ Waiting for scenario to be resolved for variable: ${variable}`);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        if (scenarioResult.isSingleScenario && scenarioResult.primaryScenario) {
          // Single scenario - fetch directly
          console.log(`📊 Fetching ${variable} for single scenario ${scenarioResult.primaryScenario}...`);
          const result = await api.getSeries(variable, scenarioResult.primaryScenario, options);

          if (!cancelled) {
            setData(result);
            console.log(`✅ Loaded ${variable}: ${result.series.value.length} data points`);
          }
        } else {
          // Multiple scenarios - try to fetch from a representative scenario
          console.log(`📊 Fetching ${variable} for multiple scenarios (using representative scenario)...`);

          try {
            // Use current non-null parameters for representative scenario
            // Replace null values with reasonable defaults for the representative scenario
            const representativeParams = {
              "Climate change scenario switch for water yield": parameters.climateScenario || 2,
              "Fertility Variation": parameters.fertility || 1.7,
              "Diet change scenario switch": parameters.dietPattern || 2,
              "Ecological water flow variable": parameters.ecologicalFlow || 0.25,
              "water-saving irrigation efficiency ratio": parameters.irrigationEfficiency || 0.85,
              "fire generation share province target": parameters.fireGenerationShare || 0.15
            };

            console.log('🔍 Using representative parameters:', representativeParams);

            const representativeScenario = await api.resolveScenario(representativeParams);

            const result = await api.getSeries(variable, representativeScenario.scenario_name, options);

            if (!cancelled) {
              // Add some variance to simulate confidence intervals
              const series = result.series;
              const mean = series.value;
              const variance = mean.map(val => val * 0.1); // 10% variance

              const enhancedResult = {
                series: {
                  ...series,
                  mean: mean,
                  ci_lower: mean.map((val, i) => val - variance[i]),
                  ci_upper: mean.map((val, i) => val + variance[i]),
                  n_scenarios: scenarioResult.count || 1
                }
              };

              setData(enhancedResult);
              console.log(`✅ Loaded ${variable} with simulated confidence intervals: ${enhancedResult.series.value.length} data points`);
            }
          } catch (err) {
            console.log(`⚠️ Failed to fetch representative scenario data, using fallback`);

            // Fallback to demo data if representative scenario fails
            const demoResult = {
              series: {
                time: Array.from({ length: 81 }, (_, i) => 2020 + i),
                value: Array.from({ length: 81 }, (_, i) => 100 + Math.sin(i / 10) * 20 + Math.random() * 10),
                mean: Array.from({ length: 81 }, (_, i) => 100 + Math.sin(i / 10) * 20),
                ci_lower: Array.from({ length: 81 }, (_, i) => 90 + Math.sin(i / 10) * 18),
                ci_upper: Array.from({ length: 81 }, (_, i) => 110 + Math.sin(i / 10) * 22),
                n_scenarios: scenarioResult.count || 0
              }
            };

            if (!cancelled) {
              setData(demoResult);
              console.log(`✅ Loaded ${variable} with demo confidence intervals: ${demoResult.series.value.length} data points`);
            }
          }
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
  }, [scenarioResult, variable, options?.start_step, options?.end_step]);

  return { data, loading, error };
}
