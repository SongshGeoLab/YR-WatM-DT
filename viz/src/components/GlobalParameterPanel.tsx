import { X, RefreshCw } from 'lucide-react';
import { useScenario } from '../contexts/ScenarioContext';
import { ParameterSlider } from './ui/parameter-slider';

/**
 * Global Parameter Control Panel
 *
 * Floating panel that allows users to adjust all parameters from one place.
 * Changes automatically update all pages.
 *
 * @param onClose - Callback when panel is closed
 */
export default function GlobalParameterPanel({ onClose }: { onClose: () => void }) {
  const { parameters, updateParameter, resetParameters, scenarioName, loading } = useScenario();

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-lg shadow-2xl border border-border w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-foreground">Global Parameters</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Adjust parameters to update all pages simultaneously
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Close panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scenario Status */}
        <div className="px-4 py-3 bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">Current Scenario:</span>
              {scenarioName ? (
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-sm font-mono">
                  {scenarioName}
                </span>
              ) : (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 rounded text-sm">
                  Not resolved
                </span>
              )}
            </div>
            {loading && (
              <span className="text-sm text-yellow-600 dark:text-yellow-400 animate-pulse">
                Updating...
              </span>
            )}
          </div>
        </div>

        {/* Parameter Controls */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Climate Scenario (Page 2) */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-cyan-500 text-white flex items-center justify-center text-xs">
                2
              </span>
              Climate Change Scenario
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map(scenario => (
                <button
                  key={scenario}
                  onClick={() => updateParameter('climateScenario', scenario)}
                  className={`px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                    parameters.climateScenario === scenario
                      ? 'bg-cyan-100 dark:bg-cyan-900/30 border-cyan-500 text-cyan-700 dark:text-cyan-300 font-medium'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  RCP{scenario === 1 ? '2.6' : scenario === 2 ? '4.5' : '8.5'}
                </button>
              ))}
            </div>
          </div>

          {/* Demographics (Page 3) */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs">
                3
              </span>
              Demographics
            </h3>

            <ParameterSlider
              label="Fertility Rate"
              min={1.6}
              max={1.8}
              step={0.05}
              defaultValue={parameters.fertility || 1.7}
              unit=""
              description="Total fertility rate (children per woman)"
              onChange={(value) => updateParameter('fertility', value)}
            />

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Diet Pattern</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 1, label: 'Traditional' },
                  { value: 2, label: 'Moderate' },
                  { value: 3, label: 'Modern' }
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => updateParameter('dietPattern', value)}
                    className={`px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                      parameters.dietPattern === value
                        ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-500 text-purple-700 dark:text-purple-300 font-medium'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Ecological Water (Page 4) */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">
                4
              </span>
              Ecological Water
            </h3>

            <ParameterSlider
              label="Ecological Flow Ratio"
              min={0.2}
              max={0.3}
              step={0.05}
              defaultValue={parameters.ecologicalFlow || 0.25}
              unit=""
              description="Proportion of ecological flow for sediment flushing"
              onChange={(value) => updateParameter('ecologicalFlow', value)}
            />
          </div>

          {/* Agriculture (Page 5) */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs">
                5
              </span>
              Agriculture & Industry
            </h3>

            <ParameterSlider
              label="Irrigation Efficiency"
              min={0.8}
              max={1.0}
              step={0.05}
              defaultValue={parameters.irrigationEfficiency || 0.9}
              unit=""
              description="Water-saving irrigation efficiency ratio"
              onChange={(value) => updateParameter('irrigationEfficiency', value)}
            />

            <ParameterSlider
              label="Fire Generation Share"
              min={0.1}
              max={0.4}
              step={0.05}
              defaultValue={parameters.fireGenerationShare || 0.25}
              unit=""
              description="Target share of fire-based power generation"
              onChange={(value) => updateParameter('fireGenerationShare', value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-between items-center">
          <button
            onClick={resetParameters}
            className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors flex items-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Reset to Defaults
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors text-sm font-medium"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}
