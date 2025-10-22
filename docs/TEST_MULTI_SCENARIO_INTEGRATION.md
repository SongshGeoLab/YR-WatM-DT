# 多情景集成测试指南

## 🎯 测试目标

验证前端 `ScenarioContext` 能否正确使用新的 `/series/multi` API，并在浏览器中展示多情景数据。

## 🚀 启动服务

```bash
# 确保服务正在运行
make dev

# 或者检查服务状态
curl http://127.0.0.1:8000/
```

## 📋 测试步骤

### 1. 打开浏览器开发者工具

1. 访问 http://localhost:3000
2. 按 `F12` 打开开发者工具
3. 切换到 **Console** 标签页

### 2. 测试单情景模式

**操作**：
1. 在 Global Parameter Panel 中设置所有参数为具体值
   - Climate: RCP4.5
   - Fertility: 1.7
   - Diet: Moderate
   - Ecological Flow: 0.25
   - Irrigation: 0.85
   - Fire Generation: 0.15

**预期日志**：
```
🔧 Updating parameter: climateScenario = 2
🔍 Resolving scenarios with parameters: {...}
✅ Single scenario resolved: sc_xxx
📊 Fetching [变量名] for single scenario sc_xxx...
✅ Loaded [变量名]: 81 data points
```

**验证**：
- ✅ 显示 "Current Scenario: sc_xxx" (绿色标签)
- ✅ 图表正常显示单条曲线
- ✅ 没有置信区间阴影

---

### 3. 测试多情景模式（单参数 Any）

**操作**：
1. 保持其他参数不变
2. 点击 Climate 的 "Clear" 按钮，设置为 null（Any）

**预期日志**：
```
🔧 Updating parameter: climateScenario = null
📊 Some parameters are null, staying in multiple scenarios mode
📊 Estimated scenario count: 3
📊 Fetching [变量名] for multiple scenarios using /series/multi API...
🔍 Querying with filters: {
  "Fertility Variation": 1.7,
  "Diet change scenario switch": 2,
  ...
}
📊 Expected to match ~3 scenarios
✅ Loaded [变量名] with real multi-scenario data:
   - 3 scenarios matched
   - 81 time points
   - Mean range: 100.00 - 150.00
```

**验证**：
- ✅ 显示 "Current Scenario: Multiple (3)" (橙色标签)
- ✅ 图表显示均值曲线 + 置信区间阴影
- ✅ 数据是真实的多情景聚合结果

---

### 4. 测试多情景模式（多参数 Any）

**操作**：
1. 继续点击其他参数的 "Clear" 按钮
2. 例如：Climate = Any, Fertility = Any

**预期日志**：
```
📊 Estimated scenario count: 15
📊 Fetching [变量名] for multiple scenarios using /series/multi API...
✅ Loaded [变量名] with real multi-scenario data:
   - 15 scenarios matched
   - 81 time points
   - Mean range: 95.00 - 155.00
```

**验证**：
- ✅ 显示 "Current Scenario: Multiple (15)" (橙色标签)
- ✅ 置信区间更宽（因为变异性更大）
- ✅ 数据实时从后端获取

---

### 5. 压力测试（大量情景）

**操作**：
1. 只设置 1-2 个参数，其他全部设为 Any
2. 观察性能和响应时间

**预期行为**：
- 日志显示匹配了大量情景（可能上千个）
- 响应时间 < 3秒
- 浏览器不卡顿
- 图表流畅渲染

---

## 🔍 关键日志解读

### 成功日志示例
```javascript
// 1. 参数更新
🔧 Updating parameter: climateScenario = null

// 2. 情景解析
📊 Some parameters are null, staying in multiple scenarios mode
📊 Estimated scenario count: 27

// 3. API 调用
📊 Fetching Total population for multiple scenarios using /series/multi API...
🔍 Querying with filters: {"Fertility Variation":1.7,"Diet change scenario switch":2}

// 4. 成功响应
✅ Loaded Total population with real multi-scenario data:
   - 27 scenarios matched
   - 81 time points
   - Mean range: 42500.00 - 68200.00
```

### 错误日志示例（应该避免）
```javascript
❌ Failed to fetch multi-scenario data: [错误信息]
⚠️ Using fallback demo data due to error: [错误信息]
```

如果看到错误：
1. 检查后端服务是否运行：`curl http://127.0.0.1:8000/params`
2. 检查 CORS 设置
3. 查看后端日志

---

## 📊 UI 验证清单

### Parameter Panel 状态显示

- [ ] **Single Scenario**
  ```
  Current Scenario: sc_42 (绿色标签)
  ```

- [ ] **Multiple Scenarios**
  ```
  Current Scenario: Multiple (27) (橙色标签)
  ```

- [ ] **Loading State**
  ```
  Updating... (黄色动画)
  ```

### 图表渲染

- [ ] **单情景**: 单条实线，无阴影
- [ ] **多情景**: 均值曲线 + 置信区间阴影（浅色）
- [ ] **置信区间**: CI 上下界应该对称
- [ ] **响应式**: 参数变化时图表自动更新

---

## 🐛 常见问题排查

### 问题 1: 显示 "Using fallback demo data"

**原因**: API 调用失败

**排查**:
```bash
# 测试 API 是否正常
curl "http://127.0.0.1:8000/series/multi?variable=Total%20population&filters=%7B%7D&aggregate=true"
```

**解决**:
- 确保后端服务运行在 8000 端口
- 检查 `viz/.env` 中的 `VITE_API_URL`

---

### 问题 2: 图表不更新

**原因**: React 状态更新问题

**排查**:
- 打开 React DevTools
- 检查 `ScenarioContext` 的 `parameters` 状态
- 查看 `scenarioResult` 是否正确

**解决**:
- 刷新页面
- 检查是否有 JavaScript 错误

---

### 问题 3: 情景数量不符合预期

**原因**: 数据库中的情景组合数量

**验证**:
```bash
# 检查参数组合
curl http://127.0.0.1:8000/params
```

**说明**:
- 不是所有参数组合都存在对应情景
- 某些参数组合可能没有数据

---

## ✅ 成功标准

全部通过以下检查：

1. ✅ 单情景模式正常工作
2. ✅ 多情景模式使用真实 API（不是 demo 数据）
3. ✅ 参数 Any 逻辑正确（null 参数不传给后端）
4. ✅ 图表显示置信区间
5. ✅ 日志清晰显示匹配情景数量
6. ✅ 性能良好（< 3秒响应）
7. ✅ 无 JavaScript 错误

---

## 📸 期望效果截图说明

### 单情景模式
```
┌─────────────────────────────────────┐
│ Current Scenario: sc_42  [绿色]     │
├─────────────────────────────────────┤
│                                     │
│     图表：单条实线                    │
│     ─────────────                   │
│                                     │
└─────────────────────────────────────┘
```

### 多情景模式
```
┌─────────────────────────────────────┐
│ Current Scenario: Multiple (27) [橙]│
├─────────────────────────────────────┤
│                                     │
│     图表：均值曲线 + 置信区间阴影      │
│     ─────────────                   │
│     ░░░░░░░░░░░░░ (CI)             │
│                                     │
└─────────────────────────────────────┘
```

---

## 🎉 测试完成

如果所有测试通过，恭喜！你的多情景集成已经成功！

现在可以：
1. 在实际场景中使用 Global Parameter Panel
2. 尝试不同的参数组合
3. 观察真实的多情景聚合数据
4. 享受流畅的 "Any" 参数体验！

---

**文档版本**: 1.0
**更新日期**: 2025-10-18
