# 🔧 部署更新不生效问题排查指南

## 快速诊断

如果你已经部署了新版本，但浏览器显示的还是旧版本，按以下步骤操作：

### 第一步：运行诊断脚本

```bash
./diagnose-deployment.sh
```

这个脚本会自动检查：
- ✅ 本地构建状态
- ✅ 服务器文件状态
- ✅ Docker 容器状态
- ✅ 容器内文件状态
- ✅ 网络访问状态

**诊断脚本不会做任何修改**，只是收集信息帮你定位问题。

### 第二步：根据诊断结果采取行动

#### 情况 1：本地未构建
**症状**: 诊断显示 `viz/build` 目录不存在

**解决方案**:
```bash
cd viz
npm run build
cd ..
./deploy-v2.sh
```

#### 情况 2：服务器上文件未更新
**症状**: 本地和服务器的文件修改时间或文件名不一致

**解决方案**:
```bash
./fix-deployment.sh
```

这个脚本会：
- 1) 停止现有服务
- 2) 删除服务器上的旧构建文件
- 3) 上传新的构建文件
- 4) 强制重新构建 Docker 镜像（不使用缓存）
- 5) 重新启动服务
- 6) 验证服务状态与可访问性

#### 情况 3：Docker 镜像缓存问题
**症状**: 服务器文件已更新，但容器内的文件是旧的

**解决方案**:
```bash
ssh ubuntu@43.165.1.18 'cd /home/ubuntu/watm-dt && \
  docker compose down && \
  docker compose build --no-cache frontend && \
  docker compose up -d'
```

#### 情况 4：浏览器缓存（虽然你说试过无痕模式）
**症状**: 所有服务器检查都正常，但浏览器显示旧版本

**解决方案**:
1. 打开开发者工具 (F12)
2. 切换到 Network 标签
3. 勾选 "Disable cache"
4. 按 Cmd+Shift+R (macOS) 或 Ctrl+Shift+R (Windows/Linux) 强制刷新

---

## 常见问题详解

### 问题 1: Docker 镜像使用了缓存

**原因**: Docker 在构建镜像时，如果检测到某一层没有变化，会使用缓存层。这可能导致新代码没有被打包进镜像。

**识别方法**:
```bash
# 检查服务器上的文件
ssh ubuntu@43.165.1.18 'ls -lht /home/ubuntu/watm-dt/viz/build/ | head -5'

# 检查容器内的文件
ssh ubuntu@43.165.1.18 'docker exec watm-dt-frontend ls -lht /usr/share/nginx/html/ | head -5'
```

如果两者的文件时间戳或文件名不一致，就是这个问题。

**解决方案**: 使用 `--no-cache` 标志强制重新构建
```bash
ssh ubuntu@43.165.1.18 'cd /home/ubuntu/watm-dt && \
  docker compose build --no-cache frontend && \
  docker compose up -d'
```

### 问题 2: 前端构建输出路径错误

**检查点**:
1. `vite.config.ts` 中的 `build.outDir` 设置
2. `Dockerfile.frontend` 中 COPY 的路径
3. `deploy-v2.sh` 中上传的路径

**当前配置**:
- Vite 输出: `viz/build/` ✅
- Dockerfile 复制: `/app/build` ✅
- Nginx 目录: `/usr/share/nginx/html` ✅

这些配置是正确的，一般不是问题所在。

### 问题 3: Nginx 缓存配置

**当前配置** (nginx.conf):
```nginx
# HTML 文件不缓存
location ~* \.html$ {
    expires -1;
    add_header Cache-Control "no-store, no-cache, must-revalidate";
}

# JS/CSS 文件长期缓存（依赖文件名中的 hash）
location ~* \.(js|css|...)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

这个配置是正确的。前端构建会为 JS/CSS 文件名添加 hash（如 `index-abc123.js`），每次构建 hash 都会变化，所以不会有缓存问题。

**验证方法**:
```bash
# 查看实际返回的 HTML
curl -s http://43.165.1.18/ | grep -o 'src="[^"]*\.js"'

# 应该看到类似这样的输出:
# src="/assets/index-msTSMgkN.js"
```

每次构建后，这个 hash（`msTSMgkN`）应该会变化。如果没变，说明 Docker 镜像没有更新。

---

## 完整的更新流程

### 标准流程（推荐）

```bash
# 1. 本地构建前端
cd viz
npm run build
cd ..

