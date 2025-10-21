import React, { useMemo } from 'react';
import { PlotlyChart } from '../charts/PlotlyChart';
import { Card } from '../ui/card';
import { useScenario, useScenarioSeries } from '../../contexts/ScenarioContext';
import GlobalScenarioSelection from '../GlobalScenarioSelection';
import { Gauge, TreePine } from 'lucide-react';

/**
 * Water Composition Tree Chart Component
 */
const WaterCompositionTreeChart = React.memo(({
  irrigationData,
  productionData,
  oaData,
  domesticData,
  scenarioResult,
  id
}: {
  irrigationData: any;
  productionData: any;
  oaData: any;
  domesticData: any;
  scenarioResult: any;
  id: string;
}) => {
  const plotData = useMemo(() => {
    if (!irrigationData?.series || !productionData?.series || !oaData?.series || !domesticData?.series) {
      return [];
    }

    const irrigationSeries = irrigationData.series;
    const productionSeries = productionData.series;
    const oaSeries = oaData.series;
    const domesticSeries = domesticData.series;

    // Get latest values for composition
    const getLatestValue = (series: any) => {
      const values = scenarioResult?.isSingleScenario ? series.value : series.mean;
      return values ? values[values.length - 1] : 0;
    };

    const irrigationValue = getLatestValue(irrigationSeries);
    const productionValue = getLatestValue(productionSeries);
    const oaValue = getLatestValue(oaSeries);
    const domesticValue = getLatestValue(domesticSeries);

    const categories = ['Irrigation', 'Production', 'Other Activities', 'Domestic'];
    const values = [irrigationValue, productionValue, oaValue, domesticValue];
    const colors = ['#f97316', '#3b82f6', '#8b5cf6', '#ef4444'];

    return [{
      type: 'treemap',
      labels: categories,
      values: values,
      parents: Array(categories.length).fill(""),
      marker: {
        colors: colors,
        line: { width: 2, color: 'white' }
      },
      textinfo: 'label+value+percent parent',
      textfont: { size: 14, color: 'white' },
      hovertemplate: '<b>%{label}</b><br>Value: %{value:.2e}<br>Percentage: %{percentParent:.1%}<extra></extra>'
    }];
  }, [irrigationData, productionData, oaData, domesticData, scenarioResult]);

  const layout = useMemo(() => ({
    margin: { l: 20, r: 20, t: 50, b: 20 },
    title: {
      text: 'Water Demand Composition (Tree Map)',
      x: 0.5,
      xanchor: 'center',
      font: { size: 16 }
    }
  }), []);

  return (
    <PlotlyChart
      id={id}
      title="Water Demand Composition"
      description="Water demand composition by sector using tree map visualization"
      height="400px"
      data={plotData}
      layout={layout}
    />
  );
});

/**
 * Total Water Demand Chart Component
 */
const TotalWaterDemandChart = React.memo(({
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
        fillcolor: 'rgba(34, 197, 94, 0.2)',
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
      line: { color: '#22c55e', width: 3 },
      name: scenarioResult && !scenarioResult.isSingleScenario ? 'Total Water Demand (Mean)' : 'Total Water Demand',
      hovertemplate: 'Year: %{x}<br>Total Water Demand: %{y:.2e}<extra></extra>'
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
      title: 'Total Water Demand (×10⁸ m³)',
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
      title="Total Water Demand Trends"
      description={scenarioResult && !scenarioResult.isSingleScenario
        ? "Total water demand with confidence intervals across multiple scenarios"
        : "Total water demand over time"
      }
      height="400px"
      data={plotData}
      layout={layout}
    />
  );
});

/**
 * Water Stress Index Page with Global Scenario Selection
 */
export default function WaterStressIndexPage() {
  const { scenarioResult } = useScenario();

  // Fetch data using global scenario context
  const { data: irrigationData, loading: irrigationLoading, error: irrigationError } = useScenarioSeries('irrigation water demand province sum');
  const { data: productionData, loading: productionLoading, error: productionError } = useScenarioSeries('production water demand province sum');
  const { data: oaData, loading: oaLoading, error: oaError } = useScenarioSeries('OA water demand province sum');
  const { data: domesticData, loading: domesticLoading, error: domesticError } = useScenarioSeries('domestic water demand province sum');
  const { data: totalWaterData, loading: totalWaterLoading, error: totalWaterError } = useScenarioSeries('water consumption of province in YRB sum');

  // Loading state
  const isLoading = irrigationLoading || productionLoading || oaLoading || domesticLoading || totalWaterLoading;
  const hasError = irrigationError || productionError || oaError || domesticError || totalWaterError;

  return (
    <div className="bg-card rounded-lg border-2 border-dashed border-border p-6 h-full overflow-hidden">
      <div className="flex items-center gap-6 mb-6">
        <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg">
          <Gauge className="w-8 h-8" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-foreground">Water Demand Analysis</h1>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
              Page 6 - Global Integration 🌐
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? 'Loading data...' :
             hasError ? 'Error loading data' :
             scenarioResult?.isSingleScenario ?
               `Scenario: ${scenarioResult.primaryScenario}` :
               `Multiple Scenarios (${scenarioResult?.count || '?'})`
            } | Total Water Demand Trends & Composition Analysis
          </p>
        </div>
      </div>

      {/* Global Scenario Selection */}
      <div className="mb-6">
        <GlobalScenarioSelection />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Water Composition Tree Chart */}
        <div className="h-[400px]">
          {irrigationData && productionData && oaData && domesticData ? (
            <WaterCompositionTreeChart
              irrigationData={irrigationData}
              productionData={productionData}
              oaData={oaData}
              domesticData={domesticData}
              scenarioResult={scenarioResult}
              id="water-composition-tree-chart"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-muted/20 rounded">
              <p className="text-muted-foreground">Loading water composition data...</p>
            </div>
          )}
        </div>

        {/* Right: Total Water Demand Chart */}
        <div className="h-[400px]">
          {totalWaterData ? (
            <TotalWaterDemandChart
              data={totalWaterData}
              scenarioResult={scenarioResult}
              id="total-water-demand-chart"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-muted/20 rounded">
              <p className="text-muted-foreground">Loading total water demand data...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
