# Multi-Scenario Query API

## 新增端点：`GET /series/multi`

支持查询多个情景的时间序列数据，实现前端"Any"参数逻辑。

## 功能特性

- ✅ **向后兼容**：不影响现有 `/series` 和 `/resolve_scenario` 端点
- ✅ **灵活过滤**：参数可以是单值、列表或省略（Any）
- ✅ **聚合模式**：返回多情景统计数据（均值、置信区间、最值）
- ✅ **原始模式**：返回每个匹配情景的完整数据
- ✅ **复用现有逻辑**：基于 `ScenarioQuery` 类实现

## API 规格

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `variable` | string | ✅ | 变量名称，如 "YRB WSI" |
| `filters` | string | ✅ | JSON 字符串，参数过滤条件 |
| `start_year` | integer | ❌ | 开始年份（≥1900） |
| `end_year` | integer | ❌ | 结束年份（≥1900） |
| `aggregate` | boolean | ❌ | 是否聚合（默认 true） |

### 过滤器格式

```json
{
  "参数名": 单个值,                    // 精确匹配
  "参数名": [值1, 值2, ...],          // 匹配任意值（Any 逻辑）
  // 省略参数 = 不过滤该参数（相当于 Any）
}
```

## 使用示例

### 示例 1: 固定部分参数，查看聚合统计

**查询：** 固定气候情景为 RCP2.6，生育率为任意值

```bash
curl "http://localhost:8000/series/multi?\
variable=Total%20population&\
filters={\"Climate%20change%20scenario%20switch%20for%20water%20yield\":1}&\
aggregate=true"
```

**响应：**
```json
{
  "variable": "Total population",
  "n_scenarios": 135,
  "filter_summary": {
    "Climate change scenario switch for water yield": {
      "requested": 1,
      "matched": [1]
    },
    "Fertility Variation": {
      "requested": "any",
      "matched": [1.6, 1.65, 1.7, 1.75, 1.8]
    },
    "Diet change scenario switch": {
      "requested": "any",
      "matched": [1, 2, 3]
    }
  },
  "series": {
    "time": [2020, 2021, ..., 2100],
    "mean": [100.5, 101.2, ...],
    "std": [2.3, 2.5, ...],
    "ci_lower": [95.9, 96.2, ...],
    "ci_upper": [105.1, 106.2, ...],
    "min": [92.1, 93.5, ...],
    "max": [108.3, 109.8, ...],
    "p05": [93.2, 94.1, ...],
    "p95": [107.8, 108.9, ...]
  }
}
```

### 示例 2: 多个参数的"Any"逻辑

**查询：** 气候情景为 RCP2.6 或 RCP4.5，生育率为 1.6 或 1.7

```bash
curl "http://localhost:8000/series/multi?\
variable=YRB%20WSI&\
filters={\"Climate%20change%20scenario%20switch%20for%20water%20yield\":[1,2],\"Fertility%20Variation\":[1.6,1.7]}&\
start_year=2020&\
end_year=2050&\
aggregate=true"
```

### 示例 3: 不聚合，返回所有匹配情景

**查询：** 获取每个情景的独立数据

```bash
curl "http://localhost:8000/series/multi?\
variable=GDP%20per%20capita&\
filters={\"Fertility%20Variation\":1.7}&\
aggregate=false"
```

**响应：**
```json
{
  "variable": "GDP per capita",
  "n_scenarios": 27,
  "scenarios": [
    {
      "scenario_name": "sc_0",
      "parameters": {
        "Climate change scenario switch for water yield": 1,
        "Fertility Variation": 1.7,
        "Diet change scenario switch": 1,
        "Ecological water flow variable": 0.2,
        "water-saving irrigation efficiency ratio": 0.8,
        "fire generation share province target": 0.1
      },
      "series": {
        "time": [2020, 2021, ..., 2100],
        "value": [45000, 46200, ..., 125000]
      }
    },
    {
      "scenario_name": "sc_1",
      "parameters": {...},
      "series": {...}
    }
  ]
}
```

