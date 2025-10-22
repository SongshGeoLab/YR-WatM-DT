import React, { useMemo, useState, useEffect } from 'react';
import { PlotlyChart } from '../charts/PlotlyChart';
import { Card } from '../ui/card';
import { useScenario, useScenarioSeries } from '../../contexts/ScenarioContext';
import { ParameterSlider } from '../ui/parameter-slider';
import { Gauge, TreePine, BarChart3, Droplets } from 'lucide-react';
import WaterCompositionComparisonPanel from '../WaterCompositionComparisonPanel';
import { useWaterCompositionComparison } from '../../hooks/useWaterCompositionComparison';
import * as api from '../../services/api';

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
      if (!series) return 0;
      const values = scenarioResult?.isSingleScenario ? series.value : series.mean;
      if (!Array.isArray(values) || values.length === 0) return 0;
      const last = values[values.length - 1];
      return Number.isFinite(last) ? last : 0;
    };

    const irrigationValue = getLatestValue(irrigationSeries);
    const productionValue = getLatestValue(productionSeries);
    const oaValue = getLatestValue(oaSeries);
    const domesticValue = getLatestValue(domesticSeries);


    const categories = ['Irrigation', 'Production', 'Other Activities', 'Domestic'];
    const values = [irrigationValue, productionValue, oaValue, domesticValue];
    const colors = ['#f97316', '#3b82f6', '#8b5cf6', '#ef4444'];

    // Filter out zero values and create labels with percentages
    const filteredData = categories.map((cat, i) => ({
      label: cat,
      value: values[i],
      color: colors[i]
    })).filter(item => item.value > 0);

    const filteredLabels = filteredData.map(item => item.label);
    const filteredValues = filteredData.map(item => item.value);
    const filteredColors = filteredData.map(item => item.color);

    // Create treemap data
    const totalValue = filteredValues.reduce((sum, val) => sum + val, 0);
    const parents = Array(filteredLabels.length).fill("");

    return [{
      type: 'treemap',
      labels: filteredLabels,
      values: filteredValues,
      parents: parents,
      marker: {
        colors: filteredColors,
        line: { width: 2, color: 'white' }
      },
      textinfo: 'label+value+percent',
      textfont: { size: 12, color: 'white' },
      hovertemplate: '<b>%{label}</b><br>Value: %{value:.2e}<br>Percentage: %{customdata}<extra></extra>',
      customdata: filteredValues.map(val => `${((val / totalValue) * 100).toFixed(1)}%`),
      branchvalues: 'total'
    }];
  }, [irrigationData, productionData, oaData, domesticData, scenarioResult]);

  const layout = useMemo(() => ({
    margin: { l: 20, r: 20, t: 50, b: 20 },
    title: {
      text: 'Water Demand Composition (Treemap)',
      x: 0.5,
      xanchor: 'center',
      font: { size: 16 }
    }
  }), []);

  return (
    <PlotlyChart
      id={id}
      title="Water Demand Composition"
      description="Water demand composition by sector using treemap visualization"
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
 * Water Composition Analysis Page with Parameter Sliders
 */
export default function WaterStressIndexPage() {
  const { scenarioResult, updateParameter, parameters } = useScenario();
  const [parameterRanges, setParameterRanges] = useState<{
    irrigation?: { min: number; max: number; step: number };
    fire?: { min: number; max: number; step: number };
  }>({});

  // Get current parameter values from global context
  const irrigationEfficiency = parameters?.irrigationEfficiency;
  const fireGenerationShare = parameters?.fireGenerationShare;

  // Fetch parameter ranges from API
  useEffect(() => {
    const fetchParameterRanges = async () => {
      try {
        const params = await api.getParams();

        // Get irrigation efficiency parameter range
        const irrigationParamName = 'water saving irrigation efficiency ratio';
        const irrigationValues = params[irrigationParamName];
        if (irrigationValues && irrigationValues.length > 0) {
          const irrigationMin = Math.min(...irrigationValues);
          const irrigationMax = Math.max(...irrigationValues);
          const irrigationStep = irrigationValues.length > 1 ?
            Math.min(...irrigationValues.slice(1).map((v, i) => Math.abs(v - irrigationValues[i]))) : 0.01;

          setParameterRanges(prev => ({
            ...prev,
            irrigation: { min: irrigationMin, max: irrigationMax, step: irrigationStep }
          }));
        }

        // Get fire generation share parameter range
        const fireParamName = 'fire generation share province target';
        const fireValues = params[fireParamName];
        if (fireValues && fireValues.length > 0) {
          const fireMin = Math.min(...fireValues);
          const fireMax = Math.max(...fireValues);
          const fireStep = fireValues.length > 1 ?
            Math.min(...fireValues.slice(1).map((v, i) => Math.abs(v - fireValues[i]))) : 0.01;

          setParameterRanges(prev => ({
            ...prev,
            fire: { min: fireMin, max: fireMax, step: fireStep }
          }));
        }
      } catch (error) {
        console.error('Failed to fetch parameter ranges:', error);
      }
    };
    fetchParameterRanges();
  }, []);

  // Fetch data using global scenario context
  const { data: irrigationData, loading: irrigationLoading, error: irrigationError } = useScenarioSeries('irrigation water demand province sum');
  const { data: productionData, loading: productionLoading, error: productionError } = useScenarioSeries('production water demand province sum');
  const { data: oaData, loading: oaLoading, error: oaError } = useScenarioSeries('OA water demand province sum');
  const { data: domesticData, loading: domesticLoading, error: domesticError } = useScenarioSeries('domestic water demand province sum');
  const { data: totalWaterData, loading: totalWaterLoading, error: totalWaterError } = useScenarioSeries('water consumption of province in YRB sum');

  // Get comparison data
  const comparisonData = useWaterCompositionComparison();

  // Find peak year for total water demand
  const peakYearInfo = useMemo(() => {
    if (!totalWaterData?.series) return null;

    const series = totalWaterData.series;
    const values = scenarioResult?.isSingleScenario ? series.value : series.mean;
    const time = series.time;

    // Guard: verify arrays exist, have data, and are aligned
    if (!values || !time || values.length === 0 || time.length === 0 || values.length !== time.length) {
      return null;
    }

    // Find peak value and corresponding year
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
  }, [totalWaterData, scenarioResult]);

  // Loading state
  const isLoading = irrigationLoading || productionLoading || oaLoading || domesticLoading || totalWaterLoading;
  const hasError = irrigationError || productionError || oaError || domesticError || totalWaterError;


  return (
    <div className="bg-card rounded-lg border-2 border-dashed border-border p-6 h-full overflow-hidden">
      <div className="flex items-center gap-6 mb-6">
        <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg">
          <Gauge className="w-8 h-8" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-foreground">Water Composition Analysis</h1>
            <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm font-medium">
              Page 6
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? 'Loading data...' :
             hasError ? 'Error loading data' :
             scenarioResult?.isSingleScenario ?
               `Scenario: ${scenarioResult.primaryScenario}` :
               `Multiple Scenarios (${scenarioResult?.count || '?'})`
            } | Water Composition Trends & Total Demand Analysis
          </p>
        </div>
      </div>

      {/* Parameter Controls */}
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Irrigation Efficiency Parameter */}
        <div className="space-y-3">
          {irrigationEfficiency !== null ? (
            <ParameterSlider
              label="Water Saving Irrigation Efficiency Ratio (Global)"
              min={parameterRanges.irrigation?.min || 0.8}
              max={parameterRanges.irrigation?.max || 1.0}
              step={parameterRanges.irrigation?.step || 0.01}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            {fireGenerationShare !== null ? (
              <ParameterSlider
                label="Fire Generation Share Province Target (Global)"
                min={parameterRanges.fire?.min || 0.1}
                max={parameterRanges.fire?.max || 0.4}
                step={parameterRanges.fire?.step || 0.01}
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

          {/* Peak Monitor */}
          <div>
            {peakYearInfo && (
              <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 h-full">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <BarChart3 className="w-3 h-3 text-white" />
                  </div>
                  <h4 className="font-semibold text-green-900 dark:text-green-200 text-sm">
                    Peak Analysis
                  </h4>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-green-700 dark:text-green-300">Year:</span>
                    <span className="font-bold text-green-900 dark:text-green-100 text-sm">
                      {Math.round(peakYearInfo.peakYear)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-green-700 dark:text-green-300">Value:</span>
                    <span className="font-bold text-green-900 dark:text-green-100 text-sm">
                      {peakYearInfo.peakValue.toFixed(1)}
                    </span>
                  </div>

                  <div className="text-xs text-green-600 dark:text-green-400 mt-2">
                    ×10⁸ m³
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
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

      {/* Comparison Panel - Bottom Row */}
      <div className="mt-6">
        {comparisonData.loading ? (
          <div className="flex items-center justify-center h-[200px] bg-muted/20 rounded">
            <p className="text-muted-foreground">Loading comparison data...</p>
          </div>
        ) : comparisonData.error ? (
          <div className="flex items-center justify-center h-[200px] bg-muted/20 rounded">
            <p className="text-red-600">Error loading data: {comparisonData.error}</p>
          </div>
        ) : comparisonData.irrigation && comparisonData.production && comparisonData.domestic && comparisonData.oa ? (
            <WaterCompositionComparisonPanel
              irrigation={comparisonData.irrigation}
              production={comparisonData.production}
              domestic={comparisonData.domestic}
              oa={comparisonData.oa}
              className="h-[200px]"
            />
        ) : (
          <div className="flex items-center justify-center h-[200px] bg-muted/20 rounded">
            <p className="text-muted-foreground">No comparison data available</p>
          </div>
        )}
      </div>
    </div>
  );
}
