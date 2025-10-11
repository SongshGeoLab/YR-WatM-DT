import { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

/**
 * Data structure for series data
 */
interface SeriesData {
  x: number[];
  y: number[];
}

/**
 * Demographics data interface
 */
interface DemographicsData {
  population: SeriesData;
  domestic: SeriesData;
  oa: SeriesData;
  loading: boolean;
  error: string | null;
}

/**
 * Binary search algorithm to find closest time index
 * Optimizes from O(n×m) to O(n log n) complexity
 *
 * @param timeArray - Array of time values (sorted)
 * @param targetYear - Target year to find
 * @returns Index of closest match
 */
function findClosestTimeIndex(timeArray: number[], targetYear: number): number {
  let left = 0;
  let right = timeArray.length - 1;
  let bestIdx = 0;
  let minDiff = Math.abs(timeArray[0] - targetYear);

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const diff = Math.abs(timeArray[mid] - targetYear);

    if (diff < minDiff) {
      minDiff = diff;
      bestIdx = mid;
    }

    if (timeArray[mid] < targetYear) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return bestIdx;
}

/**
 * Optimized Demographics data fetching hook
 * Fetches all required data in a single batch with optimized sampling
 *
 * @param fertility - Fertility rate parameter (1.6 - 1.8)
 * @param diet - Diet pattern parameter (1, 2, or 3)
 * @returns Demographics data with loading and error states
 */
export function useDemographicsSeries(fertility: number, diet: number): DemographicsData {
  const [data, setData] = useState({
    population: { x: [], y: [] },
    domestic: { x: [], y: [] },
    oa: { x: [], y: [] }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache parameters to avoid repeated API calls
  const [cachedParams, setCachedParams] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        console.log('🚀 Starting optimized demographics data fetch...');

        // Get and cache parameters (avoid repeated calls)
        let params = cachedParams;
        if (!params) {
          params = await api.getParams();
          setCachedParams(params);
          console.log('📦 Parameters cached');
        }

        const values = {
          "Fertility Variation": fertility,
          "Diet change scenario switch": diet,
          "water-saving irrigation efficiency ratio": params["water-saving irrigation efficiency ratio"][1],
          "fire generation share province target": params["fire generation share province target"][1],
          "Ecological water flow variable": params["Ecological water flow variable"][1],
          "Climate change scenario switch for water yield": params["Climate change scenario switch for water yield"][1]
        };

        console.log('🔄 Resolving scenario with values:', values);
        const { scenario_name } = await api.resolveScenario(values);
        console.log('✅ Scenario resolved:', scenario_name);

        // Fetch all required data in parallel - key optimization!
        console.log('📊 Fetching all data series in parallel...');
        const startTime = performance.now();

        const [pop, dom, oaVar] = await Promise.all([
          api.getSeries('total_population', scenario_name, { start_step: 624, end_step: 1000 }),
          api.getSeries('domestic_water_demand_province_sum', scenario_name, { start_step: 624, end_step: 1000 }),
          api.getSeries('oa_water_demand_province_sum', scenario_name, { start_step: 624, end_step: 1000 })
        ]);

        const fetchTime = performance.now() - startTime;
        console.log(`⏱️ Data fetch completed in ${fetchTime.toFixed(1)}ms`);

        // Optimized data sampling algorithm
        const optimizedSampleData = (time: number[], value: number[], scale = 1): SeriesData => {
          const targetYears = [2020, 2025, 2030, 2035, 2040, 2045, 2050, 2055, 2060];
          const xs: number[] = [];
          const ys: number[] = [];

          console.log(`🔍 Processing ${value.length} data points...`);

          targetYears.forEach(targetYear => {
            // Use binary search - O(log n) complexity instead of O(n)
            const idx = findClosestTimeIndex(time, targetYear);
            xs.push(Math.round(time[idx]));
            ys.push(value[idx] * scale);
          });

          console.log(`✨ Sampled ${xs.length} points from ${value.length} total points`);
          return { x: xs, y: ys };
        };

        if (!cancelled) {
          const processingStartTime = performance.now();

          const processedData = {
            population: optimizedSampleData(pop.series.time, pop.series.value, 1/1e6),
            domestic: optimizedSampleData(dom.series.time, dom.series.value, 1/1e9),
            oa: optimizedSampleData(oaVar.series.time, oaVar.series.value, 1/1e9)
          };

          const processingTime = performance.now() - processingStartTime;
          console.log(`⚡ Data processing completed in ${processingTime.toFixed(1)}ms`);

          setData(processedData);
          console.log('🎉 Demographics data successfully loaded and processed!');
        }
      } catch (err: any) {
        console.error('❌ Failed to load demographics data:', err);
        setError(err.message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      console.log('🛑 Demographics data fetch cancelled');
    };
  }, [fertility, diet, cachedParams]);

  return { ...data, loading, error };
}
