import { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

interface PlotlyChartProps {
  id: string;
  title?: string;
  description?: string;
  height?: string;
  data?: any;
  layout?: any;
  config?: any;
  className?: string;
}

export function PlotlyChart({
  id,
  title,
  description,
  height = "400px",
  data,
  layout,
  config,
  className = ""
}: PlotlyChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Clear previous plot
    chartRef.current.innerHTML = '';

    if (data && data.length > 0) {
      // Create the plot with actual data
      Plotly.newPlot(chartRef.current, data, layout || {}, {
        responsive: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
        ...config
      }).then(() => {
        // Ensure chart is properly sized after creation
        Plotly.Plots.resize(chartRef.current);
      });
    } else {
      // Show placeholder when no data
      const isDark = document.documentElement.classList.contains('dark') ||
                     window.matchMedia('(prefers-color-scheme: dark)').matches;
      const textColor = isDark ? 'text-gray-300' : 'text-gray-500';

      chartRef.current.innerHTML = `
        <div class="flex items-center justify-center h-full">
          <div class="text-center ${textColor}">
            <div class="text-4xl mb-2">📊</div>
            <div class="font-medium">Plotly Chart: ${title || 'Chart'}</div>
            <div class="text-sm">Ready for data integration</div>
          </div>
        </div>
      `;
    }
  }, [data, layout, config, title]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current && data && data.length > 0) {
        Plotly.Plots.resize(chartRef.current);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [data]);

  return (
    <div className={`w-full ${className}`}>
      {title && (
        <div className="mb-4">
          <h4 className="font-semibold text-gray-800">{title}</h4>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
      )}

      <div
        ref={chartRef}
        id={id}
        className="plotly-chart-container w-full bg-gray-50 rounded-lg border border-gray-200"
        style={{ height }}
      />
    </div>
  );
}
