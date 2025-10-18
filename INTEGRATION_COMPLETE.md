# 🎉 多情景查询功能集成完成

## ✅ 已完成的工作

### 1. 后端 API (`scripts/api_server.py`)
- ✅ 新增 `/series/multi` 端点
- ✅ 支持参数 "Any" 逻辑（单值、数组、省略）
- ✅ 返回真实的多情景聚合统计
- ✅ 完全向后兼容

### 2. 前端集成
- ✅ `viz/src/services/api.ts` - API 客户端和类型定义
- ✅ `viz/src/contexts/ScenarioContext.tsx` - 数据层集成
- ✅ 自动识别单/多情景模式
- ✅ 真实数据替代模拟数据

### 3. 文档和测试
- ✅ `docs/API_MULTI_SCENARIO.md` - 完整 API 文档
- ✅ `docs/TEST_MULTI_SCENARIO_INTEGRATION.md` - 测试指南
- ✅ `docs/NOTEBOOK_USAGE_GUIDE.md` - Jupyter 使用指南
- ✅ `scripts/test_multi_series.py` - 测试脚本
- ✅ `CHANGELOG_MULTI_SCENARIO.md` - 更新日志

---

## 🚀 在浏览器中测试

### 启动服务
```bash
make dev
```

### 打开浏览器
```
http://localhost:3000
```

### 测试步骤
1. 打开开发者工具（F12）
2. 在 Global Parameter Panel 中：
   - 设置所有参数 → 看到单情景
   - 点击 "Clear" 按钮 → 看到多情景
3. 查看 Console 日志验证

---

## 📊 在 Jupyter Notebook 中使用

### 快速开始（Matplotlib）

```python
# 1. 导入
import sys
from pathlib import Path
sys.path.insert(0, str(Path.cwd()))

from scripts.query_scenarios import ScenarioQuery
import polars as pl

# 2. 初始化
query = ScenarioQuery("data_parquet")

# 3. 查询数据（固定气候情景）
filters = {
    "Climate change scenario switch for water yield": 2,  # RCP4.5
}

data = query.get_series(
    variables="Total population",
    filters=filters,
    time_range=(2020, 2050),
    include_params=True
)

print(f"匹配了 {data['scenario_name'].n_unique()} 个情景")

# 4. 计算统计
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

# 5. 绘图
import matplotlib.pyplot as plt

stats_pd = stats.to_pandas()
plt.figure(figsize=(12, 6))
plt.plot(stats_pd['time'], stats_pd['mean'], linewidth=2)
plt.fill_between(stats_pd['time'], stats_pd['min'], stats_pd['max'], alpha=0.2)
plt.xlabel('Year')
plt.ylabel('Population')
plt.title('Population Projection (RCP4.5)')
plt.show()
```

### ⭐ 快速开始（Plotly - 推荐）

**一行代码绘图**：

```python
import sys
from pathlib import Path
sys.path.insert(0, str(Path.cwd()))

from scripts.query_scenarios import ScenarioQuery
from scripts.viz_helpers import quick_plot

# 初始化
query = ScenarioQuery("data_parquet")

# 一行代码：查询 + 绘图
fig = quick_plot(
    query,
    variable="Total population",
    filters={"Climate change scenario switch for water yield": 2},
    title="Population - RCP4.5",
    ylabel="Population (万人)",
    show_ci=True,      # 显示置信区间
    show_range=True    # 显示最小-最大范围
)

# 交互式显示
fig.show()

# 保存为 HTML（可分享）
fig.write_html("population_rcp45.html")
```

**优势**：
- ✨ 交互式（缩放、平移、悬停）
- 🎨 自动美化（专业配色）
- 📊 自动计算统计
- 💾 一键导出 HTML

**更多 Plotly 功能**:
- 详细指南：`docs/PLOTLY_VISUALIZATION_GUIDE.md`
- 快速开始：`PLOTLY_QUICKSTART.md`

---

### 核心类：`ScenarioQuery`

**位置**: `scripts/query_scenarios.py`

**主要方法**:
```python
# 1. 过滤情景
filtered_scenarios = query.filter_scenarios({
    "Climate change scenario switch for water yield": 2,
    "Fertility Variation": [1.6, 1.7],  # 列表 = Any
})

# 2. 获取时间序列（长格式）
data = query.get_series(
    variables="YRB WSI",
    filters={"Climate...": 2},
    time_range=(2020, 2100),
    include_params=True  # 包含参数列
)

# 3. 获取时间序列（宽格式）
wide_data = query.get_series_wide(
    variable="GDP per capita",
    filters={"Diet...": 2},
    columns_col="Fertility Variation"  # 参数作为列
)

# 4. 参数分布摘要
summary = query.get_param_summary(filters={"Climate...": 2})

# 5. 列出可用变量
variables = query.list_variables()
```

### 便捷函数

```python
from scripts.query_scenarios import quick_query, compare_params

# 快速查询
data = quick_query(
    variable="Total population",
    filters={"Climate...": 2, "Fertility...": 1.7},
    time_range=(2020, 2050)
)

# 参数对比
comparison = compare_params(
    variable="YRB WSI",
    fixed_params={"Climate...": 2, "Diet...": 2},
    vary_param="Fertility Variation",  # 这个参数作为列
    time_range=(2020, 2100)
)
```

