# Jupyter Notebook 多情景查询指南

## 🎯 概述

在 Jupyter Notebook 中使用与 API 相同的情景查询功能，直接访问 Parquet 数据，无需通过 HTTP。

## 📦 核心模块

- **数据查询**: `scripts/query_scenarios.py` 中的 **`ScenarioQuery`** 类
- **可视化**: `scripts/viz_helpers.py` 中的 **Plotly 便捷函数** ⭐推荐

## 🚀 快速开始

### 1. 基础导入（Matplotlib）

```python
import sys
from pathlib import Path

# 确保能导入项目模块
sys.path.insert(0, str(Path.cwd()))

from scripts.query_scenarios import ScenarioQuery
import polars as pl
import matplotlib.pyplot as plt
```

### 1B. 基础导入（Plotly - 推荐）✨

```python
import sys
from pathlib import Path
sys.path.insert(0, str(Path.cwd()))

from scripts.query_scenarios import ScenarioQuery
from scripts.viz_helpers import (
    plot_multi_scenario,      # 多情景时间序列
    plot_scenario_comparison,  # 参数对比
    quick_plot                # 一键绘图
)

query = ScenarioQuery("data_parquet")
```

### 2. 初始化查询引擎

```python
# 初始化查询引擎（指向 Parquet 数据目录）
query = ScenarioQuery("data_parquet")

# 查看可用变量
print("可用变量：")
for var in query.list_variables():
    print(f"  - {var}")
```

## 📊 使用示例

### 示例 1: 固定部分参数，查询多情景

```python
# 固定气候情景为 RCP4.5，其他参数任意
filters = {
    "Climate change scenario switch for water yield": 2,  # RCP4.5
}

# 查询总人口数据
data = query.get_series(
    variables="Total population",
    filters=filters,
    time_range=(2020, 2050),
    include_params=True
)

print(f"匹配了 {data['scenario_name'].n_unique()} 个情景")
print(f"数据形状: {data.shape}")
print(f"\n前几行:")
print(data.head())
```

**输出示例**:
```
匹配了 1575 个情景
数据形状: (48825, 9)

前几行:
┌──────────────┬──────┬──────────┬─────────┬──────────────┬─────────────┬───────────────┐
│ scenario_name│ step │   time   │  value  │   Climate    │  Fertility  │     Diet      │
│     str      │  i64 │   f64    │  f64    │     i64      │     f64     │     i64       │
├──────────────┼──────┼──────────┼─────────┼──────────────┼─────────────┼───────────────┤
│ sc_0         │  0   │ 2020.0   │ 44000.0 │      2       │    1.6      │      1        │
│ sc_0         │  1   │ 2021.0   │ 44100.0 │      2       │    1.6      │      1        │
│ ...          │ ...  │  ...     │  ...    │     ...      │    ...      │     ...       │
└──────────────┴──────┴──────────┴─────────┴──────────────┴─────────────┴───────────────┘
```

---

### 示例 1B: 使用 Plotly（推荐）✨

**一行代码生成交互式图表**：

```python
from scripts.viz_helpers import quick_plot

# 一行代码：查询 + 绘图
fig = quick_plot(
    query,
    variable="Total population",
    filters={"Climate change scenario switch for water yield": 2},
    title="Population Projection - RCP4.5",
    ylabel="Population (万人)",
    show_ci=True,        # 显示置信区间
    show_range=True      # 显示最小-最大范围
)

# 在 notebook 中显示（交互式）
fig.show()

# 保存为 HTML（可在浏览器中打开）
fig.write_html("population_rcp45.html")
```

**优势**：
- ✨ 交互式（缩放、平移、悬停查看数值）
- 🎨 自动美化（专业配色和样式）
- 📊 自动计算统计（均值、置信区间、最值）
- 💾 一键导出 HTML（分享给他人）

**更多 Plotly 功能**: 查看 `docs/PLOTLY_VISUALIZATION_GUIDE.md`

---

### 示例 2: 参数"Any"逻辑（多个值）

```python
# 气候情景为 RCP2.6 或 RCP4.5，生育率为 1.6 或 1.7
filters = {
    "Climate change scenario switch for water yield": [1, 2],  # 列表 = Any
    "Fertility Variation": [1.6, 1.7],
}

data = query.get_series(
    variables=["YRB WSI", "Total population"],  # 可以查询多个变量
    filters=filters,
    time_range=(2020, 2100)
)

print(f"匹配了 {data['scenario_name'].n_unique()} 个情景")
```

---

### 示例 3: 计算多情景聚合统计

