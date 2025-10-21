import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Droplets, TreeDeciduous, Clock, Mountain } from 'lucide-react';

/**
 * Historical Data Dashboard Component
 *
 * Simple dashboard-style display with timeline and data cards
 */

interface HistoricalData {
  metadata: {
    sediment_range: [number, number];
    forest_range: [number, number];
    common_range: [number, number];
    interpolated_years: number[];
    units: {
      sediment: string;
      forest: string;
    };
  };
  raw_data: {
    sediment: Array<{ year: number; value: number; category: string }>;
    forest: Array<{ year: number; value: number }>;
  };
  interpolated_data: {
    years: number[];
    sediment: number[];
    forest: number[];
  };
}

interface HistoricalDataViewerProps {
  onYearChange?: (year: number) => void;
}

export function HistoricalDataViewer({ onYearChange }: HistoricalDataViewerProps = {}) {
  const [data, setData] = useState<HistoricalData | null>(null);
  const [currentYearIndex, setCurrentYearIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    fetch('/historical_data.json')
      .then(res => res.json())
      .then(data => {
        setData(data);
        // Start at year 1000 (index ~20)
        const startIndex = Math.floor(data.interpolated_data.years.length / 6);
        setCurrentYearIndex(startIndex);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load historical data:', err);
        setLoading(false);
      });
  }, []);

  // Get current year data
  const currentData = useMemo(() => {
    if (!data) return null;

    const year = data.interpolated_data.years[currentYearIndex];
    const sediment = data.interpolated_data.sediment[currentYearIndex];
    const forest = data.interpolated_data.forest[currentYearIndex];

    return { year, sediment, forest };
  }, [data, currentYearIndex]);

  // Notify parent component of year changes
  useEffect(() => {
    if (currentData && onYearChange) {
      onYearChange(currentData.year);
    }
  }, [currentData, onYearChange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-muted-foreground">Loading historical data...</div>
      </div>
    );
  }

  if (!data || !currentData) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-red-500">Failed to load historical data</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Slider */}
      <div className="bg-card rounded-lg border-2 border-dashed border-border p-4">
        <div className="relative">
          <input
            type="range"
            min="0"
            max={data.interpolated_data.years.length - 1}
            step="1"
            value={currentYearIndex}
            onChange={(e) => setCurrentYearIndex(Number(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{data.metadata.common_range[0]} CE</span>
            <span>{data.metadata.common_range[1]} CE</span>
          </div>
        </div>
      </div>

      {/* Data Cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Year Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 dark:text-blue-300">Year</h4>
              <p className="text-xs text-blue-600 dark:text-blue-400">CE</p>
            </div>
          </div>
          <div className="text-4xl font-bold text-blue-700 dark:text-blue-400 mb-1">
            {currentData.year}
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400">
            Range: 800-1990 CE
          </div>
        </div>

        {/* Sediment Card */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl p-6 border border-red-200 dark:border-red-800 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
              <Mountain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-red-800 dark:text-red-300">Sediment Load</h4>
              <p className="text-xs text-red-600 dark:text-red-400">×10⁸ t/year</p>
            </div>
          </div>
          <div className="text-4xl font-bold text-red-700 dark:text-red-400 mb-1">
            {currentData.sediment.toFixed(2)}
          </div>
          <div className="text-sm text-red-600 dark:text-red-400">
            Historical average: {(data.raw_data.sediment.reduce((sum, d) => sum + d.value, 0) / data.raw_data.sediment.length).toFixed(2)}
          </div>
        </div>

        {/* Forest Card */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 border border-green-200 dark:border-green-800 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
              <TreeDeciduous className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-green-800 dark:text-green-300">Forest Coverage</h4>
              <p className="text-xs text-green-600 dark:text-green-400">Coverage ratio</p>
            </div>
          </div>
          <div className="text-4xl font-bold text-green-700 dark:text-green-400 mb-1">
            {(currentData.forest * 100).toFixed(2)}%
          </div>
          <div className="text-sm text-green-600 dark:text-green-400">
            Historical average: {(data.raw_data.forest.reduce((sum, d) => sum + d.value, 0) / data.raw_data.forest.length * 100).toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  );
}
