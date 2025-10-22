import React from 'react';
import { X, RefreshCw, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useScenario } from '../contexts/ScenarioContext';
import { ParameterSlider } from './ui/parameter-slider';
import { getPresetScenarios, PresetScenario } from '../services/config';

/**
 * Global Parameter Control Panel
 *
 * Floating panel that allows users to adjust all parameters from one place.
 * Changes automatically update all pages.
 *
 * @param onClose - Callback when panel is closed
 */
export default function GlobalParameterPanel({ onClose }: { onClose: () => void }) {
  const { parameters, updateParameter, resetParameters, scenarioResult, loading, applyPresetScenario } = useScenario();
  const [isClosing, setIsClosing] = useState(false);
  const [presetScenarios, setPresetScenarios] = useState<PresetScenario[]>([]);
  const [showPresets, setShowPresets] = useState(false);

  // Load preset scenarios on mount
  useEffect(() => {
    getPresetScenarios('en').then(scenarios => {
      setPresetScenarios(scenarios);
    });
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    // Wait for animation to complete before calling onClose
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleApplyPreset = (preset: PresetScenario) => {
    if (applyPresetScenario) {
      applyPresetScenario(preset.parameters);
      setShowPresets(false);
    }
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
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-xl font-bold text-foreground">Global Parameters</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Adjust parameters to update all pages simultaneously
                </p>
              </div>
              {presetScenarios.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowPresets(!showPresets)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-sm font-medium transition-all shadow-md"
                  >
                    <Sparkles className="w-4 h-4" />
                    Preset Scenarios
                  </button>
                  {showPresets && (
                    <div className="absolute top-full left-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                      <div className="p-2 border-b border-border">
                        <h3 className="font-semibold text-foreground">Quick Scenario Selection</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Load predefined parameter combinations
                        </p>
                      </div>
                      <div className="p-2 space-y-2">
                        {presetScenarios.map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() => handleApplyPreset(preset)}
                            className="w-full text-left p-3 rounded-lg border-2 border-border hover:border-blue-500 hover:bg-muted transition-all group"
                          >
                            <div className="flex items-center gap-2">
                              {preset.color && (
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: preset.color }}
                                />
                              )}
                              <span className="font-medium text-foreground group-hover:text-blue-600">
                                {preset.name}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {preset.description}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
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
              {[1, 2].map(scenario => (
                <button
                  key={scenario}
                  onClick={() => updateParameter('climateScenario', scenario)}
                  className={`px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                    parameters.climateScenario === scenario
                      ? 'bg-cyan-100 dark:bg-cyan-900/30 border-cyan-500 text-cyan-700 dark:text-cyan-300 font-medium'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  RCP{scenario === 1 ? '2.6' : '4.5'}
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
              <ParameterSlider
                label="Fertility Rate"
                min={1.6}
                max={1.8}
                step={0.05}
                defaultValue={parameters.fertility}
                unit=""
                description="Total fertility rate (children per woman)"
                onChange={(value) => updateParameter('fertility', value)}
                allowAny={true}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Diet Pattern</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 1, label: 'Low Meat', fullLabel: 'Traditional Diet (Low Meat)' },
                  { value: 2, label: 'Balanced', fullLabel: 'Moderate Diet (Balanced)' },
                  { value: 3, label: 'High Protein', fullLabel: 'High Animal Protein (High Meat)' }
                ].map(({ value, label, fullLabel }) => (
                  <button
                    key={value}
                    onClick={() => updateParameter('dietPattern', value)}
                    title={fullLabel}
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
              {/* Ecological Water (Page 6) */}
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">
                6
              </span>
              Ecological Water
            </h3>

            <div className="space-y-1">
              <ParameterSlider
                label="Ecological Flow Ratio"
                min={0.2}
                max={0.3}
                step={0.05}
                defaultValue={parameters.ecologicalFlow}
                unit=""
                description="Proportion of ecological flow for sediment flushing"
                onChange={(value) => updateParameter('ecologicalFlow', value)}
                allowAny={true}
              />
            </div>
          </div>
          </div>

          {/* Agriculture (Page 4/5 group moved: Agriculture now Page 4, Composition Page 5) */}
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs">
                4
              </span>
              Agriculture & Industry
            </h3>

            <div className="space-y-1">
              <ParameterSlider
                label="Irrigation Efficiency"
                min={0.8}
                max={1.0}
                step={0.05}
                defaultValue={parameters.irrigationEfficiency}
                unit=""
                description="water saving irrigation efficiency ratio"
                onChange={(value) => updateParameter('irrigationEfficiency', value)}
                allowAny={true}
              />
            </div>

            <div className="space-y-1">
              <ParameterSlider
                label="Thermal Power Generation Share"
                min={0.1}
                max={0.4}
                step={0.05}
                defaultValue={parameters.fireGenerationShare}
                unit=""
                description="Share of thermal (fossil fuel) power in total electricity generation"
                onChange={(value) => updateParameter('fireGenerationShare', value)}
                allowAny={true}
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
