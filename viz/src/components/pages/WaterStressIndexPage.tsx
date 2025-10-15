import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../ui/card';
import { PlotlyChart } from '../charts/PlotlyChart';
import { ParameterSlider } from '../ui/parameter-slider';
import { useScenario, useScenarioSeries } from '../../contexts/ScenarioContext';
import { getWaterStressConfig, WaterStressConfig } from '../../services/config';
import { AlertTriangle, Droplet, Gauge, TrendingUp, TrendingDown } from 'lucide-react';

/**
 * Water Stress Index Gauge Component
 * Shows current water stress level with color-coded gauge
 */
const WaterStressGauge = React.memo(({
  currentValue,
  threshold,
  config
}: {
  currentValue: number;
  threshold: number;
  config: WaterStressConfig;
}) => {
  const getStressLevel = (value: number) => {
    if (value < 0.2) return 'low';
    if (value < threshold) return 'moderate';
    return 'high';
  };

  const stressLevel = getStressLevel(currentValue);
  const color = config?.colors?.[stressLevel] || '#6366f1';
  const label = config?.labels?.en?.[stressLevel] || 'Unknown';

  // Calculate gauge angle (0-180 degrees)
  const angle = Math.min(currentValue * 180, 180);
  const percentage = Math.min(currentValue * 100, 100);

  return (
    <div className="relative w-64 h-64 mx-auto">
      {/* Gauge Background */}
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 100">
        {/* Background Arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted-foreground/20"
        />

        {/* Low Stress Arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 56 100"
          fill="none"
          stroke={config.colors.low}
          strokeWidth="8"
          opacity="0.7"
        />

        {/* Moderate Stress Arc */}
        <path
          d="M 56 100 A 80 80 0 0 1 92 100"
          fill="none"
          stroke={config.colors.moderate}
          strokeWidth="8"
          opacity="0.7"
        />

        {/* High Stress Arc */}
        <path
          d="M 92 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={config.colors.high}
          strokeWidth="8"
          opacity="0.7"
        />

        {/* Current Value Arc */}
        <path
          d={`M 20 100 A 80 80 0 0 1 ${20 + angle * 0.89} 100`}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Needle */}
        <line
          x1="100"
          y1="100"
          x2={100 + 70 * Math.cos((angle - 90) * Math.PI / 180)}
          y2={100 + 70 * Math.sin((angle - 90) * Math.PI / 180)}
          stroke="currentColor"
          strokeWidth="3"
          className="text-foreground"
        />

        {/* Center Dot */}
        <circle cx="100" cy="100" r="6" fill="currentColor" className="text-foreground" />
      </svg>

      {/* Center Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
        <div className="text-3xl font-bold" style={{ color }}>
          {percentage.toFixed(1)}%
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          {label}
        </div>
      </div>
    </div>
  );
});

/**
 * Water Stress Time Series Chart
 * Shows water stress index over time with threshold lines
 */
const WaterStressTimeSeriesChart = React.memo(({
  wsiData,
  scenarioResult,
  threshold,
  config,
  showThresholds = true
}: {
  wsiData: any;
  scenarioResult: any;
  threshold: number;
  config: WaterStressConfig;
  showThresholds?: boolean;
}) => {
  const plotData = useMemo(() => {
    if (!wsiData?.series) return [];

    const series = wsiData.series;
    const traces: any[] = [];

    if (scenarioResult && !scenarioResult.isSingleScenario) {
      // Multi-scenario mode - show confidence intervals
      const mean = series.mean || series.value;
      const variance = series.ci_upper ?
        series.ci_upper.map((val: number, i: number) => val - mean[i]) :
        mean.map((val: number) => val * 0.1);

      // Lower bound (invisible)
      traces.push({
        x: series.time,
        y: series.ci_lower || mean.map((val: number, i: number) => val - variance[i]),
        type: 'scatter',
        mode: 'lines',
        line: { width: 0 },
        showlegend: false,
        hoverinfo: 'skip',
      });

      // Upper bound (invisible)
      traces.push({
        x: series.time,
        y: series.ci_upper || mean.map((val: number, i: number) => val + variance[i]),
        type: 'scatter',
        mode: 'lines',
        line: { width: 0 },
        showlegend: false,
        hoverinfo: 'skip',
        fill: 'tonexty',
        fillcolor: 'rgba(99, 102, 241, 0.1)',
      });

      // Mean line
      traces.push({
        x: series.time,
        y: mean,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Water Stress Index',
        line: {
          color: '#6366f1',
          width: 3
        },
        marker: {
          size: 4,
          color: '#6366f1'
        }
      });
    } else {
      // Single scenario mode
      traces.push({
        x: series.time,
        y: series.value,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Water Stress Index',
        line: {
          color: '#6366f1',
          width: 3
        },
        marker: {
          size: 4,
          color: '#6366f1'
        }
      });
    }

    return traces;
  }, [wsiData, scenarioResult]);

  const layout = useMemo(() => {
    const shapes: any[] = [];
    const annotations: any[] = [];

    if (showThresholds) {
      // Threshold line
      shapes.push({
        type: 'line',
        x0: 2020,
        x1: 2100,
        y0: threshold,
        y1: threshold,
        line: {
          color: '#ef4444',
          width: 2,
          dash: 'dash'
        }
      });

      // Threshold annotation
      annotations.push({
        x: 2080,
        y: threshold,
        text: `Critical Threshold (${threshold})`,
        showarrow: true,
        arrowhead: 2,
        ax: 0,
        ay: -30,
        font: { color: '#ef4444', size: 12 },
        bgcolor: 'rgba(255, 255, 255, 0.8)',
        bordercolor: '#ef4444',
        borderwidth: 1
      });

      // Stress level zones
      shapes.push(
        {
          type: 'rect',
          x0: 2020,
          x1: 2100,
          y0: 0,
          y1: 0.2,
          fillcolor: config.colors.low,
          opacity: 0.1,
          layer: 'below'
        },
        {
          type: 'rect',
          x0: 2020,
          x1: 2100,
          y0: 0.2,
          y1: threshold,
          fillcolor: config.colors.moderate,
          opacity: 0.1,
          layer: 'below'
        },
        {
          type: 'rect',
          x0: 2020,
          x1: 2100,
          y0: threshold,
          y1: 1.0,
          fillcolor: config.colors.high,
          opacity: 0.1,
          layer: 'below'
        }
      );
    }

    return {
      title: 'Water Stress Index Over Time',
      xaxis: {
        title: 'Year',
        range: [2020, 2100],
        dtick: 20
      },
      yaxis: {
        title: 'Water Stress Index',
        range: [0, 1],
        dtick: 0.2
      },
      margin: { t: 50, b: 60, l: 80, r: 20 },
      hovermode: 'x unified',
      showlegend: true,
      shapes,
      annotations
    };
  }, [threshold, config, showThresholds]);

  if (plotData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/20 rounded">
        <p className="text-muted-foreground">Loading water stress index data...</p>
      </div>
    );
  }

  return (
    <PlotlyChart
      id="water-stress-time-series"
      title=""
      description=""
      height="400px"
      data={plotData}
      layout={layout}
    />
  );
});

/**
 * Water Stress Index Focus Page
 * Dedicated view for water stress analysis with threshold monitoring
 */
export default function WaterStressIndexPage() {
  const { parameters, updateParameter, scenarioResult } = useScenario();
  const [wsiConfig, setWsiConfig] = useState<WaterStressConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [showThresholds, setShowThresholds] = useState(true);
  const [customThreshold, setCustomThreshold] = useState(0.4);

  // Fetch WSI data
  const { data: wsiData, loading: wsiLoading, error: wsiError } = useScenarioSeries('yrb_wsi');

  // Load WSI configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setConfigLoading(true);
        const config = await getWaterStressConfig();
        setWsiConfig(config);
        setCustomThreshold(config.threshold);
      } catch (error) {
        console.error('Failed to load WSI config:', error);
      } finally {
        setConfigLoading(false);
      }
    };

    loadConfig();
  }, []);

  // Calculate current WSI value
  const currentWSI = useMemo(() => {
    if (!wsiData?.series) return 0;

    const series = wsiData.series;
    const values = scenarioResult?.isSingleScenario ? series.value : series.mean;

    if (!values || values.length === 0) return 0;

    // Return the latest value
    return values[values.length - 1];
  }, [wsiData, scenarioResult]);

  // Calculate trend
  const trend = useMemo(() => {
    if (!wsiData?.series) return 'stable';

    const series = wsiData.series;
    const values = scenarioResult?.isSingleScenario ? series.value : series.mean;

    if (!values || values.length < 2) return 'stable';

    const recent = values.slice(-10); // Last 10 values
    const first = recent[0];
    const last = recent[recent.length - 1];

    if (last > first * 1.05) return 'increasing';
    if (last < first * 0.95) return 'decreasing';
    return 'stable';
  }, [wsiData, scenarioResult]);

  const getStressLevel = (value: number) => {
    if (!wsiConfig) return 'unknown';
    if (value < 0.2) return 'low';
    if (value < customThreshold) return 'moderate';
    return 'high';
  };

  const stressLevel = getStressLevel(currentWSI);
  const threshold = wsiConfig?.threshold || customThreshold;

  if (wsiLoading || configLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading water stress analysis...</p>
        </div>
      </div>
    );
  }

  if (wsiError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500">Failed to load water stress data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Water Stress Index Analysis</h1>
        <p className="text-muted-foreground">
          Monitor water stress levels and critical thresholds across different scenarios
        </p>
      </div>

      {/* Current Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current WSI Value */}
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Droplet className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Current WSI</p>
              <p className="text-2xl font-bold">{currentWSI.toFixed(3)}</p>
              <p className="text-xs text-muted-foreground">
                {wsiConfig?.labels?.en?.[stressLevel] || 'Unknown'}
              </p>
            </div>
          </div>
        </Card>

        {/* Trend Indicator */}
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              {trend === 'increasing' ? (
                <TrendingUp className="h-6 w-6 text-red-600" />
              ) : trend === 'decreasing' ? (
                <TrendingDown className="h-6 w-6 text-green-600" />
              ) : (
                <Gauge className="h-6 w-6 text-yellow-600" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Trend</p>
              <p className="text-2xl font-bold capitalize">{trend}</p>
              <p className="text-xs text-muted-foreground">Recent trajectory</p>
            </div>
          </div>
        </Card>

        {/* Threshold Status */}
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-lg ${
              currentWSI >= threshold
                ? 'bg-red-100 dark:bg-red-900/30'
                : 'bg-green-100 dark:bg-green-900/30'
            }`}>
              <AlertTriangle className={`h-6 w-6 ${
                currentWSI >= threshold ? 'text-red-600' : 'text-green-600'
              }`} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Threshold Status</p>
              <p className="text-2xl font-bold">
                {currentWSI >= threshold ? 'CRITICAL' : 'SAFE'}
              </p>
              <p className="text-xs text-muted-foreground">
                Threshold: {threshold}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Water Stress Gauge */}
        <Card className="p-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold mb-2">Current Water Stress Level</h3>
            <p className="text-sm text-muted-foreground">
              Real-time monitoring of water stress index
            </p>
          </div>
          {wsiConfig && (
            <WaterStressGauge
              currentValue={currentWSI}
              threshold={threshold}
              config={wsiConfig}
            />
          )}
        </Card>

        {/* Controls Panel */}
        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Analysis Controls</h3>

              {/* Threshold Control */}
              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-2 cursor-pointer mb-2">
                    <input
                      type="checkbox"
                      checked={showThresholds}
                      onChange={(e) => setShowThresholds(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">显示阈值线</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    自定义临界阈值: {customThreshold}
                  </label>
                  <ParameterSlider
                    defaultValue={customThreshold}
                    onChange={setCustomThreshold}
                    min={0.1}
                    max={0.8}
                    step={0.05}
                    label=""
                  />
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• <span className="font-medium">低压力 (&lt;0.2)</span>: 水资源充足</p>
                  <p>• <span className="font-medium">中等压力 (0.2-{customThreshold.toFixed(1)})</span>: 需要关注</p>
                  <p>• <span className="font-medium">高压力 (&gt;{customThreshold.toFixed(1)})</span>: 临界状态</p>
                </div>
              </div>
            </div>

            {/* Scenario Info */}
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">当前情景</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                {scenarioResult?.isSingleScenario ? (
                  <p>单一情景: {scenarioResult.primaryScenario}</p>
                ) : (
                  <p>多情景模式: 显示置信区间</p>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Time Series Chart */}
      <Card className="p-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold mb-2">Water Stress Index Time Series</h3>
          <p className="text-sm text-muted-foreground">
            Historical and projected water stress levels with threshold monitoring
          </p>
        </div>

        {wsiData && wsiConfig && (
          <WaterStressTimeSeriesChart
            wsiData={wsiData}
            scenarioResult={scenarioResult}
            threshold={customThreshold}
            config={wsiConfig}
            showThresholds={showThresholds}
          />
        )}
      </Card>

      {/* Interpretation Guide */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Water Stress Index Interpretation</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: wsiConfig?.colors.low }}></div>
              <span className="font-medium">Low Stress (&lt;0.2)</span>
            </div>
            <p className="text-muted-foreground">
              Water resources are abundant. No immediate water scarcity concerns.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: wsiConfig?.colors.moderate }}></div>
              <span className="font-medium">Moderate Stress (0.2-{threshold.toFixed(1)})</span>
            </div>
            <p className="text-muted-foreground">
              Water stress is present but manageable. Monitoring and conservation measures recommended.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: wsiConfig?.colors.high }}></div>
              <span className="font-medium">High Stress (&gt;{threshold.toFixed(1)})</span>
            </div>
            <p className="text-muted-foreground">
              Critical water stress level. Immediate action required to prevent water scarcity.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
