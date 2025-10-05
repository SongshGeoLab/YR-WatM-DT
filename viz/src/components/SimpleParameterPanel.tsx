import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Settings } from 'lucide-react';

interface SimpleParameterPanelProps {
  className?: string;
}

export function SimpleParameterPanel({ className }: SimpleParameterPanelProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          参数控制面板
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-2 block">数据分辨率</label>
            <select className="w-full p-2 border rounded-md">
              <option value="daily">日数据</option>
              <option value="monthly">月数据</option>
              <option value="yearly">年数据</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">空间范围</label>
            <select className="w-full p-2 border rounded-md">
              <option value="global">全球</option>
              <option value="basin">流域</option>
              <option value="regional">区域</option>
            </select>
          </div>
        </div>

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
