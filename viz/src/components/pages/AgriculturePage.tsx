import { PlotlyChart } from '../charts/PlotlyChart';
import { ParameterSlider } from '../ui/parameter-slider';
import ExplanationPopover from '../ui/ExplanationPopover';
import { Sprout } from 'lucide-react';

/**
 * Agriculture and Industry Page Component
 *
 * Displays agricultural water demand, irrigation efficiency controls,
 * and industrial water usage patterns.
 */
export default function AgriculturePage() {
  return (
    <div className="bg-card rounded-lg border-2 border-dashed border-border p-6 h-full overflow-hidden">
      <div className="flex items-center gap-6 mb-6">
        <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center text-white shadow-lg">
          <Sprout className="w-8 h-8" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-foreground">Agriculture and Industry</h1>
            <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium">
              Page 5
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Irrigation Efficiency & Industrial Water Demand</p>
        </div>
      </div>

      <div className="space-y-3 h-[calc(100%-4rem)]">
        <div className="text-foreground text-base leading-relaxed">
          <p>
            <span className="font-medium">Agriculture accounts for approximately 65% of total water consumption</span>
            in the Yellow River Basin, while industry represents 23% of total demand.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <label className="text-sm font-medium text-foreground">
                water saving irrigation efficiency ratio
              </label>
              <ExplanationPopover explanationKey="irrigation_efficiency" lang="en" iconSize={14} />
            </div>
            <ParameterSlider
              label=""
              min={0.8}
              max={1.0}
              step={0.05}
              defaultValue={0.9}
              unit=""
              description="Efficiency ratio of water-saving irrigation technology in agriculture"
            />
          </div>
          <ParameterSlider
            label="Thermal Power Generation Share"
            min={0.1}
            max={0.4}
            step={0.05}
            defaultValue={0.25}
            unit=""
            description="Share of thermal (fossil fuel) power in total electricity generation at provincial level"
          />
        </div>

        <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
          <div className="min-h-0">
            <PlotlyChart
              id="water-demand-composition"
              title="Water Demand Composition"
              height="100%"
            />
          </div>
          <div className="min-h-0">
            <PlotlyChart
              id="total-water-demand-timeseries"
              title="Total Water Demand Time Series"
              height="100%"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
