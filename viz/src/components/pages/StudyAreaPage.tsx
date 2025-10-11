import { useState } from 'react';
import { LeafletMap } from '../maps/LeafletMap';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { Map, Leaf, Scale, Factory } from 'lucide-react';

/**
 * Study Area Page Component
 *
 * Displays Yellow River Basin overview with global scenario selection
 * and interactive map.
 */
export default function StudyAreaPage() {
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
    <div className="bg-card rounded-lg border-2 border-dashed border-border p-6 h-full overflow-hidden">
      <div className="flex items-center gap-6 mb-6">
        <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg">
          <Map className="w-8 h-8" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-foreground">Introduction</h1>
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
              Page 1
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Yellow River Basin Overview & Scenario Selection</p>
        </div>
      </div>

      {/* Global Scenario Selection */}
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

      {/* Main content - Map and Description */}
      <div className="flex gap-8 max-h-[calc(100%-16rem)] overflow-hidden">
        {/* Left side - Description */}
        <div className="flex-1 flex flex-col space-y-4 min-h-0">
          <div className="space-y-3 flex-shrink-0">
            <h3 className="font-semibold text-foreground text-lg">Yellow River Basin Overview</h3>
            <div className="space-y-3 text-foreground leading-relaxed text-base">
              <p>
                The Yellow River is the fifth-longest river globally, spans arid to semi-arid regions and is among
                those river basins most dramatically affected by human activity over the last century.
              </p>
              <p>
                Since the 1960s, engineering projects such as reservoir construction have fundamentally altered
                water flow and sediment transport. The basin experiences significant water use growth, mainly for
                irrigation, substantially reducing the river's discharge.
              </p>
            </div>
          </div>

          {/* Key Basin Features */}
          <div className="flex-1 bg-muted rounded-lg p-4 min-h-0 overflow-hidden">
            <h4 className="font-semibold text-foreground mb-3 text-base">Key Basin Features</h4>
            <div className="grid grid-cols-1 gap-2 text-base">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-medium">Source Region:</span>
                <span className="text-foreground">Qinghai-Tibet Plateau (35-42% streamflow)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-medium">Upper Reach:</span>
                <span className="text-foreground">Cascading reservoirs, hydroenergy</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-orange-600 font-medium">Loess Plateau:</span>
                <span className="text-foreground">Soil erosion, restoration projects</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Map */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="mb-3 flex-shrink-0">
            <h3 className="font-semibold text-foreground mb-2 text-lg">Interactive Basin Map</h3>
          </div>
          <div className="flex-1 min-h-0 bg-muted rounded-lg border-2 border-dashed border-border overflow-hidden">
            <LeafletMap
              id="yellow-river-basin-map"
              height="100%"
              className="w-full h-full rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
