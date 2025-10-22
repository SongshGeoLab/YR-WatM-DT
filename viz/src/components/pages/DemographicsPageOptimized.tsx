import React, { useState, useEffect, useMemo } from 'react';
import { PlotlyChart } from '../charts/PlotlyChart';
import { ParameterSlider } from '../ui/parameter-slider';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { Users, Droplet, Factory } from 'lucide-react';
import { useScenario, useScenarioSeries } from '../../contexts/ScenarioContext';
import ExplanationPopover from '../ui/ExplanationPopover';

/**
 * Combined Population and Domestic Water Demand Chart with Dual Y-axes
 */
const PopulationDomesticChart = React.memo(({
  populationData,
  domesticData,
  scenarioResult,
  id
}: {
  populationData: any,
  domesticData: any,
  scenarioResult: any,
  id: string
}) => {
  const plotData = useMemo(() => {
    if (!populationData?.series || !domesticData?.series) return [];

    const populationSeries = populationData.series;
    const domesticSeries = domesticData.series;
    const traces: any[] = [];

    // Add confidence intervals for population if available (multi-scenario mode)
    if (scenarioResult && !scenarioResult.isSingleScenario && populationSeries.ci_lower && populationSeries.ci_upper) {
      // Population lower bound (invisible)
      traces.push({
        x: populationSeries.time,
        y: populationSeries.ci_lower,
        type: 'scatter',
        mode: 'lines',
        line: { width: 0 },
        showlegend: false,
        hoverinfo: 'skip',
        yaxis: 'y'
      });

      // Population upper bound with fill
      traces.push({
        x: populationSeries.time,
        y: populationSeries.ci_upper,
        type: 'scatter',
        mode: 'lines',
        fill: 'tonexty',
        fillcolor: 'rgba(46, 134, 171, 0.2)',
        line: { width: 0 },
        showlegend: false,
        hoverinfo: 'skip',
        yaxis: 'y'
      });
    }

    // Population main line
    traces.push({
      x: populationSeries.time,
      y: populationSeries.mean || populationSeries.value,
      type: 'scatter',
      mode: 'lines',
      line: { color: '#2E86AB', width: 3 },
      name: scenarioResult && !scenarioResult.isSingleScenario ? 'Population (Mean)' : 'Population',
      hovertemplate: 'Year: %{x}<br>Population: %{y:.1f}M<extra></extra>',
      yaxis: 'y'
    });

    // Add confidence intervals for domestic water if available (multi-scenario mode)
    if (scenarioResult && !scenarioResult.isSingleScenario && domesticSeries.ci_lower && domesticSeries.ci_upper) {
      // Domestic lower bound (invisible)
      traces.push({
        x: domesticSeries.time,
        y: domesticSeries.ci_lower,
        type: 'scatter',
        mode: 'lines',
        line: { width: 0 },
        showlegend: false,
        hoverinfo: 'skip',
        yaxis: 'y2'
      });

      // Domestic upper bound with fill
      traces.push({
        x: domesticSeries.time,
        y: domesticSeries.ci_upper,
        type: 'scatter',
        mode: 'lines',
        fill: 'tonexty',
        fillcolor: 'rgba(162, 59, 114, 0.2)',
        line: { width: 0 },
        showlegend: false,
        hoverinfo: 'skip',
        yaxis: 'y2'
      });
    }

    // Domestic water main line
    traces.push({
      x: domesticSeries.time,
      y: domesticSeries.mean || domesticSeries.value,
      type: 'scatter',
      mode: 'lines',
      line: { color: '#A23B72', width: 3 },
      name: scenarioResult && !scenarioResult.isSingleScenario ? 'Domestic Water (Mean)' : 'Domestic Water',
      hovertemplate: 'Year: %{x}<br>Domestic Water: %{y:.2f}B m³<extra></extra>',
      yaxis: 'y2'
    });

    return traces;
  }, [populationData, domesticData, scenarioResult]);

  const layout = useMemo(() => ({
    margin: { l: 70, r: 70, t: 40, b: 60 },
    xaxis: {
      title: 'Year',
      titlefont: { size: 14 },
      tickfont: { size: 12 },
      range: [2020, 2100],
      dtick: 20
    },
    yaxis: {
      title: 'Population (Millions)',
      titlefont: { size: 14, color: '#2E86AB' },
      tickfont: { size: 12, color: '#2E86AB' },
      side: 'left'
    },
    yaxis2: {
      title: 'Domestic Water Demand (Billion m³)',
      titlefont: { size: 14, color: '#A23B72' },
      tickfont: { size: 12, color: '#A23B72' },
      overlaying: 'y',
      side: 'right'
    },
    hovermode: 'x unified',
    showlegend: true,
    legend: {
      orientation: 'h',
      yanchor: 'bottom',
      y: 1.02,
      xanchor: 'right',
      x: 1
    },
    autosize: true
  }), []);

  return (
    <PlotlyChart
      id={id}
      title="Population & Domestic Water Demand"
      description={scenarioResult && !scenarioResult.isSingleScenario
        ? "Population and domestic water demand with confidence intervals across multiple scenarios"
        : "Population and domestic water demand over time"
      }
      height="350px"
      data={plotData}
      layout={layout}
    />
  );
});

