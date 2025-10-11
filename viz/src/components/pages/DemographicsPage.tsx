import React, { useState, useEffect, useMemo } from 'react';
import { PlotlyChart } from '../charts/PlotlyChart';
import { ParameterSlider } from '../ui/parameter-slider';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { Users, Droplet } from 'lucide-react';
import { useDemographicsSeries } from '../../hooks/useDemographicsSeries';
import { useScenario, useScenarioSeries } from '../../contexts/ScenarioContext';

// Data type definitions
interface SeriesData {
  x: number[];
  y: number[];
}

// Chart component with confidence intervals support
const PopulationChartWithCI = React.memo(({ data, scenarioResult }: { data: any, scenarioResult: any }) => {
  const plotData = useMemo(() => {
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
        fillcolor: 'rgba(46, 134, 171, 0.2)',
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
      line: { color: '#2E86AB', width: 3 },
      name: scenarioResult && !scenarioResult.isSingleScenario ? 'Mean' : 'Population',
    });

    return traces;
  }, [data, scenarioResult]);

  return (
    <PlotlyChart
      id="population-with-ci"
      title="Total Population"
      description={scenarioResult && !scenarioResult.isSingleScenario
        ? "Population change with confidence intervals across multiple scenarios"
        : "Population change over time"
      }
      height="320px"
      data={plotData}
      layout={{
        margin: { l: 50, r: 20, t: 20, b: 40 },
        xaxis: { title: 'Year' },
        yaxis: { title: 'People (Millions)' }
      }}
    />
  );
});

