import React, { useState, useMemo, useEffect } from 'react';
import { PlotlyChart } from '../charts/PlotlyChart';
import { CloudRain } from 'lucide-react';
import { useScenario, useScenarioSeries } from '../../contexts/ScenarioContext';
import { useClimateComparison } from '../../hooks/useClimateComparison';
import DataComparisonPanel from '../DataComparisonPanel';
import * as api from '../../services/api';

/**
 * Water Availability Page Component
 *
 * Displays climate change scenarios (RCP pathways) and their impact
 * on surface water availability in the Yellow River Basin.
 */
export default function WaterAvailabilityPage() {
  const { parameters, scenarioResult, updateParameter } = useScenario();
  const [climateData, setClimateData] = useState<api.ClimateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // South-North Water Transfer Project toggle (local state, not global)
  const [snwtpEnabled, setSnwtpEnabled] = useState(false);

  // Get climate comparison data
  const comparisonData = useClimateComparison(snwtpEnabled);

  // Get real surface water data with SNWTP parameter
  const [surfaceWaterData, setSurfaceWaterData] = useState<any>(null);
  const [surfaceWaterLoading, setSurfaceWaterLoading] = useState(false);
  const [surfaceWaterError, setSurfaceWaterError] = useState<string | null>(null);

  // Custom data fetching for surface water with SNWTP parameter
  useEffect(() => {
    const fetchSurfaceWaterData = async () => {
      setSurfaceWaterLoading(true);
      setSurfaceWaterError(null);

      try {
        // Build filters including SNWTP parameter
        const filters: any = {};

        // Add global parameters
        Object.entries(parameters).forEach(([key, value]) => {
          if (value !== null) {
            const apiKey = key === 'climateScenario' ? 'Climate change scenario switch for water yield' :
                          key === 'fertility' ? 'Fertility Variation' :
                          key === 'dietPattern' ? 'Diet change scenario switch' :
                          key === 'ecologicalFlow' ? 'Ecological water flow variable' :
                          key === 'irrigationEfficiency' ? 'water saving irrigation efficiency ratio' :
                          key === 'fireGenerationShare' ? 'fire generation share province target' :
                          key;
            filters[apiKey] = value;
          }
        });

        // Add SNWTP parameter
        filters['SNWTP'] = snwtpEnabled ? 1 : 0;

        console.log('🔍 Fetching surface water data with filters:', filters);
        console.log('🔍 SNWTP enabled:', snwtpEnabled);

        // Call API directly
        const result = await api.getSeriesMulti(
          'YRB available surface water',
          filters,
          {
            start_year: 2020,
            end_year: 2100,
            aggregate: true
          }
        );

        if ('series' in result) {
          const enhancedResult = {
            series: {
              time: result.series.time,
              value: result.series.mean,
              mean: result.series.mean,
              min: result.series.min,
              max: result.series.max,
              std: result.series.std,
              p05: result.series.p05,
              p95: result.series.p95,
              n_scenarios: result.n_scenarios
            },
            filter_summary: result.filter_summary,
            isSingleScenario: result.isSingleScenario,
            n_scenarios: result.n_scenarios
          };
          setSurfaceWaterData(enhancedResult);
          console.log('✅ Surface water data loaded:', {
            n_scenarios: result.n_scenarios,
            time_points: result.series.time.length,
            snwtp_enabled: snwtpEnabled
          });
        }
      } catch (err: any) {
        console.error('❌ Failed to fetch surface water data:', err);
        setSurfaceWaterError(err.message);
      } finally {
        setSurfaceWaterLoading(false);
      }
    };

    fetchSurfaceWaterData();
  }, [parameters, snwtpEnabled]);

  // Derive selected scenario from global parameters
  const selectedScenario = useMemo(() => {
    const scenarioMap = {
      1: 'RCP2.6',
      2: 'RCP4.5',
      3: 'RCP8.5'
    };
    return scenarioMap[parameters.climateScenario as keyof typeof scenarioMap] || 'RCP4.5';
  }, [parameters.climateScenario]);

  // Handle scenario selection
  const handleScenarioChange = (scenario: string) => {
    const climateScenarioMap = {
      'RCP2.6': 1,
      'RCP4.5': 2,
      'RCP8.5': 3
    };
    const scenarioValue = climateScenarioMap[scenario as keyof typeof climateScenarioMap];
    if (scenarioValue) {
      updateParameter('climateScenario', scenarioValue);
    }
  };

  // Load climate data from API
  useEffect(() => {
    const loadClimateData = async () => {
      try {
        setLoading(true);
        const data = await api.getClimateData();
        setClimateData(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load climate data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load climate data');
      } finally {
        setLoading(false);
      }
    };

    loadClimateData();
  }, []);

  const scenarios = {
    'RCP2.6': {
      name: 'RCP2.6',
      title: 'Radical Sustainable Transformation',
      color: '#10b981',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-900',
      description: 'Green technology revolution with radical ecological restoration and advanced water recycling technologies'
    },
    'RCP4.5': {
      name: 'RCP4.5',
      title: 'Balancing Economy and Sustainability',
      color: '#f59e0b',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-900',
      description: 'Traditional industries coexist with green technologies, gradual renewable energy adoption'
    },
    'RCP8.5': {
      name: 'RCP8.5',
      title: 'Focusing on Economic Development',
      color: '#ef4444',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-900',
      description: 'High fossil fuel dependence with rapid economic growth but inefficient water resource use'
    }
  };

  // Process real climate data from API
  const processedClimateData = useMemo(() => {
    if (!climateData) return null;

    // Map API scenario names to display names
    const scenarioMapping = {
      'ssp126': 'RCP2.6-SSP1',
      'ssp245': 'RCP4.5-SSP2',
      'ssp585': 'RCP8.5-SSP5'
    };

    const processed = {
      rcp26: { temp: { years: [] as number[], values: [] as number[] }, precip: { years: [] as number[], values: [] as number[] } },
      rcp45: { temp: { years: [] as number[], values: [] as number[] }, precip: { years: [] as number[], values: [] as number[] } },
      rcp85: { temp: { years: [] as number[], values: [] as number[] }, precip: { years: [] as number[], values: [] as number[] } }
    };

    // Process temperature data
    Object.entries(climateData.temperature).forEach(([scenario, data]) => {
      const displayName = scenarioMapping[scenario as keyof typeof scenarioMapping];
      if (displayName === 'RCP2.6-SSP1') processed.rcp26.temp = data;
      else if (displayName === 'RCP4.5-SSP2') processed.rcp45.temp = data;
      else if (displayName === 'RCP8.5-SSP5') processed.rcp85.temp = data;
    });

    // Process precipitation data
    Object.entries(climateData.precipitation).forEach(([scenario, data]) => {
      const displayName = scenarioMapping[scenario as keyof typeof scenarioMapping];
      if (displayName === 'RCP2.6-SSP1') processed.rcp26.precip = data;
      else if (displayName === 'RCP4.5-SSP2') processed.rcp45.precip = data;
      else if (displayName === 'RCP8.5-SSP5') processed.rcp85.precip = data;
    });

    return processed;
  }, [climateData]);

  // RCP Climate Scenario Pathways chart data
  const rcpPathwaysData = useMemo(() => {
    if (!processedClimateData) return [];

    const traces: any[] = [];

    if (processedClimateData.rcp26.temp.years && processedClimateData.rcp26.temp.years.length > 0) {
      traces.push({
        type: 'scatter',
        mode: 'lines',
        x: processedClimateData.rcp26.temp.years,
        y: processedClimateData.rcp26.temp.values,
        name: 'RCP2.6-SSP1',
        line: { color: '#10b981', width: 3 },
        hovertemplate: '<b>RCP2.6-SSP1</b><br>Year: %{x}<br>Temperature: %{y:.2f}°C<extra></extra>'
      });
    }

    if (processedClimateData.rcp45.temp.years && processedClimateData.rcp45.temp.years.length > 0) {
      traces.push({
        type: 'scatter',
        mode: 'lines',
        x: processedClimateData.rcp45.temp.years,
        y: processedClimateData.rcp45.temp.values,
        name: 'RCP4.5-SSP2',
        line: { color: '#f59e0b', width: 3 },
        hovertemplate: '<b>RCP4.5-SSP2</b><br>Year: %{x}<br>Temperature: %{y:.2f}°C<extra></extra>'
      });
    }

    if (processedClimateData.rcp85.temp.years && processedClimateData.rcp85.temp.years.length > 0) {
      traces.push({
        type: 'scatter',
        mode: 'lines',
        x: processedClimateData.rcp85.temp.years,
        y: processedClimateData.rcp85.temp.values,
        name: 'RCP8.5-SSP5',
        line: { color: '#ef4444', width: 3 },
        hovertemplate: '<b>RCP8.5-SSP5</b><br>Year: %{x}<br>Temperature: %{y:.2f}°C<extra></extra>'
      });
    }

    return traces;
  }, [processedClimateData]);

  // Temperature & Precipitation Trends chart data
  const tempPrecipData = useMemo(() => {
    if (!processedClimateData) return [];

    const scenarioKey = selectedScenario.toLowerCase().replace('.', '') as keyof typeof processedClimateData;
    const selectedData = processedClimateData[scenarioKey];

    if (!selectedData || !selectedData.temp.years || !selectedData.precip.years) return [];

    return [
      {
        type: 'scatter',
        mode: 'lines',
        x: selectedData.temp.years,
        y: selectedData.temp.values,
        name: 'Temperature',
        yaxis: 'y',
        line: { color: '#ef4444', width: 3 },
        hovertemplate: '<b>Temperature</b><br>Year: %{x}<br>Value: %{y:.2f}°C<extra></extra>'
      },
      {
        type: 'scatter',
        mode: 'lines',
        x: selectedData.precip.years,
        y: selectedData.precip.values,
        name: 'Precipitation',
        yaxis: 'y2',
        line: { color: '#3b82f6', width: 3 },
        hovertemplate: '<b>Precipitation</b><br>Year: %{x}<br>Value: %{y:.1f} mm<extra></extra>'
      }
    ];
  }, [processedClimateData, selectedScenario]);

  // Surface Water Availability chart data using real data
  const surfaceWaterChartData = useMemo(() => {
    if (!surfaceWaterData || !surfaceWaterData.series) return [];

    const series = surfaceWaterData.series;
    const traces: any[] = [];

    // Add confidence interval if available (multiple scenarios mode)
    if (surfaceWaterData && !surfaceWaterData.isSingleScenario && series.min && series.max) {
      // Lower bound
      traces.push({
        x: series.time,
        y: series.min,
        type: 'scatter',
        mode: 'lines',
        line: { width: 0 },
        showlegend: false,
        hoverinfo: 'skip',
      });

      // Upper bound with fill
      traces.push({
        x: series.time,
        y: series.max,
        type: 'scatter',
        mode: 'lines',
        fill: 'tonexty',
        fillcolor: 'rgba(6, 182, 212, 0.2)', // Cyan with transparency
        line: { width: 0 },
        showlegend: false,
        hoverinfo: 'skip',
      });
    }

    // Main data line - 根据情景模式选择显示内容
    const mainValue = surfaceWaterData && surfaceWaterData.isSingleScenario ? series.value : (series.mean || series.value);

    const snwtpLabel = snwtpEnabled ? ' (with SNWTP)' : ' (no SNWTP)';
    const displayName = surfaceWaterData && surfaceWaterData.isSingleScenario
      ? (surfaceWaterData.primaryScenario || 'Current Scenario') + snwtpLabel
      : `Mean (${series.n_scenarios || surfaceWaterData?.n_scenarios || '?'} scenarios)${snwtpLabel}`;

    traces.push({
      x: series.time,
      y: mainValue,
      type: 'scatter',
      mode: 'lines',
      line: { color: snwtpEnabled ? '#10b981' : '#06b6d4', width: 3 },
      name: displayName,
      hovertemplate: '<b>Surface Water Availability</b><br>Year: %{x}<br>Value: %{y:.2f} ×10⁸ m³<extra></extra>'
    });

    return traces;
  }, [surfaceWaterData, scenarioResult, snwtpEnabled]);

  // Show loading state
  if (loading || surfaceWaterLoading) {
    return (
      <div className="bg-card rounded-lg border-2 border-dashed border-border p-6 h-full overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-cyan-500 flex items-center justify-center text-white shadow-lg mx-auto mb-4">
            <CloudRain className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Loading Climate Data...</h2>
          <p className="text-sm text-muted-foreground">
            {loading ? 'Fetching RCP scenario data from server' : 'Loading surface water availability data'}
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || surfaceWaterError) {
    return (
      <div className="bg-card rounded-lg border-2 border-dashed border-border p-6 h-full overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg mx-auto mb-4">
            <CloudRain className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Error Loading Data</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {error || surfaceWaterError}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border-2 border-dashed border-border p-6 h-full overflow-hidden">
      <div className="flex items-center gap-6 mb-6">
        <div className="w-16 h-16 rounded-full bg-cyan-500 flex items-center justify-center text-white shadow-lg">
          <CloudRain className="w-8 h-8" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-foreground">Climate Change Impact Analysis</h1>
            <span className="px-3 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-full text-sm font-medium">
              Page 2
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">RCP Pathways & Surface Water Availability Projections</p>
        </div>
      </div>

      {/* Scenario Selection */}
      <div className="mb-4 flex items-center justify-between bg-muted/50 rounded-lg p-3">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-foreground">Climate Scenario:</h3>
          <div className="flex gap-2">
            {Object.entries(scenarios).map(([key, scenario]) => (
              <button
                key={key}
                onClick={() => handleScenarioChange(key)}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  selectedScenario === key
                    ? `${scenario.bgColor} ${scenario.borderColor} ${scenario.textColor} font-medium shadow-sm`
                    : 'bg-card border-border text-foreground hover:bg-muted'
                }`}
              >
                {scenario.name}
              </button>
            ))}
          </div>
        </div>

        {/* South-North Water Transfer Project Toggle */}
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-foreground">South-North Water Transfer:</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSnwtpEnabled(false)}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                !snwtpEnabled
                  ? 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-300 font-medium'
                  : 'bg-card border-border text-foreground hover:bg-muted'
              }`}
            >
              Off
            </button>
            <button
              onClick={() => setSnwtpEnabled(true)}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                snwtpEnabled
                  ? 'bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-300 font-medium'
                  : 'bg-card border-border text-foreground hover:bg-muted'
              }`}
            >
              On
            </button>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-4 h-[calc(100%-12rem)]">
        <div className="flex flex-col gap-2 min-h-0">
          <div className="flex-1 min-h-0">
            <PlotlyChart
              id="demo-image-chart"
              data={[{
                type: 'scatter',
                x: [0, 100],
                y: [0, 100],
                mode: 'markers',
                marker: {
                  size: 1,
                  color: 'transparent'
                },
                showlegend: false,
                hoverinfo: 'none'
              }]}
              layout={{
                title: {
                  text: 'Climate Scenarios Overview',
                  x: 0.5,
                  xanchor: 'center',
                  font: { size: 16 }
                },
                xaxis: {
                  visible: false,
                  fixedrange: false,
                  range: [0, 100]
                },
                yaxis: {
                  visible: false,
                  fixedrange: false,
                  range: [0, 100],
                  scaleanchor: 'x',
                  scaleratio: 1
                },
                // Background colors will be set by PlotlyChart dark mode handler
                height: 400,
                font: { family: 'Inter, system-ui, sans-serif', size: 12 },
                margin: { l: 20, r: 20, t: 50, b: 20 },
                images: [{
                  source: '/demo.png',
                  xref: 'paper',
                  yref: 'paper',
                  x: 0.5,
                  y: 1,
                  sizex: 0.9,
                  sizey: 0.9,
                  xanchor: 'center',
                  yanchor: 'top',
                  sizing: 'contain',
                  layer: 'below'
                }]
              }}
              config={{
                responsive: true,
                displayModeBar: true,
                displaylogo: false,
                modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d']
              }}
              height="100%"
            />
          </div>
          <div className="flex-1 min-h-0">
            <PlotlyChart
              id="temperature-precipitation-trends"
              data={tempPrecipData}
              layout={{
                title: {
                  text: `Temperature & Precipitation Trends - ${selectedScenario}`,
                  x: 0.5,
                  xanchor: 'center',
                  font: { size: 16 }
                },
                xaxis: {
                  title: 'Year',
                  range: [2020, 2100],
                  showgrid: true,
                  // Grid styling will be set by PlotlyChart dark mode handler
                },
                yaxis: {
                  title: 'Temperature (°C)',
                  titlefont: { color: '#ef4444' },
                  tickfont: { color: '#ef4444' },
                  showgrid: true,
                  // Grid styling will be set by PlotlyChart dark mode handler,
                  side: 'left'
                },
                yaxis2: {
                  title: 'Precipitation (mm)',
                  titlefont: { color: '#3b82f6' },
                  tickfont: { color: '#3b82f6' },
                  overlaying: 'y',
                  side: 'right'
                },
                // Background colors will be set by PlotlyChart dark mode handler
                height: 300,
                font: { family: 'Inter, system-ui, sans-serif', size: 12 },
                hovermode: 'x unified',
                legend: {
                  orientation: 'h',
                  y: -0.15,
                  x: 0.5,
                  xanchor: 'center'
                }
              }}
              config={{ responsive: true, displayModeBar: false }}
              height="100%"
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 min-h-0">
          <div className="flex-1 min-h-0">
            <PlotlyChart
              id="surface-water-availability"
              data={surfaceWaterChartData}
              layout={{
                title: {
                  text: 'Surface Water Availability Projections',
                  x: 0.5,
                  xanchor: 'center',
                  font: { size: 16 }
                },
                xaxis: {
                  title: 'Year',
                  range: [2020, 2100],
                  showgrid: true,
                  // Grid styling will be set by PlotlyChart dark mode handler
                },
                yaxis: {
                  title: 'Surface Water (×10⁸ m³)',
                  showgrid: true,
                  // Grid styling will be set by PlotlyChart dark mode handler
                },
                // Background colors will be set by PlotlyChart dark mode handler
                height: 400,
                font: { family: 'Inter, system-ui, sans-serif', size: 12 },
                hovermode: 'x unified',
                showlegend: true,
                legend: {
                  orientation: 'h',
                  y: -0.1,
                  x: 0.5,
                  xanchor: 'center'
                }
              }}
              config={{ responsive: true, displayModeBar: false }}
              height="100%"
            />
          </div>
          <div className="flex-1 min-h-0">
            {/* Data Comparison Panel */}
            {comparisonData.loading ? (
              <div className="h-full p-6 bg-card rounded-lg border text-center flex items-center justify-center">
                <div className="text-sm text-muted-foreground">Loading comparison data...</div>
              </div>
            ) : comparisonData.error ? (
              <div className="h-full p-6 bg-card rounded-lg border text-center flex items-center justify-center">
                <div className="text-sm text-red-600">Error loading data: {comparisonData.error}</div>
              </div>
            ) : comparisonData.temperature && comparisonData.precipitation && comparisonData.waterAvailability ? (
              <DataComparisonPanel
                temperature={comparisonData.temperature}
                precipitation={comparisonData.precipitation}
                waterAvailability={comparisonData.waterAvailability}
                className="h-full"
              />
            ) : (
              <div className="h-full p-6 bg-card rounded-lg border text-center flex items-center justify-center">
                <div className="text-sm text-muted-foreground">No comparison data available</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