/**
 * Chart component with confidence intervals support for Demographics data
 */
const DemographicsChartWithCI = React.memo(({
  data,
  scenarioResult,
  title,
  yAxisTitle,
  color,
  id
}: {
  data: any,
  scenarioResult: any,
  title: string,
  yAxisTitle: string,
  color: string,
  id: string
}) => {
  const plotData = useMemo(() => {
    if (!data || !data.series) return [];

    const series = data.series;
    const traces: any[] = [];

    // Add confidence interval if available (multi-scenario mode)
    if (scenarioResult && !scenarioResult.isSingleScenario && series.ci_lower && series.ci_upper) {
      // Lower bound (invisible)
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
        fillcolor: `${color}20`, // Add transparency
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
      line: { color, width: 3 },
      name: scenarioResult && !scenarioResult.isSingleScenario ? 'Mean' : title,
      hovertemplate: `Year: %{x}<br>${title}: %{y:.2f}<extra></extra>`
    });

    return traces;
  }, [data, scenarioResult, title, color]);

  const layout = useMemo(() => ({
    margin: { l: 70, r: 30, t: 40, b: 60 },
    xaxis: {
      title: 'Year',
      titlefont: { size: 14 },
      tickfont: { size: 12 },
      range: [2020, 2100],
      dtick: 20
    },
    yaxis: {
      title: yAxisTitle,
      titlefont: { size: 14 },
      tickfont: { size: 12 }
    },
    hovermode: 'x unified',
    showlegend: false,
    autosize: true
  }), [yAxisTitle]);

  return (
    <PlotlyChart
      id={id}
      title={title}
      description={scenarioResult && !scenarioResult.isSingleScenario
        ? `${title} with confidence intervals across multiple scenarios`
        : `${title} over time`
      }
      height="350px"
      data={plotData}
      layout={layout}
    />
  );
});

/**
 * Optimized Demographics Page with Full Global Parameter Integration
 *
 * Features:
 * - Complete integration with global scenario context
 * - Confidence intervals for multi-scenario mode
 * - Diet pattern selection integrated with global parameters
 * - Real-time parameter synchronization
 * - Performance optimized with React.memo
 */
