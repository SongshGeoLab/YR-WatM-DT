# Plotly 可视化指南 - 便捷接口

## 🎨 概述

使用 `viz_helpers` 模块提供的便捷函数，一行代码生成专业的 Plotly 交互式图表。

## 🚀 快速开始

### 安装依赖

```bash
poetry add plotly  # 如果还没安装
```

### 基础导入

```python
import sys
from pathlib import Path
sys.path.insert(0, str(Path.cwd()))

from scripts.query_scenarios import ScenarioQuery
from scripts.viz_helpers import (
    plot_multi_scenario,      # 多情景时间序列
    plot_scenario_comparison,  # 参数对比
    plot_heatmap,             # 参数热图
    plot_distribution,        # 分布图
    quick_plot                # 一键绘图
)

# 初始化
query = ScenarioQuery("data_parquet")
```

---

## 📊 使用示例

### 1. 多情景时间序列（最常用）

**一行代码版本**：

```python
from scripts.viz_helpers import quick_plot

fig = quick_plot(
    query,
    variable="Total population",
    filters={"Climate change scenario switch for water yield": 2},
    title="Population Projection - RCP4.5",
    ylabel="Population (万人)"
)
fig.show()
```

**完整版本（更多控制）**：

```python
# 查询数据
data = query.get_series(
    "Total population",
    filters={"Climate change scenario switch for water yield": 2},
    time_range=(2020, 2100)
)

# 绘图
fig = plot_multi_scenario(
    data,
    title="Population Projection - RCP4.5",
    xlabel="Year",
    ylabel="Population (万人)",
    show_ci=True,          # 显示95%置信区间
    show_range=True,       # 显示最小-最大范围
    show_quantiles=False,  # 不显示分位数
    color="#2E86AB",       # 主色调
    height=700,
    width=1200
)

fig.show()

# 保存为 HTML（可交互）
fig.write_html("population_projection.html")

# 保存为静态图片
fig.write_image("population_projection.png", width=1200, height=700)
```

**效果**：
- ✨ 交互式图表（缩放、平移、悬停查看数值）
- 📊 自动显示均值曲线
- 🎨 半透明置信区间阴影
- 📈 可选显示最小-最大范围
- 🔍 悬停时显示详细统计信息

---

### 2. 参数对比图

比较不同参数值的影响：

```python
# 查询数据（需要 include_params=True）
data = query.get_series(
    "YRB WSI",
    filters={"Climate change scenario switch for water yield": 2},
    include_params=True
)

# 对比不同生育率的影响
fig = plot_scenario_comparison(
    data,
    group_by="Fertility Variation",  # 按生育率分组
    title="Water Stress by Fertility Rate (RCP4.5)",
    ylabel="WSI",
    height=700,
    width=1200
)

fig.show()
```

**自定义颜色**：

```python
fig = plot_scenario_comparison(
    data,
    group_by="Diet change scenario switch",
    title="Water Stress by Diet Pattern",
    color_discrete_map={
        1: "#66c2a5",  # Traditional - 绿色
        2: "#fc8d62",  # Moderate - 橙色
        3: "#8da0cb",  # Modern - 蓝色
    }
)
fig.show()
```

---

### 3. 参数热图

查看两个参数如何共同影响结果：

```python
data = query.get_series(
    "YRB available surface water",
    filters={"Climate change scenario switch for water yield": 2},
    include_params=True,
    time_range=(2050, 2100)  # 只看2050-2100
)

fig = plot_heatmap(
    data,
    param1="Fertility Variation",
    param2="Diet change scenario switch",
    aggregate_func="mean",  # 可选: 'mean', 'std', 'max', 'min'
    title="Available Water by Fertility × Diet (2050-2100)",
    colorscale="RdYlBu_r"  # Red-Yellow-Blue reversed
)

fig.show()
```

**常用配色方案**：
- `"Viridis"` - 紫-黄-绿（默认）
- `"RdYlBu_r"` - 红-黄-蓝（反转）
- `"RdBu_r"` - 红-蓝（反转）
- `"Plasma"` - 紫-橙-黄

---

### 4. 分布图