const DomesticChartWithCI = React.memo(({ data, scenarioResult }: { data: any, scenarioResult: any }) => {
  const plotData = useMemo(() => {
    if (!data || !data.series) return [];

    const series = data.series;
    const traces: any[] = [];

    // Add confidence interval if available
    if (scenarioResult && !scenarioResult.isSingleScenario && series.ci_lower && series.ci_upper) {
      traces.push({
        x: series.time,
        y: series.ci_lower,
        type: 'scatter',
        mode: 'lines',
        line: { width: 0 },
        showlegend: false,
        hoverinfo: 'skip',
      });

      traces.push({
        x: series.time,
        y: series.ci_upper,
        type: 'scatter',
        mode: 'lines',
        fill: 'tonexty',
        fillcolor: 'rgba(162, 59, 114, 0.2)',
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
      line: { color: '#A23B72', width: 3 },
      name: scenarioResult && !scenarioResult.isSingleScenario ? 'Mean' : 'Domestic Water',
    });

    return traces;
  }, [data, scenarioResult]);

  return (
    <PlotlyChart
      id="domestic-with-ci"
      title="Domestic Water Demand"
      description={scenarioResult && !scenarioResult.isSingleScenario
        ? "Domestic water demand with confidence intervals across multiple scenarios"
        : "Domestic water demand over time"
      }
      height="320px"
      data={plotData}
      layout={{
        margin: { l: 50, r: 20, t: 20, b: 40 },
        xaxis: { title: 'Year' },
        yaxis: { title: 'Water Demand (Billion m³)' }
      }}
    />
  );
});

const OAChartWithCI = React.memo(({ data, scenarioResult }: { data: any, scenarioResult: any }) => {
  const plotData = useMemo(() => {
    if (!data || !data.series) return [];

    const series = data.series;
    const traces: any[] = [];

    // Add confidence interval if available
    if (scenarioResult && !scenarioResult.isSingleScenario && series.ci_lower && series.ci_upper) {
      traces.push({
        x: series.time,
        y: series.ci_lower,
        type: 'scatter',
        mode: 'lines',
        line: { width: 0 },
        showlegend: false,
        hoverinfo: 'skip',
      });

      traces.push({
        x: series.time,
        y: series.ci_upper,
        type: 'scatter',
        mode: 'lines',
        fill: 'tonexty',
        fillcolor: 'rgba(44, 160, 44, 0.2)',
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
      line: { color: '#2CA02C', width: 3 },
      name: scenarioResult && !scenarioResult.isSingleScenario ? 'Mean' : 'OA Water',
    });

    return traces;
  }, [data, scenarioResult]);

  return (
    <PlotlyChart
      id="oa-with-ci"
      title="Other Activities Water Demand"
      description={scenarioResult && !scenarioResult.isSingleScenario
        ? "Other activities water demand with confidence intervals across multiple scenarios"
        : "Other activities water demand over time"
      }
      height="320px"
      data={plotData}
      layout={{
        margin: { l: 50, r: 20, t: 20, b: 40 },
        xaxis: { title: 'Year' },
        yaxis: { title: 'Water Demand (Billion m³)' }
      }}
    />
  );
});

// Optimized chart components with React.memo
const DemographicsPopulationChart = React.memo(({ data }: { data: SeriesData }) => {
  const plotData = useMemo(() => {
    return data.x.length ? [{
      x: data.x,
      y: data.y,
      type: 'scatter' as const,
      mode: 'lines' as const,
      line: { color: '#2E86AB', width: 3 }
    }] : [];
  }, [data]);

  return (
    <PlotlyChart
      id="total-population-optimized"
      title="Total Population"
      description="Population change over time across different scenarios"
      height="320px"
      data={plotData}
      layout={{
        margin: { l: 50, r: 20, t: 20, b: 40 },
        xaxis: { title: 'Year' },
        yaxis: { title: 'People (Millions)' }
      }}
    />
  );
});

const DemographicsDomesticChart = React.memo(({ data }: { data: SeriesData }) => {
  const plotData = useMemo(() => {
    return data.x.length ? [{
      x: data.x,
      y: data.y,
      type: 'scatter' as const,
      mode: 'lines' as const,
      line: { color: '#A23B72', width: 3 }
    }] : [];
  }, [data]);

  return (
    <PlotlyChart
      id="domestic-water-demand-optimized"
      title="Domestic Water Demand"
      description="Household water consumption patterns across different scenarios"
      height="350px"
      data={plotData}
      layout={{
        margin: { l: 50, r: 20, t: 20, b: 40 },
        xaxis: { title: 'Year' },
        yaxis: { title: 'Volume (Billions)' }
      }}
    />
  );
});

const DemographicsOAChart = React.memo(({ data }: { data: SeriesData }) => {
  const plotData = useMemo(() => {
    return data.x.length ? [{
      x: data.x,
      y: data.y,
      type: 'scatter' as const,
      mode: 'lines' as const,
      line: { color: '#F18F01', width: 3 }
    }] : [];
  }, [data]);

  return (
    <PlotlyChart
      id="oa-water-demand-optimized"
      title="OA Water Demand"
      description="Other activities water demand including services and public usage"
      height="350px"
      data={plotData}
      layout={{
        margin: { l: 50, r: 20, t: 20, b: 40 },
        xaxis: { title: 'Year' },
        yaxis: { title: 'Volume (Billions)' }
      }}
    />
  );
});

/**
 * Optimized Demographics Page Component
 *
 * Features:
 * - Binary search optimization for data sampling
 * - React.memo for chart components
 * - Single batch data fetching
 * - Debounced parameter updates
 * - Detailed performance logging
 */
export default function DemographicsPage() {
  const { parameters, updateParameter, scenarioResult } = useScenario();
  const [selectedDietPattern, setSelectedDietPattern] = useState('pattern2');
  const fertility = parameters.fertility || 1.7;
  const [debouncedFertility, setDebouncedFertility] = useState(fertility);
  const dietMap: Record<string, number> = { pattern1: 1, pattern2: 2, pattern3: 3 };

  // Debounce fertility changes to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFertility(fertility);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [fertility]);

  // Use global scenario series for data with confidence intervals
  const { data: populationData, loading: populationLoading } = useScenarioSeries('total_population', { start_step: 624, end_step: 1000 });
  const { data: domesticData, loading: domesticLoading } = useScenarioSeries('domestic_water_demand_province_sum', { start_step: 624, end_step: 1000 });
  const { data: oaData, loading: oaLoading } = useScenarioSeries('oa_water_demand_province_sum', { start_step: 624, end_step: 1000 });

  // Fallback to optimized hook if global data not available
  const demographicsData = useDemographicsSeries(debouncedFertility, dietMap[selectedDietPattern]);

  // Diet pattern configurations
  const dietPatterns = useMemo(() => ({
    pattern1: {
      name: 'Pattern 1',
      title: 'Sustainable',
      description: 'Plant-based diet with minimal meat consumption and lowest virtual water footprint',
      color: 'bg-green-500',
      borderColor: 'border-green-500',
      hoverColor: 'hover:bg-green-50 dark:hover:bg-green-900/20',
      textColor: 'text-green-700 dark:text-green-300',
      level: 'Low meat, low water'
    },
    pattern2: {
      name: 'Pattern 2',
      title: 'Moderate',
      description: 'Balanced diet with moderate meat consumption and medium virtual water footprint',
      color: 'bg-amber-500',
      borderColor: 'border-amber-500',
      hoverColor: 'hover:bg-amber-50 dark:hover:bg-amber-900/20',
      textColor: 'text-amber-700 dark:text-amber-300',
      level: 'Medium meat, medium water'
    },
    pattern3: {
      name: 'Pattern 3',
      title: 'Unsustainable',
      description: 'Meat-intensive diet with high consumption and highest virtual water footprint',
      color: 'bg-red-500',
      borderColor: 'border-red-500',
      hoverColor: 'hover:bg-red-50 dark:hover:bg-red-900/20',
      textColor: 'text-red-700 dark:text-red-300',
      level: 'High meat, high water'
    }
  }), []);

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
              Page 3 - Optimized ⚡
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {demographicsData.loading ?
              'Loading optimized data...' :
              demographicsData.error ?
                `Error: ${demographicsData.error}` :
                'Population Trends & Dietary Water Footprint'
            }
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100%-4rem)]">
        {/* Left side - Controls and small chart */}
        <div className="space-y-4">
          <div className="text-foreground text-base leading-relaxed">
            <p>
              <span className="font-medium">Population demographics significantly influence water demand patterns.</span>
              Changes in fertility rates, urbanization, and dietary preferences directly impact domestic water
              consumption across the Yellow River Basin.
            </p>
            {demographicsData.loading && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-blue-700 dark:text-blue-300">
                🚀 Loading optimized demographics data with improved performance...
              </div>
            )}
          </div>

          {/* Population chart - using global scenario data with confidence intervals */}
          {populationData ? (
            <PopulationChartWithCI data={populationData} scenarioResult={scenarioResult} />
          ) : (
            <DemographicsPopulationChart data={demographicsData.population} />
          )}

          {parameters.fertility !== null ? (
            <ParameterSlider
              label="Birth Rate (Global)"
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
                Birth Rate: <span className="font-medium text-foreground">Any value (Multiple scenarios)</span>
              </p>
                <button
                onClick={() => updateParameter('fertility', 1.7)}
                className="mt-2 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Set to 1.7
                </button>
            </div>
          )}

          {/* Diet Pattern Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-medium text-foreground">Diet Pattern</label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-muted-foreground cursor-help">ⓘ</span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-sm">
                  <p className="text-base">
                    Dietary patterns represent different levels of meat consumption and their
                    associated virtual water footprints. Higher meat consumption requires
                    significantly more water resources per capita.
                  </p>
                </TooltipContent>
              </Tooltip>
          </div>

            <div className="grid grid-cols-3 gap-2">
              {Object.entries(dietPatterns).map(([key, pattern]) => {
                const dropletCount = key === 'pattern1' ? 2 : key === 'pattern2' ? 3 : 5;
                const dropletColor = key === 'pattern1' ? 'fill-green-500 text-green-500' :
                                    key === 'pattern2' ? 'fill-amber-500 text-amber-500' :
                                    'fill-red-500 text-red-500';

                return (
                  <Tooltip key={key}>
                    <TooltipTrigger asChild>
                <button
                        onClick={() => setSelectedDietPattern(key)}
                        className={`p-2 rounded-lg border-2 transition-all text-center ${
                          selectedDietPattern === key
                            ? `${pattern.borderColor} bg-opacity-10 ${pattern.color.replace('bg-', 'bg-opacity-10 bg-')}`
                            : `border-border ${pattern.hoverColor}`
                        }`}
                      >
                        <div className="flex justify-center gap-0.5 mb-1">
                          {Array.from({ length: dropletCount }).map((_, i) => (
                            <Droplet key={i} className={`w-3 h-3 ${dropletColor}`} />
              ))}
            </div>
                        <div className={`font-medium text-sm ${
                          selectedDietPattern === key ? pattern.textColor : 'text-foreground'
                        }`}>
                          {pattern.name}
          </div>
                        <div className={`text-xs ${
                          selectedDietPattern === key ? pattern.textColor : 'text-muted-foreground'
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
                          <strong>Water consumption:</strong> {pattern.level}
          </div>
      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
                  </div>

            <div className="text-sm text-muted-foreground mt-2">
              Selected: <span className="font-medium text-foreground">
                {dietPatterns[selectedDietPattern].title} - {dietPatterns[selectedDietPattern].level}
                        </span>
                    </div>
                  </div>

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
        </div>

        {/* Right side - Two stacked charts */}
        <div className="flex flex-col gap-2 h-full">
          <div className="text-foreground text-base leading-relaxed flex-shrink-0">
            <p>
              Water consumption patterns vary significantly with demographic transitions.
              <span className="font-medium">Lower fertility rates and dietary changes</span> can reduce
              per capita water demand while urbanization may increase efficiency through improved infrastructure.
            </p>
          </div>

          <div className="flex-1 min-h-0">
            {domesticData ? (
              <DomesticChartWithCI data={domesticData} scenarioResult={scenarioResult} />
            ) : (
              <DemographicsDomesticChart data={demographicsData.domestic} />
            )}
          </div>

          <div className="flex-1 min-h-0">
            {oaData ? (
              <OAChartWithCI data={oaData} scenarioResult={scenarioResult} />
            ) : (
              <DemographicsOAChart data={demographicsData.oa} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
