import { useState, useEffect } from 'react';
import * as api from '../services/api';
import { useScenario } from '../contexts/ScenarioContext';

interface ComparisonData {
  now: number;
  future: number;
  diff: number;
  diffPercent: number;
}

interface WaterDemandComparisonData {
  irrigation: ComparisonData | null;
  production: ComparisonData | null;
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

export const useWaterDemandComparison = (): WaterDemandComparisonData => {
  const { parameters } = useScenario();
  const [data, setData] = useState<WaterDemandComparisonData>({
    irrigation: null,
    production: null,
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

        // Fetch irrigation and production water demand data
        const [irrigationResult, productionResult] = await Promise.all([
          api.getSeriesMulti('irrigation water demand province sum', filters, {
            start_year: 2020,
            end_year: 2100,
            aggregate: true
          }),
          api.getSeriesMulti('production water demand province sum', filters, {
            start_year: 2020,
            end_year: 2100,
            aggregate: true
          })
        ]);

        // Process irrigation data
        let irrigationData: number[] = [];
        if ('series' in irrigationResult) {
          irrigationData = irrigationResult.series.mean || [];
        }

        // Process production data
        let productionData: number[] = [];
        if ('series' in productionResult) {
          productionData = productionResult.series.mean || [];
        }

        setData({
          irrigation: irrigationData.length > 0 ? calculateFutureChange(irrigationData) : null,
          production: productionData.length > 0 ? calculateFutureChange(productionData) : null,
          loading: false,
          error: null
        });

      } catch (error) {
        console.error('Failed to fetch water demand comparison data:', error);
        setData(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch data'
        }));
      }
    };

    fetchComparisonData();
  }, [parameters]);

  return data;
};
