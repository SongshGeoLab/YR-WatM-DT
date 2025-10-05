# Plotly Integration Guide for Yangtze River Basin Application

## Overview

This guide explains how to integrate Plotly.js with your Yangtze River Basin data visualization application. Each page now includes dedicated PlotlyChart components that serve as placeholders for your actual charts.

## PlotlyChart Component

### Location
`/components/charts/PlotlyChart.tsx`

### Usage
```tsx
import { PlotlyChart } from './components/charts/PlotlyChart';

<PlotlyChart
  id="unique-chart-id"
  title="Chart Title"
  description="Optional description"
  height="400px"
  data={plotlyData}
  layout={plotlyLayout}
  config={plotlyConfig}
/>
```

### Props
- `id`: Unique identifier for the chart (required)
- `title`: Chart title displayed above the plot
- `description`: Optional description text
- `height`: Chart height (default: "400px")
- `data`: Plotly data array
- `layout`: Plotly layout object
- `config`: Plotly configuration object
- `className`: Additional CSS classes

## Chart Locations by Page

### 1. Study Area Page
- **Map Integration**: Consider replacing the SVG map with an interactive Plotly/Mapbox map
- Chart ID: N/A (uses custom SVG currently)

### 2. Water Availability Page
- **Monthly Water Availability**: `monthly-water-availability`
  - Suggested: Multi-line chart showing RCP scenarios across months
- **Climate Projections**: `climate-projections`
  - Suggested: Heatmap or multi-panel chart for temperature/precipitation

### 3. Demographics Page
- **Population Projections**: `population-projections`
  - Suggested: Area chart with confidence intervals
- **Water Demand**: `water-demand-demographics`
  - Suggested: Stacked bar chart by demographic segments

### 4. Ecological Water Page
- **Flow Requirements**: `ecological-flow-trend`
  - Suggested: Time series of environmental flow components
- **Ecosystem Health**: `ecosystem-health`
  - Suggested: Multi-metric dashboard with gauge charts

### 5. Agriculture Page
- **Water Use by Sector**: `water-use-sectors`
  - Suggested: Stacked area chart over time
- **Irrigation Efficiency**: `irrigation-efficiency`
  - Suggested: Scatter plot with trendlines
- **Industrial Recycling**: `industrial-water-recycling`
  - Suggested: Bar chart by industrial zones

### 6. Water Stress Page
- **Stress Distribution**: `water-stress-map`
  - Suggested: Choropleth map of basin regions
- **Drought Risk**: `drought-risk`
  - Suggested: Probability plots and time series
- **Vulnerability Index**: `vulnerability-index`
  - Suggested: Radar chart for multi-dimensional analysis
- **Adaptation Measures**: `adaptation-measures`
  - Suggested: Before/after comparison charts

### 7. Water Quality Page
- **Quality Trends**: `water-quality-trend`
  - Suggested: Multi-line time series for different parameters
- **Pollutant Sources**: `pollutant-sources`
  - Suggested: Sankey diagram or treemap
- **Sediment Transport**: `sediment-transport`
  - Suggested: Seasonal box plots
- **Nutrient Levels**: `nutrient-levels`
  - Suggested: Heatmap by location and time
- **Heavy Metals**: `heavy-metals`
  - Suggested: Small multiples for different metals

## Integration Steps

### 1. Install Plotly
```bash
npm install plotly.js-dist-min
npm install @types/plotly.js
```

### 2. Update PlotlyChart Component
Add the actual Plotly integration to `/components/charts/PlotlyChart.tsx`:

```tsx
import { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

// Add to useEffect:
useEffect(() => {
  if (chartRef.current && data && layout) {
    Plotly.newPlot(chartRef.current, data, layout, config || {});
  }

  return () => {
    if (chartRef.current) {
      Plotly.purge(chartRef.current);
    }
  };
}, [data, layout, config]);
```

### 3. Data Structure Example
```tsx
// Example for water availability chart
const waterAvailabilityData = [
  {
    x: months,
    y: rcp26Data,
    type: 'scatter',
    mode: 'lines+markers',
    name: 'RCP2.6',
    line: { color: '#10b981' }
  },
  {
    x: months,
    y: rcp45Data,
    type: 'scatter',
    mode: 'lines+markers',
    name: 'RCP4.5',
    line: { color: '#f59e0b' }
  },
  {
    x: months,
    y: rcp85Data,
    type: 'scatter',
    mode: 'lines+markers',
    name: 'RCP8.5',
    line: { color: '#ef4444' }
  }
];

const layout = {
  title: 'Monthly Water Availability',
  xaxis: { title: 'Month' },
  yaxis: { title: 'Water Availability (km³)' },
  showlegend: true
};
```

### 4. Data Integration
Create data service files for each domain:
- `/services/waterAvailabilityData.ts`
- `/services/demographicsData.ts`
- `/services/ecologicalData.ts`
- etc.

## CSS Classes for 16:9 Optimization

The application includes CSS classes optimized for 16:9 displays:

```css
.plotly-chart-container {
  width: 100%;
  height: 100%;
}

.chart-grid-2x2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 1rem;
  height: 100%;
}
```

## Responsive Design

Charts automatically adapt to different screen sizes using the responsive Plotly configuration:

```tsx
const config = {
  responsive: true,
  displayModeBar: false, // Hide toolbar for cleaner look
  displaylogo: false
};
```

## Performance Considerations

1. **Lazy Loading**: Consider loading Plotly charts only when their page is active
2. **Data Sampling**: For large datasets, implement data decimation
3. **Caching**: Cache computed chart data to avoid recalculations
4. **WebGL**: Use WebGL mode for large scatter plots

## Color Scheme

The application uses a consistent color scheme defined in `globals.css`:
- Chart colors: `--chart-1` through `--chart-5`
- Scenario colors: Green (#10b981), Amber (#f59e0b), Red (#ef4444)

## Next Steps

1. Implement actual data fetching services
2. Add chart interaction handlers (click, hover, zoom)
3. Implement data filtering and parameter controls
4. Add chart export functionality
5. Consider adding animation transitions between data updates
