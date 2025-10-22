# WatM-DT v2.0 部署指南

## 📋 部署前准备

### 1. 服务器要求
- **操作系统**: Ubuntu 20.04 或更高版本
- **内存**: 至少 4GB RAM
- **硬盘**: 至少 20GB 可用空间（用于数据文件和 Docker 镜像）
- **网络**: 
  - 开放端口 22 (SSH)
  - 开放端口 80 (HTTP)
  - 开放端口 443 (HTTPS，可选)

### 2. 服务器配置

#### 安装 Docker
```bash
# 更新软件包
sudo apt update

# 安装必要的依赖
sudo apt install -y ca-certificates curl gnupg lsb-release

# 添加 Docker 官方 GPG 密钥
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 设置 Docker 仓库
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 将当前用户添加到 docker 组（避免每次都需要 sudo）
sudo usermod -aG docker $USER

# 重新登录以使组权限生效
newgrp docker
```

#### 配置 SSH 密钥（推荐）
```bash
# 在本地生成 SSH 密钥（如果还没有）
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# 将公钥复制到服务器
ssh-copy-id ubuntu@43.165.1.18

# 测试 SSH 连接
ssh ubuntu@43.165.1.18
```

## 🚀 部署步骤

### 方法 1: 使用自动化部署脚本（推荐）

#### Step 1: 部署前检查
```bash
# 在项目根目录运行
bash scripts/pre-deploy-check.sh
```

这个脚本会检查：
- ✅ 必要的文件是否存在
- ✅ 前端是否已构建
- ✅ 数据文件是否准备好
- ✅ Git 状态是否干净
- ✅ Docker 配置是否正确

#### Step 2: 构建前端（如果还没有）
```bash
cd viz
npm install
npm run build
cd ..
```

#### Step 3: 执行部署
```bash
# 使用默认服务器地址
./deploy-v2.sh

# 或指定服务器地址
# SERVER_IP=your.server.ip ./deploy-v2.sh
```

部署脚本会自动：
1. 测试 SSH 连接
2. 创建服务器目录结构
3. 上传代码和配置文件
4. 上传前端构建文件
5. 检查并可选上传数据文件
6. 构建 Docker 镜像
7. 启动服务
8. 验证部署状态

### 方法 2: 手动部署

#### Step 1: 上传文件到服务器
```bash
# 使用 rsync 上传代码
rsync -avz --exclude='node_modules' --exclude='__pycache__' \
    --exclude='data_parquet' --exclude='.git' \
    ./ ubuntu@43.165.1.18:/home/ubuntu/watm-dt/
```

#### Step 2: 上传数据文件（如果服务器上没有）
```bash
# 这可能需要很长时间
rsync -avz --progress --partial --inplace \
    data_parquet/ ubuntu@43.165.1.18:/home/ubuntu/watm-dt/data_parquet/
```

#### Step 3: 在服务器上构建和启动
```bash
# SSH 到服务器
ssh ubuntu@43.165.1.18

# 进入项目目录
cd /home/ubuntu/watm-dt

# 构建镜像
docker compose build

# 启动服务
docker compose up -d

# 查看日志
docker compose logs -f
```

## 🔧 部署后管理

### 查看服务状态
```bash
ssh ubuntu@43.165.1.18 'cd /home/ubuntu/watm-dt && docker compose ps'
```

### 查看服务日志
```bash
# 实时查看所有服务日志
ssh ubuntu@43.165.1.18 'cd /home/ubuntu/watm-dt && docker compose logs -f'

# 只查看后端日志
ssh ubuntu@43.165.1.18 'cd /home/ubuntu/watm-dt && docker compose logs -f backend'

# 只查看前端日志
ssh ubuntu@43.165.1.18 'cd /home/ubuntu/watm-dt && docker compose logs -f frontend'
```

### 重启服务
```bash
# 重启所有服务
ssh ubuntu@43.165.1.18 'cd /home/ubuntu/watm-dt && docker compose restart'

# 只重启后端
ssh ubuntu@43.165.1.18 'cd /home/ubuntu/watm-dt && docker compose restart backend'

# 只重启前端
ssh ubuntu@43.165.1.18 'cd /home/ubuntu/watm-dt && docker compose restart frontend'
```

