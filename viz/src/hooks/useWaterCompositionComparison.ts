import { useState, useEffect } from 'react';
import * as api from '../services/api';
import { useScenario } from '../contexts/ScenarioContext';

interface ComparisonData {
  now: number;
  future: number;
  diff: number;
  diffPercent: number;
}

interface WaterCompositionComparisonData {
  irrigation: ComparisonData | null;
  production: ComparisonData | null;
  oa: ComparisonData | null;
  domestic: ComparisonData | null;
  total: ComparisonData | null;
  loading: boolean;
  error: string | null;
}

const calculateFutureChange = (data: number[], baselineYear: number = 2020, startYear: number = 2020): ComparisonData => {
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

export const useWaterCompositionComparison = (): WaterCompositionComparisonData => {
  const { parameters } = useScenario();
  const [data, setData] = useState<WaterCompositionComparisonData>({
    irrigation: null,
    production: null,
    oa: null,
    domestic: null,
    total: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchComparisonData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));

        // Use shared helper to convert parameters to API filters
        const filters = api.parametersToFilters(parameters);

        // Fetch all water demand data
        const [irrigationResult, productionResult, oaResult, domesticResult, totalResult] = await Promise.all([
          api.getSeriesMulti('irrigation water demand province sum', filters, {
            start_year: 2020,
            end_year: 2100,
            aggregate: true
          }),
          api.getSeriesMulti('production water demand province sum', filters, {
            start_year: 2020,
            end_year: 2100,
            aggregate: true
          }),
          api.getSeriesMulti('OA water demand province sum', filters, {
            start_year: 2020,
            end_year: 2100,
            aggregate: true
          }),
          api.getSeriesMulti('domestic water demand province sum', filters, {
            start_year: 2020,
            end_year: 2100,
            aggregate: true
          }),
          api.getSeriesMulti('water consumption of province in YRB sum', filters, {
            start_year: 2020,
            end_year: 2100,
            aggregate: true
          })
        ]);

        // Process all data
        const processData = (result: any): number[] => {
          if ('series' in result) {
            return result.series.mean || [];
          }
          return [];
        };

        const irrigationData = processData(irrigationResult);
        const productionData = processData(productionResult);
        const oaData = processData(oaResult);
        const domesticData = processData(domesticResult);
        const totalData = processData(totalResult);

        setData({
          irrigation: irrigationData.length > 0 ? calculateFutureChange(irrigationData) : null,
          production: productionData.length > 0 ? calculateFutureChange(productionData) : null,
          oa: oaData.length > 0 ? calculateFutureChange(oaData) : null,
          domestic: domesticData.length > 0 ? calculateFutureChange(domesticData) : null,
          total: totalData.length > 0 ? calculateFutureChange(totalData) : null,
          loading: false,
          error: null
        });

      } catch (error) {
        console.error('Failed to fetch water composition comparison data:', error);
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
