import React, { useState, useMemo } from 'react';
import { PlotlyChart } from '../charts/PlotlyChart';
import { CloudRain } from 'lucide-react';
import { useScenario } from '../../contexts/ScenarioContext';

/**
 * Water Availability Page Component
 *
 * Displays climate change scenarios (RCP pathways) and their impact
 * on surface water availability in the Yellow River Basin.
 */
export default function WaterAvailabilityPage() {
  const [selectedScenario, setSelectedScenario] = useState('RCP2.6');
  const { parameters, scenarioResult } = useScenario();

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

  // Generate climate data for different RCP scenarios
  const climateData = useMemo(() => {
    const years = Array.from({ length: 81 }, (_, i) => 2020 + i);

    return {
      years,
      rcp26: {
        temp: years.map(year => {
          const progress = (year - 2020) / 80;
          return 15 + progress * 1.5 + Math.sin(progress * Math.PI * 4) * 0.3;
        }),
        precip: years.map(year => {
          const progress = (year - 2020) / 80;
          return 450 + progress * 20 + Math.sin(progress * Math.PI * 3) * 15;
        })
      },
      rcp45: {
        temp: years.map(year => {
          const progress = (year - 2020) / 80;
          return 15 + progress * 2.5 + Math.sin(progress * Math.PI * 4) * 0.4;
        }),
        precip: years.map(year => {
          const progress = (year - 2020) / 80;
          return 450 + progress * 10 + Math.sin(progress * Math.PI * 3) * 20;
        })
      },
      rcp85: {
        temp: years.map(year => {
          const progress = (year - 2020) / 80;
          return 15 + progress * 4.5 + Math.sin(progress * Math.PI * 4) * 0.5;
        }),
        precip: years.map(year => {
          const progress = (year - 2020) / 80;
          return 450 - progress * 15 + Math.sin(progress * Math.PI * 3) * 25;
        })
      }
    };
  }, []);

  // RCP Climate Scenario Pathways chart data
  const rcpPathwaysData = useMemo(() => [
    {
      type: 'scatter',
      mode: 'lines',
      x: climateData.years,
      y: climateData.rcp26.temp,
      name: 'RCP2.6-SSP1',
      line: { color: '#10b981', width: 3 },
      hovertemplate: '<b>RCP2.6-SSP1</b><br>Year: %{x}<br>Temperature: %{y:.2f}°C<extra></extra>'
    },
    {
      type: 'scatter',
      mode: 'lines',
      x: climateData.years,
      y: climateData.rcp45.temp,
      name: 'RCP4.5-SSP2',
      line: { color: '#f59e0b', width: 3 },
      hovertemplate: '<b>RCP4.5-SSP2</b><br>Year: %{x}<br>Temperature: %{y:.2f}°C<extra></extra>'
    },
    {
      type: 'scatter',
      mode: 'lines',
      x: climateData.years,
      y: climateData.rcp85.temp,
      name: 'RCP8.5-SSP5',
      line: { color: '#ef4444', width: 3 },
      hovertemplate: '<b>RCP8.5-SSP5</b><br>Year: %{x}<br>Temperature: %{y:.2f}°C<extra></extra>'
    }
  ], [climateData]);

  // Temperature & Precipitation Trends chart data
  const tempPrecipData = useMemo(() => {
    const selectedData = climateData[selectedScenario.toLowerCase().replace('.', '')];

    return [
      {
        type: 'scatter',
        mode: 'lines',
        x: climateData.years,
        y: selectedData.temp,
        name: 'Temperature',
        yaxis: 'y',
        line: { color: '#ef4444', width: 3 },
        hovertemplate: '<b>Temperature</b><br>Year: %{x}<br>Value: %{y:.2f}°C<extra></extra>'
      },
      {
        type: 'scatter',
        mode: 'lines',
        x: climateData.years,
        y: selectedData.precip,
        name: 'Precipitation',
        yaxis: 'y2',
        line: { color: '#3b82f6', width: 3 },
        hovertemplate: '<b>Precipitation</b><br>Year: %{x}<br>Value: %{y:.1f} mm<extra></extra>'
      }
    ];
  }, [climateData, selectedScenario]);

  // Surface Water Availability chart data
  const surfaceWaterData = useMemo(() => {
    const years = climateData.years;

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
  }, [climateData.years, scenarioResult]);

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
