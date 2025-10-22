#!/bin/bash

# WatM-DT 部署问题修复脚本
# 用于强制更新服务器上的前端代码

SERVER_IP="43.165.1.18"
USERNAME="ubuntu"
SERVER_PATH="/home/$USERNAME/watm-dt"

echo "🔧 WatM-DT 部署更新修复工具"
echo "================================"
echo ""

# 步骤 1: 检查本地前端构建
echo "📋 步骤 1/6: 检查本地前端构建"
if [ -d "viz/build" ]; then
    BUILD_TIME=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" viz/build 2>/dev/null || stat -c "%y" viz/build 2>/dev/null)
    echo "✅ 找到本地构建目录"
    echo "   最后修改时间: $BUILD_TIME"

    # 检查关键文件
    if [ -f "viz/build/index.html" ]; then
        echo "✅ index.html 存在"
    else
        echo "❌ index.html 不存在，构建可能不完整"
    fi
else
    echo "❌ 未找到 viz/build 目录"
    echo ""
    echo "🔨 正在重新构建前端..."
    cd viz && npm run build && cd ..

    if [ $? -eq 0 ]; then
        echo "✅ 前端构建成功"
    else
        echo "❌ 前端构建失败，请检查错误信息"
        exit 1
    fi
fi

echo ""

# 步骤 2: 测试 SSH 连接
echo "📋 步骤 2/6: 测试 SSH 连接"
if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no $USERNAME@$SERVER_IP "echo '连接成功'" > /dev/null 2>&1; then
    echo "✅ SSH 连接正常"
else
    echo "❌ SSH 连接失败"
    exit 1
fi

echo ""

# 步骤 3: 检查服务器上的构建文件
echo "📋 步骤 3/6: 检查服务器上的前端文件"
SERVER_BUILD_EXISTS=$(ssh -o StrictHostKeyChecking=no $USERNAME@$SERVER_IP "[ -d $SERVER_PATH/viz/build ] && echo 'yes' || echo 'no'")

if [ "$SERVER_BUILD_EXISTS" = "yes" ]; then
    echo "✅ 服务器上存在构建文件"

    # 获取服务器上的文件信息
    echo "   正在检查服务器文件状态..."
    ssh -o StrictHostKeyChecking=no $USERNAME@$SERVER_IP "ls -lh $SERVER_PATH/viz/build/ | head -10"
else
    echo "⚠️  服务器上没有构建文件"
fi

echo ""

# 步骤 4: 停止服务
echo "📋 步骤 4/6: 停止现有服务"
ssh -o StrictHostKeyChecking=no $USERNAME@$SERVER_IP "cd $SERVER_PATH && docker compose down"
echo "✅ 服务已停止"

echo ""

# 步骤 5: 强制上传前端文件（删除旧文件）
echo "📋 步骤 5/6: 强制上传新的前端文件"
echo "   清理服务器上的旧构建..."
ssh -o StrictHostKeyChecking=no $USERNAME@$SERVER_IP "rm -rf $SERVER_PATH/viz/build/*"

echo "   上传新的构建文件..."
rsync -avz --progress --delete viz/build/ $USERNAME@$SERVER_IP:$SERVER_PATH/viz/build/

if [ $? -eq 0 ]; then
    echo "✅ 前端文件上传成功"
else
    echo "❌ 前端文件上传失败"
    exit 1
fi

echo ""

# 步骤 6: 强制重新构建 Docker 镜像并启动
echo "📋 步骤 6/6: 重新构建 Docker 镜像（不使用缓存）"
ssh -o StrictHostKeyChecking=no $USERNAME@$SERVER_IP "cd $SERVER_PATH && docker compose build --no-cache frontend"

echo ""
echo "🚀 启动服务..."
ssh -o StrictHostKeyChecking=no $USERNAME@$SERVER_IP "cd $SERVER_PATH && docker compose up -d"

echo ""
echo "⏳ 等待服务启动（20秒）..."
sleep 20

echo ""

# 检查服务状态
echo "🔍 检查服务状态..."
ssh -o StrictHostKeyChecking=no $USERNAME@$SERVER_IP "cd $SERVER_PATH && docker compose ps"

echo ""

# 测试前端访问
echo "🧪 测试前端访问..."
RESPONSE=$(curl -s -I http://$SERVER_IP/ | head -n 1)
echo "   服务器响应: $RESPONSE"

if echo "$RESPONSE" | grep -q "200"; then
    echo "✅ 前端服务正常"
else
    echo "⚠️  前端服务可能有问题"
fi

echo ""
echo "🎉 修复完成！"
echo ""
echo "📝 下一步操作："
echo "   1. 在浏览器中访问: http://$SERVER_IP"
echo "   2. 按 Ctrl+Shift+R (macOS: Cmd+Shift+R) 强制刷新"
echo "   3. 打开开发者工具 (F12) 检查 Network 标签，确认加载的是新文件"
echo ""
echo "💡 验证方法："
echo "   - 检查文件名中的 hash 是否改变 (如 index-xxxxx.js)"
echo "   - 查看控制台是否有新的日志或功能"
echo ""
echo "🔍 如果还是旧版本，运行以下命令查看日志："
echo "   ssh $USERNAME@$SERVER_IP 'cd $SERVER_PATH && docker compose logs frontend | tail -50'"
