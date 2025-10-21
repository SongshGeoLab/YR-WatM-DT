# 🚀 部署快速检查清单

> 每次部署前快速检查，避免常见错误

## ✅ 部署前检查（5 分钟）

### 1. 本地构建
```bash
cd viz
npm run build
cd ..
```
**✓** 确认 `viz/build/` 目录存在且是最新的

### 2. 检查构建文件
```bash
ls -lh viz/build/assets/
```
**✓** 看到类似 `index-xxxxx.js` 的文件（xxxxx 是随机 hash）

### 3. 记录本地文件 Hash（用于后续验证）
```bash
grep -o 'src="/assets/[^"]*\.js"' viz/build/index.html
```
**✓** 记下输出的文件名，例如：`index-DpJTYsGo.js`

---

## 🚀 部署步骤（标准流程）

### 方法 A: 使用部署脚本（推荐）
```bash
./deploy-v2.sh
```

### 方法 B: 使用强制修复脚本（如果遇到问题）
```bash
./fix-deployment.sh
```

---

## 🔍 部署后验证（5 分钟）

### 1. 检查服务器文件
```bash
curl -s http://43.165.1.18/ | grep -o 'src="/assets/[^"]*\.js"'
```
**✓** 确认输出的文件名和本地一致

### 2. 浏览器验证
1. 打开 http://43.165.1.18
2. 按 `Cmd+Shift+R` (macOS) 强制刷新
3. 打开开发者工具 (F12) → Network 标签
4. 找到 `index-xxxxx.js` 文件
5. **✓** 确认 hash 值是新的

### 3. 功能测试
- **✓** 页面正常加载
- **✓** 参数控制正常工作
- **✓** 图表显示正确
- **✓** API 调用成功（查看 Network 标签）

---

## ⚠️ 常见问题快速修复

### 问题 1: 浏览器显示旧版本

**症状**: 文件 hash 不匹配

**快速诊断**:
```bash
./diagnose-deployment.sh
```

**快速修复**:
```bash
./fix-deployment.sh
```

### 问题 2: 服务无法访问

**检查容器状态**:
```bash
ssh ubuntu@43.165.1.18 'cd /home/ubuntu/watm-dt && docker compose ps'
```

**重启服务**:
```bash
ssh ubuntu@43.165.1.18 'cd /home/ubuntu/watm-dt && docker compose restart'
```

### 问题 3: Docker 镜像缓存

**强制重建（不使用缓存）**:
```bash
ssh ubuntu@43.165.1.18 'cd /home/ubuntu/watm-dt && \
  docker compose build --no-cache frontend && \
  docker compose up -d'
```

---

## 📋 完整部署流程（带验证）

```bash
# === 本地准备 ===
cd viz && npm run build && cd ..
LOCAL_HASH=$(grep -o 'src="/assets/[^"]*\.js"' viz/build/index.html | head -1)
echo "本地文件: $LOCAL_HASH"

# === 部署 ===
./deploy-v2.sh

# === 等待服务启动 ===
echo "等待 30 秒..."
sleep 30

# === 验证 ===
REMOTE_HASH=$(curl -s http://43.165.1.18/ | grep -o 'src="/assets/[^"]*\.js"' | head -1)
echo "远端文件: $REMOTE_HASH"

if [ "$LOCAL_HASH" = "$REMOTE_HASH" ]; then
    echo "✅ 部署成功！文件已更新"
else
    echo "❌ 部署有问题！文件不匹配"
    echo "运行修复: ./fix-deployment.sh"
fi
```

---

## 💡 记住这些关键点

1. **必须上传源代码**：项目使用 Docker 多阶段构建，需要源代码而非仅构建产物
2. **检查文件 Hash**：通过 JS 文件名中的 hash 值判断是否更新成功
3. **使用 --no-cache**：怀疑缓存问题时，强制重建镜像
4. **强制刷新浏览器**：`Cmd+Shift+R` (macOS) 或 `Ctrl+Shift+R` (Windows)

---

## 🆘 紧急救援

如果所有方法都失败了：

```bash
# 完全清理并重新部署
ssh ubuntu@43.165.1.18 'cd /home/ubuntu/watm-dt && \
  docker compose down && \
  docker system prune -af && \
  rm -rf viz/build/*'

# 重新上传所有文件
./deploy-v2.sh

# 等待并验证
sleep 30
curl -s http://43.165.1.18/ | grep -o 'src="/assets/[^"]*\.js"'
```

---

## 📚 详细文档

- **故障排查**: [TROUBLESHOOTING_DEPLOYMENT.md](TROUBLESHOOTING_DEPLOYMENT.md)
- **部署指南**: [DEPLOY.md](DEPLOY.md)
- **README**: [README.md](README.md#-deployment-best-practices)

---

**最后更新**: 2025-10-21
**维护者**: SongshGeo