export default function DemographicsPageOptimized() {
  const { parameters, updateParameter, scenarioResult } = useScenario();

  // Get current parameter values
  const fertility = parameters.fertility;
  const dietPattern = parameters.dietPattern;

  // Fetch data using global scenario context
  const { data: populationData, loading: populationLoading, error: populationError } = useScenarioSeries('total_population');
  const { data: domesticData, loading: domesticLoading, error: domesticError } = useScenarioSeries('domestic_water_demand_province_sum');
  const { data: oaData, loading: oaLoading, error: oaError } = useScenarioSeries('oa_water_demand_province_sum');

  // Diet pattern configurations
  const dietPatterns = useMemo(() => ({
    1: {
      name: 'Low Meat',
      title: 'Traditional Diet',
      description: 'Traditional diet with low meat consumption - plant-based with minimal animal protein and lowest virtual water footprint',
      color: 'bg-green-500',
      borderColor: 'border-green-500',
      hoverColor: 'hover:bg-green-50 dark:hover:bg-green-900/20',
      textColor: 'text-green-700 dark:text-green-300',
      level: 'Low meat, low water',
      waterFootprint: 'Low'
    },
    2: {
      name: 'Balanced',
      title: 'Moderate Diet',
      description: 'Moderate diet with balanced nutrition - mixed sources with medium animal protein and moderate virtual water footprint',
      color: 'bg-amber-500',
      borderColor: 'border-amber-500',
      hoverColor: 'hover:bg-amber-50 dark:hover:bg-amber-900/20',
      textColor: 'text-amber-700 dark:text-amber-300',
      level: 'Medium meat, medium water',
      waterFootprint: 'Medium'
    },
    3: {
      name: 'High Protein',
      title: 'High Animal Protein',
      description: 'High animal protein diet - meat-intensive with high consumption and highest virtual water footprint',
      color: 'bg-red-500',
      borderColor: 'border-red-500',
      hoverColor: 'hover:bg-red-50 dark:hover:bg-red-900/20',
      textColor: 'text-red-700 dark:text-red-300',
      level: 'High meat, high water',
      waterFootprint: 'High'
    }
  }), []);

  // Loading state
  const isLoading = populationLoading || domesticLoading || oaLoading;
  const hasError = populationError || domesticError || oaError;

  // Calculate statistics for display
  const statistics = useMemo(() => {
    if (!populationData?.series || !domesticData?.series || !oaData?.series) return null;

    const getStats = (series: any) => {
      const values = scenarioResult?.isSingleScenario ? series.value : series.mean;
      if (!values || values.length === 0) return null;

      const min = Math.min(...values);
      const max = Math.max(...values);
      const avg = values.reduce((sum: number, val: number) => sum + val, 0) / values.length;

      return { min, max, avg };
    };

    return {
      population: getStats(populationData.series),
      domestic: getStats(domesticData.series),
      oa: getStats(oaData.series)
    };
  }, [populationData, domesticData, oaData, scenarioResult]);

  // Peak helpers
  const computePeakInfo = (seriesContainer: any) => {
    if (!seriesContainer?.series) return null;
    const series = seriesContainer.series;
    const values = scenarioResult?.isSingleScenario ? series.value : series.mean;
    const time = series.time;
    if (!values || !time || values.length === 0 || time.length === 0 || values.length !== time.length) return null;
    let maxValue = values[0];
    let peakYear = time[0];
    for (let i = 1; i < values.length; i++) {
      if (values[i] > maxValue) {
        maxValue = values[i];
        peakYear = time[i];
      }
    }
    return {
      peakYear,
      peakValue: maxValue,
      method: scenarioResult?.isSingleScenario ? 'single scenario' : 'multi-scenario mean'
    };
  };

  const populationPeakInfo = useMemo(() => computePeakInfo(populationData), [populationData, scenarioResult]);
  const domesticPeakInfo = useMemo(() => computePeakInfo(domesticData), [domesticData, scenarioResult]);
  const oaPeakInfo = useMemo(() => computePeakInfo(oaData), [oaData, scenarioResult]);

  return (
    <div className="bg-card rounded-lg border-2 border-dashed border-border p-6 h-full overflow-hidden">
      <div className="flex items-center gap-6 mb-6">
        <div className="w-16 h-16 rounded-full bg-purple-500 flex items-center justify-center text-white shadow-lg">
          <Users className="w-8 h-8" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-foreground">Demography and Domestic Water Usage</h1>
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
              Page 3
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? 'Loading data...' :
             hasError ? 'Error loading data' :
             scenarioResult?.isSingleScenario ?
               `Scenario: ${scenarioResult.primaryScenario}` :
               `Multiple Scenarios (${scenarioResult?.count || '?'})`
            } | Population Trends & Dietary Water Footprint
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left side - Controls only */}
        <div className="space-y-4">
          <div className="text-foreground text-base leading-relaxed">
            <p>
              <span className="font-medium">Population demographics significantly influence water demand patterns.</span>
              Changes in fertility rates, urbanization, and dietary preferences directly impact domestic water
              consumption across the Yellow River Basin.
            </p>
            {isLoading && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-blue-700 dark:text-blue-300">
                🌐 Loading global scenario data...
              </div>
            )}
          </div>

          {/* Fertility Rate Parameter */}
          <div className="space-y-3">
            {fertility !== null ? (
          <ParameterSlider
                label="Fertility Rate (Global)"
            min={1.6}
            max={1.8}
            step={0.05}
            defaultValue={fertility}
            unit=""
                description="Total fertility rate (children per woman) - affects all pages"
                onChange={(v) => updateParameter('fertility', v)}
              />
            ) : (
              <div className="p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Fertility Rate: <span className="font-medium text-foreground">Any value (Multiple scenarios)</span>
                </p>
                <button
                  onClick={() => updateParameter('fertility', 1.7)}
                  className="mt-2 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Set to 1.7
                </button>
              </div>
            )}
          </div>

          {/* Diet Pattern Selection - Integrated with Global Parameters */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="font-medium text-foreground">Diet Pattern (Global)</label>
                <ExplanationPopover explanationKey="diet_water_footprint" lang="en" iconSize={14} />
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-muted-foreground cursor-help">ⓘ</span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-sm">
                  <p className="text-base">
                    Dietary patterns represent different levels of meat consumption and their
                    associated virtual water footprints. This affects water demand across all pages.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {Object.entries(dietPatterns).map(([key, pattern]) => {
                const patternValue = parseInt(key);
                const isSelected = dietPattern === patternValue;
                const dropletCount = patternValue === 1 ? 2 : patternValue === 2 ? 3 : 5;
                const dropletColor = patternValue === 1 ? 'fill-green-500 text-green-500' :
                                    patternValue === 2 ? 'fill-amber-500 text-amber-500' :
                                    'fill-red-500 text-red-500';

                return (
                  <Tooltip key={key}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => updateParameter('dietPattern', patternValue)}
                        className={`p-3 rounded-lg border-2 transition-all text-center ${
                          isSelected
                            ? `${pattern.borderColor} bg-opacity-10 ${pattern.color.replace('bg-', 'bg-opacity-10 bg-')}`
                            : `border-border ${pattern.hoverColor}`
                        }`}
                      >
                        <div className="flex justify-center gap-0.5 mb-2">
                          {Array.from({ length: dropletCount }).map((_, i) => (
                            <Droplet key={i} className={`w-3 h-3 ${dropletColor}`} />
                          ))}
                        </div>
                        <div className={`font-medium text-sm ${
                          isSelected ? pattern.textColor : 'text-foreground'
                        }`}>
                          {pattern.name}
                        </div>
                        <div className={`text-xs ${
                          isSelected ? pattern.textColor : 'text-muted-foreground'
                        }`}>
                          {pattern.title}
                        </div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="space-y-2">
                        <div className="font-medium">{pattern.name}: {pattern.title}</div>
                        <div className="text-base opacity-90">{pattern.description}</div>
                        <div className="text-sm mt-2 pt-2 border-t border-white/20">
                          <strong>Water footprint:</strong> {pattern.waterFootprint}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>

            <div className="text-sm text-muted-foreground">
              Selected: <span className="font-medium text-foreground">
                {dietPattern ? dietPatterns[dietPattern].title : 'Any (Multiple scenarios)'} - {
                  dietPattern ? dietPatterns[dietPattern].level : 'All patterns'
                }
              </span>
            </div>
          </div>

          {/* Statistics Panel */}
          {statistics && (
            <div className="bg-muted/50 dark:bg-muted/20 border border-border rounded-lg p-4">
              <h4 className="font-medium text-foreground mb-3 text-base">Current Scenario Statistics</h4>
              <div className="space-y-2">
                {statistics.population && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Population (avg):</span>
                    <span className="font-medium text-foreground">{statistics.population.avg.toFixed(1)}M</span>
                  </div>
                )}
                {statistics.domestic && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Domestic Water (avg):</span>
                    <span className="font-medium text-foreground">{statistics.domestic.avg.toFixed(2)}B m³</span>
                  </div>
                )}
                {statistics.oa && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">OA Water (avg):</span>
                    <span className="font-medium text-foreground">{statistics.oa.avg.toFixed(2)}B m³</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Virtual Water Information Panel */}
          <div className="bg-muted/50 dark:bg-muted/20 border border-border rounded-lg p-3">
            <h4 className="font-medium text-foreground mb-3 text-base">Virtual Water by Food Type</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-5 bg-green-500 rounded"></div>
                  <span className="text-sm text-foreground">Vegetables</span>
                </div>
                <div className="flex items-center gap-1">
                  <Droplet className="w-3 h-3 fill-green-500 text-green-500" />
                  <span className="text-sm font-medium text-foreground">322 L/kg</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-32 h-5 bg-blue-400 rounded"></div>
                  <span className="text-sm text-foreground">White Meat</span>
                </div>
                <div className="flex items-center gap-1">
                  <Droplet className="w-3 h-3 fill-blue-400 text-blue-400" />
                  <Droplet className="w-3 h-3 fill-blue-400 text-blue-400" />
                  <Droplet className="w-3 h-3 fill-blue-400 text-blue-400" />
                  <span className="text-sm font-medium text-foreground">4,325 L/kg</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-48 h-5 bg-red-500 rounded"></div>
                  <span className="text-sm text-foreground">Red Meat</span>
                </div>
                <div className="flex items-center gap-1">
                  <Droplet className="w-3 h-3 fill-red-500 text-red-500" />
                  <Droplet className="w-3 h-3 fill-red-500 text-red-500" />
                  <Droplet className="w-3 h-3 fill-red-500 text-red-500" />
                  <Droplet className="w-3 h-3 fill-red-500 text-red-500" />
                  <Droplet className="w-3 h-3 fill-red-500 text-red-500" />
                  <span className="text-sm font-medium text-foreground">15,415 L/kg</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Virtual water includes all water used in production process
              </p>
            </div>
          </div>

          {/* Peak Year Information - trio */}
          {(populationPeakInfo || domesticPeakInfo || oaPeakInfo) && (
            <div className="grid grid-cols-3 gap-3">
              {/* Population peak */}
              {populationPeakInfo && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-200">Population Peak</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-700 dark:text-blue-300">Peak Year:</span>
                      <span className="font-bold text-blue-900 dark:text-blue-100">{Math.round(populationPeakInfo.peakYear)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-700 dark:text-blue-300">Peak Value:</span>
                      <span className="font-bold text-blue-900 dark:text-blue-100">{populationPeakInfo.peakValue.toFixed(1)}M</span>
                    </div>
                    <div className="pt-2 border-t border-blue-200 dark:border-blue-700">
                      <p className="text-xs text-blue-600 dark:text-blue-400">Based on {populationPeakInfo.method}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Domestic water peak */}
              {domesticPeakInfo && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                      <Droplet className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="font-semibold text-green-900 dark:text-green-200">Domestic Water Peak</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-700 dark:text-green-300">Peak Year:</span>
                      <span className="font-bold text-green-900 dark:text-green-100">{Math.round(domesticPeakInfo.peakYear)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-700 dark:text-green-300">Peak Value:</span>
                      <span className="font-bold text-green-900 dark:text-green-100">{domesticPeakInfo.peakValue.toFixed(2)}B m³</span>
                    </div>
                    <div className="pt-2 border-t border-green-200 dark:border-green-700">
                      <p className="text-xs text-green-600 dark:text-green-400">Based on {domesticPeakInfo.method}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* OA water peak */}
              {oaPeakInfo && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
                      <Factory className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="font-semibold text-amber-900 dark:text-amber-200">Other Activities Peak</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-amber-700 dark:text-amber-300">Peak Year:</span>
                      <span className="font-bold text-amber-900 dark:text-amber-100">{Math.round(oaPeakInfo.peakYear)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-amber-700 dark:text-amber-300">Peak Value:</span>
                      <span className="font-bold text-amber-900 dark:text-amber-100">{oaPeakInfo.peakValue.toFixed(2)}B m³</span>
                    </div>
                    <div className="pt-2 border-t border-amber-200 dark:border-amber-700">
                      <p className="text-xs text-amber-600 dark:text-amber-400">Based on {oaPeakInfo.method}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right side - Combined chart and OA chart */}
        <div className="flex flex-col gap-6">
          {/* Combined Population & Domestic Water Chart */}
          <div className="h-[350px]">
            {populationData && domesticData ? (
              <PopulationDomesticChart
                populationData={populationData}
                domesticData={domesticData}
                scenarioResult={scenarioResult}
                id="population-domestic-combined"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-muted/20 rounded">
                <p className="text-muted-foreground">Loading population and domestic water data...</p>
              </div>
            )}
          </div>

          {/* OA Water Chart */}
          <div className="h-[300px]">
            {oaData ? (
              <DemographicsChartWithCI
                data={oaData}
                scenarioResult={scenarioResult}
                title="Other Activities Water Demand"
                yAxisTitle="Water Demand (Billion m³)"
                color="#2CA02C"
                id="oa-global"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-muted/20 rounded">
                <p className="text-muted-foreground">Loading OA water data...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
