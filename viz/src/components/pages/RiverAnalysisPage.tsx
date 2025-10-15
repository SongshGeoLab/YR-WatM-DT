import React, { useMemo } from 'react';
import { PlotlyChart } from '../charts/PlotlyChart';
import { Activity } from 'lucide-react';

/**
 * River Analysis Page Component
 *
 * Displays two bubble charts analyzing global river characteristics:
 * 1. River discharge analysis - comparing basin area, river length, and annual discharge
 * 2. Sediment load analysis - comparing basin area, river length, and sediment load
 *
 * Data source: reports/page7.ipynb
 */
export default function RiverAnalysisPage() {
  // River discharge data
  const dischargeData = useMemo(() => {
    const rivers = [
      { name: 'Amazon', basin: 5888, length: 6300, discharge: 5467.49, perCapita: 169987.86 },
      { name: 'Congo', basin: 3689, length: 4700, discharge: 1337.60, perCapita: 14763.02 },
      { name: 'Danube', basin: 796, length: 2900, discharge: 208.44, perCapita: 2599.45 },
      { name: 'Ganges', basin: 980, length: 2200, discharge: 367.34, perCapita: 768.59 },
      { name: 'Indus', basin: 856, length: 3200, discharge: 71.22, perCapita: 375.02 },
      { name: 'Mississippi', basin: 3208, length: 5900, discharge: 550.76, perCapita: 7045.00 },
      { name: 'Niger', basin: 2112, length: 4000, discharge: 150.23, perCapita: 1605.00 },
      { name: 'Nile', basin: 2933, length: 6700, discharge: 66.75, perCapita: 383.00 },
      { name: 'Ob-Irsytch', basin: 3043, length: 5400, discharge: 403.87, perCapita: 13157.00 },
      { name: 'Parana / La Plata', basin: 2926, length: 4800, discharge: 516.67, perCapita: 5857.00 },
      { name: 'Rhine', basin: 164, length: 1400, discharge: 73.02, perCapita: 1495.00 },
      { name: 'Yangtze', basin: 1800, length: 6300, discharge: 871.12, perCapita: 1487.00 },
      { name: 'Yellow River', basin: 750, length: 5500, discharge: 37.19, perCapita: 244.00 },
      { name: 'Yenisey', basin: 2504, length: 4100, discharge: 568.93, perCapita: 72922.00 }
    ];

    return {
      x: rivers.map(r => r.basin),
      y: rivers.map(r => r.length),
      size: rivers.map(r => Math.pow(r.discharge, 0.5) / 1.5),
      color: rivers.map(r => Math.log10(r.perCapita)),
      text: rivers.map(r =>
        `<b>${r.name}</b><br>` +
        `Basin area: ${r.basin} km²<br>` +
        `River length: ${r.length} km<br>` +
        `Discharge: ${r.discharge.toFixed(1)}×10⁸ m³/a<br>` +
        `Per capita: ${r.perCapita.toFixed(0)} m³/a`
      ),
      rivers
    };
  }, []);

  // Sediment load data
  const sedimentData = useMemo(() => {
    const rivers = [
      { name: 'Amazon', basin: 5888, length: 6300, sediment: 14.70, concentration: 0.27 },
      { name: 'Congo', basin: 3689, length: 4700, sediment: 0.99, concentration: 0.07 },
      { name: 'Danube', basin: 796, length: 2900, sediment: 1.22, concentration: 0.59 },
      { name: 'Ganges', basin: 980, length: 2200, sediment: 6.11, concentration: 1.66 },
      { name: 'Indus', basin: 856, length: 3200, sediment: 2.60, concentration: 3.65 },
      { name: 'Mississippi', basin: 3208, length: 5900, sediment: 2.60, concentration: 0.47 },
      { name: 'Niger', basin: 2112, length: 4000, sediment: 0.51, concentration: 0.34 },
      { name: 'Nile', basin: 2933, length: 6700, sediment: 0.01, concentration: 0.02 },
      { name: 'Ob-Irsytch', basin: 3043, length: 5400, sediment: 0.50, concentration: 0.12 },
      { name: 'Parana / La Plata', basin: 2926, length: 4800, sediment: 0.90, concentration: 0.17 },
      { name: 'Rhine', basin: 164, length: 1400, sediment: 0.60, concentration: 0.82 },
      { name: 'Yangtze', basin: 1800, length: 6300, sediment: 6.50, concentration: 0.75 },
      { name: 'Yellow River', basin: 750, length: 5500, sediment: 8.83, concentration: 23.74 },
      { name: 'Yenisey', basin: 2504, length: 4100, sediment: 0.56, concentration: 0.10 },
      { name: 'Yellow River (recent)', basin: 750, length: 5500, sediment: 1.45, concentration: 7.87 }
    ];

    return {
      x: rivers.map(r => r.basin),
      y: rivers.map(r => r.length),
      size: rivers.map(r => Math.pow(r.sediment, 0.5) * 20),
      color: rivers.map(r => Math.log10(r.concentration)),
      text: rivers.map(r =>
        `<b>${r.name}</b><br>` +
        `Basin area: ${r.basin} km²<br>` +
        `River length: ${r.length} km<br>` +
        `Sediment load: ${r.sediment.toFixed(2)}×10⁸ t/a<br>` +
        `Concentration: ${r.concentration.toFixed(2)} kg·m⁻³`
      ),
      rivers
    };
  }, []);

  // Discharge chart layout
  const dischargeLayout = useMemo(() => {
    const yellowRiver = dischargeData.rivers.find(r => r.name === 'Yellow River');

    return {
      title: {
        text: 'River Discharge Analysis',
        x: 0.5,
        xanchor: 'center',
        font: { size: 18 }
      },
      xaxis: {
        title: 'Drainage basin area (km²)',
        range: [10, 6200],
        showgrid: true,
        // Grid styling will be set by PlotlyChart dark mode handler
      },
      yaxis: {
        title: 'River length (km)',
        range: [1010, 6990],
        showgrid: true,
        // Grid styling will be set by PlotlyChart dark mode handler
      },
      // Background colors will be set by PlotlyChart dark mode handler
      height: 700,
      font: { family: 'Inter, system-ui, sans-serif', size: 12 },
      hovermode: 'closest',
      shapes: yellowRiver ? [
        {
          type: 'line',
          x0: yellowRiver.basin,
          y0: 0,
          x1: yellowRiver.basin,
          y1: yellowRiver.length,
          line: { color: '#8E2D30', width: 1, dash: 'dash' }
        },
        {
          type: 'line',
          x0: 0,
          y0: yellowRiver.length,
          x1: yellowRiver.basin,
          y1: yellowRiver.length,
          line: { color: '#8E2D30', width: 1, dash: 'dash' }
        }
      ] : [],
      annotations: yellowRiver ? [
        {
          x: 750,
          y: 6100,
          text: 'Yellow River',
          showarrow: false,
          font: { size: 12, color: '#8E2D30' }
        },
        {
          x: 280,
          y: 5750,
          text: `Discharge =<br>${yellowRiver.discharge.toFixed(1)}×10⁸ m³/a`,
          showarrow: false,
          font: { size: 10, color: '#8E2D30' },
          align: 'left'
        }
      ] : []
    };
  }, [dischargeData]);

  // Sediment chart layout
  const sedimentLayout = useMemo(() => {
    const yellowRiver = sedimentData.rivers.find(r => r.name === 'Yellow River');

    return {
      title: {
        text: 'River Sediment Load Analysis',
        x: 0.5,
        xanchor: 'center',
        font: { size: 18 }
      },
      xaxis: {
        title: 'Drainage basin area (km²)',
        range: [10, 6200],
        showgrid: true,
        // Grid styling will be set by PlotlyChart dark mode handler
      },
      yaxis: {
        title: 'River length (km)',
        range: [1010, 6990],
        showgrid: true,
        // Grid styling will be set by PlotlyChart dark mode handler
      },
      // Background colors will be set by PlotlyChart dark mode handler
      height: 700,
      font: { family: 'Inter, system-ui, sans-serif', size: 12 },
      hovermode: 'closest',
      shapes: yellowRiver ? [
        {
          type: 'line',
          x0: yellowRiver.basin,
          y0: 0,
          x1: yellowRiver.basin,
          y1: yellowRiver.length,
          line: { color: '#8E2D30', width: 1, dash: 'dash' }
        },
        {
          type: 'line',
          x0: 0,
          y0: yellowRiver.length,
          x1: yellowRiver.basin,
          y1: yellowRiver.length,
          line: { color: '#8E2D30', width: 1, dash: 'dash' }
        }
      ] : [],
      annotations: yellowRiver ? [
        {
          x: 750,
          y: 6100,
          text: 'Yellow River',
          showarrow: false,
          font: { size: 12, color: '#8E2D30' }
        },
        {
          x: 280,
          y: 5750,
          text: `Sediment load =<br>${yellowRiver.sediment.toFixed(2)}×10⁸ t/a`,
          showarrow: false,
          font: { size: 10, color: '#8E2D30' },
          align: 'left'
        }
      ] : []
    };
  }, [sedimentData]);

  // Discharge chart data
  const dischargeChartData = useMemo(() => [{
    type: 'scatter',
    mode: 'markers',
    x: dischargeData.x,
    y: dischargeData.y,
    marker: {
      size: dischargeData.size,
      color: dischargeData.color,
      colorscale: [
        [0, '#E8C872'],
        [0.4, '#FFF3CF'],
        [0.6, '#C9D7DD'],
        [1, '#637A9F']
      ],
      showscale: true,
      colorbar: {
        title: {
          text: 'Annual discharge<br>per capita (m³/a)',
          side: 'right'
        },
        tickmode: 'array',
        tickvals: [3, 4, 5],
        ticktext: ['10³', '10⁴', '10⁵'],
        x: 1.02
      },
      line: { width: 0 }
    },
    text: dischargeData.text,
    hovertemplate: '%{text}<extra></extra>',
    name: 'Rivers'
  }], [dischargeData]);

  // Sediment chart data
  const sedimentChartData = useMemo(() => [{
    type: 'scatter',
    mode: 'markers',
    x: sedimentData.x,
    y: sedimentData.y,
    marker: {
      size: sedimentData.size,
      color: sedimentData.color,
      colorscale: [
        [0, '#637A9F'],
        [0.4, '#C9D7DD'],
        [0.6, '#FFF3CF'],
        [1, '#E8C872']
      ],
      showscale: true,
      colorbar: {
        title: {
          text: 'Sediment concentration<br>(kg·m⁻³)',
          side: 'right'
        },
        tickmode: 'array',
        tickvals: [-1, 0, 1],
        ticktext: ['0.1', '1', '10'],
        x: 1.02
      },
      line: { width: 0.5, color: 'white' }
    },
    text: sedimentData.text,
    hovertemplate: '%{text}<extra></extra>',
    name: 'Rivers'
  }], [sedimentData]);

  return (
    <div className="bg-card rounded-lg border-2 border-dashed border-border p-6 h-full overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-6 mb-6 flex-shrink-0">
        <div className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-lg">
          <Activity className="w-8 h-8" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-foreground">River Analysis</h1>
            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
              Page 7
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Global River Discharge and Sediment Load Comparison
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="mb-4 flex-shrink-0">
        <p className="text-foreground leading-relaxed text-base">
          <span className="font-medium">The Yellow River is globally famous for its exceptionally high sediment load
          relative to its water discharge.</span> This unique characteristic distinguishes it from other major river
          systems worldwide.
        </p>
      </div>

      {/* Charts Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Discharge Chart */}
        <div className="flex flex-col">
          <PlotlyChart
            id="discharge-chart"
            data={dischargeChartData}
            layout={dischargeLayout}
            config={{ responsive: true, displayModeBar: false }}
            height="700px"
          />
        </div>

        {/* Sediment Chart */}
        <div className="flex flex-col">
          <PlotlyChart
            id="sediment-chart"
            data={sedimentChartData}
            layout={sedimentLayout}
            config={{ responsive: true, displayModeBar: false }}
            height="700px"
          />
        </div>
      </div>
    </div>
  );
}
