import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { PlotlyChart } from '../charts/PlotlyChart';
import { TreePine } from 'lucide-react';
import * as api from '../../services/api';
import { useScenario, useScenarioSeries } from '../../contexts/ScenarioContext';

// Helper function to detect dark mode
const isDarkMode = () => {
  if (typeof window !== 'undefined') {
    return document.documentElement.classList.contains('dark') ||
           window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
};

// Chart component with confidence intervals support
const EcologicalChartWithCI = ({ data, scenarioResult, selectedVariable, availableVariables }: {
  data: any;
  scenarioResult: any;
  selectedVariable: string;
  availableVariables: any[];
}) => {
  const variable = availableVariables.find(v => v.name === selectedVariable);
  const plotData = React.useMemo(() => {
    if (!data || !data.series) return [];

    const series = data.series;
    const traces: any[] = [];

    // Add confidence interval if available
    if (scenarioResult && !scenarioResult.isSingleScenario && series.ci_lower && series.ci_upper) {
      // Lower bound
      traces.push({
        x: series.time,
        y: series.ci_lower,
        type: 'scatter',
        mode: 'lines',
        line: { width: 0 },
        showlegend: false,
        hoverinfo: 'skip',
      });

      // Upper bound with fill
      traces.push({
        x: series.time,
        y: series.ci_upper,
        type: 'scatter',
        mode: 'lines',
        fill: 'tonexty',
        fillcolor: 'rgba(16, 185, 129, 0.2)', // Green with transparency
        line: { width: 0 },
        showlegend: false,
        hoverinfo: 'skip',
      });
    }

    // Main data line
    traces.push({
      x: series.time,
      y: series.mean || series.value,
      type: 'scatter',
      mode: 'lines',
      line: { color: '#10b981', width: 3 },
      name: scenarioResult && !scenarioResult.isSingleScenario ? 'Mean' : variable?.label || selectedVariable,
    });

    return traces;
  }, [data, scenarioResult, selectedVariable, availableVariables]);

  return (
    <PlotlyChart
      id="ecological-water-with-ci"
      height="500px"
      data={plotData}
      layout={{
        title: {
          text: `Ecological Water Flow Impact on ${variable?.label || selectedVariable} (2020-2100)`,
          font: { size: 16 }
        },
        xaxis: {
          title: 'Year',
          gridcolor: isDarkMode() ? '#374151' : '#e5e7eb'
        },
        yaxis: {
          title: `${variable?.label || selectedVariable} (${variable?.unit || ''})`,
          gridcolor: isDarkMode() ? '#374151' : '#e5e7eb'
        },
        plot_bgcolor: 'transparent',
        paper_bgcolor: 'transparent',
        font: { color: isDarkMode() ? '#f9fafb' : '#111827' },
        height: 500
      }}
      config={{ responsive: true, displaylogo: false }}
    />
  );
};

/**
 * Ecological Water page with slider control.
 *
 * This page demonstrates:
 * 1. Slider control for Ecological water flow variable
 * 2. Real-time chart updates when slider changes
 * 3. Single variable display with dynamic parameter control
 */
export function EcologicalWaterPageSlider() {
  const { parameters, updateParameter, scenarioResult } = useScenario();
  const ecoFlowValue = parameters.ecologicalFlow || 0.25;
  const [selectedVariable, setSelectedVariable] = useState<string>('YRB available surface water');
  const [plotData, setPlotData] = useState<any[]>([]);
  const [layout, setLayout] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<any>(null);

  // Use global scenario series for data with confidence intervals
  const { data: globalData, loading: globalLoading } = useScenarioSeries(
    selectedVariable === 'YRB available surface water' ? 'YRB available surface water' :
    selectedVariable === 'hydrologic station discharge[lijin]' ? 'hydrologic station discharge[lijin]' :
    'sediment load[lijin]'
  );

  // Available variables
  const availableVariables = [
    { name: 'YRB available surface water', label: 'YRB Available Surface Water', unit: 'km³', apiName: 'YRB available surface water' },
    { name: 'hydrologic station discharge[lijin]', label: 'Discharge at Lijin', unit: 'm³/s', apiName: 'hydrologic station discharge[lijin]' },
    { name: 'sediment load[lijin]', label: 'Sediment Load at Lijin', unit: 'ton', apiName: 'sediment load[lijin]' }
  ];

  // Available ecological flow values
  const ecoFlowValues = [0.2, 0.25, 0.3];
  const ecoFlowStep = 0.05;

  // Remove old loadData effect - now using global state

  // Listen for theme changes and reload data to update chart colors
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => {
      // Theme changed - chart will automatically update via global state
      console.log('Theme changed, chart will update automatically');
    };

    mediaQuery.addEventListener('change', handleThemeChange);

    // Also listen for class changes on document element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          handleThemeChange();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
      observer.disconnect();
    };
  }, []);

  // loadData function removed - now using global state

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
              Slider Control
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? 'Loading data...' : error ? `Error: ${error}` : `Eco Flow: ${ecoFlowValue} | Scenario: ${statistics?.scenario || 'Loading...'}`}
          </p>
        </div>
      </div>

      {/* Variable Selection */}
      <div className="mb-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-4 mb-3">
          <label className="font-medium text-foreground">Select Variable:</label>
          <div className="flex gap-2">
            {availableVariables.map((variable) => (
              <Button
                key={variable.name}
                variant={selectedVariable === variable.name ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedVariable(variable.name)}
                className={selectedVariable === variable.name ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {variable.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Ecological Flow Slider */}
      <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <label className="font-medium text-green-900 dark:text-green-200">
            Ecological Water Flow Variable: <span className="font-bold">{ecoFlowValue}</span>
          </label>
          <div className="flex gap-1">
            {ecoFlowValues.map((value) => (
              <Button
                key={value}
                variant={ecoFlowValue === value ? "default" : "outline"}
                size="sm"
                onClick={() => updateParameter('ecologicalFlow', value)}
                className={ecoFlowValue === value ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {value}
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Slider - Only valid values */}
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="2"
            step="1"
            value={ecoFlowValues.indexOf(ecoFlowValue)}
            onChange={(e) => updateParameter('ecologicalFlow', ecoFlowValues[parseInt(e.target.value)])}
            className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #10b981 0%, #10b981 ${(ecoFlowValues.indexOf(ecoFlowValue) / 2) * 100}%, #e5e7eb ${(ecoFlowValues.indexOf(ecoFlowValue) / 2) * 100}%, #e5e7eb 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-green-600 dark:text-green-400">
            <span>0.2 (Low)</span>
            <span>0.25 (Medium)</span>
            <span>0.3 (High)</span>
          </div>
        </div>

        <p className="text-sm text-green-700 dark:text-green-300 mt-2">
          Proportion of ecological flow for sediment flushing and environmental management
        </p>
      </div>

      {/* Statistics Panel */}
      {statistics && (
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-3 text-base">
            Current Statistics (Eco Flow = {statistics.eco_flow})
          </h4>
          <div className="grid grid-cols-4 gap-4 text-base">
            <div>
              <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Mean Value</div>
              <div className="font-bold text-blue-700 dark:text-blue-300">
                {statistics.mean_value.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Maximum</div>
              <div className="font-bold text-blue-700 dark:text-blue-300">
                {statistics.max_value.toFixed(2)}
              </div>
              <div className="text-xs text-blue-500 dark:text-blue-500">Year {statistics.max_year.toFixed(0)}</div>
            </div>
            <div>
              <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Minimum</div>
              <div className="font-bold text-blue-700 dark:text-blue-300">
                {statistics.min_value.toFixed(2)}
              </div>
              <div className="text-xs text-blue-500 dark:text-blue-500">Year {statistics.min_year.toFixed(0)}</div>
            </div>
            <div>
              <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Scenario</div>
              <div className="font-bold text-blue-700 dark:text-blue-300">
                {statistics.scenario}
              </div>
              <div className="text-xs text-blue-500 dark:text-blue-500">2020-2100</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Chart */}
      <div className="mt-6">
        {globalData ? (
          <EcologicalChartWithCI
            data={globalData}
            scenarioResult={scenarioResult}
            selectedVariable={selectedVariable}
            availableVariables={availableVariables}
          />
        ) : plotData.length > 0 ? (
          <PlotlyChart
            id="ecological-water-slider"
            height="500px"
            data={plotData}
            layout={layout}
            config={{ responsive: true, displaylogo: false }}
          />
        ) : (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="text-lg font-medium text-muted-foreground">
                {loading || globalLoading ? 'Loading data...' : 'No data available'}
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
            console.log('Refresh requested - data will update automatically via global state');
          }}
          disabled={globalLoading}
          variant="outline"
          size="sm"
        >
          {globalLoading ? 'Loading...' : 'Refresh Data'}
        </Button>
      </div>
    </div>
  );
}
