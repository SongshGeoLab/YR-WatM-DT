# Plotly 快速开始 ⚡

## 🎨 一行代码绘图

```python
import sys
from pathlib import Path
sys.path.insert(0, str(Path.cwd()))

from scripts.query_scenarios import ScenarioQuery
from scripts.viz_helpers import quick_plot

# 初始化
query = ScenarioQuery("data_parquet")

# 一行绘图
fig = quick_plot(
    query,
    variable="Total population",
    filters={"Climate change scenario switch for water yield": 2},
    title="Population - RCP4.5"
)

fig.show()  # 交互式显示
fig.write_html("output.html")  # 保存为 HTML
```

---

## 📊 四种图表类型

### 1. 多情景趋势（最常用）

```python
from scripts.viz_helpers import plot_multi_scenario

data = query.get_series("YRB WSI", filters={...})
fig = plot_multi_scenario(
    data,
    title="Water Stress Index",
    show_ci=True,       # 置信区间
    show_range=True     # 最小-最大范围
)
fig.show()
```

### 2. 参数对比

```python
from scripts.viz_helpers import plot_scenario_comparison

data = query.get_series("...", filters={...}, include_params=True)
fig = plot_scenario_comparison(
    data,
    group_by="Fertility Variation",
    title="By Fertility Rate"
)
fig.show()
```

### 3. 参数热图

```python
from scripts.viz_helpers import plot_heatmap

data = query.get_series("...", filters={...}, include_params=True)
fig = plot_heatmap(
    data,
    param1="Fertility Variation",
    param2="Diet change scenario switch",
    colorscale="RdYlBu_r"
)
fig.show()
```

### 4. 分布图

```python
from scripts.viz_helpers import plot_distribution

data = query.get_series("...", filters={...})
fig = plot_distribution(data, year=2050)
fig.show()
```

---

## ✨ 主要优势

- ✅ **交互式**：缩放、平移、悬停查看
- ✅ **美观**：专业配色，自动美化
- ✅ **便捷**：一行代码生成复杂图表
- ✅ **分享**：导出 HTML，在浏览器中打开
- ✅ **零配置**：开箱即用

---

## 📚 完整文档

- **详细指南**: `docs/PLOTLY_VISUALIZATION_GUIDE.md`
- **Notebook 使用**: `docs/NOTEBOOK_USAGE_GUIDE.md`

---

**开始探索！🚀**