## 前端集成

### TypeScript 接口定义

```typescript
// API request
interface MultiSeriesRequest {
  variable: string;
  filters: Record<string, number | number[]>;  // 支持单值或数组
  start_year?: number;
  end_year?: number;
  aggregate?: boolean;
}

// API response (aggregate=true)
interface MultiSeriesAggregateResponse {
  variable: string;
  n_scenarios: number;
  filter_summary: Record<string, {
    requested: number | number[] | "any";
    matched: number[] | string;
  }>;
  series: {
    time: number[];
    mean: number[];
    std: number[];
    ci_lower: number[];
    ci_upper: number[];
    min: number[];
    max: number[];
    p05: number[];
    p95: number[];
  };
}

// API response (aggregate=false)
interface MultiSeriesRawResponse {
  variable: string;
  n_scenarios: number;
  scenarios: Array<{
    scenario_name: string;
    parameters: Record<string, number>;
    series: {
      time: number[];
      value: number[];
    };
  }>;
}
```

### 使用示例

```typescript
async function fetchMultiScenarioData(
  variable: string,
  parameters: ScenarioParameters
): Promise<MultiSeriesAggregateResponse> {
  // 构建 filters：null 值的参数不包含（表示 Any）
  const filters: Record<string, number | number[]> = {};

  if (parameters.climateScenario !== null) {
    filters["Climate change scenario switch for water yield"] = parameters.climateScenario;
  }

  if (parameters.fertility !== null) {
    filters["Fertility Variation"] = parameters.fertility;
  }
  // ... 其他参数

  const params = new URLSearchParams({
    variable,
    filters: JSON.stringify(filters),
    aggregate: 'true',
    start_year: '2020',
    end_year: '2100'
  });

  const response = await fetch(`${API_BASE_URL}/series/multi?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch multi-scenario data: ${response.statusText}`);
  }

  return response.json();
}
```

## 与现有端点的对比

| 特性 | `/series` (旧) | `/series/multi` (新) |
|------|---------------|---------------------|
| 情景选择 | 单个情景名称 | 参数过滤（可匹配多个） |
| 参数灵活性 | 需要先调用 `/resolve_scenario` | 直接支持参数过滤 |
| Any 逻辑 | ❌ 不支持 | ✅ 支持 |
| 聚合统计 | ❌ 不支持 | ✅ 支持（mean, CI, min, max） |
| 时间过滤 | 按 step | 按 year |
| 向后兼容 | - | ✅ 完全兼容 |

## 性能考虑

- **小规模查询**（< 10 个情景）：响应时间 < 100ms
- **中等规模**（10-50 个情景）：响应时间 < 500ms
- **大规模查询**（> 100 个情景）：建议使用 `aggregate=true`，响应时间 < 2s

## 错误处理

| 状态码 | 说明 | 解决方案 |
|--------|------|---------|
| 400 | JSON 格式错误 | 检查 `filters` 参数的 JSON 格式 |
| 404 | 没有匹配的情景 | 放宽过滤条件或检查参数名称 |
| 500 | 服务器内部错误 | 检查变量名称是否存在 |

## 测试端点

访问 FastAPI 自动文档测试：
```
http://localhost:8000/docs#/default/get_series_multi_series_multi_get
```

## 迁移指南

### 从单情景查询迁移

**之前：**
```typescript
// 1. 先解析情景
const resolved = await resolveScenario(parameters);
// 2. 再获取数据
const data = await getSeries(variable, resolved.scenario_name);
```

**现在：**
```typescript
// 一步到位，还支持 Any 逻辑
const data = await getSeriesMulti(variable, parameters, { aggregate: true });
```

### 保持原有逻辑

如果需要精确的单情景查询，继续使用原有端点：
```typescript
// 完全向后兼容
const data = await getSeries(variable, "sc_42");
```