### 停止服务
```bash
ssh ubuntu@43.165.1.18 'cd /home/ubuntu/watm-dt && docker compose down'
```

### 更新代码
```bash
# 重新运行部署脚本即可
./deploy-v2.sh
```

### 清理旧镜像和容器
```bash
ssh ubuntu@43.165.1.18 'docker system prune -a --volumes'
```

## 📊 数据文件管理

### 首次部署
首次部署时，部署脚本会询问是否上传数据文件。如果选择上传，可能需要 30-60 分钟（取决于网络速度）。

### 数据文件已存在
如果服务器上已有数据文件，部署脚本会自动跳过数据上传，大大加快部署速度。

### 手动上传数据文件
```bash
# 使用 rsync 断点续传
rsync -avz --progress --partial --inplace \
    data_parquet/ ubuntu@43.165.1.18:/home/ubuntu/watm-dt/data_parquet/
```

### 数据文件更新
如果本地数据文件有更新，需要重新上传：
```bash
# 同步数据文件（只上传更改的文件）
rsync -avz --progress --delete \
    data_parquet/ ubuntu@43.165.1.18:/home/ubuntu/watm-dt/data_parquet/
```

## 🔍 故障排查

### 问题 1: SSH 连接失败
**症状**: 无法连接到服务器

**解决方案**:
1. 检查服务器 IP 是否正确
2. 检查安全组是否开放 22 端口
3. 检查 SSH 密钥是否配置正确
4. 尝试使用密码登录：`ssh ubuntu@43.165.1.18`

### 问题 2: Docker 构建失败
**症状**: Docker 镜像构建过程中出错

**解决方案**:
1. 检查 Dockerfile 语法
2. 检查服务器磁盘空间：`ssh ubuntu@43.165.1.18 'df -h'`
3. 清理旧镜像：`ssh ubuntu@43.165.1.18 'docker system prune -a'`
4. 查看构建日志找出具体错误

### 问题 3: 服务启动失败
**症状**: `docker compose ps` 显示服务状态不正常

**解决方案**:
1. 查看日志：`docker compose logs -f`
2. 检查数据文件是否存在
3. 检查配置文件是否正确
4. 重启服务：`docker compose restart`

### 问题 4: 数据文件上传太慢
**症状**: 上传数据文件时间过长

**解决方案**:
1. 使用 rsync 的 `-z` 参数压缩传输
2. 使用 `--partial` 和 `--inplace` 支持断点续传
3. 考虑在服务器上直接生成数据文件
4. 使用更快的网络连接

### 问题 5: 服务无法访问
**症状**: 浏览器无法打开 http://43.165.1.18

**解决方案**:
1. 检查安全组是否开放 80 端口
2. 检查服务是否正在运行：`docker compose ps`
3. 检查 nginx 配置是否正确
4. 查看前端日志：`docker compose logs frontend`

## 🎯 最佳实践

### 1. 增量部署
- 只上传更改的文件，不要每次都上传所有内容
- 使用 rsync 而不是 scp
- 如果数据文件没有更改，跳过数据上传

### 2. 版本控制
- 每次部署前确保代码已提交到 Git
- 使用有意义的 Git 标签标记版本
- 保持 dev 分支与 main 分支同步

### 3. 备份
- 定期备份服务器上的数据文件
- 使用 Git 管理代码版本
- 导出 Docker 镜像作为备份

### 4. 监控
- 定期检查服务状态
- 监控服务器资源使用（CPU、内存、磁盘）
- 设置日志轮转防止日志文件过大

### 5. 安全
- 使用 SSH 密钥而不是密码
- 配置防火墙规则
- 定期更新系统和 Docker
- 使用 HTTPS（配置 SSL 证书）

## 📚 相关文档

- [Docker 文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Nginx 文档](https://nginx.org/en/docs/)
- [FastAPI 部署指南](https://fastapi.tiangolo.com/deployment/)
- [React 生产环境部署](https://create-react-app.dev/docs/deployment/)

## 🆘 获取帮助

如果遇到问题，请：
1. 查看本文档的故障排查部分
2. 检查服务日志找出具体错误
3. 在项目 GitHub 仓库提交 Issue
4. 联系项目维护者
