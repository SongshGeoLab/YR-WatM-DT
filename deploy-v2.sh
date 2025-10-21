#!/bin/bash

# WatM-DT v2.0 部署脚本
# 不包含大文件，使用增量更新方式
# 使用方法: ./deploy-v2.sh

SERVER_IP="43.165.1.18"
USERNAME="ubuntu"
SERVER_PATH="/home/$USERNAME/watm-dt"

echo "🚀 开始部署 WatM-DT v2.0 到服务器 $SERVER_IP"
echo "📦 服务器路径: $SERVER_PATH"

# 测试 SSH 连接
echo "🔍 测试 SSH 连接..."
if ! ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no $USERNAME@$SERVER_IP "echo 'SSH 连接成功'"; then
    echo "❌ SSH 连接失败，请检查："
    echo "   1. 服务器 IP 地址是否正确"
    echo "   2. 用户名是否正确"
    echo "   3. SSH 密钥是否配置正确"
    echo "   4. 安全组是否开放 22 端口"
    exit 1
fi

# 创建服务器目录结构
echo "📁 创建服务器目录结构..."
ssh -o StrictHostKeyChecking=no $USERNAME@$SERVER_IP "mkdir -p $SERVER_PATH/{config,scripts,src,viz,data_parquet}"

# 停止现有服务
echo "🛑 停止现有服务..."
ssh -o StrictHostKeyChecking=no $USERNAME@$SERVER_IP "cd $SERVER_PATH && docker compose down || true"

# 上传 Docker 配置文件
echo "📤 上传 Docker 配置文件..."
rsync -avz --progress \
    docker-compose.yml \
    Dockerfile.backend \
    Dockerfile.frontend \
    nginx.conf \
    $USERNAME@$SERVER_IP:$SERVER_PATH/

# 上传 Python 配置和依赖
echo "📤 上传 Python 配置..."
rsync -avz --progress \
    pyproject.toml \
    poetry.lock \
    makefile \
    $USERNAME@$SERVER_IP:$SERVER_PATH/

# 上传配置文件
echo "📤 上传配置文件..."
rsync -avz --progress --delete \
    config/ \
    $USERNAME@$SERVER_IP:$SERVER_PATH/config/

# 上传脚本文件
echo "📤 上传脚本文件..."
rsync -avz --progress --delete \
    --exclude='__pycache__' \
    scripts/ \
    $USERNAME@$SERVER_IP:$SERVER_PATH/scripts/

# 上传源代码
echo "📤 上传源代码..."
rsync -avz --progress --delete \
    --exclude='__pycache__' \
    src/ \
    $USERNAME@$SERVER_IP:$SERVER_PATH/src/

# 上传前端源代码（Docker 构建需要）
echo "📤 上传前端源代码..."
rsync -avz --progress --delete \
    --exclude='node_modules' \
    --exclude='.vite' \
    --exclude='dist' \
    --exclude='build' \
    viz/ \
    $USERNAME@$SERVER_IP:$SERVER_PATH/viz/

# 可选：也上传构建文件（如果已构建，可用于快速回滚）
if [ -d "viz/build" ]; then
    echo "📤 上传前端构建文件（备用）..."
    rsync -avz --progress --delete \
        viz/build/ \
        $USERNAME@$SERVER_IP:$SERVER_PATH/viz/build/
fi

# 检查数据文件是否需要上传
echo "🔍 检查数据文件..."
DATA_FILES_EXIST=$(ssh -o StrictHostKeyChecking=no $USERNAME@$SERVER_IP "[ -d $SERVER_PATH/data_parquet ] && [ -n \"\$(ls -A $SERVER_PATH/data_parquet)\" ] && echo 'yes' || echo 'no'")

if [ "$DATA_FILES_EXIST" = "no" ]; then
    echo "⚠️  服务器上没有数据文件"
    read -p "是否需要上传数据文件？这可能需要很长时间 (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📤 上传数据文件..."
        rsync -avz --progress --partial --inplace \
            data_parquet/ \
            $USERNAME@$SERVER_IP:$SERVER_PATH/data_parquet/
    else
        echo "⚠️  跳过数据文件上传，请确保服务器上已有数据文件"
    fi
else
    echo "✅ 服务器上已有数据文件，跳过上传"
fi

# 检查 Docker 环境
echo "🐳 检查 Docker 环境..."
if ! ssh -o StrictHostKeyChecking=no $USERNAME@$SERVER_IP "docker --version && docker compose version"; then
    echo "❌ Docker 环境检查失败"
    echo "请先在服务器上安装 Docker 和 Docker Compose"
    exit 1
fi

# 构建并启动服务
echo "🏗️  构建 Docker 镜像..."
ssh -o StrictHostKeyChecking=no $USERNAME@$SERVER_IP "cd $SERVER_PATH && docker compose build"

echo "🚀 启动服务..."
ssh -o StrictHostKeyChecking=no $USERNAME@$SERVER_IP "cd $SERVER_PATH && docker compose up -d"

# 等待服务启动
echo "⏳ 等待服务启动（30秒）..."
sleep 30

# 检查服务状态
echo "🔍 检查服务状态..."
ssh -o StrictHostKeyChecking=no $USERNAME@$SERVER_IP "cd $SERVER_PATH && docker compose ps"

# 查看服务日志
echo "📋 查看最近的服务日志..."
ssh -o StrictHostKeyChecking=no $USERNAME@$SERVER_IP "cd $SERVER_PATH && docker compose logs --tail=50"

# 测试服务
echo "🧪 测试服务..."
if curl -s --connect-timeout 10 http://$SERVER_IP/ > /dev/null; then
    echo "✅ 服务部署成功！"
    echo "🌐 访问地址: http://$SERVER_IP"
else
    echo "⚠️  服务可能还在启动中或遇到问题"
    echo "🔍 请检查日志: ssh $USERNAME@$SERVER_IP 'cd $SERVER_PATH && docker compose logs'"
fi

echo ""
echo "🎉 部署完成！"
echo ""
echo "📚 有用的命令:"
echo "   查看日志: ssh $USERNAME@$SERVER_IP 'cd $SERVER_PATH && docker compose logs -f'"
echo "   重启服务: ssh $USERNAME@$SERVER_IP 'cd $SERVER_PATH && docker compose restart'"
echo "   停止服务: ssh $USERNAME@$SERVER_IP 'cd $SERVER_PATH && docker compose down'"
echo "   查看状态: ssh $USERNAME@$SERVER_IP 'cd $SERVER_PATH && docker compose ps'"
