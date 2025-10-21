import React from 'react';
import { Card } from './ui/card';
import { TrendingUp, TrendingDown, Droplets, Factory, Home, Building, Fish } from 'lucide-react';

interface ComparisonData {
  now: number;
  future: number;
  diff: number;
  diffPercent: number;
}

interface WaterCompositionComparisonPanelProps {
  irrigation: ComparisonData;
  production: ComparisonData;
  domestic: ComparisonData;
  oa: ComparisonData;
  className?: string;
}

const WaterCompositionComparisonPanel: React.FC<WaterCompositionComparisonPanelProps> = ({
  irrigation,
  production,
  domestic,
  oa,
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
      <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${color} ${bgColor}`}>
        {React.createElement(icon, { className: 'w-2.5 h-2.5' })}
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
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-2 flex-shrink-0">
        <div className={`p-1.5 rounded-lg ${iconColor}`}>
          {icon}
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{title}</h3>
      </div>

      <div className="space-y-2 flex-1 flex flex-col justify-between">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600 dark:text-gray-400">Now (2020)</span>
          <span className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
            {formatValue(data.now, unit, decimals)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600 dark:text-gray-400">Future (2100)</span>
          <span className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
            {formatValue(data.future, unit, decimals)}
          </span>
        </div>

        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Change</span>
            <div className="text-xs">
              {formatDiff(data.diff, data.diffPercent)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className={`p-4 bg-gradient-to-br from-purple-50 to-green-50 dark:from-gray-800 dark:to-gray-900 border-2 border-purple-200 dark:border-purple-800 shadow-lg h-full flex flex-col ${className}`}>
      <div className="mb-3 flex-shrink-0">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
          Water Demand Impact Summary
        </h2>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Projected changes from 2020 to 2100
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3 flex-1">
        <MetricCard
          title="Irrigation"
          icon={<Droplets className="w-5 h-5 text-white" />}
          iconColor="bg-orange-500"
          data={irrigation}
          unit="×10⁸ m³"
          decimals={1}
        />

        <MetricCard
          title="Production"
          icon={<Factory className="w-5 h-5 text-white" />}
          iconColor="bg-blue-500"
          data={production}
          unit="×10⁸ m³"
          decimals={1}
        />

        <MetricCard
          title="Domestic"
          icon={<Home className="w-5 h-5 text-white" />}
          iconColor="bg-red-500"
          data={domestic}
          unit="×10⁸ m³"
          decimals={1}
        />

        <MetricCard
          title="Livestock & Fisheries"
          icon={<Fish className="w-5 h-5 text-white" />}
          iconColor="bg-purple-500"
          data={oa}
          unit="×10⁸ m³"
          decimals={1}
        />
      </div>


    </Card>
  );
};

export default WaterCompositionComparisonPanel;