---

## 🔑 关键特性

### "Any" 逻辑

```python
# 单值 = 精确匹配
filters = {"Climate...": 2}

# 列表 = 匹配任意值
filters = {"Climate...": [1, 2, 3]}

# 省略参数 = 不过滤（All）
filters = {}  # 匹配所有情景
```

### 自动聚合

后端自动计算：
- `mean` - 均值
- `std` - 标准差
- `ci_lower`, `ci_upper` - 95% 置信区间
- `min`, `max` - 最小/最大值
- `p05`, `p95` - 5% 和 95% 分位数

---

## 📚 完整文档

### API 文档
- **`docs/API_MULTI_SCENARIO.md`** - 完整 API 规格和示例
- **`docs/TEST_MULTI_SCENARIO_INTEGRATION.md`** - 浏览器测试指南

### Notebook 文档
- **`docs/NOTEBOOK_USAGE_GUIDE.md`** - Jupyter 完整使用指南（必读！）
- 包含 10+ 个实际示例
- 涵盖所有常见使用场景

### 测试和示例
- **`scripts/test_multi_series.py`** - 后端 API 测试脚本
- **`reports/page5.ipynb`** - 实际应用案例

---

## 🆚 对比：API vs Notebook

| 特性 | Web API | Jupyter Notebook |
|------|---------|-----------------|
| 数据源 | HTTP `/series/multi` | `ScenarioQuery` 类 |
| 访问方式 | 网络请求 | 直接读 Parquet |
| 性能 | 🌐 网络延迟 | ⚡ 本地极快 |
| 灵活性 | 标准化接口 | 完全控制 |
| 适用场景 | Web 应用 | 数据探索、研究 |
| 底层实现 | **同一个类** | **同一个类** |

✅ **关键点**: API 和 Notebook **使用相同的底层逻辑** (`ScenarioQuery`)

---

## 💡 最佳实践

### Notebook 中

1. **总是指定时间范围**
   ```python
   # ✅ 好
   data = query.get_series(var, filters, time_range=(2020, 2050))

   # ❌ 可能很慢
   data = query.get_series(var, filters)  # 加载全部
   ```

2. **批量查询多个变量**
   ```python
   # ✅ 好：一次查询
   data = query.get_series(["var1", "var2", "var3"], filters)

   # ❌ 慢：多次查询
   data1 = query.get_series("var1", filters)
   data2 = query.get_series("var2", filters)
   ```

3. **使用 Polars 而非 Pandas**
   ```python
   # ✅ Polars 快很多
   stats = data.group_by("time").agg([pl.col("value").mean()])

   # 只在绘图时转换
   stats_pd = stats.to_pandas()
   plt.plot(stats_pd['time'], stats_pd['mean'])
   ```

---

## 🎯 快速参考

### 创建你的第一个分析 Notebook

1. 在项目根目录创建 `my_analysis.ipynb`
2. 复制以下模板：

```python
# ============ 设置 ============
import sys
from pathlib import Path
sys.path.insert(0, str(Path.cwd()))

from scripts.query_scenarios import ScenarioQuery
import polars as pl
import matplotlib.pyplot as plt

# ============ 初始化 ============
query = ScenarioQuery("data_parquet")
print(f"✅ 加载成功，可用变量: {len(query.list_variables())} 个")

# ============ 查询数据 ============
filters = {
    "Climate change scenario switch for water yield": 2,  # RCP4.5
}

data = query.get_series(
    variables="YRB WSI",
    filters=filters,
    time_range=(2020, 2100),
)

print(f"✅ 查询完成: {data['scenario_name'].n_unique()} 个情景")

# ============ 分析 ============
stats = (
    data.group_by("time")
    .agg([
        pl.col("value").mean().alias("mean"),
        pl.col("value").std().alias("std"),
    ])
    .sort("time")
)

# ============ 可视化 ============
stats_pd = stats.to_pandas()
plt.figure(figsize=(12, 6))
plt.plot(stats_pd['time'], stats_pd['mean'], linewidth=2)
plt.xlabel('Year')
plt.ylabel('YRB WSI')
plt.title('Water Stress Index (RCP4.5)')
plt.show()
```

---

## ✅ 验证清单

在浏览器中：
- [ ] 单情景模式正常（绿色标签）
- [ ] 多情景模式正常（橙色标签）
- [ ] Console 显示 "using /series/multi API"
- [ ] 图表显示置信区间
- [ ] 无 JavaScript 错误

在 Notebook 中：
- [ ] 成功导入 `ScenarioQuery`
- [ ] 能列出可用变量
- [ ] 查询返回数据
- [ ] 统计计算正确
- [ ] 绘图正常显示

---

## 🎉 完成！

你现在可以：

1. **在浏览器中** 使用 Global Parameter Panel 进行交互式探索
2. **在 Notebook 中** 使用 `ScenarioQuery` 进行深度数据分析
3. **使用相同的底层逻辑** 保证一致性

**核心类**: `scripts/query_scenarios.py` 中的 `ScenarioQuery`

**Happy exploring! 🚀**

---

**版本**: 1.0
**完成日期**: 2025-10-18
**作者**: Agent
