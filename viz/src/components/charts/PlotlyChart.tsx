import { useEffect, useRef, useState } from 'react';
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

// Helper function to detect dark mode
const isDarkMode = () => {
  if (typeof window === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
};

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
  const [darkMode, setDarkMode] = useState(isDarkMode());

  // Listen for theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const newDarkMode = isDarkMode();
      console.log(`PlotlyChart ${id}: Dark mode changed to ${newDarkMode}`);
      setDarkMode(newDarkMode);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, [id]);

  useEffect(() => {
    if (!chartRef.current) return;

    // Clear previous plot
    chartRef.current.innerHTML = '';

    if (data && data.length > 0) {
      console.log(`PlotlyChart ${id}: Rendering with darkMode=${darkMode}`);
      // Apply dark mode to layout - merge with user layout last to preserve custom settings
      const darkModeLayout = {
        // Base layout from user
        ...layout,
        // Override with dark mode styles
        paper_bgcolor: darkMode ? '#1f2937' : '#ffffff',
        plot_bgcolor: darkMode ? '#111827' : '#f9fafb',
        font: {
          ...layout?.font,
          color: darkMode ? '#e5e7eb' : '#1f2937',
          family: 'Inter, system-ui, sans-serif'
        },
        xaxis: {
          ...layout?.xaxis,
          gridcolor: darkMode ? '#374151' : '#e5e7eb',
          linecolor: darkMode ? '#4b5563' : '#d1d5db',
          zerolinecolor: darkMode ? '#4b5563' : '#d1d5db',
          tickfont: { ...layout?.xaxis?.tickfont, color: darkMode ? '#e5e7eb' : '#1f2937' },
          titlefont: { ...layout?.xaxis?.titlefont, color: darkMode ? '#e5e7eb' : '#1f2937' }
        },
        yaxis: {
          ...layout?.yaxis,
          gridcolor: darkMode ? '#374151' : '#e5e7eb',
          linecolor: darkMode ? '#4b5563' : '#d1d5db',
          zerolinecolor: darkMode ? '#4b5563' : '#d1d5db',
          tickfont: { ...layout?.yaxis?.tickfont, color: darkMode ? '#e5e7eb' : '#1f2937' },
          titlefont: { ...layout?.yaxis?.titlefont, color: darkMode ? '#e5e7eb' : '#1f2937' }
        },
        // Handle multiple y-axes (like yaxis2) - only if they exist in layout
        ...(layout?.yaxis2 && {
          yaxis2: {
            ...layout.yaxis2,
            tickfont: { ...layout.yaxis2.tickfont, color: darkMode ? '#e5e7eb' : '#1f2937' },
            titlefont: { ...layout.yaxis2.titlefont, color: layout.yaxis2.titlefont?.color || (darkMode ? '#e5e7eb' : '#1f2937') }
          }
        }),
        ...(layout?.yaxis3 && {
          yaxis3: {
            ...layout.yaxis3,
            tickfont: { ...layout.yaxis3.tickfont, color: darkMode ? '#e5e7eb' : '#1f2937' },
            titlefont: { ...layout.yaxis3.titlefont, color: layout.yaxis3.titlefont?.color || (darkMode ? '#e5e7eb' : '#1f2937') }
          }
        }),
        // Handle legend colors - only if legend exists
        ...(layout?.legend && {
          legend: {
            ...layout.legend,
            font: { ...layout.legend.font, color: darkMode ? '#e5e7eb' : '#1f2937' }
          }
        }),
        // Handle title colors - only if title exists
        ...(layout?.title && {
          title: {
            ...layout.title,
            font: {
              ...layout.title.font,
              color: darkMode ? '#e5e7eb' : '#1f2937'
            }
          }
        })
      };

      // Create the plot with actual data
      const plotConfig = {
        responsive: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'autoScale2d'],
        toImageButtonOptions: {
          format: 'png',
          filename: title?.replace(/\s+/g, '_').toLowerCase() || 'chart',
          height: 600,
          width: 1200,
          scale: 2
        },
        ...config
      };

      Plotly.newPlot(chartRef.current, data, darkModeLayout, plotConfig).then(() => {
        // Ensure chart is properly sized after creation
        if (chartRef.current) {
          Plotly.Plots.resize(chartRef.current);

          // Add smooth transitions for better UX
          Plotly.relayout(chartRef.current, {
            'transition.duration': 500,
            'transition.easing': 'cubic-in-out'
          });
        }
      });
    } else {
      // Show placeholder when no data
      const textColor = darkMode ? 'text-gray-300' : 'text-gray-500';
      const bgColor = darkMode ? 'bg-gray-800' : 'bg-gray-50';

      chartRef.current.innerHTML = `
        <div class="flex items-center justify-center h-full ${bgColor}">
          <div class="text-center ${textColor}">
            <div class="text-4xl mb-2">📊</div>
            <div class="font-medium">Plotly Chart: ${title || 'Chart'}</div>
            <div class="text-sm">Ready for data integration</div>
          </div>
        </div>
      `;
    }
  }, [data, layout, config, title, darkMode]);

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
          <h4 className="font-semibold text-foreground">{title}</h4>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      )}

      <div
        ref={chartRef}
        id={id}
        className="plotly-chart-container w-full bg-card rounded-lg border border-border"
        style={{ height }}
      />
    </div>
  );
}