查看某一年的值分布：

```python
data = query.get_series(
    "Total population",
    filters={"Climate change scenario switch for water yield": 2}
)

# 查看 2050 年的分布
fig = plot_distribution(
    data,
    year=2050,
    title="Population Distribution in 2050",
    xlabel="Population (万人)",
    color="#e74c3c"
)

fig.show()
```

**所有年份的总体分布**：

```python
fig = plot_distribution(
    data,
    year=None,  # None = 所有年份
    title="Population Distribution (2020-2100)"
)
fig.show()
```

---

## 🎨 高级定制

### 组合多个图表

```python
from plotly.subplots import make_subplots
import plotly.graph_objects as go

# 查询多个变量
data_pop = query.get_series("Total population", filters={...})
data_wsi = query.get_series("YRB WSI", filters={...})

# 创建子图
fig = make_subplots(
    rows=2, cols=1,
    subplot_titles=("Population", "Water Stress Index"),
    vertical_spacing=0.15
)

# 添加第一个图表
fig1 = plot_multi_scenario(data_pop, show_ci=True)
for trace in fig1.data:
    fig.add_trace(trace, row=1, col=1)

# 添加第二个图表
fig2 = plot_multi_scenario(data_wsi, show_ci=True, color="#e74c3c")
for trace in fig2.data:
    fig.add_trace(trace, row=2, col=1)

# 更新布局
fig.update_xaxes(title_text="Year", row=2, col=1)
fig.update_yaxes(title_text="Population", row=1, col=1)
fig.update_yaxes(title_text="WSI", row=2, col=1)
fig.update_layout(height=900, width=1200, showlegend=False)

fig.show()
```

---

### 添加自定义注释

```python
fig = plot_multi_scenario(data, title="...")

# 添加垂直线标记重要年份
fig.add_vline(
    x=2030,
    line_dash="dash",
    line_color="red",
    annotation_text="2030 Target",
    annotation_position="top right"
)

# 添加横线标记阈值
fig.add_hline(
    y=0.4,
    line_dash="dot",
    line_color="orange",
    annotation_text="Warning Threshold"
)

# 添加文本注释
fig.add_annotation(
    x=2050,
    y=50000,
    text="Peak Population",
    showarrow=True,
    arrowhead=2,
    arrowsize=1,
    arrowwidth=2,
    arrowcolor="red",
    ax=-40,
    ay=-40
)

fig.show()
```

---

### 导出为不同格式

```python
fig = plot_multi_scenario(data, ...)

# 交互式 HTML（推荐）
fig.write_html("report.html")

# 静态图片（需要 kaleido）
fig.write_image("report.png", width=1200, height=700)
fig.write_image("report.pdf", width=1200, height=700)
fig.write_image("report.svg", width=1200, height=700)

# 在 Jupyter 中显示
fig.show()

# 在浏览器中打开
import plotly.offline as pyo
pyo.plot(fig, filename='report.html', auto_open=True)
```

---

## 📦 完整工作流示例

```python
# ============ 设置 ============
import sys
from pathlib import Path
sys.path.insert(0, str(Path.cwd()))

from scripts.query_scenarios import ScenarioQuery
from scripts.viz_helpers import (
    plot_multi_scenario,
    plot_scenario_comparison,
    plot_heatmap
)

# ============ 初始化 ============
query = ScenarioQuery("data_parquet")

# ============ 图表 1: 多情景趋势 ============
print("📊 生成多情景趋势图...")

data1 = query.get_series(
    "Total population",
    filters={"Climate change scenario switch for water yield": 2},
    time_range=(2020, 2100)
)

fig1 = plot_multi_scenario(
    data1,
    title="Population Projection - RCP4.5",
    ylabel="Population (万人)",
    show_ci=True,
    show_range=True,
    height=700,
    width=1200
)
fig1.write_html("output/fig1_population_trend.html")
print("✅ 保存到 output/fig1_population_trend.html")

# ============ 图表 2: 参数对比 ============
print("📊 生成参数对比图...")

data2 = query.get_series(
    "YRB WSI",
    filters={"Climate change scenario switch for water yield": 2},
    include_params=True
)

fig2 = plot_scenario_comparison(
    data2,
    group_by="Fertility Variation",
    title="Water Stress by Fertility Rate",
    ylabel="WSI",
    height=700,
    width=1200
)
fig2.write_html("output/fig2_fertility_comparison.html")
print("✅ 保存到 output/fig2_fertility_comparison.html")

# ============ 图表 3: 参数热图 ============
print("📊 生成参数热图...")

data3 = query.get_series(
    "YRB available surface water",
    filters={"Climate change scenario switch for water yield": 2},
    include_params=True,
    time_range=(2050, 2100)
)

fig3 = plot_heatmap(
    data3,
    param1="Fertility Variation",
    param2="Diet change scenario switch",
    title="Available Water - Fertility × Diet",
    colorscale="RdYlBu_r"
)
fig3.write_html("output/fig3_parameter_heatmap.html")
print("✅ 保存到 output/fig3_parameter_heatmap.html")

print("\n🎉 所有图表生成完成！")
```

