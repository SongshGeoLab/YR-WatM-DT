import React from 'react';
import { Card } from './ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ComparisonData {
  now: number;
  future: number;
  diff: number;
  diffPercent: number;
}

interface DataComparisonPanelProps {
  temperature: ComparisonData;
  precipitation: ComparisonData;
  waterAvailability: ComparisonData;
  className?: string;
}

const DataComparisonPanel: React.FC<DataComparisonPanelProps> = ({
  temperature,
  precipitation,
  waterAvailability,
  className = ''
}) => {
  const formatValue = (value: number, unit: string, decimals: number = 1) => {
    return `${value.toFixed(decimals)} ${unit}`;
  };

  const formatDiff = (diff: number, diffPercent: number) => {
    const isPositive = diff >= 0;
    const icon = isPositive ? TrendingUp : TrendingDown;
    const color = isPositive ? 'text-green-600' : 'text-red-600';
    const bgColor = isPositive ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20';

    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${color} ${bgColor}`}>
        {React.createElement(icon, { className: 'w-3 h-3' })}
        <span>{diff > 0 ? '+' : ''}{diff.toFixed(1)} ({diffPercent > 0 ? '+' : ''}{diffPercent.toFixed(1)}%)</span>
      </div>
    );
  };

  const MetricCard: React.FC<{
    title: string;
    icon: React.ReactNode;
    iconColor: string;
    data: ComparisonData;
    unit: string;
    decimals?: number;
  }> = ({ title, icon, iconColor, data, unit, decimals = 1 }) => (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${iconColor}`}>
          {icon}
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Now (2020)</span>
          <span className="font-mono text-lg font-semibold text-gray-900 dark:text-gray-100">
            {formatValue(data.now, unit, decimals)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Future (2100)</span>
          <span className="font-mono text-lg font-semibold text-gray-900 dark:text-gray-100">
            {formatValue(data.future, unit, decimals)}
          </span>
        </div>

        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Change</span>
            {formatDiff(data.diff, data.diffPercent)}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className={`p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 border-2 border-blue-200 dark:border-blue-800 shadow-lg ${className}`}>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Climate Impact Summary
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Projected changes from 2020 to 2100
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Temperature"
          icon={<TrendingUp className="w-5 h-5 text-white" />}
          iconColor="bg-red-500"
          data={temperature}
          unit="°C"
          decimals={1}
        />

        <MetricCard
          title="Precipitation"
          icon={<TrendingUp className="w-5 h-5 text-white" />}
          iconColor="bg-blue-500"
          data={precipitation}
          unit="mm"
          decimals={0}
        />

        <MetricCard
          title="Water Availability"
          icon={<TrendingUp className="w-5 h-5 text-white" />}
          iconColor="bg-cyan-500"
          data={waterAvailability}
          unit="×10⁸ m³"
          decimals={1}
        />
      </div>

      <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="font-medium">Scenario Impact:</span>
          <span>Based on current climate scenario and water transfer settings</span>
        </div>
      </div>
    </Card>
  );
};

export default DataComparisonPanel;
