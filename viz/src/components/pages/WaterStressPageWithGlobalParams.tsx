import React, { useState, useEffect, useMemo } from 'react';
import { Gauge } from 'lucide-react';
import { PlotlyChart } from '../charts/PlotlyChart';
import { useScenario, useScenarioSeries } from '../../contexts/ScenarioContext';

/**
 * Water Stress Chart with Confidence Intervals
 * Renders mean line and confidence interval area when in multi-scenario mode
 */
interface WaterStressChartWithCIProps {
  data: any;
  scenarioResult: any;
  height?: string;
}

const WaterStressChartWithCI: React.FC<WaterStressChartWithCIProps> = ({
  data,
  scenarioResult,
  height = "500px"
}) => {
  const isDarkMode = () => {
    return document.documentElement.classList.contains('dark') ||
           window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  const plotlyConfig = useMemo(() => {
    if (!data?.series) return null;

    const darkMode = isDarkMode();
    const { time, value, mean, ci_lower, ci_upper } = data.series;

    // Prepare data for single scenario (value) or multi-scenario (mean + CI)
    const traces = [];

    if (scenarioResult?.isSingleScenario) {
      // Single scenario - show actual values
      traces.push({
        type: "scatter",
        x: time,
        y: value,
        mode: "lines",
        line: {
          color: darkMode ? "#4A9EFF" : "#1f77b4",
          width: 2.5
        },
        name: "WSI",
        hovertemplate: "Year: %{x}<br>WSI: %{y:.4f}<extra></extra>"
      });
    } else {
      // Multi-scenario - show mean + confidence interval
      // Upper bound (invisible)
      traces.push({
        type: "scatter",
        x: time,
        y: ci_upper,
        mode: "lines",
        line: { width: 0 },
        showlegend: false,
        hoverinfo: "skip"
      });

      // Lower bound with fill
      traces.push({
        type: "scatter",
        x: time,
        y: ci_lower,
        fill: "tonexty",
        mode: "lines",
        line: { width: 0 },
        fillcolor: darkMode ? "rgba(100, 150, 255, 0.3)" : "rgba(68, 138, 255, 0.2)",
        name: "Confidence Interval",
        hovertemplate: "Year: %{x}<br>Confidence Interval<extra></extra>"
      });

      // Mean line
      traces.push({
        type: "scatter",
        x: time,
        y: mean,
        mode: "lines",
        line: {
          color: darkMode ? "#4A9EFF" : "#1f77b4",
          width: 2.5
        },
        name: "Mean WSI",
        hovertemplate: "Year: %{x}<br>Mean WSI: %{y:.4f}<extra></extra>"
      });
    }

    // Add threshold lines
    const shapes = [
      {
        type: "line",
        x0: time[0],
        x1: time[time.length - 1],
        y0: 0.4,
        y1: 0.4,
        line: { dash: "dot", color: "orange", width: 2 }
      },
      {
        type: "line",
        x0: time[0],
        x1: time[time.length - 1],
        y0: 0.6,
        y1: 0.6,
        line: { dash: "dot", color: "red", width: 2 }
      }
    ];

    const annotations = [
      {
        x: time[time.length - 1],
        y: 0.4,
        text: "High Stress (0.4)",
        showarrow: false,
        xanchor: "right",
        font: { color: darkMode ? '#FFA500' : 'orange' }
      },
      {
        x: time[time.length - 1],
        y: 0.6,
        text: "Critical Stress (0.6)",
        showarrow: false,
        xanchor: "right",
        font: { color: darkMode ? '#FF6B6B' : 'red' }
      }
    ];

    return {
      data: traces,
      layout: {
        title: {
          text: "Water Stress Index (WSI) Time Series Analysis<br><sub>Yellow River Basin - " +
                (scenarioResult?.isSingleScenario ? "Single Scenario" : "Mean and Confidence Interval") + "</sub>",
          x: 0.5,
          xanchor: "center",
          font: {
            color: darkMode ? '#ffffff' : '#000000',
            size: 16
          }
        },
        xaxis: {
          title: "Year",
          color: darkMode ? '#ffffff' : '#000000',
          gridcolor: darkMode ? '#333333' : '#e5e5e5',
          linecolor: darkMode ? '#666666' : '#cccccc',
          range: [2020, 2100],
          dtick: 20
        },
        yaxis: {
          title: "Water Stress Index (WSI)",
          color: darkMode ? '#ffffff' : '#000000',
          gridcolor: darkMode ? '#333333' : '#e5e5e5',
          linecolor: darkMode ? '#666666' : '#cccccc',
          range: [0, 1]
        },
        hovermode: "x unified",
        plot_bgcolor: darkMode ? '#1a1a1a' : '#ffffff',
        paper_bgcolor: darkMode ? '#1a1a1a' : '#ffffff',
        height: parseInt(height),
        margin: { t: 80, b: 60, l: 60, r: 20 },
        legend: {
          orientation: "h",
          yanchor: "bottom",
          y: 1.02,
          xanchor: "right",
          x: 1,
          font: { color: darkMode ? '#ffffff' : '#000000' }
        },
        shapes,
        annotations
      },
      config: {
        responsive: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['pan2d', 'lasso2d']
      }
    };
  }, [data, scenarioResult, height]);

  if (!plotlyConfig) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Water Stress Index...</p>
        </div>
      </div>
    );
  }

  return (
    <PlotlyChart
      id="water-stress-index-global"
      title=""
      description=""
      height={height}
      data={plotlyConfig.data}
      layout={plotlyConfig.layout}
      config={plotlyConfig.config}
      className="h-full"
    />
  );
};

