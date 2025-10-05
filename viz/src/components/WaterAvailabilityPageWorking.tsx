import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { PlotlyChart } from './charts/PlotlyChart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

const monthlyData = [
  { month: 'Jan', historical: 8500, rcp26: 8800, rcp45: 8600, rcp85: 8200 },
  { month: 'Feb', historical: 7200, rcp26: 7500, rcp45: 7300, rcp85: 6900 },
  { month: 'Mar', historical: 9800, rcp26: 10200, rcp45: 9900, rcp85: 9400 },
  { month: 'Apr', historical: 15600, rcp26: 16200, rcp45: 15800, rcp85: 15000 },
  { month: 'May', historical: 22400, rcp26: 23100, rcp45: 22700, rcp85: 21600 },
  { month: 'Jun', historical: 35200, rcp26: 36500, rcp45: 35800, rcp85: 34100 }
];

const annualTrendData = [
  { year: '2020', rcp26: 249.4, rcp45: 249.4, rcp85: 249.4 },
  { year: '2030', rcp26: 256.8, rcp45: 252.1, rcp85: 245.7 },
  { year: '2040', rcp26: 262.3, rcp45: 255.9, rcp85: 242.8 },
  { year: '2050', rcp26: 267.1, rcp45: 258.4, rcp85: 238.6 }
];

