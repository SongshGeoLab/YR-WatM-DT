import React, { useState, useMemo, useEffect } from 'react';
import { PlotlyChart } from '../charts/PlotlyChart';
import { CloudRain } from 'lucide-react';
import { useScenario } from '../../contexts/ScenarioContext';
import * as api from '../../services/api';

/**
 * Water Availability Page Component
 *
 * Displays climate change scenarios (RCP pathways) and their impact
 * on surface water availability in the Yellow River Basin.
 */
export default function WaterAvailabilityPage() {
  const [selectedScenario, setSelectedScenario] = useState('RCP2.6');
  const { parameters, scenarioResult } = useScenario();
  const [climateData, setClimateData] = useState<api.ClimateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      'ssp126_corrected': 'RCP2.6-SSP1',
      'ssp245_corrected': 'RCP4.5-SSP2',
      'ssp585_corrected': 'RCP8.5-SSP5'
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

  // Surface Water Availability chart data
  const surfaceWaterData = useMemo(() => {
    // Use a representative time range from climate data or default
    const years = processedClimateData?.rcp26?.temp?.years || Array.from({ length: 81 }, (_, i) => 2020 + i);

    if (scenarioResult?.isSingleScenario) {
      // Single scenario - show one line
      const values = years.map(year => {
        const progress = (year - 2020) / 80;
        return 200 + progress * 50 + Math.sin(progress * Math.PI * 2) * 20;
      });

      return [{
        type: 'scatter',
        mode: 'lines',
        x: years,
        y: values,
        name: scenarioResult.primaryScenario || 'Current Scenario',
        line: { color: '#06b6d4', width: 3 },
        hovertemplate: '<b>Surface Water Availability</b><br>Year: %{x}<br>Value: %{y:.1f} ×10⁸ m³<extra></extra>'
      }];
    } else {
      // Multiple scenarios - show confidence interval
      const meanValues = years.map(year => {
        const progress = (year - 2020) / 80;
        return 200 + progress * 50 + Math.sin(progress * Math.PI * 2) * 20;
      });

      const upperValues = meanValues.map(val => val * 1.15);
      const lowerValues = meanValues.map(val => val * 0.85);

      return [
        {
          type: 'scatter',
          mode: 'lines',
          x: [...years, ...years.slice().reverse()],
          y: [...upperValues, ...lowerValues.slice().reverse()],
          fill: 'toself',
          fillcolor: 'rgba(6, 182, 212, 0.2)',
          line: { color: 'rgba(255,255,255,0)' },
          showlegend: false,
          hovertemplate: 'Confidence Interval<extra></extra>'
        },
        {
          type: 'scatter',
          mode: 'lines',
          x: years,
          y: meanValues,
          name: `Multiple Scenarios (n = ${scenarioResult?.count || '?'})`,
          line: { color: '#06b6d4', width: 3 },
          hovertemplate: '<b>Surface Water Availability (Mean)</b><br>Year: %{x}<br>Value: %{y:.1f} ×10⁸ m³<extra></extra>'
        }
      ];
    }
  }, [processedClimateData, scenarioResult]);

  // Show loading state
  if (loading) {
    return (
      <div className="bg-card rounded-lg border-2 border-dashed border-border p-6 h-full overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-cyan-500 flex items-center justify-center text-white shadow-lg mx-auto mb-4">
            <CloudRain className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Loading Climate Data...</h2>
          <p className="text-sm text-muted-foreground">Fetching RCP scenario data from server</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-card rounded-lg border-2 border-dashed border-border p-6 h-full overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg mx-auto mb-4">
            <CloudRain className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Error Loading Climate Data</h2>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
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
            <h1 className="text-4xl font-bold text-foreground">Climate Change Scenarios</h1>
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
                onClick={() => setSelectedScenario(key)}
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
              </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-4 h-[calc(100%-12rem)]">
        <div className="flex flex-col gap-4 min-h-0">
          <div className="flex-1 min-h-0">
            <PlotlyChart
              id="rcp-climate-scenarios"
              data={rcpPathwaysData}
              layout={{
                title: {
                  text: 'RCP Climate Scenario Pathways',
                  x: 0.5,
                  xanchor: 'center',
                  font: { size: 16 }
                },
                xaxis: {
                  title: 'Year',
                  range: [2020, 2100],
                  showgrid: true,
                  gridcolor: 'rgba(187, 187, 187, 0.3)'
                },
                yaxis: {
                  title: 'Temperature (°C)',
                  showgrid: true,
                  gridcolor: 'rgba(187, 187, 187, 0.3)'
                },
                plot_bgcolor: 'white',
                paper_bgcolor: 'transparent',
                height: 300,
                font: { family: 'Arial, sans-serif', size: 12 },
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
                  gridcolor: 'rgba(187, 187, 187, 0.3)'
                },
                yaxis: {
                  title: 'Temperature (°C)',
                  titlefont: { color: '#ef4444' },
                  tickfont: { color: '#ef4444' },
                  showgrid: true,
                  gridcolor: 'rgba(187, 187, 187, 0.3)',
                  side: 'left'
                },
                yaxis2: {
                  title: 'Precipitation (mm)',
                  titlefont: { color: '#3b82f6' },
                  tickfont: { color: '#3b82f6' },
                  overlaying: 'y',
                  side: 'right'
                },
                plot_bgcolor: 'white',
                paper_bgcolor: 'transparent',
                height: 300,
                font: { family: 'Arial, sans-serif', size: 12 },
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
              data={surfaceWaterData}
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
                  gridcolor: 'rgba(187, 187, 187, 0.3)'
                },
                yaxis: {
                  title: 'Surface Water (×10⁸ m³)',
                  showgrid: true,
                  gridcolor: 'rgba(187, 187, 187, 0.3)'
                },
                plot_bgcolor: 'white',
                paper_bgcolor: 'transparent',
                height: 400,
                font: { family: 'Arial, sans-serif', size: 12 },
                hovermode: 'x unified'
              }}
              config={{ responsive: true, displayModeBar: false }}
              height="100%"
            />
          </div>
          <div className="flex-1 bg-muted/50 rounded-lg p-4 overflow-y-auto">
            <h4 className="font-semibold text-foreground mb-3">
              {scenarios[selectedScenario].name}: Understanding the Scenario
            </h4>
            <div className="space-y-3 text-base text-foreground leading-relaxed">
              <p>{scenarios[selectedScenario].description}</p>
              <div className="mt-4 p-3 bg-card rounded-lg border">
                <div className="text-sm font-medium text-muted-foreground mb-2">Current Scenario Status</div>
                <div className="text-xs">
                  {scenarioResult?.isSingleScenario ? (
                    <div>
                      <div className="font-medium text-green-600">Single Scenario Mode</div>
                      <div>Scenario: {scenarioResult.primaryScenario}</div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium text-blue-600">Multiple Scenarios Mode</div>
                      <div>Scenarios: {scenarioResult?.count || '?'} scenarios</div>
                      <div>Showing mean ± confidence interval</div>
            </div>
                  )}
            </div>
          </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
