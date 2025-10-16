#!/bin/bash

# 轻量级部署脚本 - 只上传必要文件
# 使用方法: ./deploy-minimal.sh

SERVER_IP="43.165.1.18"
USERNAME="ubuntu"
SERVER_PATH="/home/$USERNAME/watm-dt"

echo "🚀 开始轻量级部署..."

# 测试 SSH 连接
echo "🔍 测试 SSH 连接..."
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no $USERNAME@$SERVER_IP "echo 'SSH 连接成功'"

# 创建服务器目录
echo "📁 创建服务器目录..."
ssh -o StrictHostKeyChecking=no $USERNAME@$SERVER_IP "mkdir -p $SERVER_PATH"

# 上传 Docker 配置文件（小文件）
echo "📤 上传 Docker 配置文件..."
for file in docker-compose.yml Dockerfile.backend Dockerfile.frontend nginx.conf .dockerignore; do
    if [ -f "$file" ]; then
        echo "上传 $file..."
        scp -o StrictHostKeyChecking=no "$file" $USERNAME@$SERVER_IP:$SERVER_PATH/
    fi
done

# 上传 Python 配置文件
echo "📤 上传 Python 配置文件..."
for file in pyproject.toml poetry.lock; do
    if [ -f "$file" ]; then
        echo "上传 $file..."
        scp -o StrictHostKeyChecking=no "$file" $USERNAME@$SERVER_IP:$SERVER_PATH/
    fi
done

# 创建数据目录结构
echo "📁 创建数据目录结构..."
ssh -o StrictHostKeyChecking=no $USERNAME@$SERVER_IP "cd $SERVER_PATH && mkdir -p data_parquet config scripts src viz"

echo "✅ 轻量级部署完成！"
echo "📝 接下来需要手动上传数据文件（如果需要）"
