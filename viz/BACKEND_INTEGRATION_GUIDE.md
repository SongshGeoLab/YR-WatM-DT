# 前后端对接指南 / Backend Integration Guide

## 🎯 概述

本指南基于成功的 Ecological Water 页面集成经验，为其他页面提供标准化的前后端对接流程。

## ✅ 成功案例

**EcologicalWaterPageSlider.tsx** - 已完成，包含：
- 滑块控制的实时数据更新
- 深色模式适配
- 多变量切换
- 统计分析面板

---

## 📋 标准集成流程

### 1. 准备阶段

#### 检查依赖
```bash
# 确保已安装必要依赖
npm install plotly.js-dist-min @types/plotly.js
```

#### 导入必要模块
```tsx
import { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { PlotlyChart } from '../charts/PlotlyChart';
import * as api from '../../services/api';
```

### 2. 状态管理

#### 基础状态
```tsx
const [plotData, setPlotData] = useState<Plotly.Data[]>([]);
const [layout, setLayout] = useState<any>({});
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [statistics, setStatistics] = useState<any>(null);
```

#### 参数控制状态
```tsx
const [parameterValue, setParameterValue] = useState<number>(defaultValue);
const [selectedVariable, setSelectedVariable] = useState<string>('variable_name');
```

### 3. 数据获取函数

#### 标准 loadData 函数
```tsx
const loadData = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);

    // 1. 获取参数选项
    const params = await api.getParams();

    // 2. 构建参数值 (使用当前参数 + 其他参数的默认值)
    const values: api.ParameterValues = {
      "Your Parameter Name": parameterValue,
      "Fertility Variation": params["Fertility Variation"][0],
      "water saving irrigation efficiency ratio": params["water saving irrigation efficiency ratio"][0],
      "fire generation share province target": params["fire generation share province target"][0],
      "Climate change scenario switch for water yield": params["Climate change scenario switch for water yield"][0],
      "Diet change scenario switch": params["Diet change scenario switch"][0]
    };

    // 3. 解析场景
    const result = await api.resolveScenario(values);
    const scenario_name = result.scenario_name;

    // 4. 获取时间序列数据 (2020-2100)
    const series = await api.getSeries(selectedVariable, scenario_name, {
      start_step: 624,  // 2020年
      end_step: 1904    // 2100年
    });

    // 5. 处理数据
    const time = series.series.time;
    const value = series.series.value;

    // 6. 创建图表数据
    setPlotData([{
      x: time,
      y: value,
      type: 'scatter',
      mode: 'lines',
      name: `Parameter = ${parameterValue}`,
      line: { color: '#2ca02c', width: 3 }
    }]);

    // 7. 设置布局 (深色模式适配)
    const darkMode = isDarkMode();
    setLayout({
      title: {
        text: `Parameter Impact on ${selectedVariable} (2020-2100)`,
        font: {
          size: 16,
          family: 'Arial',
          color: darkMode ? '#ffffff' : '#000000'
        }
      },
      xaxis: {
        title: 'Year',
        range: [2020, 2100],
        showgrid: true,
        gridwidth: 1,
        gridcolor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(128, 128, 128, 0.2)',
        color: darkMode ? '#ffffff' : '#000000',
        titlefont: { color: darkMode ? '#ffffff' : '#000000' },
        tickfont: { color: darkMode ? '#ffffff' : '#000000' }
      },
      yaxis: {
        title: `${selectedVariable}`,
        showgrid: true,
        gridwidth: 1,
        gridcolor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(128, 128, 128, 0.2)',
        color: darkMode ? '#ffffff' : '#000000',
        titlefont: { color: darkMode ? '#ffffff' : '#000000' },
        tickfont: { color: darkMode ? '#ffffff' : '#000000' }
      },
      plot_bgcolor: darkMode ? '#1a1a1a' : '#ffffff',
      paper_bgcolor: darkMode ? '#1a1a1a' : '#ffffff',
      template: darkMode ? 'plotly_dark' : 'plotly_white',
      height: 500,
      margin: { l: 80, r: 40, t: 80, b: 80 }
    });

    // 8. 计算统计信息
    const meanValue = value.reduce((a, b) => a + b, 0) / value.length;
    const maxValue = Math.max(...value);
    const minValue = Math.min(...value);
    const maxIndex = value.indexOf(maxValue);
    const minIndex = value.indexOf(minValue);

    setStatistics({
      mean_value: meanValue,
      max_value: maxValue,
      max_year: time[maxIndex],
      min_value: minValue,
      min_year: time[minIndex],
      scenario: scenario_name,
      parameter_value: parameterValue
    });

  } catch (err: any) {
    setError(err.message);
    console.error('Failed to load data:', err);
  } finally {
    setLoading(false);
  }
}, [parameterValue, selectedVariable]);
```

### 4. 深色模式检测

```tsx
// 添加到文件顶部
const isDarkMode = () => {
  if (typeof window !== 'undefined') {
    return document.documentElement.classList.contains('dark') ||
           window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
};
```

### 5. 主题变化监听

```tsx
// 监听主题变化并自动重新渲染图表
useEffect(() => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleThemeChange = () => {
    setTimeout(() => {
      loadData();
    }, 100);
  };

  mediaQuery.addEventListener('change', handleThemeChange);

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        handleThemeChange();
      }
    });
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  });

  return () => {
    mediaQuery.removeEventListener('change', handleThemeChange);
    observer.disconnect();
  };
}, []);
```

### 6. 参数控制组件

