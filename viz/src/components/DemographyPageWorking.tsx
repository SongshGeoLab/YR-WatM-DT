import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { BasicChart } from './charts/BasicChart';
import { Users, Home, TrendingUp } from 'lucide-react';
import { PlotlyChart } from './charts/PlotlyChart';

export function DemographyPageWorking() {
  const [status, setStatus] = useState<string>('');
  const [plotData, setPlotData] = useState<any[] | null>(null);
  const [layout, setLayout] = useState<any | null>(null);

  const load = async () => {
    try {
      setStatus('加载数据...');
      const API_BASE = 'http://127.0.0.1:8000';
      const variable = 'Total population';
      console.log('[Demography] fetch params → resolve → series for', variable);
      const paramsRes = await fetch(`${API_BASE}/params`, { cache: 'no-store' });
      const params = await paramsRes.json();
      const values: Record<string, string | number> = {};
      Object.entries(params).forEach(([k, arr]: any) => { values[k] = (arr as any[])[0]; });
      const scRes = await fetch(`${API_BASE}/resolve_scenario`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ values }), cache: 'no-store' });
      const { scenario_name } = await scRes.json();
      console.log('[Demography] scenario_name', scenario_name);
      const seriesRes = await fetch(`${API_BASE}/series?variable=${encodeURIComponent(variable)}&scenario=${encodeURIComponent(scenario_name)}`, { cache: 'no-store' });
      const series = await seriesRes.json();
      console.log('[Demography] series points', series?.series?.time?.length ?? 0);
      const time = series?.series?.time ?? [];
      const value = series?.series?.value ?? [];
      if (time.length && value.length) {
        setPlotData([
          { x: time, y: value, type: 'scatter', mode: 'lines', name: `${variable} | ${scenario_name}` }
        ]);
        setLayout({ xaxis: { title: 'Time' }, yaxis: { title: variable } });
        setStatus('');
      } else {
        const demoX = Array.from({ length: 80 }, (_, i) => 2020 + i);
        const demoY = demoX.map((_, i) => 400 + i * 1.2);
        setPlotData([
          { x: demoX, y: demoY, type: 'scatter', mode: 'lines', name: 'Demo population' }
        ]);
        setLayout({ xaxis: { title: 'Year' }, yaxis: { title: 'Population (M)' } });
        setStatus('使用示例数据（API空返回）');
      }
    } catch (e: any) {
      const demoX = Array.from({ length: 80 }, (_, i) => 2020 + i);
      const demoY = demoX.map((_, i) => 400 + i * 1.2);
      setPlotData([
        { x: demoX, y: demoY, type: 'scatter', mode: 'lines', name: 'Demo population' }
      ]);
      setLayout({ xaxis: { title: 'Year' }, yaxis: { title: 'Population (M)' } });
      setStatus(`使用示例数据（${e?.message ?? e}）`);
    }
  };

  useEffect(() => { load(); }, []);
  // 人口投影数据 - 显示总人口趋势
  const populationData = [
    { label: '2020', value: 450 },
    { label: '2030', value: 465 },
    { label: '2040', value: 475 },
    { label: '2050', value: 485 },
    { label: '2060', value: 490 }
  ];

  // 家庭规模分布数据
  const householdData = [
    { label: '1 person', value: 13 },
    { label: '2 people', value: 23 },
    { label: '3 people', value: 31 },
    { label: '4 people', value: 25 },
    { label: '5+ people', value: 9 }
  ];

  return (
    <div className="h-full p-6 overflow-auto">
      <Card className="max-w-none h-full p-6 border-2 border-dashed border-gray-300">
        {/* 页面标题 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-bold">
              3
            </div>
            <h1 className="text-3xl font-bold">Demography & Households</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              <Users className="w-3 h-3 mr-1" />
              UN Population Model
            </Badge>
          </div>
        </div>

        {/* 主要图表区域 - 2x1 网格布局 */}
        <div className="chart-grid-2x1 h-[calc(100vh-320px)]">
          {/* 人口投影图表 */}
          <div>
            <div className="mb-3 text-sm text-red-600">{status || '就绪'}</div>
            <div className="mb-3">
              <button
                onClick={load}
                className="px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-50"
              >
                重新拉取人口数据
              </button>
            </div>
            <PlotlyChart
              id="population-projections"
              height="360px"
              data={plotData ?? []}
              layout={layout ?? {}}
              config={{ responsive: true, displaylogo: false }}
            />
          </div>

          {/* 右侧：关键指标和家庭规模分布 */}
          <div className="space-y-4">
            {/* 家庭规模分布图表 */}
            <div className="h-1/2">
              <BasicChart
                title="Household Size Distribution"
                description="Distribution of household sizes across the basin"
                data={householdData}
                type="bar"
              />
            </div>

            {/* 关键指标卡片 */}
            <div className="grid grid-cols-1 gap-3 h-1/2">
              <Card className="p-3 bg-gradient-to-r from-purple-50 to-purple-100">
                <div className="text-xl font-bold text-purple-700">495M</div>
                <div className="text-xs text-purple-600">Peak Population (2070)</div>
                <div className="text-xs text-gray-600">+10% from 2020</div>
              </Card>

              <Card className="p-3 bg-gradient-to-r from-blue-50 to-blue-100">
                <div className="text-xl font-bold text-blue-700">87%</div>
                <div className="text-xs text-blue-600">Urbanization Rate (2050)</div>
                <div className="text-xs text-gray-600">Currently 63%</div>
              </Card>

              <Card className="p-3 bg-gradient-to-r from-orange-50 to-orange-100">
                <div className="text-xl font-bold text-orange-700">136 km³</div>
                <div className="text-xs text-orange-600">Water Demand (2100)</div>
                <div className="text-xs text-gray-600">+60% from current</div>
              </Card>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
