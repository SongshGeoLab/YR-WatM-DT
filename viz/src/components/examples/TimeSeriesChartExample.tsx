/**
 * Example component showing how to integrate backend API with Plotly charts.
 *
 * This component demonstrates:
 * - Fetching variables and parameters from API
 * - User selection of variable and scenario
 * - Loading states and error handling
 * - Real-time data visualization with Plotly
 */

import { useState } from 'react';
import { PlotlyChart } from '../charts/PlotlyChart';
import { useVariables, useParams, useSeries } from '../../hooks/useApiData';
import { Alert, AlertDescription } from '../ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

export function TimeSeriesChartExample() {
  const [selectedVariable, setSelectedVariable] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

  // Fetch available variables and scenarios
  const { data: variables, loading: loadingVars, error: varsError } = useVariables();
  const { data: params, loading: loadingParams, error: paramsError } = useParams();

  // Fetch time series data when both variable and scenario are selected
  const { data: seriesData, loading: loadingSeries, error: seriesError } = useSeries(
    selectedVariable,
    selectedScenario
  );

  // Extract scenario names from params
  const scenarios = params?.scenario_name || [];

  // Show loading state while fetching initial data
  if (loadingVars || loadingParams) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Show error state if initial data fetch fails
  if (varsError || paramsError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load data from API. Please ensure the backend server is running at http://127.0.0.1:8000
          <br />
          <code className="text-xs">Error: {varsError?.message || paramsError?.message}</code>
        </AlertDescription>
      </Alert>
    );
  }

  // Prepare Plotly data
  const plotlyData = seriesData
    ? [
        {
          x: seriesData.series.time,
          y: seriesData.series.value,
          type: 'scatter' as const,
          mode: 'lines' as const,
          name: selectedVariable || 'Data',
          line: { color: '#2563eb', width: 2 },
        },
      ]
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time Series Visualization (API Integration Example)</CardTitle>
        <CardDescription>
          Select a variable and scenario to visualize real-time data from the backend API
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Selection Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Variable Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Variable</label>
            <Select
              value={selectedVariable || undefined}
              onValueChange={setSelectedVariable}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a variable..." />
              </SelectTrigger>
              <SelectContent>
                {variables.map((variable) => (
                  <SelectItem key={variable} value={variable}>
                    {variable}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Scenario Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Scenario</label>
            <Select
              value={selectedScenario || undefined}
              onValueChange={setSelectedScenario}
              disabled={!selectedVariable}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a scenario..." />
              </SelectTrigger>
              <SelectContent>
                {scenarios.map((scenario: string) => (
                  <SelectItem key={scenario} value={scenario}>
                    {scenario}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Chart Area */}
        <div className="border rounded-lg p-4 bg-gray-50">
          {!selectedVariable || !selectedScenario ? (
            <div className="h-96 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                  />
                </svg>
                <p className="mt-4 text-sm">Select a variable and scenario to view the chart</p>
              </div>
            </div>
          ) : loadingSeries ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-sm text-gray-600">Loading data from API...</p>
              </div>
            </div>
          ) : seriesError ? (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to load series data: {seriesError.message}
              </AlertDescription>
            </Alert>
          ) : (
            <PlotlyChart
              id="timeseries-example"
              data={plotlyData}
              layout={{
                xaxis: {
                  title: 'Time',
                  showgrid: true,
                  zeroline: false,
                },
                yaxis: {
                  title: selectedVariable || 'Value',
                  showgrid: true,
                  zeroline: false,
                },
                hovermode: 'x unified',
              }}
              height="400px"
            />
          )}
        </div>

        {/* Data Info */}
        {seriesData && (
          <div className="flex items-center justify-between text-sm text-gray-600 bg-blue-50 p-3 rounded">
            <div>
              <span className="font-medium">Data points:</span> {seriesData.series.time.length}
            </div>
            <div>
              <span className="font-medium">Variable:</span> {seriesData.variable}
            </div>
            <div>
              <span className="font-medium">Scenario:</span> {seriesData.scenario}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