---

## 🆚 Plotly vs Matplotlib

| 特性 | Plotly | Matplotlib |
|------|--------|------------|
| 交互性 | ✅ 原生支持 | ❌ 需要额外工具 |
| 美观度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 学习曲线 | 简单 | 中等 |
| 导出 HTML | ✅ 一键导出 | ❌ 不支持 |
| 性能（大数据） | 快 | 较慢 |
| 定制灵活性 | 高 | 极高 |
| 适用场景 | 报告、仪表板 | 科学出版 |

---

## 💡 最佳实践

### 1. 使用一键函数快速探索

```python
from scripts.viz_helpers import quick_plot

# 快速尝试不同变量
for var in ["Total population", "YRB WSI", "GDP per capita"]:
    fig = quick_plot(
        query,
        variable=var,
        filters={"Climate change scenario switch for water yield": 2},
        title=f"{var} - RCP4.5"
    )
    fig.show()
```

### 2. 保存为模板复用

```python
# 定义标准样式
STANDARD_LAYOUT = dict(
    height=700,
    width=1200,
    template='plotly_white',
    font=dict(family="Arial", size=12),
    title=dict(font=dict(size=18, family='Arial Black'))
)

fig = plot_multi_scenario(data, ...)
fig.update_layout(**STANDARD_LAYOUT)
fig.show()
```

### 3. 批量生成报告

```python
variables = ["Total population", "YRB WSI", "GDP per capita"]
filters_list = [
    {"Climate change scenario switch for water yield": 1},  # RCP2.6
    {"Climate change scenario switch for water yield": 2},  # RCP4.5
    {"Climate change scenario switch for water yield": 3},  # RCP8.5
]

for var in variables:
    for i, filters in enumerate(filters_list, 1):
        data = query.get_series(var, filters)
        fig = plot_multi_scenario(
            data,
            title=f"{var} - RCP{[2.6, 4.5, 8.5][i-1]}"
        )
        fig.write_html(f"output/{var}_rcp{i}.html")
```

---

## 🎓 学习资源

- **Plotly 官方文档**: https://plotly.com/python/
- **颜色方案**: https://plotly.com/python/builtin-colorscales/
- **示例画廊**: https://plotly.com/python/plotly-express/

---

## 🚀 快速参考卡片

```python
# 一键绘图（最简单）
from scripts.viz_helpers import quick_plot
fig = quick_plot(query, variable="...", filters={...})

# 多情景趋势（常用）
from scripts.viz_helpers import plot_multi_scenario
fig = plot_multi_scenario(data, title="...", show_ci=True)

# 参数对比（研究用）
from scripts.viz_helpers import plot_scenario_comparison
fig = plot_scenario_comparison(data, group_by="Fertility Variation")

# 参数热图（探索用）
from scripts.viz_helpers import plot_heatmap
fig = plot_heatmap(data, param1="...", param2="...")

# 分布图（统计用）
from scripts.viz_helpers import plot_distribution
fig = plot_distribution(data, year=2050)

# 显示
fig.show()

# 保存
fig.write_html("output.html")
```

---

**Happy Plotting! 🎨**
