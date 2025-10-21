import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { PlotlyChart } from '../charts/PlotlyChart';
import { TreePine } from 'lucide-react';
import * as api from '../../services/api';
import { useScenario } from '../../contexts/ScenarioContext';

// Helper function to detect dark mode
const isDarkMode = () => {
  if (typeof window !== 'undefined') {
    return document.documentElement.classList.contains('dark') ||
           window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
};

// Ecological Water Flow Chart with threshold comparison
const EcologicalWaterChart = ({ data, snwtpEnabled, ecoFlowValue }: {
  data: any;
  snwtpEnabled: boolean;
  ecoFlowValue: number;
}) => {
  const plotData = useMemo(() => {
    if (!data || !data.series) return [];

    const series = data.series;
    const traces: any[] = [];

    // Ecological flow thresholds (km³)
    const thresholds = {
      "critical": { value: 17.4, color: "red", label: "Critical (17.4 km³)" },
      "normal": { value: 23.2, color: "orange", label: "Normal (23.2 km³)" },
      "safe": { value: 29.0, color: "yellow", label: "Safe (29.0 km³)" },
      "great": { value: 34.8, color: "green", label: "Great (34.8 km³)" },
    };

    // Calculate ecological water flow from available surface water
    const ecologicalWater = series.mean.map((value: number, index: number) => {
      return value * ecoFlowValue / (1 - ecoFlowValue);
    });

    // Add uncertainty bands if multi-scenario
    if (!data.isSingleScenario && series.min && series.max) {
      const ecoWaterMin = series.min.map((value: number) => value * ecoFlowValue / (1 - ecoFlowValue));
      const ecoWaterMax = series.max.map((value: number) => value * ecoFlowValue / (1 - ecoFlowValue));

      // Min-Max Range (lightest)
      traces.push({
        x: series.time,
        y: ecoWaterMax,
        type: 'scatter',
        mode: 'lines',
        line: { width: 0 },
        showlegend: false,
        hoverinfo: 'skip',
      });

      traces.push({
        x: series.time,
        y: ecoWaterMin,
        type: 'scatter',
        mode: 'lines',
        fill: 'tonexty',
        fillcolor: 'rgba(46, 134, 171, 0.1)',
        line: { width: 0 },
        showlegend: false,
        hoverinfo: 'skip',
      });

      // 95% CI if available
      if (series.p05 && series.p95) {
        const ecoWaterCIUpper = series.p95.map((value: number) => value * ecoFlowValue / (1 - ecoFlowValue));
        const ecoWaterCILower = series.p05.map((value: number) => value * ecoFlowValue / (1 - ecoFlowValue));

        traces.push({
          x: series.time,
          y: ecoWaterCIUpper,
          type: 'scatter',
          mode: 'lines',
          line: { width: 0 },
          showlegend: false,
          hoverinfo: 'skip',
        });

        traces.push({
          x: series.time,
          y: ecoWaterCILower,
          type: 'scatter',
          mode: 'lines',
          fill: 'tonexty',
          fillcolor: 'rgba(46, 134, 171, 0.3)',
          line: { width: 0 },
          showlegend: false,
          hoverinfo: 'skip',
        });
      }
    }

    // Main ecological water flow line
    const snwtpLabel = snwtpEnabled ? ' (with SNWTP)' : ' (no SNWTP)';
    const displayName = data.isSingleScenario
      ? `Ecological Water Flow${snwtpLabel}`
      : `Mean Ecological Water${snwtpLabel}`;

    traces.push({
      x: series.time,
      y: ecologicalWater,
      type: 'scatter',
      mode: 'lines',
      line: { color: snwtpEnabled ? '#10b981' : '#2E86AB', width: 3 },
      name: displayName,
      hovertemplate: '<b>Ecological Water Flow</b><br>Year: %{x}<br>Value: %{y:.2f} km³<extra></extra>'
    });

    // Add threshold lines
    Object.values(thresholds).forEach(threshold => {
      traces.push({
        x: series.time,
        y: new Array(series.time.length).fill(threshold.value),
        type: 'scatter',
        mode: 'lines',
        line: {
          color: threshold.color,
          width: 2,
          dash: 'dash'
        },
        name: threshold.label,
        showlegend: true,
        hoverinfo: 'skip'
      });
    });

    return traces;
  }, [data, snwtpEnabled, ecoFlowValue]);

  return (
    <PlotlyChart
      id="ecological-water-thresholds"
      height="600px"
      data={plotData}
      layout={{
        title: {
          text: 'Ecological Water Flow - Multi-Scenario Analysis',
          font: { size: 18 }
        },
        xaxis: {
          title: 'Year',
          range: [2020, 2100],
          gridcolor: isDarkMode() ? '#374151' : '#e5e7eb'
        },
        yaxis: {
          title: 'Ecological Water (km³)',
          range: [10, 40],
          gridcolor: isDarkMode() ? '#374151' : '#e5e7eb'
        },
        plot_bgcolor: 'transparent',
        paper_bgcolor: 'transparent',
        font: { color: isDarkMode() ? '#f9fafb' : '#111827' },
        hovermode: 'x unified',
        legend: {
          yanchor: 'top',
          y: 0.99,
          xanchor: 'left',
          x: 0.01,
          bgcolor: isDarkMode() ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)'
        }
      }}
      config={{ responsive: true, displaylogo: false }}
    />
  );
};

/**
 * Ecological Water page with threshold comparison and SNWTP control.
 *
 * This page demonstrates:
 * 1. Ecological water flow threshold comparison chart
 * 2. SNWTP (South-North Water Transfer Project) toggle
 * 3. Multi-scenario uncertainty visualization
 * 4. Real-time updates based on global parameters
 */
