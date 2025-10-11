import { X, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
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
  const { parameters, updateParameter, resetParameters, scenarioResult, loading } = useScenario();
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    // Wait for animation to complete before calling onClose
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <div className={`fixed inset-0 z-[9999] backdrop-blur-sm transition-all duration-300 ${
      isClosing
        ? 'bg-black/0'
        : 'bg-black/50'
    }`}>
      <div className={`h-full w-full flex flex-col bg-card shadow-2xl transition-all duration-300 ease-out ${
        isClosing
          ? 'animate-out slide-out-to-top-4 opacity-0'
          : 'animate-in slide-in-from-top-4 opacity-100'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-foreground">Global Parameters</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Adjust parameters to update all pages simultaneously
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Close panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scenario Status */}
        <div className="px-2 py-1 bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">Current Scenario:</span>
              {scenarioResult ? (
                <span className={`px-2 py-1 rounded text-sm font-mono ${
                  scenarioResult.isSingleScenario
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                }`}>
                  {scenarioResult.isSingleScenario
                    ? scenarioResult.primaryScenario
                    : `Multiple (${scenarioResult.count || '?'})`
                  }
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
        <div className="flex-1 overflow-y-auto p-2" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 h-full w-full max-w-none">
            {/* Left Column */}
            <div className="space-y-2">
          {/* Climate Scenario (Page 2) */}
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-cyan-500 text-white flex items-center justify-center text-xs">
                2
              </span>
              Climate Change Scenario
            </h3>
            <div className="grid grid-cols-4 gap-2">
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
              <button
                onClick={() => updateParameter('climateScenario', null)}
                className={`px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                  parameters.climateScenario === null
                    ? 'bg-gray-100 dark:bg-gray-900/30 border-gray-500 text-gray-700 dark:text-gray-300 font-medium'
                    : 'border-border hover:bg-muted'
                }`}
              >
                Any
              </button>
            </div>
          </div>

          {/* Demographics (Page 3) */}
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs">
                3
              </span>
              Demographics
            </h3>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Fertility Rate</label>
                <button
                  onClick={() => updateParameter('fertility', parameters.fertility === null ? 1.7 : null)}
                  className={`px-2 py-1 rounded text-xs transition-all ${
                    parameters.fertility === null
                      ? 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
                      : 'bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground'
                  }`}
                >
                  {parameters.fertility === null ? 'Set to 1.7' : 'Clear'}
                </button>
              </div>
              <ParameterSlider
                label=""
                min={1.6}
                max={1.8}
                step={0.05}
                defaultValue={parameters.fertility || 1.7}
                unit=""
                description={parameters.fertility === null ? "Any value (Multiple scenarios)" : "Total fertility rate (children per woman)"}
                onChange={(value) => updateParameter('fertility', value)}
                disabled={parameters.fertility === null}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Diet Pattern</label>
              <div className="grid grid-cols-4 gap-2">
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
                <button
                  onClick={() => updateParameter('dietPattern', null)}
                  className={`px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                    parameters.dietPattern === null
                      ? 'bg-gray-100 dark:bg-gray-900/30 border-gray-500 text-gray-700 dark:text-gray-300 font-medium'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  Any
                </button>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-2">
              {/* Ecological Water (Page 4) */}
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">
                4
              </span>
              Ecological Water
            </h3>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Ecological Flow Ratio</label>
                <button
                  onClick={() => updateParameter('ecologicalFlow', parameters.ecologicalFlow === null ? 0.25 : null)}
                  className={`px-2 py-1 rounded text-xs transition-all ${
                    parameters.ecologicalFlow === null
                      ? 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
                      : 'bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground'
                  }`}
                >
                  {parameters.ecologicalFlow === null ? 'Set to 0.25' : 'Clear'}
                </button>
              </div>
              <ParameterSlider
                label=""
                min={0.2}
                max={0.3}
                step={0.05}
                defaultValue={parameters.ecologicalFlow || 0.25}
                unit=""
                description={parameters.ecologicalFlow === null ? "Any value (Multiple scenarios)" : "Proportion of ecological flow for sediment flushing"}
                onChange={(value) => updateParameter('ecologicalFlow', value)}
                disabled={parameters.ecologicalFlow === null}
              />
            </div>
          </div>
          </div>

          {/* Agriculture (Page 5) */}
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs">
                5
              </span>
              Agriculture & Industry
            </h3>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Irrigation Efficiency</label>
                <button
                  onClick={() => updateParameter('irrigationEfficiency', parameters.irrigationEfficiency === null ? 0.85 : null)}
                  className={`px-2 py-1 rounded text-xs transition-all ${
                    parameters.irrigationEfficiency === null
                      ? 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
                      : 'bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground'
                  }`}
                >
                  {parameters.irrigationEfficiency === null ? 'Set to 0.85' : 'Clear'}
                </button>
              </div>
              <ParameterSlider
                label=""
                min={0.8}
                max={1.0}
                step={0.05}
                defaultValue={parameters.irrigationEfficiency || 0.85}
                unit=""
                description={parameters.irrigationEfficiency === null ? "Any value (Multiple scenarios)" : "Water-saving irrigation efficiency ratio"}
                onChange={(value) => updateParameter('irrigationEfficiency', value)}
                disabled={parameters.irrigationEfficiency === null}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Fire Generation Share</label>
                <button
                  onClick={() => updateParameter('fireGenerationShare', parameters.fireGenerationShare === null ? 0.15 : null)}
                  className={`px-2 py-1 rounded text-xs transition-all ${
                    parameters.fireGenerationShare === null
                      ? 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
                      : 'bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground'
                  }`}
                >
                  {parameters.fireGenerationShare === null ? 'Set to 0.15' : 'Clear'}
                </button>
              </div>
              <ParameterSlider
                label=""
                min={0.1}
                max={0.4}
                step={0.05}
                defaultValue={parameters.fireGenerationShare || 0.15}
                unit=""
                description={parameters.fireGenerationShare === null ? "Any value (Multiple scenarios)" : "Target share of fire-based power generation"}
                onChange={(value) => updateParameter('fireGenerationShare', value)}
                disabled={parameters.fireGenerationShare === null}
              />
            </div>
            </div>
          </div>
          </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-border flex justify-between items-center">
          <button
            onClick={resetParameters}
            className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors flex items-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Reset to Defaults
          </button>
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors text-sm font-medium"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}
