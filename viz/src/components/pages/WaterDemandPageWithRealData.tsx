import React, { useState, useMemo } from 'react';
import { PlotlyChart } from '../charts/PlotlyChart';
import { ParameterSlider } from '../ui/parameter-slider';
import { Card } from '../ui/card';
import { useScenario, useScenarioSeries } from '../../contexts/ScenarioContext';
import { Sprout, Factory } from 'lucide-react';

/**
 * Irrigation Water Demand Chart Component
 */
const IrrigationWaterDemandChart = React.memo(({
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
        fillcolor: 'rgba(249, 115, 22, 0.2)',
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
      line: { color: '#f97316', width: 3 },
      name: scenarioResult && !scenarioResult.isSingleScenario ? 'Irrigation Water Demand (Mean)' : 'Irrigation Water Demand',
      hovertemplate: 'Year: %{x}<br>Irrigation Water Demand: %{y:.2e}<extra></extra>'
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
      title: 'Water Demand (×10⁸ m³)',
      titlefont: { size: 14 },
      tickfont: { size: 12 }
    },
    hovermode: 'x unified',
    showlegend: false,
    autosize: true
  }), []);

  return (
    <PlotlyChart
      id={id}
      title="Irrigation Water Demand Trends"
      description={scenarioResult && !scenarioResult.isSingleScenario
        ? "Irrigation water demand with confidence intervals across multiple scenarios"
        : "Irrigation water demand over time"
      }
      height="400px"
      data={plotData}
      layout={layout}
    />
  );
});

/**
 * Production Water Demand Chart Component
 */
const ProductionWaterDemandChart = React.memo(({
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
        fillcolor: 'rgba(59, 130, 246, 0.2)',
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
      line: { color: '#3b82f6', width: 3 },
      name: scenarioResult && !scenarioResult.isSingleScenario ? 'Production Water Demand (Mean)' : 'Production Water Demand',
      hovertemplate: 'Year: %{x}<br>Production Water Demand: %{y:.2e}<extra></extra>'
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
      title: 'Water Demand (×10⁸ m³)',
      titlefont: { size: 14 },
      tickfont: { size: 12 }
    },
    hovermode: 'x unified',
    showlegend: false,
    autosize: true
  }), []);

  return (
    <PlotlyChart
      id={id}
      title="Production Water Demand Trends"
      description={scenarioResult && !scenarioResult.isSingleScenario
        ? "Production water demand with confidence intervals across multiple scenarios"
        : "Production water demand over time"
      }
      height="400px"
      data={plotData}
      layout={layout}
    />
  );
});

/**
 * Water Demand Analysis Page with Global Parameter Integration
 */
export default function WaterDemandPageWithRealData() {
  const { parameters, updateParameter, scenarioResult } = useScenario();

  // Get current parameter values
  const irrigationEfficiency = parameters.irrigationEfficiency;
  const fireGenerationShare = parameters.fireGenerationShare;

  // Fetch data using global scenario context
  const { data: irrigationData, loading: irrigationLoading, error: irrigationError } = useScenarioSeries('irrigation water demand province sum');
  const { data: productionData, loading: productionLoading, error: productionError } = useScenarioSeries('production water demand province sum');

  // Loading state
  const isLoading = irrigationLoading || productionLoading;
  const hasError = irrigationError || productionError;

  return (
    <div className="bg-card rounded-lg border-2 border-dashed border-border p-6 h-full overflow-hidden">
      <div className="flex items-center gap-6 mb-6">
        <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center text-white shadow-lg">
          <Sprout className="w-8 h-8" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-foreground">Water Demand Analysis</h1>
            <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium">
              Page 5 - Global Integration 🌐
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? 'Loading data...' :
             hasError ? 'Error loading data' :
             scenarioResult?.isSingleScenario ?
               `Scenario: ${scenarioResult.primaryScenario}` :
               `Multiple Scenarios (${scenarioResult?.count || '?'})`
            } | Irrigation & Production Water Demand
          </p>
        </div>
      </div>

      {/* Parameter Controls - Top Row */}
      <div className="mb-6">
        <div className="text-foreground text-base leading-relaxed mb-4">
          <p>
            <span className="font-medium">Water demand patterns vary significantly across different sectors.</span>
            Irrigation and production water demands are influenced by agricultural efficiency,
            industrial development, and energy generation policies across the Yellow River Basin.
          </p>
          {isLoading && (
            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-blue-700 dark:text-blue-300">
              🌐 Loading global scenario data...
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Irrigation Efficiency Parameter */}
          <div className="space-y-3">
            {irrigationEfficiency !== null ? (
              <ParameterSlider
                label="Water Saving Irrigation Efficiency Ratio (Global)"
                min={0.8}
                max={1.0}
                step={0.01}
                defaultValue={irrigationEfficiency}
                unit=""
                description="Efficiency ratio for irrigation water saving - affects all pages"
                onChange={(v) => updateParameter('irrigationEfficiency', v)}
              />
            ) : (
              <div className="p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Irrigation Efficiency: <span className="font-medium text-foreground">Any value (Multiple scenarios)</span>
                </p>
                <button
                  onClick={() => updateParameter('irrigationEfficiency', 0.9)}
                  className="mt-2 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Set to 0.9
                </button>
              </div>
            )}
          </div>

          {/* Fire Generation Share Parameter */}
          <div className="space-y-3">
            {fireGenerationShare !== null ? (
              <ParameterSlider
                label="Fire Generation Share Province Target (Global)"
                min={0.1}
                max={0.4}
                step={0.01}
                defaultValue={fireGenerationShare}
                unit=""
                description="Target share of thermal power generation - affects all pages"
                onChange={(v) => updateParameter('fireGenerationShare', v)}
              />
            ) : (
              <div className="p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Fire Generation Share: <span className="font-medium text-foreground">Any value (Multiple scenarios)</span>
                </p>
                <button
                  onClick={() => updateParameter('fireGenerationShare', 0.25)}
                  className="mt-2 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Set to 0.25
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts - Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Irrigation Water Demand Chart */}
        <div className="h-[400px]">
          {irrigationData ? (
            <IrrigationWaterDemandChart
              data={irrigationData}
              scenarioResult={scenarioResult}
              id="irrigation-water-demand-chart"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-muted/20 rounded">
              <p className="text-muted-foreground">Loading irrigation water demand data...</p>
            </div>
          )}
        </div>

        {/* Production Water Demand Chart */}
        <div className="h-[400px]">
          {productionData ? (
            <ProductionWaterDemandChart
              data={productionData}
              scenarioResult={scenarioResult}
              id="production-water-demand-chart"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-muted/20 rounded">
              <p className="text-muted-foreground">Loading production water demand data...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
