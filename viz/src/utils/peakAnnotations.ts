/**
 * Peak and Valley Annotations for Plotly Charts
 *
 * Utility functions to add peak/valley markers and annotations to Plotly charts.
 */

import { SeriesStatistics } from '../services/api';

export interface PeakAnnotationOptions {
  showPeak?: boolean;
  showValley?: boolean;
  peakColor?: string;
  valleyColor?: string;
  fontSize?: number;
}

/**
 * Create Plotly annotations for peak and valley values.
 *
 * @param stats - Series statistics containing peak and valley information
 * @param options - Customization options
 * @returns Array of Plotly annotation objects
 */
export function createPeakAnnotations(
  stats: SeriesStatistics,
  options: PeakAnnotationOptions = {}
): any[] {
  const {
    showPeak = true,
    showValley = true,
    peakColor = '#ef4444',
    valleyColor = '#3b82f6',
    fontSize = 11
  } = options;

  const annotations: any[] = [];

  // Peak annotation
  if (showPeak) {
    annotations.push({
      x: stats.peak.year,
      y: stats.peak.value,
      xref: 'x',
      yref: 'y',
      text: `Peak: ${stats.peak.value.toFixed(2)}<br>${stats.peak.year}`,
      showarrow: true,
      arrowhead: 2,
      arrowsize: 1,
      arrowwidth: 2,
      arrowcolor: peakColor,
      ax: 0,
      ay: -40,
      bgcolor: 'rgba(255, 255, 255, 0.9)',
      bordercolor: peakColor,
      borderwidth: 2,
      borderpad: 4,
      font: {
        size: fontSize,
        color: peakColor,
        family: 'Inter, system-ui, sans-serif'
      }
    });
  }

  // Valley annotation
  if (showValley) {
    annotations.push({
      x: stats.valley.year,
      y: stats.valley.value,
      xref: 'x',
      yref: 'y',
      text: `Valley: ${stats.valley.value.toFixed(2)}<br>${stats.valley.year}`,
      showarrow: true,
      arrowhead: 2,
      arrowsize: 1,
      arrowwidth: 2,
      arrowcolor: valleyColor,
      ax: 0,
      ay: 40,
      bgcolor: 'rgba(255, 255, 255, 0.9)',
      bordercolor: valleyColor,
      borderwidth: 2,
      borderpad: 4,
      font: {
        size: fontSize,
        color: valleyColor,
        family: 'Inter, system-ui, sans-serif'
      }
    });
  }

  return annotations;
}

/**
 * Create Plotly scatter points for peak and valley markers.
 *
 * @param stats - Series statistics
 * @param options - Customization options
 * @returns Plotly data object for markers
 */
export function createPeakMarkers(
  stats: SeriesStatistics,
  options: PeakAnnotationOptions = {}
): any {
  const {
    showPeak = true,
    showValley = true,
    peakColor = '#ef4444',
    valleyColor = '#3b82f6'
  } = options;

  const x: number[] = [];
  const y: number[] = [];
  const colors: string[] = [];
  const labels: string[] = [];

  if (showPeak) {
    x.push(stats.peak.year);
    y.push(stats.peak.value);
    colors.push(peakColor);
    labels.push(`Peak: ${stats.peak.value.toFixed(2)} (${stats.peak.year})`);
  }

  if (showValley) {
    x.push(stats.valley.year);
    y.push(stats.valley.value);
    colors.push(valleyColor);
    labels.push(`Valley: ${stats.valley.value.toFixed(2)} (${stats.valley.year})`);
  }

  return {
    x,
    y,
    mode: 'markers',
    type: 'scatter',
    name: 'Peak/Valley',
    marker: {
      size: 12,
      color: colors,
      symbol: 'diamond',
      line: {
        color: 'white',
        width: 2
      }
    },
    text: labels,
    hoverinfo: 'text',
    showlegend: false
  };
}

/**
 * Format statistics summary for display.
 *
 * @param stats - Series statistics
 * @returns Formatted statistics object
 */
export function formatStatisticsSummary(stats: SeriesStatistics): {
  peak: string;
  valley: string;
  mean: string;
  trend: string;
  range: string;
} {
  return {
    peak: `${stats.peak.value.toFixed(2)} (${stats.peak.year})`,
    valley: `${stats.valley.value.toFixed(2)} (${stats.valley.year})`,
    mean: stats.mean.toFixed(2),
    trend: `${stats.trend > 0 ? '+' : ''}${stats.trend.toFixed(4)}/year`,
    range: stats.range.toFixed(2)
  };
}

/**
 * Determine if dark mode is active.
 *
 * @returns True if dark mode is active
 */
export function isDarkMode(): boolean {
  return document.documentElement.classList.contains('dark');
}

/**
 * Apply dark mode styles to peak annotations.
 *
 * @param annotations - Array of annotation objects
 * @returns Updated annotations with dark mode styles
 */
export function applyDarkModeToAnnotations(annotations: any[]): any[] {
  const dark = isDarkMode();

  return annotations.map(annotation => ({
    ...annotation,
    bgcolor: dark ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)',
    font: {
      ...annotation.font,
      color: annotation.font.color // Keep original color for contrast
    }
  }));
}