```python
# 查询数据
filters = {
    "Climate change scenario switch for water yield": 2,
}

data = query.get_series(
    variables="YRB WSI",
    filters=filters,
    time_range=(2020, 2100)
)

# 计算每个时间步的统计数据
stats = (
    data.group_by(["step", "time"])
    .agg([
        pl.col("value").mean().alias("mean"),
        pl.col("value").std().alias("std"),
        pl.col("value").min().alias("min"),
        pl.col("value").max().alias("max"),
        pl.col("value").quantile(0.05).alias("p05"),
        pl.col("value").quantile(0.95).alias("p95"),
        pl.col("scenario_name").n_unique().alias("n_scenarios")
    ])
    .with_columns([
        (pl.col("mean") - 1.96 * pl.col("std")).alias("ci_lower"),
        (pl.col("mean") + 1.96 * pl.col("std")).alias("ci_upper")
    ])
    .sort("step")
)

print(stats.head())
```

---

### 示例 4: 绘制多情景图表

```python
import matplotlib.pyplot as plt

# 查询并聚合数据
filters = {"Climate change scenario switch for water yield": 2}
data = query.get_series("YRB WSI", filters=filters, time_range=(2020, 2100))

stats = (
    data.group_by(["time"])
    .agg([
        pl.col("value").mean().alias("mean"),
        pl.col("value").std().alias("std"),
    ])
    .with_columns([
        (pl.col("mean") - 1.96 * pl.col("std")).alias("ci_lower"),
        (pl.col("mean") + 1.96 * pl.col("std")).alias("ci_upper")
    ])
    .sort("time")
)

# 转换为 pandas 用于绘图
stats_pd = stats.to_pandas()

# 绘图
plt.figure(figsize=(12, 6))
plt.plot(stats_pd['time'], stats_pd['mean'], label='Mean', linewidth=2)
plt.fill_between(
    stats_pd['time'],
    stats_pd['ci_lower'],
    stats_pd['ci_upper'],
    alpha=0.3,
    label='95% CI'
)
plt.xlabel('Year')
plt.ylabel('YRB WSI')
plt.title(f'Water Stress Index (RCP4.5, {data["scenario_name"].n_unique()} scenarios)')
plt.legend()
plt.grid(alpha=0.3)
plt.show()
```

---

### 示例 5: 比较不同参数的影响

```python
# 使用便捷函数比较不同参数
from scripts.query_scenarios import compare_params

# 固定其他参数，对比不同灌溉效率的影响
comparison = compare_params(
    variable="irrigation water demand province sum",
    fixed_params={
        "Climate change scenario switch for water yield": 2,
        "Fertility Variation": 1.7,
        "Diet change scenario switch": 2,
        "Ecological water flow variable": 0.25,
        "fire generation share province target": 0.15
    },
    vary_param="water saving irrigation efficiency ratio",  # 这个参数会作为列
    time_range=(2020, 2100)
)

print(comparison.head())
# 结果：时间作为行，不同灌溉效率作为列
```

---

### 示例 6: 查看参数分布

```python
# 查看某些过滤条件下的参数分布
filters = {"Climate change scenario switch for water yield": 2}

summary = query.get_param_summary(filters=filters)
print(summary)
```

**输出示例**:
```
┌────────────────────────────────┬──────────┬────────────────┬────────────┐
│          parameter             │ n_unique │     values     │ n_scenarios│
│            str                 │   i64    │      str       │    i64     │
├────────────────────────────────┼──────────┼────────────────┼────────────┤
│ Climate change scenario...     │    1     │     [2]        │   1575     │
│ Fertility Variation            │    5     │ [1.6, 1.65,... │   1575     │
│ Diet change scenario switch    │    3     │   [1, 2, 3]    │   1575     │
│ ...                            │   ...    │     ...        │    ...     │
└────────────────────────────────┴──────────┴────────────────┴────────────┘
```

---

## 🔧 高级用法

### 宽格式数据（用于比较）

```python
# 获取宽格式数据（时间×参数值）
wide_data = query.get_series_wide(
    variable="GDP per capita",
    filters={"Diet change scenario switch": 2},
    columns_col="Fertility Variation"  # 生育率作为列
)

print(wide_data.head())
# 结果：每行是一个时间点，每列是一个生育率值
```

### 使用便捷函数

```python
from scripts.query_scenarios import quick_query

# 一行代码快速查询
data = quick_query(
    variable="Total population",
    filters={
        "Climate change scenario switch for water yield": 2,
        "Fertility Variation": 1.7
    },
    time_range=(2020, 2050)
)
```

---

