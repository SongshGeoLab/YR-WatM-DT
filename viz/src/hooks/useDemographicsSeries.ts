import { useState, useEffect } from 'react';
import * as api from '../services/api';

interface SeriesData {
  x: number[];
  y: number[];
}

interface DemographicsData {
  population: SeriesData;
  domestic: SeriesData;
  oa: SeriesData;
  loading: boolean;
}

/**
 * Custom hook for demographics data fetching
 * Extracted from App.tsx to improve maintainability and performance
 */
export function useDemographicsSeries(fertility: number, diet: number): DemographicsData {
  const [population, setPopulation] = useState<SeriesData>({ x: [], y: [] });
  const [domestic, setDomestic] = useState<SeriesData>({ x: [], y: [] });
  const [oa, setOa] = useState<SeriesData>({ x: [], y: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        // Cache params to avoid repeated calls
        const params = await api.getParams();
        const values = {
          "Fertility Variation": fertility,
          "Diet change scenario switch": diet,
          "water-saving irrigation efficiency ratio": params["water-saving irrigation efficiency ratio"][1],
          "fire generation share province target": params["fire generation share province target"][1],
          "Ecological water flow variable": params["Ecological water flow variable"][1],
          "Climate change scenario switch for water yield": params["Climate change scenario switch for water yield"][1]
        };

        const { scenario_name } = await api.resolveScenario(values);

        // Only fetch the data we need, with smaller time range for faster response
        const [pop, dom, oaVar] = await Promise.all([
          api.getSeries('total_population', scenario_name, { start_step: 624, end_step: 1000 }), // Reduced range
          api.getSeries('domestic_water_demand_province_sum', scenario_name, { start_step: 624, end_step: 1000 }),
          api.getSeries('oa_water_demand_province_sum', scenario_name, { start_step: 624, end_step: 1000 })
        ]);

        // Optimized sampling - pre-calculate year indices
        const targetYears = [2020, 2025, 2030, 2035, 2040, 2045, 2050, 2055, 2060];
        const sampleData = (time: number[], value: number[], scale = 1): SeriesData => {
          const xs: number[] = [];
          const ys: number[] = [];

          for (const year of targetYears) {
            // Find closest time point more efficiently
            let closestIdx = 0;
            let minDiff = Math.abs(time[0] - year);

            for (let i = 1; i < time.length; i++) {
              const diff = Math.abs(time[i] - year);
              if (diff < minDiff) {
                minDiff = diff;
                closestIdx = i;
              }
            }

            xs.push(Math.round(time[closestIdx]));
            ys.push(value[closestIdx] * scale);
          }

          return { x: xs, y: ys };
        };

        if (!cancelled) {
          setPopulation(sampleData(pop.series.time, pop.series.value, 1/1e6));
          setDomestic(sampleData(dom.series.time, dom.series.value, 1/1e9));
          setOa(sampleData(oaVar.series.time, oaVar.series.value, 1/1e9));
        }
      } catch (error) {
        console.error('Failed to load demographics data:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [fertility, diet]);

  return { population, domestic, oa, loading };
}
