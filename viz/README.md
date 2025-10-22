# DT: Wat-M in Yellow River

黄河流域水资源管理决策剧场 (WatM-DT) 前端应用。基于 React + Vite + Plotly.js 构建的交互式数据可视化平台。

Original Figma design: https://www.figma.com/design/hAst4xOwIBYM3KsLovgPAX/%E6%95%B0%E6%8D%AE%E5%8F%AF%E8%A7%86%E5%8C%96%E7%BD%91%E9%A1%B5%E5%8E%9F%E5%9E%8B

---

## Quick Start

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Runs on http://localhost:3000 (or next available port)

### Production Build
```bash
npm run build
npm run preview
```

---

## 🎯 Latest Updates

> **注意**: 版本管理由 [Google Release Please](https://github.com/googleapis/release-please) 自动处理，请遵循 [Conventional Commits](https://conventionalcommits.org/) 规范提交代码。

当前版本: **v0.1.0** → **v2.0.0** (待发布)

### 📊 完整重构：所有页面完成集成

#### **Page 1: Introduction - 黄河流域介绍**
展示黄河流域概况，包含河流分析气泡图和交互式地图。

#### **Page 2: Climate Change Impact Analysis - 气候变化影响分析**
完整的气候变化情景分析页面，展示多情景聚合与不确定性可视化。

##### 核心功能
1. **河流分析气泡图**
   - 河流流量与流域面积的关系分析
   - 河流泥沙负荷分析
   - 交互式气泡图展示

2. **黄河流域地图**
   - 交互式 Leaflet 地图
   - 流域边界和主要河流显示

#### **Page 4: Water Demand Analysis - 用水需求分析**
灌溉用水和生产用水需求分析，支持参数调节。

##### 核心功能
1. **参数滑块控制**
   - 灌溉效率调节
   - 火力发电比例调节
   - 从API动态获取参数范围

2. **用水需求图表**
   - 灌溉用水需求时间序列
   - 生产用水需求时间序列
   - 多情景不确定性可视化

3. **现在vs未来对比面板**
   - 2020年vs 2100年数据对比
   - 变化趋势和百分比显示

#### **Page 5: Water Composition Analysis - 用水组成分析**
用水组成趋势分析和总用水需求分析。

##### 核心功能
1. **用水组成分析**
   - 饼图显示各用水类型比例
   - 灌溉、生产、生活用水组成

2. **总用水需求时间序列**
   - 多情景聚合显示
   - 不确定性区间可视化

3. **现在vs未来对比面板**
   - 三列布局展示各用水类型对比
   - 2020年vs 2100年数据对比

#### **Page 7: Water Stress Index Analysis - 水压力指数分析**
全局情景选择和水压力指数监控分析。

##### 核心功能
1. **全局情景选择**
   - 三个预设情景选择
   - 激进可持续转型、平衡发展、经济优先
   - 影响全局参数设置

2. **水压力指数监控**
   - 时间序列图表显示
   - 阈值线指示
   - 情景分析信息面板
   - 自动检测并显示情景数量
   - 实时切换，无需手动配置

4. **气候影响对比面板** (`DataComparisonPanel`)
   - 温度变化 (2020 → 2100)
   - 降水变化 (2020 → 2100)
   - 水资源可用性变化 (2020 → 2100)
   - 显示当前值、未来值、变化量和变化百分比
   - 趋势指示器 (上升/下降)

5. **响应式布局优化**
   - 自适应高度，无需滚动条
   - Flexbox 布局，自动分配空间
   - 暗黑模式完美支持

##### 技术实现

**新增组件**
- `DataComparisonPanel.tsx`: 气候影响对比面板
  - 三指标卡片式布局
  - 渐变背景和阴影效果
  - 动态趋势图标和颜色

**新增 Hook**
- `useClimateComparison.ts`: 气候数据对比逻辑
  - 调用 `/climate-data` API 获取温度和降水
  - 调用 `/series/multi` API 获取水资源数据
  - 计算 2020 基准年和未来平均值
  - 返回变化量和百分比

**更新组件**
- `WaterAvailabilityPage.tsx`: 完全重写数据获取逻辑
  - 自定义 `useEffect` 处理 SNWTP 参数
  - 集成 `useClimateComparison` hook
  - 多情景聚合数据处理
  - Plotly 不确定性区间可视化

**ScenarioContext 增强**
- `useScenarioSeries`: 支持多情景聚合
  - 单情景：返回 `{ value: [...] }`
  - 多情景：返回 `{ mean: [...], min: [...], max: [...], std: [...], p05: [...], p95: [...] }`
  - 自动检测 `isSingleScenario` 标志

##### API 集成
```typescript
// Multi-scenario series with SNWTP parameter
const result = await api.getSeriesMulti(
  'YRB available surface water',
  {
    'Climate change scenario switch for water yield': [1, 2, 3],
    'SNWTP': snwtpEnabled ? 1 : 0
  },
  { start_year: 2020, end_year: 2100, aggregate: true }
);

// Climate data for comparison
const climateData = await api.getClimateData();
const tempData = climateData.temperature['ssp245_corrected'].values;
```

##### 数据可视化模式

**单情景显示**
```
当用户设置所有参数为具体值时：
→ API 返回 1 个匹配情景
→ 显示单条曲线
→ 图例：情景名称 (如 "sc_1234")
```

**多情景显示**
```
当用户设置部分参数为 "Any" 时：
→ API 返回 N 个匹配情景
→ 显示均值曲线 + 不确定性阴影 (min/max)
→ 图例：Mean (N scenarios)
→ 阴影区域：浅青色半透明 (rgba(6, 182, 212, 0.2))
```

**不确定性可视化**
```typescript
// Plotly traces for uncertainty band
traces.push({
  x: series.time,
  y: series.min,
  type: 'scatter',
  mode: 'lines',
  line: { width: 0 },
  showlegend: false,
  hoverinfo: 'skip'
});
traces.push({
  x: series.time,
  y: series.max,
  type: 'scatter',
  mode: 'lines',
  fill: 'tonexty',  // Fill to previous trace
  fillcolor: 'rgba(6, 182, 212, 0.2)',
  line: { width: 0 },
  showlegend: false,
  hoverinfo: 'skip'
});
traces.push({
  x: series.time,
  y: series.mean,
  type: 'scatter',
  mode: 'lines',
  line: { color: '#06b6d4', width: 3 },
  name: `Mean (${n_scenarios} scenarios)`
});
```

---

## 📁 Project Structure

```
viz/
├── src/
│   ├── components/
│   │   ├── pages/
│   │   │   ├── StudyAreaPage.tsx                    # ✅ Page 1 (v3.0 完全重构)
│   │   │   ├── WaterAvailabilityPage.tsx            # ✅ Page 2 (v2.0 完全集成)
│   │   │   ├── DemographicsPageOptimized.tsx        # ✅ Page 3 (已集成)
│   │   │   ├── EcologicalWaterPageSlider.tsx        # ✅ Page 4 (已集成)
│   │   │   ├── WaterDemandPageWithRealData.tsx      # ✅ Page 5 (v3.0 完全重构)
│   │   │   ├── WaterStressIndexPage.tsx             # ✅ Page 6 (v3.0 完全重构)
│   │   │   └── WaterQualityPage.tsx                 # ✅ Page 7 (v3.0 完全重构)
│   │   ├── charts/
│   │   │   └── PlotlyChart.tsx                      # 可复用图表组件
│   │   ├── DataComparisonPanel.tsx                  # 气候影响对比面板
│   │   ├── WaterDemandComparisonPanel.tsx           # **NEW**: 用水需求对比面板
│   │   ├── WaterCompositionComparisonPanel.tsx      # **NEW**: 用水组成对比面板
│   │   ├── GlobalParameterPanel.tsx                 # 全局参数控制面板
│   │   ├── GlobalScenarioSelection.tsx              # 全局情景选择组件
│   │   └── ui/                                      # shadcn/ui 组件库
│   ├── contexts/
│   │   └── ScenarioContext.tsx                      # 全局状态管理
│   ├── hooks/
│   │   ├── useApiData.ts                            # 通用数据获取
│   │   ├── useClimateComparison.ts                  # 气候数据对比
│   │   ├── useWaterDemandComparison.ts              # **NEW**: 用水需求对比
│   │   └── useWaterCompositionComparison.ts         # **NEW**: 用水组成对比
│   ├── services/
│   │   └── api.ts                                   # API 客户端
│   └── styles/
│       └── globals.css                              # 全局样式
├── package.json
├── vite.config.ts
└── README.md
```

---

## 🔌 Backend API Integration

### 后端数据结构变化 (v2.0)

#### 1. SNWTP 参数扩展
- 原始情景数：4725
- 扩展后情景数：9450 (每个基础情景 × 2 SNWTP 选项)
- 参数名：`SNWTP` (0=关闭, 1=开启)

#### 2. 新增 API 端点

**`GET /series/multi`**
多情景聚合时间序列：
```typescript
interface MultiSeriesResponse {
  variable: string;
  n_scenarios: number;
  isSingleScenario: boolean;
  filter_summary: Record<string, any>;
  series: {
    time: number[];
    mean: number[];
    min: number[];
    max: number[];
    std: number[];
    p05: number[];
    p95: number[];
  };
}
```

**`GET /climate-data`**
RCP/SSP 气候情景数据：
```typescript
interface ClimateDataResponse {
  temperature: {
    ssp126_corrected: { scenario: string; variable: string; values: number[] };
    ssp245_corrected: { scenario: string; variable: string; values: number[] };
    ssp585_corrected: { scenario: string; variable: string; values: number[] };
  };
  precipitation: {
    ssp126_corrected: { ... };
    ssp245_corrected: { ... };
    ssp585_corrected: { ... };
  };
  years: number[];
}
```

### API 调用示例

```typescript
import * as api from './services/api';

// 1. 多情景聚合查询
const result = await api.getSeriesMulti(
  'YRB available surface water',
  {
    'Climate change scenario switch for water yield': [1, 2, 3], // 多值过滤
    'Fertility Variation': 1.7,
    'SNWTP': 0
  },
  {
    start_year: 2020,
    end_year: 2100,
    aggregate: true
  }
);

// 返回：15 个匹配情景的统计结果
console.log(result.n_scenarios);        // 15
console.log(result.isSingleScenario);   // false
console.log(result.series.mean);        // 均值序列
console.log(result.series.min);         // 最小值序列
console.log(result.series.max);         // 最大值序列

// 2. 气候数据查询
const climateData = await api.getClimateData();
const temp_rcp45 = climateData.temperature.ssp245_corrected.values;
const precip_rcp45 = climateData.precipitation.ssp245_corrected.values;
```

---

## 🎨 UI/UX 设计模式

### 参数控制模式

#### 全局参数
影响所有页面的参数，通过 `GlobalParameterPanel` 控制：
- Climate Scenario (气候情景)
- Fertility Variation (生育率)
- Diet Pattern (饮食模式)
- Ecological Flow (生态流量)
- Irrigation Efficiency (灌溉效率)
- Fire Generation Share (火电比例)

#### 局部参数
仅影响当前页面的参数，直接在页面内控制：
- **SNWTP** (Page 2): 南水北调工程开关
  - 独立于全局状态
  - 仅影响 "YRB available surface water" 变量
  - UI: On/Off 切换按钮

### 图表可视化模式

#### 单情景图表
```
┌─────────────────────────────────────┐
│ Surface Water Availability          │
├─────────────────────────────────────┤
│          /‾‾‾\                      │
│         /     \___                  │
│    ____/          \___              │
│                                     │
│ ━━━━ Scenario: sc_1234             │
└─────────────────────────────────────┘
```

#### 多情景图表（不确定性）
```
┌─────────────────────────────────────┐
│ Surface Water Availability          │
├─────────────────────────────────────┤
│        ████  /‾‾‾\  ████            │
│     ████    /     \████             │
│  ████   ____/          ████         │
│                                     │
│ ──── Mean (15 scenarios)            │
│ ▓▓▓▓ Uncertainty (min-max)          │
└─────────────────────────────────────┘
```

### 暗黑模式适配

所有组件自动适配暗黑模式：
- 图表背景：`paper_bgcolor` 和 `plot_bgcolor`
- 网格线颜色：浅色/深色自动切换
- 文字颜色：`foreground` / `muted-foreground`
- 卡片背景：`card` / `card-foreground`

---

## 🛠️ Development Guide

### 添加新页面集成

参考 `WaterAvailabilityPage.tsx` 实现模式：

1. **使用全局参数**
```typescript
import { useScenario, useScenarioSeries } from '../contexts/ScenarioContext';

const { parameters } = useScenario();
const { data, loading, error } = useScenarioSeries('variable_name', {
  start_step: 39,  // 2020
  end_step: 119    // 2100
});
```

2. **添加局部参数**
```typescript
const [localParam, setLocalParam] = useState(defaultValue);

// Custom fetching with local parameter
useEffect(() => {
  const fetchData = async () => {
    const filters = { ...globalParametersMapping, localParam };
    const result = await api.getSeriesMulti(variable, filters, options);
    setData(result);
  };
  fetchData();
}, [parameters, localParam]);
```

3. **处理多情景数据**
```typescript
const chartData = useMemo(() => {
  if (!data || !data.series) return [];

  const traces = [];

  // Uncertainty band (if multi-scenario)
  if (!data.isSingleScenario && data.series.min && data.series.max) {
    traces.push(
      { x: data.series.time, y: data.series.min, /* ... */ },
      { x: data.series.time, y: data.series.max, fill: 'tonexty', /* ... */ }
    );
  }

  // Main line
  const yData = data.isSingleScenario ? data.series.value : data.series.mean;
  traces.push({ x: data.series.time, y: yData, /* ... */ });

  return traces;
}, [data]);
```

### 代码规范

- 组件使用 TypeScript + React Hooks
- Google 风格注释（英文）
- CSS 使用 Tailwind 实用类
- 状态管理优先使用 Context API
- 图表统一使用 `PlotlyChart` 组件

---

## 📚 Documentation

- **[BACKEND_INTEGRATION_GUIDE.md](./BACKEND_INTEGRATION_GUIDE.md)**: 后端集成标准流程
- **[../README.md](../README.md)**: 项目整体文档
- **[../docs/](../docs/)**: 详细技术文档

---

## 🚀 Future Roadmap

### 页面集成状态
- ✅ **Page 2: Water Availability** - 完全集成，真实数据 + SNWTP 开关 + 气候对比面板
- ✅ **Page 3: Demographics** - 完全集成，多情景分析 + 峰值年份检测 + 不确定性可视化
- ✅ **Page 4: Water Demand** - 完全集成，参数滑块 + 多情景不确定性
- ✅ **Page 5: Water Composition** - 完全集成，用水组成 + 总用水趋势
- ✅ **Page 6: Ecological Water** - 完全集成，阈值对比 + SNWTP 影响分析 + 生态流量计算
- ⏳ Page 1: Study Area (研究区域)
- ⏳ Page 7: Water Quality (水质)

### 计划功能
- [ ] 图表导出 (PNG/CSV)
- [ ] 多变量叠加对比
- [ ] 时间序列下采样（LTTB 算法）
- [ ] 情景收藏和比较
- [ ] 数据表格视图

---

---

## 🔧 重构经验总结

### 页面重构模式

基于第二、三、四页面的重构经验，我们总结出以下标准模式：

#### 1. **数据获取模式**
```typescript
// 标准数据获取模式
const { data, loading, error } = useScenarioSeries('variable_name');

// 自定义数据获取（用于特殊需求）
useEffect(() => {
  const fetchData = async () => {
    const result = await api.getSeriesMulti('variable_name', filters, options);
    // 处理数据...
  };
  fetchData();
}, [parameters, localParams]);
```

#### 2. **多情景不确定性可视化**
```typescript
// 标准不确定性处理
if (!scenarioResult.isSingleScenario && series.min && series.max) {
  // 添加不确定性区间
  traces.push({
    x: series.time,
    y: series.max,
    fill: 'tonexty',
    fillcolor: 'rgba(46, 134, 171, 0.2)',
    // ...
  });
}
```

#### 3. **全局 vs 局部参数**
```typescript
// 全局参数：影响所有页面
const { parameters, updateParameter } = useScenario();

// 局部参数：仅影响当前页面
const [localParam, setLocalParam] = useState(false);
```

#### 4. **响应式布局最佳实践**
```typescript
// 标准响应式布局
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <div className="space-y-4">
    {/* 左侧控制面板 */}
  </div>
  <div className="flex flex-col gap-6">
    {/* 右侧图表区域 */}
  </div>
</div>
```

### 关键技术要点

1. **参数名映射**: 确保前端参数名与后端 API 参数名一致
2. **数据类型处理**: 正确处理单情景 vs 多情景数据的显示逻辑
3. **容器高度**: 使用 `h-full overflow-hidden` 保持页面边距一致
4. **图表高度**: 使用固定高度避免响应式布局问题
5. **不确定性可视化**: 使用 `min/max` 和 `ci_lower/ci_upper` 字段

---

## 📞 Support

维护者：SongshGeo <songshgeo@gmail.com>

项目仓库：https://github.com/SongshGeoLab/YR-WatM-DT

问题反馈：请在 GitHub 仓库提交 Issue
