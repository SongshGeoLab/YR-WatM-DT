import { Card } from './ui/card';
import { Button } from './ui/button';
import { CalendarDays, Download, RefreshCw } from 'lucide-react';

interface SimpleFiltersProps {
  selectedVariable: string;
  onVariableChange: (value: string) => void;
  selectedTimeWindow: string;
  onTimeWindowChange: (value: string) => void;
  selectedScenario: string;
  onScenarioChange: (value: string) => void;
  onExport: (type: 'png' | 'csv') => void;
  onRefresh: () => void;
}

export function SimpleFilters({
  selectedVariable,
  onVariableChange,
  selectedTimeWindow,
  onTimeWindowChange,
  selectedScenario,
  onScenarioChange,
  onExport,
  onRefresh
}: SimpleFiltersProps) {
  return (
    <Card className="p-4 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">全局筛选</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">主要变量</label>
              <select
                value={selectedVariable}
                onChange={(e) => onVariableChange(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="water_availability">水资源可用性</option>
                <option value="population">人口增长</option>
                <option value="agriculture">农业需求</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">时间窗口</label>
              <select
                value={selectedTimeWindow}
                onChange={(e) => onTimeWindowChange(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="2020-2030">2020-2030</option>
                <option value="2030-2050">2030-2050</option>
                <option value="2050-2100">2050-2100</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">气候情景</label>
              <select
                value={selectedScenario}
                onChange={(e) => onScenarioChange(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="rcp26">RCP2.6 (低排放)</option>
                <option value="rcp45">RCP4.5 (中等排放)</option>
                <option value="rcp85">RCP8.5 (高排放)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            刷新
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport('png')}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            PNG
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport('csv')}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            CSV
          </Button>
        </div>
      </div>
    </Card>
  );
}