export function WaterAvailabilityPageWorking() {
  const [status, setStatus] = useState<string>('');
  const [plotData, setPlotData] = useState<any[] | null>(null);
  const [layout, setLayout] = useState<any | null>(null);

  useEffect(() => {
    async function init() {
      try {
        setStatus('加载数据...');
        const API_BASE = 'http://127.0.0.1:8000';
        const variable = 'YRB available surface water';
        const paramsRes = await fetch(`${API_BASE}/params`, { cache: 'no-store' });
        const params = await paramsRes.json();
        const values: Record<string, string | number> = {};
        Object.entries(params).forEach(([k, arr]: any) => { values[k] = (arr as any[])[0]; });
        const scRes = await fetch(`${API_BASE}/resolve_scenario`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ values }), cache: 'no-store' });
        const { scenario_name } = await scRes.json();
        const seriesRes = await fetch(`${API_BASE}/series?variable=${encodeURIComponent(variable)}&scenario=${encodeURIComponent(scenario_name)}`, { cache: 'no-store' });
        const series = await seriesRes.json();
        const time = series?.series?.time ?? [];
        const value = series?.series?.value ?? [];
        if (time.length && value.length) {
          setPlotData([
            { x: time, y: value, type: 'scatter', mode: 'lines', name: `${variable} | ${scenario_name}` }
          ]);
          setLayout({ xaxis: { title: 'Time' }, yaxis: { title: variable } });
          setStatus('');
        } else {
          // Fallback demo data if API returns empty
          const demoX = Array.from({ length: 120 }, (_, i) => i);
          const demoY = demoX.map(i => 50 + 30 * Math.sin(i / 12));
          setPlotData([
            { x: demoX, y: demoY, type: 'scatter', mode: 'lines', name: 'Demo series' }
          ]);
          setLayout({ xaxis: { title: 'Index' }, yaxis: { title: 'Value' } });
          setStatus('使用示例数据（API空返回）');
        }
      } catch (e: any) {
        // On any error, show demo data so页面不空白
        const demoX = Array.from({ length: 120 }, (_, i) => i);
        const demoY = demoX.map(i => 50 + 30 * Math.cos(i / 10));
        setPlotData([
          { x: demoX, y: demoY, type: 'scatter', mode: 'lines', name: 'Demo series' }
        ]);
        setLayout({ xaxis: { title: 'Index' }, yaxis: { title: 'Value' } });
        setStatus(`使用示例数据（${e?.message ?? e}）`);
      }
    }
    init();
  }, []);

  return (
    <div className="h-full p-6 overflow-auto">
      <Card className="max-w-7xl mx-auto h-full p-8 border-2 border-dashed border-gray-300">
        {/* 页面标题 */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-100 text-cyan-600 font-bold">
            2
          </div>
          <h1 className="text-3xl font-bold">Surface Water Availability</h1>
        </div>

        {/* 控制面板 */}
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">Monthly</Button>
            <Button variant="ghost" size="sm">Annual</Button>
            <Button variant="ghost" size="sm">Seasonal</Button>
          </div>
          {status && <div className="text-sm text-muted-foreground">{status}</div>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100%-200px)]">
          {/* 左侧：月度可用性图表（加入 Plotly 实例） */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Surface Water Availability (Plotly)</h3>
              {plotData && (
                <PlotlyChart
                  id="monthly-water-availability"
                  height="360px"
                  data={plotData}
                  layout={layout ?? undefined}
                  config={{ responsive: true, displaylogo: false }}
                />
              )}
            </Card>
            <Card className="p-4 h-full">
              <h3 className="font-semibold mb-4">Monthly Water Availability by Climate Scenario</h3>
              <div className="grid grid-cols-1 gap-4 h-[90%]">
                <div>
                  <h4 className="font-medium mb-2">Monthly Distribution</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="historical" fill="#6b7280" name="Historical" />
                      <Bar dataKey="rcp26" fill="#10b981" name="RCP2.6" />
                      <Bar dataKey="rcp45" fill="#f59e0b" name="RCP4.5" />
                      <Bar dataKey="rcp85" fill="#ef4444" name="RCP8.5" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Annual Trends</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={annualTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="rcp26" stroke="#10b981" strokeWidth={2} name="RCP2.6" />
                      <Line type="monotone" dataKey="rcp45" stroke="#f59e0b" strokeWidth={2} name="RCP4.5" />
                      <Line type="monotone" dataKey="rcp85" stroke="#ef4444" strokeWidth={2} name="RCP8.5" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>
          </div>

          {/* 右侧：关键指标和说明 */}
          <div className="space-y-6">
            {/* 关键统计数据 */}
            <div className="space-y-3">
              <Card className="p-4 bg-gradient-to-r from-cyan-50 to-cyan-100">
                <div className="text-2xl font-bold text-cyan-700">256 km³</div>
                <div className="text-sm text-cyan-600">Annual Average (2050, RCP4.5)</div>
                <div className="text-xs text-gray-600 mt-1">+2.7% from historical baseline</div>
              </Card>

              <Card className="p-4 bg-gradient-to-r from-green-50 to-green-100">
                <div className="text-2xl font-bold text-green-700">+15%</div>
                <div className="text-sm text-green-600">Wet Season Increase</div>
                <div className="text-xs text-gray-600 mt-1">Jun-Sep under RCP2.6</div>
              </Card>

              <Card className="p-4 bg-gradient-to-r from-red-50 to-red-100">
                <div className="text-2xl font-bold text-red-700">-19%</div>
                <div className="text-sm text-red-600">Century-end Decline</div>
                <div className="text-xs text-gray-600 mt-1">2100 under RCP8.5</div>
              </Card>
            </div>

            {/* 方法说明 */}
            <Card className="p-4 bg-blue-50 border border-blue-200">
              <h4 className="font-medium mb-2">Methodology</h4>
              <div className="text-sm text-gray-600 space-y-2">
                <div>• SWAT+ hydrological model</div>
                <div>• 5 GCM ensemble (2006-2100)</div>
                <div>• Bias-corrected climate inputs</div>
                <div>• Daily simulation at sub-basin scale</div>
                <div>• Validation period: 1980-2005</div>
              </div>
            </Card>

            {/* 数据质量指标 */}
            <div className="space-y-2">
              <Badge variant="outline" className="w-full justify-center">NSE: 0.84 (Calibration)</Badge>
              <Badge variant="outline" className="w-full justify-center">R²: 0.89 (Validation)</Badge>
              <Badge variant="outline" className="w-full justify-center">PBIAS: ±3.2%</Badge>
            </div>
          </div>
        </div>

        {/* 底部导航提示 */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>2 / 7</span>
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
