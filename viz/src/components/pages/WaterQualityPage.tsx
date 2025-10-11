import { PlotlyChart } from '../charts/PlotlyChart';
import { Activity } from 'lucide-react';

/**
 * Water Quality and Sediment Page Component
 *
 * Displays sediment load analysis, global river comparisons,
 * and temporal trends of the Yellow River.
 */
export default function WaterQualityPage() {
  return (
    <div className="bg-card rounded-lg border-2 border-dashed border-border p-6 h-full overflow-hidden">
      <div className="flex items-center gap-6 mb-6">
        <div className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-lg">
          <Activity className="w-8 h-8" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-foreground">Water and Sediment</h1>
            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
              Page 7
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Sediment Load Analysis & Global River Comparison</p>
        </div>
      </div>

      <div className="space-y-3 h-[calc(100%-4rem)]">
        <div className="text-foreground leading-relaxed text-base">
          <p>
            <span className="font-medium">The Yellow River is globally famous for its exceptionally high sediment load
            relative to its water discharge.</span> This unique characteristic distinguishes it from other major river
            systems worldwide.
          </p>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
          <div className="min-h-0">
            <PlotlyChart
              id="discharge-sediment-load"
              title="Global River Comparison: Discharge vs Sediment Load"
              height="100%"
            />
          </div>
          <div className="min-h-0">
            <PlotlyChart
              id="sediment-temporal-trends"
              title="Yellow River Sediment Load Temporal Trends"
              height="100%"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
