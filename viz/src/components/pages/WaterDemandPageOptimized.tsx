import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/card';
import { PlotlyChart } from '../charts/PlotlyChart';
import { ParameterSlider } from '../ui/parameter-slider';

// Dark mode detection helper
const isDarkMode = () => {
  if (typeof window !== 'undefined') {
    return document.documentElement.classList.contains('dark') ||
           window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
};

// Pre-computed data structure (from Page5.ipynb exports)
interface WaterDemandData {
  parameters: {
    water_saving_ratio: number;
    energy_generation: number;
    other_constraints: Record<string, any>;
  };
  composition: {
    categories: string[];
    values: number[];
    percentages: number[];
  };
  time_series: {
    time: number[];
    mean: number[];
    ci_lower: number[];
    ci_upper: number[];
    min: number[];
    max: number[];
    n_scenarios: number;
  };
  statistics: {
    overall_mean: number;
    overall_std: number;
    max_value: number;
    max_year: number;
    min_value: number;
    min_year: number;
    modern_period_mean: number | null;
    modern_period_std: number | null;
    total_change: number | null;
    total_change_pct: number | null;
    annual_growth_rate: number | null;
    coefficient_of_variation: number;
    value_range: number;
  };
}

const WaterDemandPageOptimized: React.FC = () => {
  // State management
  const [compositionData, setCompositionData] = useState<Plotly.Data[]>([]);
  const [compositionLayout, setCompositionLayout] = useState<any>({});
  const [timeSeriesData, setTimeSeriesData] = useState<Plotly.Data[]>([]);
  const [timeSeriesLayout, setTimeSeriesLayout] = useState<any>({});
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [pageData, setPageData] = useState<WaterDemandData | null>(null);
  
  // Parameter control state
  const [waterSavingRatio, setWaterSavingRatio] = useState<number>(0.9);
  const [energyGeneration, setEnergyGeneration] = useState<number>(0.25);

  // Category colors matching Page5.ipynb
  const categoryColors: Record<string, string> = {
    'Irrigation': '#1f77b4',
    'Production': '#ff7f0e', 
    'Other Activities': '#2ca02c',
    'Domestic': '#d62728'
  };

  // Load pre-computed data from Page5.ipynb
  const loadPreComputedData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real application, this would fetch from the backend API
      // For now, we'll simulate loading the pre-computed data
      // The actual implementation would be:
      // const response = await fetch('/api/page5-data');
      // const data = await response.json();
      
      // For demo purposes, we'll create mock data based on Page5.ipynb structure
      const mockData: WaterDemandData = {
        parameters: {
          water_saving_ratio: waterSavingRatio,
          energy_generation: energyGeneration,
          other_constraints: {}
        },
        composition: {
          categories: ['Irrigation', 'Production', 'Domestic', 'Other Activities'],
          values: [2.1140e7, 8.4693e6, 4.3235e6, 6735.49894],
          percentages: [62.287267, 24.954121, 12.738767, 0.019846]
        },
        time_series: {
          time: Array.from({ length: 81 }, (_, i) => 2020 + i),
          mean: Array.from({ length: 81 }, (_, i) => 132 + Math.sin(i / 10) * 10 + Math.random() * 5),
          ci_lower: Array.from({ length: 81 }, (_, i) => 125 + Math.sin(i / 10) * 8),
          ci_upper: Array.from({ length: 81 }, (_, i) => 139 + Math.sin(i / 10) * 12),
          min: Array.from({ length: 81 }, (_, i) => 120 + Math.sin(i / 10) * 6),
          max: Array.from({ length: 81 }, (_, i) => 145 + Math.sin(i / 10) * 15),
          n_scenarios: 135
        },
        statistics: {
          overall_mean: 132.0,
          overall_std: 13.2,
          max_value: 144.0,
          max_year: 2046,
          min_value: 98.4,
          min_year: 1981,
          modern_period_mean: 137.0,
          modern_period_std: 8.34,
          total_change: 36.8,
          total_change_pct: 37.39,
          annual_growth_rate: 0.00267,
          coefficient_of_variation: 10.02,
          value_range: 45.6
        }
      };

      setPageData(mockData);
      await updateCharts(mockData);

    } catch (err: any) {
      setError(err.message);
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [waterSavingRatio, energyGeneration]);

  // Update charts with current data
  const updateCharts = useCallback(async (data: WaterDemandData) => {
    const darkMode = isDarkMode();

    // Create composition chart (TreeMap)
    const compositionChartData: Plotly.Data = {
      type: 'treemap',
      labels: data.composition.categories,
      parents: data.composition.categories.map(() => ""),
      values: data.composition.values,
      text: data.composition.categories.map((category, index) => 
        `${category}<br>${category}<br>${data.composition.percentages[index].toFixed(1)}%`
      ),
      textposition: "middle center",
      marker: {
        colors: data.composition.categories.map(cat => categoryColors[cat] || '#1f77b4'),
        line: { width: 2, color: 'white' }
      },
      hovertemplate: '<b>%{label}</b><br>Total Demand: %{value:.2e}<br>Percentage: %{percentRoot:.1f}%<extra></extra>'
    };

    setCompositionData([compositionChartData]);

    setCompositionLayout({
      title: {
        text: `Water Demand Composition<br><sub>Water-saving ratio: ${waterSavingRatio}, Energy generation: ${energyGeneration}</sub>`,
        x: 0.5,
        xanchor: 'center',
        font: {
          size: 16,
          family: 'Arial',
          color: darkMode ? '#ffffff' : '#000000'
        }
      },
      height: 400,
      margin: { t: 80, l: 10, r: 10, b: 10 },
      plot_bgcolor: darkMode ? '#1a1a1a' : '#ffffff',
      paper_bgcolor: darkMode ? '#1a1a1a' : '#ffffff'
    });

    // Create time series chart
    const timeSeriesChartData: Plotly.Data[] = [
      // Confidence interval band
      {
        x: data.time_series.time,
        y: data.time_series.ci_upper,
        mode: 'lines',
        line: { width: 0 },
        showlegend: false,
        hoverinfo: 'skip'
      },
      {
        x: data.time_series.time,
        y: data.time_series.ci_lower,
        mode: 'lines',
        line: { width: 0 },
        fillcolor: 'rgba(68, 68, 68, 0.2)',
        fill: 'tonexty',
        name: '95% CI',
        hovertemplate: '95% CI: %{y:.2e}<extra></extra>'
      },
      // Mean line
      {
        x: data.time_series.time,
        y: data.time_series.mean,
        type: 'scatter',
        mode: 'lines',
        name: 'Mean Total Demand',
        line: { color: '#1f77b4', width: 2 },
        hovertemplate: 'Year: %{x:.0f}<br>Mean: %{y:.2e}<extra></extra>'
      },
      // Min-Max range
      {
        x: data.time_series.time,
        y: data.time_series.max,
        mode: 'lines',
        line: { width: 0 },
        showlegend: false,
        hoverinfo: 'skip'
      },
      {
        x: data.time_series.time,
        y: data.time_series.min,
        mode: 'lines',
        line: { width: 0 },
        fillcolor: 'rgba(180, 180, 180, 0.1)',
        fill: 'tonexty',
        name: 'Min-Max Range',
        hovertemplate: 'Min-Max: %{y:.2e}<extra></extra>'
      }
    ];

    setTimeSeriesData(timeSeriesChartData);

    setTimeSeriesLayout({
      title: {
        text: `Total Water Demand Time Series<br><sub>Water-saving ratio: ${waterSavingRatio}, Energy generation: ${energyGeneration}</sub>`,
        x: 0.5,
        xanchor: 'center',
        font: {
          size: 16,
          family: 'Arial',
          color: darkMode ? '#ffffff' : '#000000'
        }
      },
      xaxis: {
        title: 'Year',
        range: [2020, 2100],
        showgrid: true,
        gridwidth: 1,
        gridcolor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(128, 128, 128, 0.2)',
        color: darkMode ? '#ffffff' : '#000000',
        titlefont: { color: darkMode ? '#ffffff' : '#000000' },
        tickfont: { color: darkMode ? '#ffffff' : '#000000' }
      },
      yaxis: {
        title: 'Total Water Demand (m³)',
        showgrid: true,
        gridwidth: 1,
        gridcolor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(128, 128, 128, 0.2)',
        color: darkMode ? '#ffffff' : '#000000',
        titlefont: { color: darkMode ? '#ffffff' : '#000000' },
        tickfont: { color: darkMode ? '#ffffff' : '#000000' }
      },
      height: 400,
      hovermode: 'x unified',
      legend: { 
        x: 0.02, 
        y: 0.98, 
        bgcolor: darkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
        bordercolor: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
        borderwidth: 1
      },
      plot_bgcolor: darkMode ? '#1a1a1a' : '#ffffff',
      paper_bgcolor: darkMode ? '#1a1a1a' : '#ffffff',
      template: darkMode ? 'plotly_dark' : 'plotly_white'
    });

    // Set statistics
    setStatistics(data.statistics);

  }, [waterSavingRatio, energyGeneration]);

  // Load data on component mount and parameter changes
  useEffect(() => {
    loadPreComputedData();
  }, [loadPreComputedData]);

  // Theme change listener
  useEffect(() => {
    if (!pageData) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => {
      setTimeout(() => {
        updateCharts(pageData);
      }, 100);
    };

    mediaQuery.addEventListener('change', handleThemeChange);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          handleThemeChange();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
      observer.disconnect();
    };
  }, [pageData, updateCharts]);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Water Demand Analysis</h1>
        <p className="text-muted-foreground">
          Analyze water demand composition and trends based on water-saving efficiency and energy generation parameters.
        </p>
      </div>

      {/* Parameter Controls */}
      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ParameterSlider
            label="Water-saving Irrigation Efficiency Ratio"
            min={0.8}
            max={1.0}
            step={0.05}
            defaultValue={waterSavingRatio}
            unit=""
            description="Efficiency ratio of water-saving irrigation technology in agriculture"
            onChange={(value) => setWaterSavingRatio(value)}
          />

          <ParameterSlider
            label="Fire Generation Share Province Target"
            min={0.1}
            max={0.4}
            step={0.05}
            defaultValue={energyGeneration}
            unit=""
            description="Target share of fire-based power generation at provincial level"
            onChange={(value) => setEnergyGeneration(value)}
          />
        </div>
      </div>

      {/* Loading and Error States */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading data...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Charts Grid - Following Figma Design */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: Water Demand Composition */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Water Demand Composition</h3>
            <p className="text-sm text-muted-foreground">
              Proportional breakdown of water demand by sector and region
            </p>
          </div>
          
          {!loading && !error && compositionData.length > 0 && (
            <PlotlyChart
              id="water-demand-composition"
              height="400px"
              data={compositionData}
              layout={compositionLayout}
              config={{ responsive: true, displaylogo: false }}
            />
          )}
          
          <div className="mt-4 text-sm text-muted-foreground">
            Ready for data integration
          </div>
        </Card>

        {/* Right Card: Total Water Demand Time Series */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Total Water Demand Time Series</h3>
            <p className="text-sm text-muted-foreground">
              Temporal trends in total water demand (2020-2100)
            </p>
          </div>
          
          {!loading && !error && timeSeriesData.length > 0 && (
            <PlotlyChart
              id="water-demand-timeseries"
              height="400px"
              data={timeSeriesData}
              layout={timeSeriesLayout}
              config={{ responsive: true, displaylogo: false }}
            />
          )}
          
          <div className="mt-4 text-sm text-muted-foreground">
            Ready for data integration
          </div>
        </Card>
      </div>

      {/* Statistics Panel */}
      {statistics && (
        <Card className="p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">Key Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Parameters</p>
              <p className="font-medium">Water-saving: {waterSavingRatio}</p>
              <p className="font-medium">Energy generation: {energyGeneration}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mean & Extremes</p>
              <p className="font-medium">Mean: {statistics.overall_mean?.toFixed(2)} m³</p>
              <p className="font-medium">Max: {statistics.max_value?.toFixed(2)} m³ (Year {statistics.max_year?.toFixed(0)})</p>
              <p className="font-medium">Min: {statistics.min_value?.toFixed(2)} m³ (Year {statistics.min_year?.toFixed(0)})</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Trend Analysis</p>
              <p className="font-medium">Total Change: {statistics.total_change_pct?.toFixed(1)}%</p>
              <p className="font-medium">Annual Growth: {(statistics.annual_growth_rate * 100)?.toFixed(3)}%</p>
              <p className="font-medium">Coefficient of Variation: {statistics.coefficient_of_variation?.toFixed(2)}%</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default WaterDemandPageOptimized;
