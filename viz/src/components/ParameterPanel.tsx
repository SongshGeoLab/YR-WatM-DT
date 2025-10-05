import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { ChevronDown, ChevronRight, Settings, TrendingUp, Layers, Palette } from 'lucide-react';

interface ParameterPanelProps {
  className?: string;
}

export function ParameterPanel({ className }: ParameterPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    comparison: false,
    statistics: false,
    visualization: false,
    advanced: false,
    export: false
  });

  const [showStatsBand, setShowStatsBand] = useState(true);
  const [showMultiCurve, setShowMultiCurve] = useState(false);
  const [confidenceLevel, setConfidenceLevel] = useState([90]);
  const [lineStyle, setLineStyle] = useState('solid');
  const [colorPalette, setColorPalette] = useState('continuous');

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          参数控制面板
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 基础参数 */}
        <Collapsible open={expandedSections.basic} onOpenChange={() => toggleSection('basic')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded-md">
            <span className="font-medium">基础参数</span>
            {expandedSections.basic ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="px-2 py-2 space-y-3">
            <div>
              <label className="text-sm font-medium mb-2 block">数据分辨率</label>
              <Select defaultValue="monthly">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">日数据</SelectItem>
                  <SelectItem value="monthly">月数据</SelectItem>
                  <SelectItem value="yearly">年数据</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">空间范围</label>
              <Select defaultValue="basin">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">全球</SelectItem>
                  <SelectItem value="basin">流域</SelectItem>
                  <SelectItem value="regional">区域</SelectItem>
                  <SelectItem value="local">本地</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* 对比分析 */}
        <Collapsible open={expandedSections.comparison} onOpenChange={() => toggleSection('comparison')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded-md">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="font-medium">对比分析</span>
            </div>
            {expandedSections.comparison ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="px-2 py-2 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">多曲线对比</label>
              <Switch checked={showMultiCurve} onCheckedChange={setShowMultiCurve} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">基准情景</label>
              <Select defaultValue="historical">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="historical">历史基准</SelectItem>
                  <SelectItem value="rcp26">RCP2.6</SelectItem>
                  <SelectItem value="rcp45">RCP4.5</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* 统计选项 */}
        <Collapsible open={expandedSections.statistics} onOpenChange={() => toggleSection('statistics')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded-md">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <span className="font-medium">统计选项</span>
            </div>
            {expandedSections.statistics ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="px-2 py-2 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">统计带 (P10-P90)</label>
              <Switch checked={showStatsBand} onCheckedChange={setShowStatsBand} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                置信区间: {confidenceLevel[0]}%
              </label>
              <Slider
                value={confidenceLevel}
                onValueChange={setConfidenceLevel}
                max={99}
                min={50}
                step={5}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">平滑算法</label>
              <Select defaultValue="moving_average">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无平滑</SelectItem>
                  <SelectItem value="moving_average">移动平均</SelectItem>
                  <SelectItem value="lowess">LOWESS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* 可视化样式 */}
        <Collapsible open={expandedSections.visualization} onOpenChange={() => toggleSection('visualization')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded-md">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="font-medium">可视化样式</span>
            </div>
            {expandedSections.visualization ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="px-2 py-2 space-y-3">
            <div>
              <label className="text-sm font-medium mb-2 block">色彩方案</label>
              <Select value={colorPalette} onValueChange={setColorPalette}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="continuous">连续色板</SelectItem>
                  <SelectItem value="categorical">分类色板</SelectItem>
                  <SelectItem value="diverging">发散色板</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">线型样式</label>
              <Select value={lineStyle} onValueChange={setLineStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">实线</SelectItem>
                  <SelectItem value="dashed">虚线</SelectItem>
                  <SelectItem value="dotted">点线</SelectItem>
                  <SelectItem value="mixed">混合</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* 高级选项 */}
        <Collapsible open={expandedSections.advanced} onOpenChange={() => toggleSection('advanced')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded-md">
            <span className="font-medium">高级选项</span>
            {expandedSections.advanced ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="px-2 py-2 space-y-3">
            <div>
              <label className="text-sm font-medium mb-2 block">数据下采样</label>
              <Select defaultValue="auto">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">自动</SelectItem>
                  <SelectItem value="none">关闭</SelectItem>
                  <SelectItem value="aggressive">激进</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">阈值线设置</label>
              <Select defaultValue="none">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无阈值线</SelectItem>
                  <SelectItem value="warning">警戒线</SelectItem>
                  <SelectItem value="critical">临界线</SelectItem>
                  <SelectItem value="custom">自定义</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* 快速操作 */}
        <div className="pt-4 border-t">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              重置参数
            </Button>
            <Button size="sm" className="flex-1">
              应用更改
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
