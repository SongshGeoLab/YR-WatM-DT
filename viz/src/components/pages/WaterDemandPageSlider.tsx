import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/card';
import { PlotlyChart } from '../charts/PlotlyChart';
import { ParameterSlider } from '../ui/parameter-slider';
import * as api from '../../services/api';

// Dark mode detection helper
const isDarkMode = () => {
  if (typeof window !== 'undefined') {
    return document.documentElement.classList.contains('dark') ||
           window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
};

const WaterDemandPageSlider: React.FC = () => {
  // State management
  const [compositionData, setCompositionData] = useState<Plotly.Data[]>([]);
  const [compositionLayout, setCompositionLayout] = useState<any>({});
  const [timeSeriesData, setTimeSeriesData] = useState<Plotly.Data[]>([]);
  const [timeSeriesLayout, setTimeSeriesLayout] = useState<any>({});
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<any>(null);
  
  // Parameter control state
  const [waterSavingRatio, setWaterSavingRatio] = useState<number>(0.9);
  const [energyGeneration, setEnergyGeneration] = useState<number>(0.25);

  // Load data function
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build parameter values for scenario resolution
      const values: api.ParameterValues = {
        "water-saving irrigation efficiency ratio": waterSavingRatio,
        "fire generation share province target": energyGeneration,
        "Fertility Variation": 1.7, // Default values for other parameters
        "Ecological water flow variable": 0.25,
        "Climate change scenario switch for water yield": 1,
        "Diet change scenario switch": 1
      };

      // Resolve scenario
      const result = await api.resolveScenario(values);
      const scenario_name = result.scenario_name;

      // Get water demand categories data
      const waterCategories = [
        "irrigation water demand province sum",
        "production water demand province sum", 
        "OA water demand province sum",
        "domestic water demand province sum"
      ];

      // Load composition data (total across all time)
      const compositionPromises = waterCategories.map(async (category) => {
        const series = await api.getSeries(category, scenario_name, {
          start_step: 0,  // All time periods
          end_step: 1904
        });
        const totalValue = series.series.value.reduce((sum: number, val: number) => sum + val, 0);
        return { category, totalValue };
      });

      const compositionResults = await Promise.all(compositionPromises);
      const totalDemand = compositionResults.reduce((sum, item) => sum + item.totalValue, 0);

      // Calculate percentages and create composition chart
      const compositionChartData = compositionResults.map((item, index) => {
        const percentage = (item.totalValue / totalDemand) * 100;
        const categoryName = item.category
          .replace(' water demand province sum', '')
          .replace('irrigation', 'Irrigation')
          .replace('production', 'Production')
          .replace('OA', 'Other Activities')
          .replace('domestic', 'Domestic');
        
        return {
          category: categoryName,
          value: item.totalValue,
          percentage: percentage
        };
      });

      // Create treemap data for composition chart
      const treemapData: Plotly.Data = {
        type: 'treemap',
        labels: compositionChartData.map(item => item.category),
        parents: compositionChartData.map(() => ""),
        values: compositionChartData.map(item => item.value),
        text: compositionChartData.map(item => 
          `${item.category}<br>${item.category}<br>${item.percentage.toFixed(1)}%`
        ),
        textposition: "middle center",
        marker: {
          colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728'],
          line: { width: 2, color: 'white' }
        },
        hovertemplate: '<b>%{label}</b><br>Total Demand: %{value:.2e}<br>Percentage: %{percentRoot:.1f}%<extra></extra>'
      };

      setCompositionData([treemapData]);

      // Create composition chart layout
      const darkMode = isDarkMode();
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
        height: 500,
        margin: { t: 80, l: 10, r: 10, b: 10 },
        plot_bgcolor: darkMode ? '#1a1a1a' : '#ffffff',
        paper_bgcolor: darkMode ? '#1a1a1a' : '#ffffff'
      });

      // Load time series data (total water demand over time)
      const timeSeriesPromises = waterCategories.map(async (category) => {
        const series = await api.getSeries(category, scenario_name, {
          start_step: 624,  // 2020-2100
          end_step: 1904
        });
        return series.series.value;
      });

      const timeSeriesResults = await Promise.all(timeSeriesPromises);
      const timeData = await api.getSeries(waterCategories[0], scenario_name, {
        start_step: 624,
        end_step: 1904
      });

      // Calculate total demand for each time point
      const totalDemandTimeSeries = timeData.series.time.map((_: any, index: number) => {
        return timeSeriesResults.reduce((sum, categoryData) => sum + categoryData[index], 0);
      });

      // Calculate statistics
      const meanValue = totalDemandTimeSeries.reduce((a, b) => a + b, 0) / totalDemandTimeSeries.length;
      const maxValue = Math.max(...totalDemandTimeSeries);
      const minValue = Math.min(...totalDemandTimeSeries);
      const maxIndex = totalDemandTimeSeries.indexOf(maxValue);
      const minIndex = totalDemandTimeSeries.indexOf(minValue);

      // Create time series chart data
      const timeSeriesChartData: Plotly.Data[] = [
        {
          x: timeData.series.time,
          y: totalDemandTimeSeries,
          type: 'scatter',
          mode: 'lines',
          name: 'Mean Total Demand',
          line: { color: '#1f77b4', width: 2 },
          hovertemplate: 'Year: %{x:.0f}<br>Mean: %{y:.2e}<extra></extra>'
        }
      ];

      setTimeSeriesData(timeSeriesChartData);

      // Create time series chart layout
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
        height: 500,
        hovermode: 'x unified',
        legend: { x: 0.02, y: 0.98, bgcolor: darkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)' },
        plot_bgcolor: darkMode ? '#1a1a1a' : '#ffffff',
        paper_bgcolor: darkMode ? '#1a1a1a' : '#ffffff',
        template: darkMode ? 'plotly_dark' : 'plotly_white'
      });

      // Set statistics
      setStatistics({
        mean_value: meanValue,
        max_value: maxValue,
        max_year: timeData.series.time[maxIndex],
        min_value: minValue,
        min_year: timeData.series.time[minIndex],
        scenario: scenario_name,
        water_saving_ratio: waterSavingRatio,
        energy_generation: energyGeneration
      });

    } catch (err: any) {
      setError(err.message);
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [waterSavingRatio, energyGeneration]);

  // Load data on component mount and parameter changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Theme change listener
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => {
      setTimeout(() => {
        loadData();
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
  }, [loadData]);

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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
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
              <p className="font-medium">Water-saving: {statistics.water_saving_ratio}</p>
              <p className="font-medium">Energy generation: {statistics.energy_generation}</p>
              <p className="font-medium">Scenario: {statistics.scenario}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mean & Extremes</p>
              <p className="font-medium">Mean (2020-2100): {statistics.mean_value?.toFixed(2)} m³</p>
              <p className="font-medium">Max: {statistics.max_value?.toFixed(2)} m³ (Year {statistics.max_year?.toFixed(0)})</p>
              <p className="font-medium">Min: {statistics.min_value?.toFixed(2)} m³ (Year {statistics.min_year?.toFixed(0)})</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Trend Analysis</p>
              <p className="font-medium">Total Change: {((statistics.max_value - statistics.min_value) / statistics.min_value * 100).toFixed(1)}%</p>
              <p className="font-medium">Peak Year: {statistics.max_year?.toFixed(0)}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default WaterDemandPageSlider;
