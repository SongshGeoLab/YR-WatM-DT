import { useState } from 'react';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { Leaf, Scale, Factory } from 'lucide-react';

/**
 * Global Scenario Selection Component
 *
 * Displays three overall scenario presets for parameter selection
 */
export default function GlobalScenarioSelection() {
  const [selectedScenario, setSelectedScenario] = useState('tSSP1-RCP2.6');

  const scenarios = {
    'tSSP1-RCP2.6': {
      name: 'Radical sustainable transformation',
      code: 'tSSP1-RCP2.6',
      color: 'bg-green-500',
      icon: Leaf,
      description: 'Green technology revolution, social equity, and integrated governance with radical ecological restoration'
    },
    'tSSP2-RCP4.5': {
      name: 'Balancing economy and sustainability',
      code: 'tSSP2-RCP4.5',
      color: 'bg-amber-500',
      icon: Scale,
      description: 'Seeking balance between economic growth and ecosystem protection with moderate policy implementation'
    },
    'tSSP5-RCP8.5': {
      name: 'Focusing on economic development',
      code: 'tSSP5-RCP8.5',
      color: 'bg-red-500',
      icon: Factory,
      description: 'Economy-driven development prioritizing growth over sustainability with high fossil fuel dependence'
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Global Scenario Selection</h2>
      <p className="text-lg text-muted-foreground mb-6">
        Select a preset of parameters from three overall scenarios:
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(scenarios).map(([key, scenario]) => {
          const Icon = scenario.icon;
          return (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setSelectedScenario(key)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedScenario === key
                      ? `${scenario.color} border-transparent text-white`
                      : 'bg-card border-border hover:border-muted-foreground text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      selectedScenario === key
                        ? 'bg-white/20 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="font-medium">{scenario.name}</div>
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-md">
                <div className="space-y-2">
                  <div className="font-medium text-base">{scenario.name}</div>
                  <div className="text-sm opacity-90">{scenario.description}</div>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