#### 滑块控制
```tsx
<div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
  <ParameterSlider
    label="Parameter Name"
    min={minValue}
    max={maxValue}
    step={stepValue}
    defaultValue={defaultValue}
    unit=""
    description="Parameter description"
    onChange={(value) => setParameterValue(value)}
  />
  <div className="flex gap-2 mt-2 md:mt-0">
    {validValues.map((val) => (
      <Button
        key={val}
        variant={parameterValue === val ? "default" : "outline"}
        onClick={() => setParameterValue(val)}
      >
        {val}
      </Button>
    ))}
  </div>
</div>
```

#### 变量切换
```tsx
<div className="flex gap-2 mb-4">
  {availableVariables.map((v) => (
    <Button
      key={v.name}
      variant={selectedVariable === v.name ? "default" : "outline"}
      onClick={() => setSelectedVariable(v.name)}
    >
      {v.label}
    </Button>
  ))}
</div>
```

### 7. 图表渲染

```tsx
{!loading && !error && plotData.length > 0 && (
  <Card className="p-4">
    <PlotlyChart
      id="unique-chart-id"
      height="500px"
      data={plotData}
      layout={layout}
      config={{ responsive: true, displaylogo: false }}
    />
    {statistics && (
      <div className="mt-4 text-sm text-muted-foreground grid grid-cols-2 gap-2">
        <div>
          <p><strong>Parameter:</strong> {statistics.parameter_value}</p>
          <p><strong>Scenario:</strong> {statistics.scenario}</p>
          <p><strong>Mean (2020-2100):</strong> {statistics.mean_value?.toFixed(2)}</p>
        </div>
        <div>
          <p><strong>Max Value:</strong> {statistics.max_value?.toFixed(2)} (Year {statistics.max_year?.toFixed(0)})</p>
          <p><strong>Min Value:</strong> {statistics.min_value?.toFixed(2)} (Year {statistics.min_year?.toFixed(0)})</p>
        </div>
      </div>
    )}
  </Card>
)}
```

---

## 📊 可用变量列表

```typescript
const availableVariables = [
  { name: 'YRB available surface water', label: 'YRB Available Surface Water', unit: 'km³' },
  { name: 'hydrologic station discharge[lijin]', label: 'Discharge at Lijin', unit: 'm³/s' },
  { name: 'sediment load[lijin]', label: 'Sediment Load at Lijin', unit: 'ton' },
  { name: 'Total population', label: 'Total Population', unit: 'people' },
  { name: 'GDP per capita', label: 'GDP per Capita', unit: 'USD' },
  { name: 'YRB WSI', label: 'Water Stress Index', unit: 'ratio' },
  { name: 'domestic water demand province sum', label: 'Domestic Water Demand', unit: 'km³' },
  { name: 'irrigation water demand province sum', label: 'Irrigation Water Demand', unit: 'km³' },
  { name: 'production water demand province sum', label: 'Production Water Demand', unit: 'km³' }
];
```

## 🎛️ 参数配置

```typescript
// 参数名称必须与后端 API 完全一致
const parameterConfigs = {
  fertility: {
    name: "Fertility Variation",
    values: [1.6, 1.65, 1.7, 1.75, 1.8],
    default: 1.6
  },
  irrigation: {
    name: "water saving irrigation efficiency ratio",
    values: [0.8, 0.85, 0.9, 0.95, 1.0],
    default: 0.8
  },
  ecoFlow: {
    name: "Ecological water flow variable",
    values: [0.2, 0.25, 0.3],
    default: 0.25
  },
  fireGeneration: {
    name: "fire generation share province target",
    values: [0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4],
    default: 0.1
  },
  climateSwitch: {
    name: "Climate change scenario switch for water yield",
    values: [1, 2, 3],
    default: 1
  },
  dietSwitch: {
    name: "Diet change scenario switch",
    values: [1, 2, 3],
    default: 1
  }
};
```

---

## 🔧 常见问题解决

### 1. 数据不显示
- ✅ 检查参数名称是否与后端 API 一致
- ✅ 确认场景解析成功 (`scenario_name` 不为空)
- ✅ 验证时间步长设置 (2020-2100: start_step=624, end_step=1904)

### 2. 深色模式问题
- ✅ 使用 `isDarkMode()` 函数检测主题
- ✅ 设置 `template: darkMode ? 'plotly_dark' : 'plotly_white'`
- ✅ 添加主题变化监听器

### 3. 滑块控制问题
- ✅ 使用 `useCallback` 包装 `loadData` 函数
- ✅ 在 `useEffect` 中监听参数变化
- ✅ 确保滑块值在有效范围内

---

## 🚀 快速模板

基于 EcologicalWaterPageSlider.tsx 创建新页面：

1. **复制文件**: `EcologicalWaterPageSlider.tsx` → `YourPageSlider.tsx`
2. **修改参数**: 更新 `parameterValue`, `parameterName`, `availableVariables`
3. **更新标题**: 修改页面标题和图标
4. **调整布局**: 根据页面需求调整组件布局
5. **测试功能**: 验证滑块控制和数据更新

---

## 📝 检查清单

- [ ] 导入所有必要模块
- [ ] 设置正确的状态管理
- [ ] 实现 `loadData` 函数
- [ ] 添加深色模式支持
- [ ] 创建参数控制组件
- [ ] 配置图表渲染
- [ ] 添加错误处理
- [ ] 测试滑块功能
- [ ] 验证主题切换
- [ ] 更新 App.tsx 路由

---

## 🎯 成功标准

✅ **功能完整**: 滑块移动 → 场景更新 → 数据刷新 → 图表重绘
✅ **深色模式**: 主题切换时图表自动适配
✅ **用户体验**: 加载状态、错误提示、统计信息
✅ **代码质量**: 类型安全、错误处理、性能优化

---

**参考实现**: `viz/src/components/pages/EcologicalWaterPageSlider.tsx`