# 2. 运行诊断检查（可选但推荐）
./diagnose-deployment.sh

# 3. 部署到服务器
./deploy-v2.sh
```

### 强制更新流程（当标准流程不生效时）

```bash
# 1. 确保本地已构建
cd viz && npm run build && cd ..

# 2. 运行修复脚本（包含强制重建）
./fix-deployment.sh
```

### 手动完整更新流程（当脚本都失败时）

```bash
# 1. 本地构建
cd viz && npm run build && cd ..

# 2. 清理服务器（推荐：仅清理本项目）
ssh ubuntu@43.165.1.18 'cd /home/ubuntu/watm-dt && \
  docker compose down --volumes --rmi all && \
  rm -rf viz/build/*'

# ⚠️ 注意：避免使用全局清理命令！
# docker system prune -af --volumes 会删除服务器上所有 Docker 资源，
# 可能影响其他项目。请使用上面的项目作用域清理命令。

# 3. 重新上传
rsync -avz --progress viz/build/ ubuntu@43.165.1.18:/home/ubuntu/watm-dt/viz/build/

# 4. 重新构建和启动（不使用任何缓存）
ssh ubuntu@43.165.1.18 'cd /home/ubuntu/watm-dt && \
  docker compose build --no-cache && \
  docker compose up -d'

# 5. 等待启动并检查
sleep 20
ssh ubuntu@43.165.1.18 'cd /home/ubuntu/watm-dt && docker compose ps'
```

---

## 验证更新是否生效

### 方法 1: 检查文件 Hash
```bash
# 本地构建的 JS 文件
grep -o 'src="[^"]*\.js"' viz/build/index.html

# 服务器返回的 JS 文件
curl -s http://43.165.1.18/ | grep -o 'src="[^"]*\.js"'

# 两者应该一致
```

### 方法 2: 检查版本号（如果代码中有）
在前端代码中添加版本号或时间戳：
```tsx
// 在 App.tsx 或其他组件中
console.log('App Version:', '2.0.0', 'Build:', new Date().toISOString());
```

然后在浏览器控制台查看输出。

### 方法 3: 检查容器创建时间
```bash
ssh ubuntu@43.165.1.18 'docker inspect watm-dt-frontend | grep "Created"'
```

如果创建时间是最近的，说明容器是新的。

---

## 紧急联系方式

如果所有方法都无效，请检查：

1. **服务器磁盘空间**: `ssh ubuntu@43.165.1.18 'df -h'`
2. **Docker 日志**: `ssh ubuntu@43.165.1.18 'cd /home/ubuntu/watm-dt && docker compose logs frontend | tail -100'`
3. **是否有代理/CDN**: 有些云服务商会在前面加 CDN，需要刷新 CDN 缓存

---

## 预防措施

为了避免以后遇到同样的问题，建议：

### 1. 每次部署前运行诊断
```bash
./diagnose-deployment.sh
```

### 2. 在前端添加版本显示
在页面底部或控制台显示当前版本号和构建时间。

### 3. 使用版本标签
为每次重要更新打 Git tag：
```bash
git tag -a v2.0.0 -m "Release version 2.0.0"
git push origin v2.0.0
```

### 4. 添加健康检查端点
在前端添加一个 `/version.json` 文件，包含版本信息：
```json
{
  "version": "2.0.0",
  "buildTime": "2025-01-21T10:30:00Z",
  "commit": "abc123"
}
```

这样可以直接访问 `http://43.165.1.18/version.json` 检查版本。

---

## 快速参考

| 问题症状 | 可能原因 | 解决命令 |
|---------|---------|---------|
| 浏览器显示旧版本 | 多种可能 | `./diagnose-deployment.sh` |
| 诊断显示文件不一致 | Docker 缓存 | `./fix-deployment.sh` |
| 容器内文件是旧的 | 镜像缓存 | `docker compose build --no-cache` |
| 服务无法访问 | 容器未启动 | `docker compose up -d` |
| 本地未构建 | 忘记构建 | `cd viz && npm run build` |

---

**最后更新**: 2025-01-21
**维护者**: SongshGeo
