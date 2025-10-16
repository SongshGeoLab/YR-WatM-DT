#!/bin/bash

# WatM-DT 部署脚本
# 使用方法: ./deploy.sh [服务器IP] [用户名]

SERVER_IP=${1:-"43.165.1.18"}
USERNAME=${2:-"ubuntu"}
SERVER_PATH="/home/$USERNAME/watm-dt"

echo "🚀 开始部署 WatM-DT 到服务器 $SERVER_IP"
echo "📦 服务器路径: $SERVER_PATH"

# 检查必要文件
if [ ! -f "deploy.tar.gz" ]; then
    echo "❌ 找不到 deploy.tar.gz 文件"
    exit 1
fi

# 测试 SSH 连接
echo "🔍 测试 SSH 连接..."
if ! ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no $USERNAME@$SERVER_IP "echo 'SSH 连接成功'"; then
    echo "❌ SSH 连接失败，请检查："
    echo "   1. 服务器 IP 地址是否正确"
    echo "   2. 用户名是否正确"
    echo "   3. 密码是否正确"
    echo "   4. 安全组是否开放 22 端口"
    exit 1
fi

# 创建服务器目录
echo "📁 创建服务器目录..."
ssh -o StrictHostKeyChecking=no $USERNAME@$SERVER_IP "mkdir -p $SERVER_PATH"

# 上传文件（使用 rsync，支持断点续传）
echo "📤 上传部署文件..."
if rsync -avz --progress --partial --inplace deploy.tar.gz $USERNAME@$SERVER_IP:$SERVER_PATH/; then
    echo "✅ 文件上传成功"
else
    echo "❌ 文件上传失败"
    exit 1
fi

# 解压文件
echo "📦 解压部署文件..."
ssh -o StrictHostKeyChecking=no $USERNAME@$SERVER_IP "cd $SERVER_PATH && tar -xzf deploy.tar.gz"

# 检查 Docker 环境
echo "🐳 检查 Docker 环境..."
ssh -o StrictHostKeyChecking=no $USERNAME@$SERVER_IP "cd $SERVER_PATH && docker --version && docker compose version"

# 启动服务
echo "🚀 启动服务..."
ssh -o StrictHostKeyChecking=no $USERNAME@$SERVER_IP "cd $SERVER_PATH && docker compose up -d"

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."
ssh -o StrictHostKeyChecking=no $USERNAME@$SERVER_IP "cd $SERVER_PATH && docker compose ps"

# 测试服务
echo "🧪 测试服务..."
if curl -s --connect-timeout 10 http://$SERVER_IP/health; then
    echo "✅ 服务部署成功！"
    echo "🌐 访问地址: http://$SERVER_IP"
else
    echo "⚠️  服务可能还在启动中，请稍后访问 http://$SERVER_IP"
fi

echo "🎉 部署完成！"
