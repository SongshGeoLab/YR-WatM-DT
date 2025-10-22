/**
 * Data Prefetching Service
 *
 * Preloads common scenario data to improve perceived performance
 */

import * as api from './api';

interface PrefetchConfig {
  commonScenarios: string[];
  commonVariables: string[];
  timeRange: { start_step: number; end_step: number };
}

const DEFAULT_CONFIG: PrefetchConfig = {
  commonScenarios: ['tSSP1-RCP2.6', 'tSSP2-RCP4.5'],
  commonVariables: [
    'yrb_wsi',
    'total_population',
    'domestic_water_demand_province_sum',
    'oa_water_demand_province_sum',
    'irrigation_water_demand_province_sum',
    'production_water_demand_province_sum'
  ],
  timeRange: { start_step: 624, end_step: 1000 } // 2020-2100
};

class PrefetchService {
  private cache = new Map<string, any>();
  private prefetchPromise: Promise<void> | null = null;

  /**
   * Prefetch common scenario data
   */
  async prefetchCommonData(): Promise<void> {
    if (this.prefetchPromise) {
      return this.prefetchPromise;
    }

    this.prefetchPromise = this._doPrefetch();
    return this.prefetchPromise;
  }

  private async _doPrefetch(): Promise<void> {
    console.log('🚀 Starting data prefetch...');
    const startTime = performance.now();

    try {
      // Prefetch parameters
      const params = await api.getParams();
      this.cache.set('params', params);

      // Prefetch common scenarios in parallel
      const prefetchPromises: Promise<any>[] = [];

      for (const scenario of DEFAULT_CONFIG.commonScenarios) {
        for (const variable of DEFAULT_CONFIG.commonVariables) {
          const cacheKey = `${scenario}-${variable}`;
          if (!this.cache.has(cacheKey)) {
            prefetchPromises.push(
              api.getSeries(variable, scenario, DEFAULT_CONFIG.timeRange)
                .then(data => {
                  this.cache.set(cacheKey, data);
                  return data;
                })
                .catch(err => {
                  console.warn(`Failed to prefetch ${scenario}-${variable}:`, err);
                })
            );
          }
        }
      }

      await Promise.allSettled(prefetchPromises);

      const duration = performance.now() - startTime;
      console.log(`✅ Prefetch completed in ${duration.toFixed(1)}ms`);
      console.log(`📦 Cached ${this.cache.size} items`);

    } catch (error) {
      console.error('❌ Prefetch failed:', error);
    }
  }

  /**
   * Get cached data if available
   */
  getCachedData(key: string): any {
    return this.cache.get(key);
  }

  /**
   * Check if data is cached
   */
  isCached(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.prefetchPromise = null;
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Singleton instance
export const prefetchService = new PrefetchService();

/**
 * Hook for prefetching data
 */
export function usePrefetch() {
  const [isPrefetching, setIsPrefetching] = React.useState(false);
  const [prefetchComplete, setPrefetchComplete] = React.useState(false);

  React.useEffect(() => {
    if (!prefetchComplete) {
      setIsPrefetching(true);
      prefetchService.prefetchCommonData()
        .finally(() => {
          setIsPrefetching(false);
          setPrefetchComplete(true);
        });
    }
  }, [prefetchComplete]);

  return { isPrefetching, prefetchComplete };
}

// Import React for the hook
import React from 'react';
