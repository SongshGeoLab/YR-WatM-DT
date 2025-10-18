# 多情景查询功能更新 (Multi-Scenario Query)

## 🎯 更新内容

新增 **`/series/multi`** 端点，支持灵活的多情景查询和 "Any" 参数逻辑。

## ✨ 新功能

### 1. 多情景查询 API

**端点**: `GET /series/multi`

**特性**:
- ✅ 支持参数为单值、数组或省略（Any 逻辑）
- ✅ 聚合模式：返回多情景统计数据（均值、置信区间、最值）
- ✅ 原始模式：返回每个匹配情景的完整数据
- ✅ 完全向后兼容现有 API

### 2. 前端 API 客户端更新

**文件**: `viz/src/services/api.ts`

新增函数：
- `getSeriesMulti()` - 多情景查询
- `parametersToFilters()` - 参数转换辅助函数

新增类型定义：
- `MultiSeriesFilters`
- `MultiSeriesAggregateResponse`
- `MultiSeriesRawResponse`
- `ScenarioWithData`
- `FilterSummary`

## 📝 使用示例

### 后端测试

```bash
# 测试新端点
curl "http://127.0.0.1:8000/series/multi?\
variable=Total%20population&\
filters=%7B%22Climate%20change%20scenario%20switch%20for%20water%20yield%22%3A%202%7D&\
aggregate=true"

# 运行完整测试套件
poetry run python scripts/test_multi_series.py
```

### 前端调用

```typescript
import { getSeriesMulti, parametersToFilters } from '@/services/api';

// 将前端参数转换为 API filters
const filters = parametersToFilters(parameters);

// 查询多情景聚合数据
const data = await getSeriesMulti('YRB WSI', filters, {
  aggregate: true,
  start_year: 2020,
  end_year: 2100
});

console.log(`匹配了 ${data.n_scenarios} 个情景`);
console.log(`时间序列长度: ${data.series.time.length}`);
```

## 🔄 与现有 API 对比

| 特性 | `/series` (旧) | `/series/multi` (新) |
|------|---------------|---------------------|
| 情景选择 | 单个情景名称 | 参数过滤（可匹配多个） |
| Any 逻辑 | ❌ | ✅ |
| 聚合统计 | ❌ | ✅ (mean, CI, min, max) |
| 向后兼容 | - | ✅ 完全兼容 |

## 📚 文档

- **API 文档**: `docs/API_MULTI_SCENARIO.md`
- **交互式文档**: http://127.0.0.1:8000/docs
- **测试脚本**: `scripts/test_multi_series.py`

## 🚀 启动服务

```bash
# 推荐方式（全栈开发环境）
make dev

# 或单独启动后端
poetry run uvicorn scripts.api_server:app --host 0.0.0.0 --port 8000 --reload
```

## ✅ 测试验证

```bash
# 测试 1: 固定气候情景，其他参数 Any
✅ 匹配了 1575 个情景

# 测试 2: 完整测试套件
poetry run python scripts/test_multi_series.py
```

## 📦 修改的文件

1. `scripts/api_server.py` - 新增 `get_series_multi()` 端点
2. `viz/src/services/api.ts` - 新增前端 API 函数和类型
3. `scripts/test_multi_series.py` - 测试脚本（新建）
4. `docs/API_MULTI_SCENARIO.md` - 完整 API 文档（新建）

## 🔒 向后兼容性

- ✅ 所有现有 API 端点保持不变
- ✅ 现有前端代码无需修改
- ✅ 新功能为可选增强

---

**更新日期**: 2025-10-18
**版本**: v0.2.0