/**
 * Water Stress Page with Global Parameter Integration
 * Uses global scenario context for parameter management and data fetching
 */
const WaterStressPageWithGlobalParams: React.FC = () => {
  const { parameters, scenarioResult, updateParameter } = useScenario();
  const [loading, setLoading] = useState(true);

  // Fetch WSI data using global scenario context
  const { data: wsiData, loading: dataLoading, error: dataError } = useScenarioSeries('yrb_wsi');

  useEffect(() => {
    setLoading(dataLoading);
  }, [dataLoading]);

  // Calculate statistics from the data
  const statistics = useMemo(() => {
    if (!wsiData?.series) return null;

    const { time, value, mean } = wsiData.series;
    const values = scenarioResult?.isSingleScenario ? value : mean;

    // Debug: Log data information
    console.log('🔍 WSI Data Debug:', {
      timeLength: time?.length,
      valueLength: value?.length,
      meanLength: mean?.length,
      timeRange: time ? [time[0], time[time.length - 1]] : null,
      valueRange: values ? [Math.min(...values), Math.max(...values)] : null,
      isSingleScenario: scenarioResult?.isSingleScenario
    });

    if (!values || values.length === 0) return null;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum: number, val: number) => sum + val, 0) / values.length;

    // Find critical periods
    const criticalCount = values.filter((v: number) => v >= 0.6).length;
    const highCount = values.filter((v: number) => v >= 0.4 && v < 0.6).length;

    return {
      mean: avg,
      min: min,
      max: max,
      range: max - min,
      critical_years: criticalCount,
      high_stress_years: highCount,
      total_years: values.length
    };
  }, [wsiData, scenarioResult]);

  if (loading) {
    return (
      <div className="bg-card rounded-lg border-2 border-dashed border-border p-6 h-full overflow-hidden">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading Water Stress Index...</p>
          </div>
        </div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="bg-card rounded-lg border-2 border-dashed border-border p-6 h-full overflow-hidden">
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-red-500">
            <p className="text-lg font-medium">Error loading data</p>
            <p className="text-sm">{dataError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border-2 border-dashed border-border p-6 h-full overflow-hidden">
      <div className="flex items-center gap-6 mb-6">
        <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg">
          <Gauge className="w-8 h-8" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-foreground">Water Stress</h1>
            <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm font-medium">
              Page 6
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Water Stress Index & Critical Threshold Analysis
            {scenarioResult?.isSingleScenario ? ` | Scenario: ${scenarioResult.primaryScenario}` : ` | Multiple Scenarios (${scenarioResult?.count || '?'})`}
          </p>
        </div>
      </div>

      <div className="space-y-4 h-[calc(100%-4rem)] flex flex-col">
        {/* Description */}
        <div className="text-foreground leading-relaxed text-base flex-shrink-0">
          <p>
            Almost all climate and socioeconomic changes will affect the water balance pressure in the YRB.
            <span className="font-medium"> The water stress index combines demand-to-supply ratios with seasonal variability patterns,</span> showing
            critical stress levels projected to emerge clearly by 2050 across multiple scenarios.
            Peak stress occurs during summer months when irrigation demand coincides with reduced precipitation.
          </p>
        </div>

        {/* Main Chart */}
        <div className="flex-1 min-h-0">
          <WaterStressChartWithCI
            data={wsiData}
            scenarioResult={scenarioResult}
            height="100%"
          />
        </div>

        {/* Statistics Dashboard */}
        {statistics && (
          <>
            <div className="grid grid-cols-4 gap-3 flex-shrink-0">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                  0.6
                </div>
                <div className="text-sm text-red-600 dark:text-red-400">Critical Stress</div>
                <div className="text-xs text-red-500 dark:text-red-500 mt-1">Threshold Line</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  0.4
                </div>
                <div className="text-sm text-orange-600 dark:text-orange-400">High Stress</div>
                <div className="text-xs text-orange-500 dark:text-orange-500 mt-1">Warning Level</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {statistics.max.toFixed(3)}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">Peak WSI</div>
                <div className="text-xs text-blue-500 dark:text-blue-500 mt-1">Maximum Value</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {statistics.total_years}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">Analysis Period</div>
                <div className="text-xs text-green-500 dark:text-green-500 mt-1">2020-2100</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 flex-shrink-0">
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
                  {statistics.mean.toFixed(3)}
                </div>
                <div className="text-sm text-purple-600 dark:text-purple-400">Average WSI</div>
                <div className="text-xs text-purple-500 dark:text-purple-500 mt-1">Mean Value</div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                  {statistics.range.toFixed(3)}
                </div>
                <div className="text-sm text-yellow-600 dark:text-yellow-400">Value Range</div>
                <div className="text-xs text-yellow-500 dark:text-yellow-500 mt-1">Max - Min</div>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                  {statistics.critical_years}
                </div>
                <div className="text-sm text-indigo-600 dark:text-indigo-400">Critical Years</div>
                <div className="text-xs text-indigo-500 dark:text-indigo-500 mt-1">
                  WSI ≥ 0.6
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WaterStressPageWithGlobalParams;
