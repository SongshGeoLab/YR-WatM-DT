import React, { useMemo, useState, memo, useEffect } from 'react';
import { PlotlyChart } from '../charts/PlotlyChart';
import { Card } from '../ui/card';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { useScenario, useScenarioSeries } from '../../contexts/ScenarioContext';
import { Activity, Gauge, Leaf, Scale, Factory, Droplets } from 'lucide-react';
import { getPresetScenarios, PresetScenario } from '../../services/config';
import * as api from '../../services/api';

/**
 * Water Stress Index Chart Component
 * Shows water stress index over time with threshold lines
 * Includes historical data (before 2020) and future projections
 */
const WaterStressIndexChart = React.memo(({
  data,
  scenarioResult,
  id
}: {
  data: any;
  scenarioResult: any;
  id: string;
}) => {
  const [historicalData, setHistoricalData] = useState<api.SeriesData | null>(null);
  const [loadingHistorical, setLoadingHistorical] = useState(true);

  // Fetch historical data (before 2020) using baseline scenario
  useEffect(() => {
    const fetchHistorical = async () => {
      try {
        setLoadingHistorical(true);
        // Use baseline scenario for historical data
        const historical = await api.getSeries('yrb_wsi', 'sc_1548', {
          start_step: 0,
          end_step: 20 // Assuming step 20 corresponds to year 2020
        });
        setHistoricalData(historical);
      } catch (error) {
        console.error('Failed to load historical WSI data:', error);
      } finally {
        setLoadingHistorical(false);
      }
    };
    fetchHistorical();
  }, []);

  const plotData = useMemo(() => {
    const traces: any[] = [];

    // Combine historical and future data
    let allTime: number[] = [];
    let allValues: number[] = [];
    let allCILower: number[] | null = null;
    let allCIUpper: number[] | null = null;

    // Add historical data if available
    if (historicalData?.series) {
      const histTime = historicalData.series.time.filter((t: number) => t < 2020);
      const histValues = historicalData.series.value.slice(0, histTime.length);
      allTime = [...histTime];
      allValues = [...histValues];
    }

    // Add future data
    if (data?.series) {
      const series = data.series;
      const futureTime = series.time;
      const futureValues = series.mean || series.value;

      allTime = [...allTime, ...futureTime];
      allValues = [...allValues, ...futureValues];

      // Add confidence intervals for future data if available
      if (scenarioResult && !scenarioResult.isSingleScenario && series.ci_lower && series.ci_upper) {
        allCILower = [...(allCILower || []), ...series.ci_lower];
        allCIUpper = [...(allCIUpper || []), ...series.ci_upper];
      }
    }

    if (allTime.length === 0) return [];

    // Add confidence interval if available (multi-scenario mode, only for future)
    if (allCILower && allCIUpper && data?.series) {
      // Lower bound (invisible)
      traces.push({
        x: data.series.time,
        y: allCILower.slice(allCILower.length - data.series.time.length),
        type: 'scatter',
        mode: 'lines',
        line: { width: 0 },
        showlegend: false,
        hoverinfo: 'skip',
      });

      // Upper bound with fill
      traces.push({
        x: data.series.time,
        y: allCIUpper.slice(allCIUpper.length - data.series.time.length),
        type: 'scatter',
        mode: 'lines',
        fill: 'tonexty',
        fillcolor: 'rgba(99, 102, 241, 0.2)',
        line: { width: 0 },
        showlegend: false,
        hoverinfo: 'skip',
      });
    }

    // Main data line (combined historical + future)
    traces.push({
      x: allTime,
      y: allValues,
      type: 'scatter',
      mode: 'lines',
      line: { color: '#6366f1', width: 3 },
      name: scenarioResult && !scenarioResult.isSingleScenario ? 'Water Stress Index (Mean)' : 'Water Stress Index',
      hovertemplate: 'Year: %{x}<br>Water Stress Index: %{y:.3f}<extra></extra>'
    });

    // Add threshold reference lines (spanning full range)
    const minYear = Math.min(...allTime);
    const maxYear = Math.max(...allTime);

    // Low Stress threshold (<0.4)
    traces.push({
      x: [minYear, maxYear],
      y: [0.4, 0.4],
      type: 'scatter',
      mode: 'lines',
      line: { color: '#10b981', width: 2, dash: 'dash' },
      name: 'Low Stress Threshold (<0.4)',
      hovertemplate: 'Low Stress Threshold: 0.4<br>Water resources abundant<extra></extra>',
      showlegend: false
    });

    // High Stress threshold (>0.6)
    traces.push({
      x: [minYear, maxYear],
      y: [0.6, 0.6],
      type: 'scatter',
      mode: 'lines',
      line: { color: '#ef4444', width: 2, dash: 'dash' },
      name: 'High Stress Threshold (>0.6)',
      hovertemplate: 'High Stress Threshold: 0.6<br>Critical water scarcity risk<extra></extra>',
      showlegend: false
    });

    return traces;
  }, [data, scenarioResult, historicalData]);

  const layout = useMemo(() => {
    // Detect dark mode
    const isDarkMode = document.documentElement.classList.contains('dark');

    // Determine time range
    let minYear = 2020;
    let maxYear = 2100;

    if (historicalData?.series) {
      const histTime = historicalData.series.time.filter((t: number) => t < 2020);
      if (histTime.length > 0) {
        minYear = Math.min(...histTime);
      }
    }

    if (data?.series && data.series.time.length > 0) {
      maxYear = Math.max(...data.series.time);
    }

    // Color scheme based on theme
    const lineColor = isDarkMode ? '#818cf8' : '#6366f1'; // Lighter indigo for dark mode
    const annotationBg = isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)'; // Dark slate for dark mode
    const annotationText = isDarkMode ? '#f1f5f9' : '#1e293b'; // Light text for dark mode
    const annotationBorder = isDarkMode ? '#818cf8' : '#6366f1';

    return {
      plot_bgcolor: isDarkMode ? 'rgba(0, 0, 0, 0)' : 'rgba(255, 255, 255, 0)',
      paper_bgcolor: 'transparent',
      margin: { l: 70, r: 30, t: 40, b: 60 },
      xaxis: {
        title: 'Year',
        titlefont: { size: 14 },
        tickfont: { size: 12 },
        range: [minYear, maxYear],
        dtick: Math.ceil((maxYear - minYear) / 8) // Auto-adjust tick interval
      },
      yaxis: {
        title: 'Water Stress Index',
        titlefont: { size: 14 },
        tickfont: { size: 12 },
        range: [0.2, 1], // Fixed Y-axis range
        dtick: 0.2
      },
      // Add vertical line at 2020 to separate historical and future
      shapes: [{
        type: 'line',
        xref: 'x',
        yref: 'paper',
        x0: 2020,
        y0: 0,
        x1: 2020,
        y1: 1,
        line: {
          color: lineColor, // Dynamic color based on theme
          width: 3,
          dash: 'dash'
        },
        layer: 'above'
      }],
      // Add annotations for historical and future periods (at bottom, where legend was)
      annotations: [
        {
          x: 2020,
          y: 0.02,
          xref: 'x',
          yref: 'paper',
          text: '<b>Historical Period</b>',
          showarrow: false,
          font: {
            size: 14,
            color: annotationText, // Dynamic text color
            family: 'Arial, sans-serif'
          },
          xanchor: 'right',
          xshift: -10,
          bgcolor: annotationBg, // Dynamic background
          bordercolor: annotationBorder, // Dynamic border
          borderwidth: 2,
          borderpad: 6,
          align: 'center'
        },
        {
          x: 2020,
          y: 0.02,
          xref: 'x',
          yref: 'paper',
          text: '<b>Future Projection</b>',
          showarrow: false,
          font: {
            size: 14,
            color: annotationText, // Dynamic text color
            family: 'Arial, sans-serif'
          },
          xanchor: 'left',
          xshift: 10,
          bgcolor: annotationBg, // Dynamic background
          bordercolor: annotationBorder, // Dynamic border
          borderwidth: 2,
          borderpad: 6,
          align: 'center'
        }
      ],
      hovermode: 'x unified',
      showlegend: false, // Disable legend
      autosize: true
    };
  }, [data, historicalData]);

  return (
    <PlotlyChart
      id={id}
      title="Water Stress Index Trends"
      description={scenarioResult && !scenarioResult.isSingleScenario
        ? "Water stress index with confidence intervals across multiple scenarios"
        : "Water stress index over time"
      }
      height="400px"
      data={plotData}
      layout={layout}
    />
  );
});

