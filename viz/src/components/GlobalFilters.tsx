import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { CalendarDays, Download, RefreshCw } from 'lucide-react';

interface GlobalFiltersProps {
  selectedVariable: string;
  onVariableChange: (value: string) => void;
  selectedTimeWindow: string;
  onTimeWindowChange: (value: string) => void;
  selectedScenario: string;
  onScenarioChange: (value: string) => void;
  onExport: (type: 'png' | 'csv') => void;
  onRefresh: () => void;
}

export function GlobalFilters({
  selectedVariable,
  onVariableChange,
  selectedTimeWindow,
  onTimeWindowChange,
  selectedScenario,
  onScenarioChange,
  onExport,
  onRefresh
}: GlobalFiltersProps) {
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
              <Select value={selectedVariable} onValueChange={onVariableChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择变量" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="water_availability">水资源可用性</SelectItem>
                  <SelectItem value="population">人口增长</SelectItem>
                  <SelectItem value="agriculture">农业需求</SelectItem>
                  <SelectItem value="industry">工业需水</SelectItem>
                  <SelectItem value="ecology">生态用水</SelectItem>
                  <SelectItem value="water_stress">水资源压力</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">时间窗口</label>
              <Select value={selectedTimeWindow} onValueChange={onTimeWindowChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择时间段" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2020-2030">2020-2030</SelectItem>
                  <SelectItem value="2030-2050">2030-2050</SelectItem>
                  <SelectItem value="2050-2100">2050-2100</SelectItem>
                  <SelectItem value="historical">历史数据</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">气候情景</label>
              <Select value={selectedScenario} onValueChange={onScenarioChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择情景" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rcp26">RCP2.6 (低排放)</SelectItem>
                  <SelectItem value="rcp45">RCP4.5 (中等排放)</SelectItem>
                  <SelectItem value="rcp85">RCP8.5 (高排放)</SelectItem>
                  <SelectItem value="ssp119">SSP1-1.9</SelectItem>
                  <SelectItem value="ssp245">SSP2-4.5</SelectItem>
                </SelectContent>
              </Select>
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
