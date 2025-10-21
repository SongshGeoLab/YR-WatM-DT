import React, { useMemo, useState } from 'react';
import { PlotlyChart } from '../charts/PlotlyChart';
import { Card } from '../ui/card';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { useScenario, useScenarioSeries } from '../../contexts/ScenarioContext';
import { Activity, Gauge, Leaf, Scale, Factory } from 'lucide-react';

/**
 * Water Stress Index Chart Component
 * Shows water stress index over time with threshold lines
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
  const plotData = useMemo(() => {
    if (!data?.series) return [];

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
        fillcolor: 'rgba(99, 102, 241, 0.2)',
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
      line: { color: '#6366f1', width: 3 },
      name: scenarioResult && !scenarioResult.isSingleScenario ? 'Water Stress Index (Mean)' : 'Water Stress Index',
      hovertemplate: 'Year: %{x}<br>Water Stress Index: %{y:.3f}<extra></extra>'
    });

    return traces;
  }, [data, scenarioResult]);

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
      title: 'Water Stress Index',
      titlefont: { size: 14 },
      tickfont: { size: 12 },
      range: [0, 1],
      dtick: 0.2
    },
    hovermode: 'x unified',
    showlegend: false,
    autosize: true
  }), []);

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
export default function WaterQualityPage() {
  const { scenarioResult } = useScenario();
  const [selectedScenario, setSelectedScenario] = useState('tSSP1-RCP2.6');

  // Global scenario definitions
  const scenarios = {
    'tSSP1-RCP2.6': {
      name: 'Radical sustainable transformation',
      description: 'Strong sustainability policies, low population growth, rapid technological progress, and ambitious climate action',
      icon: Leaf,
      color: 'bg-green-500'
    },
    'tSSP2-RCP4.5': {
      name: 'Balancing economy and sustainability',
      description: 'Moderate policies, balanced development, and gradual climate action with mixed economic growth',
      icon: Scale,
      color: 'bg-amber-500'
    },
    'tSSP5-RCP8.5': {
      name: 'Focusing on economic development',
      description: 'Market-driven development, high economic growth, and limited climate action with high emissions',
      icon: Factory,
      color: 'bg-red-500'
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
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? 'Loading data...' :
             hasError ? 'Error loading data' :
             scenarioResult?.isSingleScenario ?
               `Scenario: ${scenarioResult.primaryScenario}` :
               `Multiple Scenarios (${scenarioResult?.count || '?'})`
            } | Water Stress Index Monitoring & Analysis
          </p>
        </div>
      </div>

      {/* Global Scenario Selection */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-4">Global Scenario Selection</h2>
        <p className="text-lg text-muted-foreground mb-6">
          Select a preset of parameters from three overall scenarios:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(scenarios).map(([key, scenario]) => {
            const Icon = scenario.icon;
            return (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setSelectedScenario(key)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedScenario === key
                        ? `${scenario.color} border-transparent text-white`
                        : 'bg-card border-border hover:border-muted-foreground text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        selectedScenario === key
                          ? 'bg-white/20 text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="font-medium">{scenario.name}</div>
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-md">
                  <div className="space-y-2">
                    <div className="font-medium text-base">{scenario.name}</div>
                    <div className="text-sm opacity-90">{scenario.description}</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Water Stress Index Chart */}
        <div className="h-[400px]">
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
                  <span className="font-medium">Low Stress (&lt;0.2)</span>: Water resources abundant
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="text-sm text-foreground">
                  <span className="font-medium">Moderate Stress (0.2-0.4)</span>: Monitoring recommended
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm text-foreground">
                  <span className="font-medium">High Stress (&gt;0.4)</span>: Critical water scarcity risk
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
    </div>
  );
}