export function EcologicalWaterPageSlider() {
  const { parameters, updateParameter } = useScenario();
  const ecoFlowValue = parameters.ecologicalFlow || 0.25;

  // SNWTP toggle (local state, not global)
  const [snwtpEnabled, setSnwtpEnabled] = useState(false);

  // Data fetching state
  const [surfaceWaterData, setSurfaceWaterData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Available ecological flow values
  const ecoFlowValues = [0.2, 0.25, 0.3];

  // Fetch surface water data with SNWTP parameter
  useEffect(() => {
    const fetchSurfaceWaterData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Build filters from global parameters
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

        const result = await api.getSeriesMulti(
          'YRB available surface water',
          filters,
          { start_year: 2020, end_year: 2100, aggregate: true }
        );

        if ('series' in result) {
          const enhancedResult = {
            series: {
              time: result.series.time,
              value: result.series.mean,
              mean: result.series.mean,
              min: result.series.min,
              max: result.series.max,
              std: result.series.std,
              p05: result.series.p05,
              p95: result.series.p95,
              n_scenarios: result.n_scenarios
            },
            filter_summary: result.filter_summary,
            isSingleScenario: result.isSingleScenario,
            n_scenarios: result.n_scenarios
          };
          setSurfaceWaterData(enhancedResult);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSurfaceWaterData();
  }, [parameters, snwtpEnabled]);

  return (
    <div className="bg-card rounded-lg border-2 border-dashed border-border p-6 h-full overflow-hidden">
      <div className="flex items-center gap-6 mb-6">
        <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg">
          <TreePine className="w-8 h-8" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-foreground">Ecological Water Flow Analysis</h1>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
              Threshold Comparison
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? 'Loading data...' : error ? `Error: ${error}` : `Eco Flow: ${ecoFlowValue} | Scenarios: ${surfaceWaterData?.n_scenarios || 'Loading...'}`}
          </p>
        </div>
      </div>

      {/* Controls Row - SNWTP Toggle and Ecological Flow Slider */}
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* SNWTP Toggle */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-foreground text-sm">South-North Water Transfer:</h3>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSnwtpEnabled(false)}
                className={`px-3 py-1.5 rounded-lg border-2 transition-all text-sm ${
                  !snwtpEnabled
                    ? 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-300 font-medium'
                    : 'bg-card border-border text-foreground hover:bg-muted'
                }`}
              >
                Off
              </button>
              <button
                onClick={() => setSnwtpEnabled(true)}
                className={`px-3 py-1.5 rounded-lg border-2 transition-all text-sm ${
                  snwtpEnabled
                    ? 'bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-300 font-medium'
                    : 'bg-card border-border text-foreground hover:bg-muted'
                }`}
              >
                On
              </button>
            </div>
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Toggle SNWTP to see its impact on ecological water flow
          </p>
        </div>

        {/* Ecological Flow Slider */}
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <label className="font-medium text-green-900 dark:text-green-200 text-sm">
              Ecological Flow: <span className="font-bold">{ecoFlowValue}</span>
            </label>
            <div className="flex gap-1">
              {ecoFlowValues.map((value) => (
                <Button
                  key={value}
                  variant={ecoFlowValue === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateParameter('ecologicalFlow', value)}
                  className={`text-xs px-2 py-1 ${ecoFlowValue === value ? "bg-green-600 hover:bg-green-700" : ""}`}
                >
                  {value}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Slider - Compact version */}
          <div className="space-y-1">
            <input
              type="range"
              min="0"
              max="2"
              step="1"
              value={ecoFlowValues.indexOf(ecoFlowValue)}
              onChange={(e) => updateParameter('ecologicalFlow', ecoFlowValues[parseInt(e.target.value)])}
              className="w-full h-1.5 bg-green-200 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #10b981 0%, #10b981 ${(ecoFlowValues.indexOf(ecoFlowValue) / 2) * 100}%, #e5e7eb ${(ecoFlowValues.indexOf(ecoFlowValue) / 2) * 100}%, #e5e7eb 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-green-600 dark:text-green-400">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>
          </div>
        </div>
      </div>

      {/* Threshold Information */}
      <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-3">
          Ecological Flow Thresholds (km³)
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-yellow-800 dark:text-yellow-200">Critical: 17.4</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-yellow-800 dark:text-yellow-200">Normal: 23.2</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-yellow-800 dark:text-yellow-200">Safe: 29.0</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-yellow-800 dark:text-yellow-200">Great: 34.8</span>
          </div>
        </div>
        <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
          Based on Yellow River Basin Comprehensive Planning and ecological protection targets
        </p>
      </div>

      {/* Main Chart */}
      <div className="mt-6">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="text-lg font-medium text-muted-foreground">
                Loading ecological water flow data...
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="text-lg font-medium text-red-600">
                Error: {error}
              </div>
            </div>
          </div>
        ) : surfaceWaterData ? (
          <EcologicalWaterChart
            data={surfaceWaterData}
            snwtpEnabled={snwtpEnabled}
            ecoFlowValue={ecoFlowValue}
          />
        ) : (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="text-lg font-medium text-muted-foreground">
                No data available
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex justify-center gap-2">
        <Button
          onClick={() => {
            // Force refresh by updating a dummy parameter to trigger re-render
            console.log('Refresh requested - data will update automatically');
          }}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          {loading ? 'Loading...' : 'Refresh Data'}
        </Button>
      </div>
    </div>
  );
}