/**
 * Water Stress Index Page with Global Parameter Integration
 */
export default memo(function WaterQualityPage() {
  const { scenarioResult, updateParameter, applyPresetScenario } = useScenario();
  const [selectedScenario, setSelectedScenario] = useState('pessimistic');
  const [presetScenarios, setPresetScenarios] = useState<PresetScenario[]>([]);

  // Load preset scenarios on mount
  React.useEffect(() => {
    getPresetScenarios('en').then(scenarios => {
      setPresetScenarios(scenarios);
    });
  }, []);

  // Get the first three preset scenarios for the buttons, with baseline in the middle
  const displayScenarios = useMemo(() => {
    const firstThree = presetScenarios.slice(0, 3);
    // Reorder to put baseline in the middle: [optimistic, baseline, pessimistic]
    const baseline = firstThree.find(s => s.id === 'baseline');
    const others = firstThree.filter(s => s.id !== 'baseline');
    return [others[0], baseline, others[1]].filter(Boolean);
  }, [presetScenarios]);

  // Map scenario IDs to icons, colors, and display names
  const scenarioConfig = {
    'baseline': {
      icon: Scale,
      color: 'bg-blue-500',
      displayName: 'Balancing economy and sustainability'
    },
    'optimistic': {
      icon: Leaf,
      color: 'bg-green-500',
      displayName: 'Radical sustainable transformation'
    },
    'pessimistic': {
      icon: Factory,
      color: 'bg-red-500',
      displayName: 'Focusing on economic development'
    }
  };

  // Fetch data using global scenario context
  const { data: wsiData, loading: wsiLoading, error: wsiError } = useScenarioSeries('yrb_wsi');

  // Loading state
  const isLoading = wsiLoading;
  const hasError = wsiError;

  return (
    <div className="bg-card rounded-lg border-2 border-dashed border-border p-6 h-full overflow-hidden">
      <div className="flex items-center gap-6 mb-6">
        <div className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-lg">
          <Activity className="w-8 h-8" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-foreground">Water Stress Index Analysis</h1>
            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
              Page 7
            </span>
            {scenarioResult && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                scenarioResult.isSingleScenario
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
              }`}>
                {scenarioResult.isSingleScenario
                  ? `Scenario: ${scenarioResult.primaryScenario}`
                  : `Multiple Scenarios (${scenarioResult.count || '?'})`
                }
              </span>
            )}
            {isLoading && (
              <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm font-medium animate-pulse">
                Loading...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Global Scenario Selection */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-4">Global Scenario Selection</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayScenarios.map((scenario) => {
            if (!scenario) return null;
            const config = scenarioConfig[scenario.id as keyof typeof scenarioConfig];
            const Icon = config?.icon || Scale;
            const colorClass = config?.color || 'bg-blue-500';
            return (
              <Tooltip key={scenario.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      setSelectedScenario(scenario.id);
                      if (applyPresetScenario) {
                        applyPresetScenario(scenario.parameters);
                      }
                    }}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedScenario === scenario.id
                        ? `${colorClass} border-transparent text-white`
                        : 'bg-card border-border hover:border-muted-foreground text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        selectedScenario === scenario.id
                          ? 'bg-white/20 text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="font-medium">{config?.displayName || scenario.name}</div>
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-md">
                  <div className="space-y-2">
                    <div className="font-medium text-base">{scenario.name}</div>
                    <div className="text-sm opacity-90">{scenario.description}</div>
                    {scenario.story && (
                      <div className="text-xs opacity-75 italic">{scenario.story}</div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Left: Water Stress Index Chart */}
        <div className="min-h-[400px]">
          {wsiData ? (
            <WaterStressIndexChart
              data={wsiData}
              scenarioResult={scenarioResult}
              id="water-stress-index-chart"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-muted/20 rounded">
              <p className="text-muted-foreground">Loading water stress index data...</p>
            </div>
          )}
        </div>

        {/* Right: Information Panel */}
        <div className="space-y-4">
          <div className="text-foreground text-base leading-relaxed">
            <p>
              <span className="font-medium">Water Stress Index (WSI) is a key indicator for water resource sustainability.</span>
              It measures the ratio of water demand to available water supply, providing insights into
              water scarcity risks and sustainability challenges across the Yellow River Basin.
            </p>
            {isLoading && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-blue-700 dark:text-blue-300">
                🌐 Loading global scenario data...
              </div>
            )}
          </div>

          {/* WSI Interpretation Guide */}
          <div className="bg-muted/50 dark:bg-muted/20 border border-border rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-3 text-base">WSI Interpretation Guide</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm text-foreground">
                  <span className="font-medium">Low Stress (&lt;0.4)</span>: Water resources abundant
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="text-sm text-foreground">
                  <span className="font-medium">Moderate Stress (0.4-0.6)</span>: Monitoring recommended
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm text-foreground">
                  <span className="font-medium">High Stress (&gt;0.6)</span>: Critical water scarcity risk
                </span>
              </div>
            </div>
          </div>

          {/* Current Scenario Info */}
          {scenarioResult && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue/to-20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <Gauge className="w-4 h-4 text-white" />
                </div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-200">
                  Scenario Analysis
                </h4>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    Analysis Mode:
                  </span>
                  <span className="font-bold text-blue-900 dark:text-blue-100">
                    {scenarioResult.isSingleScenario ? 'Single Scenario' : 'Multi-Scenario'}
                  </span>
                </div>

                {scenarioResult.isSingleScenario && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-700 dark:text-blue-300">
                      Scenario ID:
                    </span>
                    <span className="font-bold text-blue-900 dark:text-blue-100">
                      {scenarioResult.primaryScenario}
                    </span>
                  </div>
                )}

                {!scenarioResult.isSingleScenario && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-700 dark:text-blue-300">
                      Scenarios Count:
                    </span>
                    <span className="font-bold text-blue-900 dark:text-blue-100">
                      {scenarioResult.count || '?'}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-blue-200 dark:border-blue-700">
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {scenarioResult.isSingleScenario
                      ? 'Showing precise values for selected scenario'
                      : 'Showing mean values with confidence intervals'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* WSI Threshold Monitors */}
      <div className="mt-12">
        {wsiData?.series ? (
          <div className="grid grid-cols-3 gap-4">
            {([0.8, 0.6, 0.4] as number[]).map((threshold, idx) => {
              const series = wsiData.series;
              const values = scenarioResult?.isSingleScenario ? series.value : series.mean;
              const time = series.time;
              let firstYear: number | null = null;
              let continuousYears = 0;
              if (Array.isArray(values) && Array.isArray(time) && values.length === time.length) {
                // Only consider data from 2020 onwards
                let startIndex = -1;
                for (let i = 0; i < values.length; i++) {
                  const year = time[i];
                  if (year >= 2020) {
                    const v = values[i] as number;
                    if (typeof v === 'number' && v < threshold) {
                      firstYear = year;
                      startIndex = i;
                      break;
                    }
                  }
                }
                if (startIndex >= 0) {
                  // Count continuous integer years crossed
                  let yearCount = 0;
                  let lastYear = Math.floor(time[startIndex]);

                  for (let j = startIndex; j < values.length; j++) {
                    const v = values[j] as number;
                    const currentYear = Math.floor(time[j]);

                    if (typeof v === 'number' && v < threshold) {
                      // If we've moved to a new year, increment count
                      if (currentYear > lastYear) {
                        yearCount++;
                        lastYear = currentYear;
                      }
                    } else {
                      // Threshold exceeded, stop counting
                      break;
                    }
                  }

                  // Add 1 for the initial year
                  continuousYears = yearCount + 1;
                }
              }

              const palette = idx === 0
                ? { bg: 'from-rose-50 to-red-50', darkBg: 'from-rose-900/20 to-red-900/20', border: 'border-red-200 dark:border-red-800', circle: 'bg-red-500', text: 'text-red-900 dark:text-red-200' }
                : idx === 1
                ? { bg: 'from-amber-50 to-yellow-50', darkBg: 'from-amber-900/20 to-yellow-900/20', border: 'border-amber-200 dark:border-amber-800', circle: 'bg-amber-500', text: 'text-amber-900 dark:text-amber-200' }
                : { bg: 'from-emerald-50 to-green-50', darkBg: 'from-emerald-900/20 to-green-900/20', border: 'border-emerald-200 dark:border-emerald-800', circle: 'bg-emerald-500', text: 'text-emerald-900 dark:text-emerald-200' };

              return (
                <div key={threshold} className={`bg-gradient-to-br ${palette.bg} dark:${palette.darkBg} border ${palette.border} rounded-lg p-4`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-full ${palette.circle} flex items-center justify-center`}>
                      <Droplets className="w-4 h-4 text-white" />
                    </div>
                    <h4 className={`font-semibold ${palette.text}`}>WSI &lt; {threshold}</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${palette.text} opacity-80`}>First Year</span>
                      <span className={`font-bold ${palette.text}`}>
                        {firstYear ? Math.round(firstYear) : (threshold === 0.4 ? 'Never' : '—')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${palette.text} opacity-80`}>Continuous Years</span>
                      <span className={`font-bold ${palette.text}`}>
                        {continuousYears > 0 ? continuousYears : (threshold === 0.4 ? 'Never' : '—')}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">Based on {scenarioResult?.isSingleScenario ? 'single scenario' : 'multi-scenario mean'} (2020+)</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-[120px] bg-muted/20 rounded">
            <p className="text-muted-foreground">Loading WSI threshold monitors...</p>
          </div>
        )}
      </div>
    </div>
  );
});
