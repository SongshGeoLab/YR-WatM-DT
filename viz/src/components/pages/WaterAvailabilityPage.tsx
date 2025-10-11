import { useState } from 'react';
import { PlotlyChart } from '../charts/PlotlyChart';
import { CloudRain } from 'lucide-react';

/**
 * Water Availability Page Component
 *
 * Displays climate change scenarios (RCP pathways) and their impact
 * on surface water availability in the Yellow River Basin.
 */
export default function WaterAvailabilityPage() {
  const [selectedScenario, setSelectedScenario] = useState('RCP2.6');

  const scenarios = {
    'RCP2.6': {
      name: 'RCP2.6',
      title: 'Radical Sustainable Transformation',
      color: '#10b981',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-900',
      description: 'Green technology revolution with radical ecological restoration and advanced water recycling technologies'
    },
    'RCP4.5': {
      name: 'RCP4.5',
      title: 'Balancing Economy and Sustainability',
      color: '#f59e0b',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-900',
      description: 'Traditional industries coexist with green technologies, gradual renewable energy adoption'
    },
    'RCP8.5': {
      name: 'RCP8.5',
      title: 'Focusing on Economic Development',
      color: '#ef4444',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-900',
      description: 'High fossil fuel dependence with rapid economic growth but inefficient water resource use'
    }
  };

  return (
    <div className="bg-card rounded-lg border-2 border-dashed border-border p-6 h-full overflow-hidden">
      <div className="flex items-center gap-6 mb-6">
        <div className="w-16 h-16 rounded-full bg-cyan-500 flex items-center justify-center text-white shadow-lg">
          <CloudRain className="w-8 h-8" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-foreground">Climate Change Scenarios</h1>
            <span className="px-3 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-full text-sm font-medium">
              Page 2
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">RCP Pathways & Surface Water Availability Projections</p>
        </div>
      </div>

      {/* Scenario Selection */}
      <div className="mb-4 flex items-center justify-between bg-muted/50 rounded-lg p-3">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-foreground">Climate Scenario:</h3>
          <div className="flex gap-2">
            {Object.entries(scenarios).map(([key, scenario]) => (
              <button
                key={key}
                onClick={() => setSelectedScenario(key)}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  selectedScenario === key
                    ? `${scenario.bgColor} ${scenario.borderColor} ${scenario.textColor} font-medium shadow-sm`
                    : 'bg-card border-border text-foreground hover:bg-muted'
                }`}
              >
                {scenario.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-4 h-[calc(100%-12rem)]">
        <div className="flex flex-col gap-4 min-h-0">
          <div className="flex-1 min-h-0">
            <PlotlyChart
              id="rcp-climate-scenarios"
              title="RCP Climate Scenario Pathways"
              height="100%"
            />
          </div>
          <div className="flex-1 min-h-0">
            <PlotlyChart
              id="temperature-precipitation-trends"
              title="Temperature & Precipitation Trends"
              height="100%"
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 min-h-0">
          <div className="flex-1 min-h-0 max-h-[50%]">
            <PlotlyChart
              id="surface-water-availability"
              title="Surface Water Availability Projections"
              height="100%"
            />
          </div>
          <div className="flex-1 bg-muted/50 rounded-lg p-4 overflow-y-auto">
            <h4 className="font-semibold text-foreground mb-3">
              {scenarios[selectedScenario].name}: Understanding the Scenario
            </h4>
            <div className="space-y-3 text-base text-foreground leading-relaxed">
              <p>{scenarios[selectedScenario].description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
