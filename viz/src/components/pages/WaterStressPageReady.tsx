import React, { useState, useEffect } from 'react';
import { Gauge } from 'lucide-react';
import { PlotlyChart } from '../charts/PlotlyChart';

/**
 * Water Stress Page with embedded mock data
 * No API dependency - works immediately
 */
const WaterStressPageReady: React.FC = () => {
  const [plotlyConfig, setPlotlyConfig] = useState<any>(null);
  const [wsiData, setWsiData] = useState<any>(null);

  // Check if dark mode is enabled
  const isDarkMode = () => {
    return document.documentElement.classList.contains('dark') ||
           window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  useEffect(() => {
    // Generate mock time series data
    const timePoints = 120; // 120 years
    const startYear = 1981;
    const time = Array.from({ length: timePoints }, (_, i) => startYear + i);

    // Generate realistic WSI patterns
    const mean = time.map((year, i) => {
      const base = 0.55;
      const trend = 0.0001 * (year - startYear);
      const seasonal = 0.15 * Math.sin((i / timePoints) * Math.PI * 4);
      const noise = 0.05 * (Math.random() - 0.5);
      return base + trend + seasonal + noise;
    });

    const median = mean.map(v => v - 0.02 + 0.01 * Math.random());
    const p10 = mean.map(v => v - 0.15);
    const p90 = mean.map(v => v + 0.15);

    // Mock data
    const mockData = {
      metadata: {
        variable: "YRB WSI",
        time_range: { start: startYear, end: startYear + timePoints - 1 },
        n_scenarios: 4725
      },
      statistics: {
        overall: {
          mean: 0.7137,
          max: { value: 0.9748, year: 1997, scenario: "sc_0" },
          min: { value: 0.4284, year: 1983, scenario: "sc_0" },
          range: 0.5465,
          trend: { annual_rate: 0.000118, total_change: 0.1062 }
        },
        critical_periods: {
          threshold_high: 0.4,
          threshold_critical: 0.6,
          critical_years: 1781,
          high_stress_years: 124
        }
      }
    };

    const darkMode = isDarkMode();

    // Create Plotly configuration
    const config = {
      data: [
        // P90 upper bound
        {
          type: "scatter",
          x: time,
          y: p90,
          mode: "lines",
          line: { width: 0 },
          showlegend: false,
          hoverinfo: "skip"
        },
        // P10 lower bound with fill
        {
          type: "scatter",
          x: time,
          y: p10,
          fill: "tonexty",
          mode: "lines",
          line: { width: 0 },
          fillcolor: darkMode ? "rgba(100, 150, 255, 0.3)" : "rgba(68, 138, 255, 0.2)",
          name: "10th-90th Percentile",
          hovertemplate: "Year: %{x}<br>Confidence Interval<extra></extra>"
        },
        // Mean line
        {
          type: "scatter",
          x: time,
          y: mean,
          mode: "lines",
          line: {
            color: darkMode ? "#4A9EFF" : "#1f77b4",
            width: 2.5
          },
          name: "Mean WSI",
          hovertemplate: "Year: %{x}<br>Mean WSI: %{y:.4f}<extra></extra>"
        },
        // Median line
        {
          type: "scatter",
          x: time,
          y: median,
          mode: "lines",
          line: {
            color: darkMode ? "#4ADE80" : "#2ca02c",
            width: 1.5,
            dash: "dash"
          },
          name: "Median WSI",
          hovertemplate: "Year: %{x}<br>Median WSI: %{y:.4f}<extra></extra>"
        }
      ],
      layout: {
        title: {
          text: "Water Stress Index (WSI) Time Series Analysis<br><sub>Yellow River Basin - Mean and Confidence Interval</sub>",
          x: 0.5,
          xanchor: "center",
          font: {
            color: darkMode ? '#ffffff' : '#000000',
            size: 16
          }
        },
        xaxis: {
          title: "Year",
          color: darkMode ? '#ffffff' : '#000000',
          gridcolor: darkMode ? '#333333' : '#e5e5e5',
          linecolor: darkMode ? '#666666' : '#cccccc'
        },
        yaxis: {
          title: "Water Stress Index (WSI)",
          color: darkMode ? '#ffffff' : '#000000',
          gridcolor: darkMode ? '#333333' : '#e5e5e5',
          linecolor: darkMode ? '#666666' : '#cccccc'
        },
        hovermode: "x unified",
        plot_bgcolor: darkMode ? '#1a1a1a' : '#ffffff',
        paper_bgcolor: darkMode ? '#1a1a1a' : '#ffffff',
        height: 450,
        margin: { t: 80, b: 60, l: 60, r: 20 },
        legend: {
          orientation: "h",
          yanchor: "bottom",
          y: 1.02,
          xanchor: "right",
          x: 1,
          font: { color: darkMode ? '#ffffff' : '#000000' }
        },
        shapes: [
          // High stress threshold line
          {
            type: "line",
            x0: startYear,
            x1: startYear + timePoints - 1,
            y0: 0.4,
            y1: 0.4,
            line: { dash: "dot", color: "orange", width: 2 }
          },
          // Critical stress threshold line
          {
            type: "line",
            x0: startYear,
            x1: startYear + timePoints - 1,
            y0: 0.6,
            y1: 0.6,
            line: { dash: "dot", color: "red", width: 2 }
          }
        ],
        annotations: [
          {
            x: startYear + timePoints - 1,
            y: 0.4,
            text: "High Stress (0.4)",
            showarrow: false,
            xanchor: "right",
            font: { color: darkMode ? '#FFA500' : 'orange' }
          },
          {
            x: startYear + timePoints - 1,
            y: 0.6,
            text: "Critical Stress (0.6)",
            showarrow: false,
            xanchor: "right",
            font: { color: darkMode ? '#FF6B6B' : 'red' }
          }
        ]
      },
      config: {
        responsive: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['pan2d', 'lasso2d']
      }
    };

    setWsiData(mockData);
    setPlotlyConfig(config);
  }, []);

  // Handle theme changes - regenerate chart config without reloading page
  useEffect(() => {
    const handleThemeChange = () => {
      if (!wsiData) return;

      const darkMode = isDarkMode();
      const timePoints = 120;
      const startYear = 1981;
      const time = Array.from({ length: timePoints }, (_, i) => startYear + i);

      const mean = time.map((year, i) => {
        const base = 0.55;
        const trend = 0.0001 * (year - startYear);
        const seasonal = 0.15 * Math.sin((i / timePoints) * Math.PI * 4);
        const noise = 0.05 * (Math.random() - 0.5);
        return base + trend + seasonal + noise;
      });

      const median = mean.map(v => v - 0.02 + 0.01 * Math.random());
      const p10 = mean.map(v => v - 0.15);
      const p90 = mean.map(v => v + 0.15);

      const newConfig = {
        data: [
          {
            type: "scatter",
            x: time,
            y: p90,
            mode: "lines",
            line: { width: 0 },
            showlegend: false,
            hoverinfo: "skip"
          },
          {
            type: "scatter",
            x: time,
            y: p10,
            fill: "tonexty",
            mode: "lines",
            line: { width: 0 },
            fillcolor: darkMode ? "rgba(100, 150, 255, 0.3)" : "rgba(68, 138, 255, 0.2)",
            name: "10th-90th Percentile",
            hovertemplate: "Year: %{x}<br>Confidence Interval<extra></extra>"
          },
          {
            type: "scatter",
            x: time,
            y: mean,
            mode: "lines",
            line: {
              color: darkMode ? "#4A9EFF" : "#1f77b4",
              width: 2.5
            },
            name: "Mean WSI",
            hovertemplate: "Year: %{x}<br>Mean WSI: %{y:.4f}<extra></extra>"
          },
          {
            type: "scatter",
            x: time,
            y: median,
            mode: "lines",
            line: {
              color: darkMode ? "#4ADE80" : "#2ca02c",
              width: 1.5,
              dash: "dash"
            },
            name: "Median WSI",
            hovertemplate: "Year: %{x}<br>Median WSI: %{y:.4f}<extra></extra>"
          }
        ],
        layout: {
          title: {
            text: "Water Stress Index (WSI) Time Series Analysis<br><sub>Yellow River Basin - Mean and Confidence Interval</sub>",
            x: 0.5,
            xanchor: "center",
            font: {
              color: darkMode ? '#ffffff' : '#000000',
              size: 16
            }
          },
          xaxis: {
            title: "Year",
            color: darkMode ? '#ffffff' : '#000000',
            gridcolor: darkMode ? '#333333' : '#e5e5e5',
            linecolor: darkMode ? '#666666' : '#cccccc'
          },
          yaxis: {
            title: "Water Stress Index (WSI)",
            color: darkMode ? '#ffffff' : '#000000',
            gridcolor: darkMode ? '#333333' : '#e5e5e5',
            linecolor: darkMode ? '#666666' : '#cccccc'
          },
          hovermode: "x unified",
          plot_bgcolor: darkMode ? '#1a1a1a' : '#ffffff',
          paper_bgcolor: darkMode ? '#1a1a1a' : '#ffffff',
          height: 450,
          margin: { t: 80, b: 60, l: 60, r: 20 },
          legend: {
            orientation: "h",
            yanchor: "bottom",
            y: 1.02,
            xanchor: "right",
            x: 1,
            font: { color: darkMode ? '#ffffff' : '#000000' }
          },
          shapes: [
            {
              type: "line",
              x0: startYear,
              x1: startYear + timePoints - 1,
              y0: 0.4,
              y1: 0.4,
              line: { dash: "dot", color: "orange", width: 2 }
            },
            {
              type: "line",
              x0: startYear,
              x1: startYear + timePoints - 1,
              y0: 0.6,
              y1: 0.6,
              line: { dash: "dot", color: "red", width: 2 }
            }
          ],
          annotations: [
            {
              x: startYear + timePoints - 1,
              y: 0.4,
              text: "High Stress (0.4)",
              showarrow: false,
              xanchor: "right",
              font: { color: darkMode ? '#FFA500' : 'orange' }
            },
            {
              x: startYear + timePoints - 1,
              y: 0.6,
              text: "Critical Stress (0.6)",
              showarrow: false,
              xanchor: "right",
              font: { color: darkMode ? '#FF6B6B' : 'red' }
            }
          ]
        },
        config: {
          responsive: true,
          displaylogo: false,
          modeBarButtonsToRemove: ['pan2d', 'lasso2d']
        }
      };

      setPlotlyConfig(newConfig);
    };

    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, [wsiData]);

  if (!plotlyConfig || !wsiData) {
    return (
      <div className="bg-card rounded-lg border-2 border-dashed border-border p-6 h-full overflow-hidden">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Initializing Water Stress Index...</p>
          </div>
        </div>
      </div>
    );
  }

  const stats = wsiData.statistics;

  return (
    <div className="bg-card rounded-lg border-2 border-dashed border-border p-6 h-full overflow-hidden">
      <div className="flex items-center gap-6 mb-6">
        <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg">
          <Gauge className="w-8 h-8" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-foreground">Water Stress</h1>
            <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm font-medium">
              Page 6
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Water Stress Index & Critical Threshold Analysis</p>
        </div>
      </div>

      <div className="space-y-4 h-[calc(100%-4rem)] flex flex-col">
        {/* Description */}
        <div className="text-foreground leading-relaxed text-base flex-shrink-0">
          <p>
            Almost all climate and socioeconomic changes will affect the water balance pressure in the YRB.
            <span className="font-medium"> The water stress index combines demand-to-supply ratios with seasonal variability patterns,</span> showing
            critical stress levels projected to emerge clearly by 2050 across multiple scenarios.
            Peak stress occurs during summer months when irrigation demand coincides with reduced precipitation.
          </p>
        </div>

        {/* Main Chart - Takes most of the space */}
        <div className="flex-1 min-h-0">
          <PlotlyChart
            id="water-stress-index-timeseries"
            title=""
            description=""
            height="100%"
            data={plotlyConfig.data}
            layout={plotlyConfig.layout}
            config={plotlyConfig.config}
            className="h-full"
          />
        </div>

        {/* Statistics Dashboard - Bottom */}
        <div className="grid grid-cols-4 gap-3 flex-shrink-0">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-700 dark:text-red-300">
              {stats.critical_periods.threshold_critical.toFixed(1)}
            </div>
            <div className="text-sm text-red-600 dark:text-red-400">Critical Stress</div>
            <div className="text-xs text-red-500 dark:text-red-500 mt-1">Threshold Line</div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              {stats.critical_periods.threshold_high.toFixed(1)}
            </div>
            <div className="text-sm text-orange-600 dark:text-orange-400">High Stress</div>
            <div className="text-xs text-orange-500 dark:text-orange-500 mt-1">Warning Level</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {stats.overall.max.year}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">Peak Year</div>
            <div className="text-xs text-blue-500 dark:text-blue-500 mt-1">
              WSI: {stats.overall.max.value.toFixed(3)}
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {wsiData.metadata.time_range.end - wsiData.metadata.time_range.start + 1}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">Analysis Period</div>
            <div className="text-xs text-green-500 dark:text-green-500 mt-1">
              {wsiData.metadata.time_range.start}-{wsiData.metadata.time_range.end}
            </div>
          </div>
        </div>

        {/* Additional Statistics Row */}
        <div className="grid grid-cols-3 gap-3 flex-shrink-0">
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
              {stats.overall.mean.toFixed(3)}
            </div>
            <div className="text-sm text-purple-600 dark:text-purple-400">Multi-year Average</div>
            <div className="text-xs text-purple-500 dark:text-purple-500 mt-1">WSI Value</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
              {(stats.overall.trend.annual_rate * 1000).toFixed(2)}
            </div>
            <div className="text-sm text-yellow-600 dark:text-yellow-400">Annual Trend</div>
            <div className="text-xs text-yellow-500 dark:text-yellow-500 mt-1">×10⁻³ per year</div>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
              {stats.critical_periods.critical_years}
            </div>
            <div className="text-sm text-indigo-600 dark:text-indigo-400">Critical Years</div>
            <div className="text-xs text-indigo-500 dark:text-indigo-500 mt-1">
              WSI &gt; {stats.critical_periods.threshold_critical.toFixed(1)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaterStressPageReady;
