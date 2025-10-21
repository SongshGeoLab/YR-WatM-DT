import { useState, useEffect } from 'react';
import * as api from '../services/api';
import { useScenario } from '../contexts/ScenarioContext';

interface ComparisonData {
  now: number;
  future: number;
  diff: number;
  diffPercent: number;
}

interface ClimateComparisonData {
  temperature: ComparisonData | null;
  precipitation: ComparisonData | null;
  waterAvailability: ComparisonData | null;
  loading: boolean;
  error: string | null;
}

const calculateFutureChange = (data: number[], baselineYear: number = 2020, startYear: number = 1981): ComparisonData => {
  const baselineIndex = baselineYear - startYear;
  const futureStartIndex = Math.max(baselineIndex + 1, 0);

  // Calculate averages
  const nowValue = data[baselineIndex] || 0;
  const futureValues = data.slice(futureStartIndex);
  const futureValue = futureValues.length > 0
    ? futureValues.reduce((sum, val) => sum + val, 0) / futureValues.length
    : nowValue;

  const diff = futureValue - nowValue;
  const diffPercent = nowValue !== 0 ? (diff / nowValue) * 100 : 0;

  return {
    now: nowValue,
    future: futureValue,
    diff,
    diffPercent
  };
};


export const useClimateComparison = (snwtpEnabled: boolean): ClimateComparisonData => {
  const { parameters } = useScenario();
  const [data, setData] = useState<ClimateComparisonData>({
    temperature: null,
    precipitation: null,
    waterAvailability: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchComparisonData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));

        // Prepare filters for API calls
        const filters: any = {};
        Object.entries(parameters).forEach(([key, value]) => {
          if (value !== null) {
            const apiKey = key === 'climateScenario' ? 'Climate change scenario switch for water yield' :
                          key === 'fertility' ? 'Fertility Variation' :
                          key === 'dietPattern' ? 'Diet change scenario switch' :
                          key === 'ecologicalFlow' ? 'Ecological water flow variable' :
                          key === 'irrigationEfficiency' ? 'water saving irrigation efficiency ratio' :
                          key === 'fireGenerationShare' ? 'fire generation share province target' :
                          key;
            filters[apiKey] = value;
          }
        });

        // Add SNWTP parameter
        filters['SNWTP'] = snwtpEnabled ? 1 : 0;

        // Fetch climate data and water availability data
        const [climateResult, waterAvailabilityResult] = await Promise.all([
          api.getClimateData(),
          api.getSeriesMulti('YRB available surface water', filters, {
            start_year: 2020,
            end_year: 2100,
            aggregate: true
          })
        ]);

        // Map climate scenario to SSP scenario
        const scenarioMapping: Record<number, string> = {
          1: 'ssp126',
          2: 'ssp245',
          3: 'ssp585'
        };

        const selectedScenario = scenarioMapping[parameters.climateScenario || 2];

        // Process climate data
        const temperatureData = climateResult.temperature[selectedScenario]?.values || [];
        const precipitationData = climateResult.precipitation[selectedScenario]?.values || [];

        // Process water availability data - handle both single and multi-scenario cases
        let waterAvailabilityData: number[] = [];
        if ('series' in waterAvailabilityResult) {
          waterAvailabilityData = waterAvailabilityResult.series.mean || [];
        }

        setData({
          temperature: temperatureData.length > 0 ? calculateFutureChange(temperatureData) : null,
          precipitation: precipitationData.length > 0 ? calculateFutureChange(precipitationData) : null,
          waterAvailability: waterAvailabilityData.length > 0 ? calculateFutureChange(waterAvailabilityData) : null,
          loading: false,
          error: null
        });

      } catch (error) {
        console.error('Failed to fetch comparison data:', error);
        setData(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch data'
        }));
      }
    };

    fetchComparisonData();
  }, [parameters, snwtpEnabled]);

  return data;
};
