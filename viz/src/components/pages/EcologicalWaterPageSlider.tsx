import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { PlotlyChart } from '../charts/PlotlyChart';
import { TreePine } from 'lucide-react';
import * as api from '../../services/api';

// Helper function to detect dark mode
const isDarkMode = () => {
  if (typeof window !== 'undefined') {
    return document.documentElement.classList.contains('dark') ||
           window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
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
  const [ecoFlowValue, setEcoFlowValue] = useState<number>(0.25);
  const [selectedVariable, setSelectedVariable] = useState<string>('YRB available surface water');
  const [plotData, setPlotData] = useState<any[]>([]);
  const [layout, setLayout] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<any>(null);

  // Available variables
  const availableVariables = [
    { name: 'YRB available surface water', label: 'YRB Available Surface Water', unit: 'km³', apiName: 'YRB available surface water' },
    { name: 'hydrologic station discharge[lijin]', label: 'Discharge at Lijin', unit: 'm³/s', apiName: 'hydrologic station discharge[lijin]' },
    { name: 'sediment load[lijin]', label: 'Sediment Load at Lijin', unit: 'ton', apiName: 'sediment load[lijin]' }
  ];

  // Available ecological flow values
  const ecoFlowValues = [0.2, 0.25, 0.3];
  const ecoFlowStep = 0.05;

  useEffect(() => {
    loadData();
  }, [ecoFlowValue, selectedVariable]);

  // Listen for theme changes and reload data to update chart colors
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => {
      // Small delay to ensure DOM has updated
      setTimeout(() => {
        loadData();
      }, 100);
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

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get parameters
      const params = await api.getParams();

      // Build parameter values with current eco flow value
      // Use first values for other parameters to ensure scenario exists
      const values: api.ParameterValues = {
        "Ecological water flow variable": ecoFlowValue,
        "Fertility Variation": params["Fertility Variation"][0], // 1.6
        "water-saving irrigation efficiency ratio": params["water-saving irrigation efficiency ratio"][0], // 0.8
        "fire generation share province target": params["fire generation share province target"][0], // 0.1
        "Climate change scenario switch for water yield": params["Climate change scenario switch for water yield"][0], // 1
        "Diet change scenario switch": params["Diet change scenario switch"][0] // 1
      };

      // Resolve scenario
      console.log('Resolving scenario with values:', values);
      const result = await api.resolveScenario(values);
      console.log('Scenario resolution result:', result);
      const scenario_name = result.scenario_name;

      // Fetch data for selected variable
      const currentVar = availableVariables.find(v => v.name === selectedVariable);
      const apiVariableName = currentVar?.apiName || selectedVariable;
      console.log(`Fetching data for variable: ${apiVariableName}, scenario: ${scenario_name}`);
      const series = await api.getSeries(apiVariableName, scenario_name, {
        start_step: 624, // 2020年对应的step
        end_step: 1904   // 2100年对应的step
      });
      console.log('Series data received:', series);

      // Process data for visualization
      const time = series.series.time;
      const value = series.series.value;

      // Create plot data for current eco flow value
      const currentPlotData = [{
        x: time,
        y: value,
        type: 'scatter',
        mode: 'lines',
        name: `Eco Flow = ${ecoFlowValue}`,
        line: { color: '#2ca02c', width: 3 }
      }];

      setPlotData(currentPlotData);

      // Update layout with dark mode support
      const currentVariable = availableVariables.find(v => v.name === selectedVariable);
      const darkMode = isDarkMode();

      setLayout({
        title: {
          text: `Ecological Water Flow Impact on ${currentVariable?.label || selectedVariable} (2020-2100)`,
          font: {
            size: 16,
            family: 'Arial',
            color: darkMode ? '#ffffff' : '#000000'
          }
        },
        xaxis: {
          title: 'Year',
          range: [2020, 2100],
          showgrid: true,
          gridwidth: 1,
          gridcolor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(128, 128, 128, 0.2)',
          color: darkMode ? '#ffffff' : '#000000',
          titlefont: { color: darkMode ? '#ffffff' : '#000000' },
          tickfont: { color: darkMode ? '#ffffff' : '#000000' }
        },
        yaxis: {
          title: `${currentVariable?.label || selectedVariable} (${currentVariable?.unit || ''})`,
          showgrid: true,
          gridwidth: 1,
          gridcolor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(128, 128, 128, 0.2)',
          color: darkMode ? '#ffffff' : '#000000',
          titlefont: { color: darkMode ? '#ffffff' : '#000000' },
          tickfont: { color: darkMode ? '#ffffff' : '#000000' }
        },
        hovermode: 'x unified',
        legend: {
          orientation: 'h',
          yanchor: 'bottom',
          y: -0.15,
          xanchor: 'center',
          x: 0.5,
          font: { color: darkMode ? '#ffffff' : '#000000' },
          bgcolor: darkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          bordercolor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'
        },
        plot_bgcolor: darkMode ? '#1a1a1a' : '#ffffff',
        paper_bgcolor: darkMode ? '#1a1a1a' : '#ffffff',
        template: darkMode ? 'plotly_dark' : 'plotly_white',
        height: 500,
        margin: { l: 80, r: 40, t: 80, b: 80 }
      });

      // Calculate statistics
      const meanValue = value.reduce((a, b) => a + b, 0) / value.length;
      const maxValue = Math.max(...value);
      const minValue = Math.min(...value);
      const maxIndex = value.indexOf(maxValue);
      const minIndex = value.indexOf(minValue);

      setStatistics({
        mean_value: meanValue,
        max_value: maxValue,
        max_year: time[maxIndex],
        min_value: minValue,
        min_year: time[minIndex],
        scenario: scenario_name,
        eco_flow: ecoFlowValue
      });

    } catch (err: any) {
      setError(err.message);
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

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
                onClick={() => setEcoFlowValue(value)}
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
            onChange={(e) => setEcoFlowValue(ecoFlowValues[parseInt(e.target.value)])}
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
      <div className="h-[calc(100%-20rem)]">
        {plotData.length > 0 ? (
          <PlotlyChart
            id="ecological-water-slider"
            height="100%"
            data={plotData}
            layout={layout}
            config={{ responsive: true, displaylogo: false }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-lg font-medium text-muted-foreground">
                {loading ? 'Loading data...' : 'No data available'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex justify-center gap-2">
        <Button
          onClick={loadData}
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