## 📚 完整的 Notebook 模板

创建新的 notebook `my_analysis.ipynb`:

```python
# ============ 环境设置 ============
import sys
from pathlib import Path
sys.path.insert(0, str(Path.cwd()))

from scripts.query_scenarios import ScenarioQuery
import polars as pl
import matplotlib.pyplot as plt
import seaborn as sns

# 设置绘图风格
plt.style.use('seaborn-v0_8-darkgrid')
sns.set_palette("husl")

# ============ 初始化 ============
query = ScenarioQuery("data_parquet")
print(f"✅ 数据加载成功")
print(f"📊 可用变量: {len(query.list_variables())} 个")

# ============ 数据查询 ============
# 定义你的过滤条件
filters = {
    "Climate change scenario switch for water yield": 2,  # RCP4.5
    "Fertility Variation": [1.6, 1.7],  # 两个值
}

# 查询数据
data = query.get_series(
    variables="YRB WSI",
    filters=filters,
    time_range=(2020, 2100),
    include_params=True
)

print(f"✅ 查询完成: {data['scenario_name'].n_unique()} 个情景")

# ============ 数据分析 ============
# 计算统计数据
stats = (
    data.group_by("time")
    .agg([
        pl.col("value").mean().alias("mean"),
        pl.col("value").std().alias("std"),
        pl.col("value").min().alias("min"),
        pl.col("value").max().alias("max"),
    ])
    .sort("time")
)

# ============ 可视化 ============
fig, ax = plt.subplots(figsize=(12, 6))
stats_pd = stats.to_pandas()

ax.plot(stats_pd['time'], stats_pd['mean'], linewidth=2, label='Mean')
ax.fill_between(
    stats_pd['time'],
    stats_pd['min'],
    stats_pd['max'],
    alpha=0.2,
    label='Min-Max Range'
)

ax.set_xlabel('Year', fontsize=12)
ax.set_ylabel('YRB WSI', fontsize=12)
ax.set_title('Water Stress Index - Multi-Scenario Analysis', fontsize=14, fontweight='bold')
ax.legend()
ax.grid(alpha=0.3)

plt.tight_layout()
plt.show()

# ============ 结果输出 ============
print("\n📈 关键统计:")
print(f"  均值范围: {stats_pd['mean'].min():.2f} - {stats_pd['mean'].max():.2f}")
print(f"  标准差范围: {stats_pd['std'].min():.2f} - {stats_pd['std'].max():.2f}")
```

---

## 🆚 与 API 对比

| 特性 | Jupyter Notebook | Web API |
|------|-----------------|---------|
| 使用类 | `ScenarioQuery` | `getSeriesMulti()` |
| 数据访问 | 直接读取 Parquet | HTTP 请求 |
| 性能 | ⚡ 更快（本地） | 🌐 网络延迟 |
| 灵活性 | 🔧 完全控制 | 📦 标准化 |
| 适用场景 | 数据探索、研究 | Web 应用 |

---

## 💡 最佳实践

1. **使用过滤减少数据量**
   ```python
   # ✅ 好：指定时间范围
   data = query.get_series(var, filters, time_range=(2020, 2050))

   # ❌ 避免：加载所有数据
   data = query.get_series(var, filters)  # 可能很大
   ```

2. **批量查询多个变量**
   ```python
   # ✅ 好：一次查询多个
   data = query.get_series(["var1", "var2", "var3"], filters)

   # ❌ 避免：分别查询
   data1 = query.get_series("var1", filters)
   data2 = query.get_series("var2", filters)
   ```

3. **使用 Polars 表达式优化**
   ```python
   # Polars 比 Pandas 快很多
   stats = data.group_by("time").agg([pl.col("value").mean()])
   ```

---

## 🎯 实际应用案例

查看项目中的示例 notebooks：

- `reports/page1.ipynb` - 系统概览
- `reports/page2.ipynb` - 气候变化影响
- `reports/page3.ipynb` - 人口统计分析
- `reports/page5.ipynb` - 水需求分析（使用 ScenarioQuery）

---

## 🐛 常见问题

### Q1: 找不到 `query_scenarios` 模块

**解决**:
```python
import sys
from pathlib import Path
sys.path.insert(0, str(Path.cwd()))  # 确保在项目根目录
```

### Q2: Polars 版本问题

**解决**:
```bash
poetry install  # 使用项目依赖
```

### Q3: 数据太大，内存不足

**解决**:
- 使用 `time_range` 限制时间范围
- 只查询需要的变量
- 使用流式处理（Polars lazy API）

---

**Happy exploring! 🚀**
