#!/bin/bash

# WatM-DT 部署诊断脚本
# 快速检查部署状态，不做任何修改

SERVER_IP="43.165.1.18"
USERNAME="ubuntu"
SERVER_PATH="/home/$USERNAME/watm-dt"

echo "🔍 WatM-DT 部署状态诊断"
echo "================================"
echo ""

# 1. 检查本地构建
echo "1️⃣ 本地构建状态"
echo "--------------------------------"
if [ -d "viz/build" ]; then
    BUILD_TIME=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" viz/build 2>/dev/null || stat -c "%y" viz/build 2>/dev/null || echo "无法获取")
    FILE_COUNT=$(find viz/build -type f | wc -l | tr -d ' ')
    BUILD_SIZE=$(du -sh viz/build 2>/dev/null | cut -f1)

    echo "✅ 构建目录存在"
    echo "   路径: viz/build"
    echo "   修改时间: $BUILD_TIME"
    echo "   文件数量: $FILE_COUNT"
    echo "   总大小: $BUILD_SIZE"

    # 检查 index.html 内容（获取资源文件 hash）
    if [ -f "viz/build/index.html" ]; then
        echo ""
        echo "   📄 index.html 中引用的资源文件："
        grep -o 'src="[^"]*\.js"' viz/build/index.html | head -3 || echo "   无法解析 JS 文件"
        grep -o 'href="[^"]*\.css"' viz/build/index.html | head -3 || echo "   无法解析 CSS 文件"
    fi
else
    echo "❌ viz/build 目录不存在"
    echo "   ⚠️  需要运行: cd viz && npm run build"
fi

echo ""
echo ""

# 2. 检查服务器状态
echo "2️⃣ 服务器状态"
echo "--------------------------------"
if ! ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no $USERNAME@$SERVER_IP "echo 'ok'" > /dev/null 2>&1; then
    echo "❌ SSH 连接失败"
    exit 1
fi

echo "✅ SSH 连接正常"

# 检查服务器上的文件
echo ""
echo "   📁 服务器上的文件状态："
SERVER_BUILD_EXISTS=$(ssh -o StrictHostKeyChecking=no $USERNAME@$SERVER_IP "[ -d $SERVER_PATH/viz/build ] && echo 'yes' || echo 'no'")

if [ "$SERVER_BUILD_EXISTS" = "yes" ]; then
    echo "   ✅ 构建目录存在"

    # 获取服务器上的文件信息
    SERVER_FILE_COUNT=$(ssh -o StrictHostKeyChecking=no $USERNAME@$SERVER_IP "find $SERVER_PATH/viz/build -type f 2>/dev/null | wc -l" | tr -d ' ')
    SERVER_BUILD_TIME=$(ssh -o StrictHostKeyChecking=no $USERNAME@$SERVER_IP "stat -c %y $SERVER_PATH/viz/build 2>/dev/null | cut -d'.' -f1" || echo "无法获取")

    echo "   文件数量: $SERVER_FILE_COUNT"
    echo "   修改时间: $SERVER_BUILD_TIME"

    # 检查服务器上的 index.html
    if ssh -o StrictHostKeyChecking=no $USERNAME@$SERVER_IP "[ -f $SERVER_PATH/viz/build/index.html ]" > /dev/null 2>&1; then
        echo ""
        echo "   📄 服务器上 index.html 引用的资源："
        ssh -o StrictHostKeyChecking=no $USERNAME@$SERVER_IP "grep -o 'src=\"[^\"]*\.js\"' $SERVER_PATH/viz/build/index.html | head -3"
    fi
else
    echo "   ❌ 构建目录不存在"
fi

echo ""
echo ""

# 3. 检查 Docker 容器状态
echo "3️⃣ Docker 容器状态"
echo "--------------------------------"
ssh -o StrictHostKeyChecking=no $USERNAME@$SERVER_IP "cd $SERVER_PATH && docker compose ps"

echo ""

# 4. 检查 Docker 镜像
echo "4️⃣ Docker 镜像信息"
echo "--------------------------------"
echo "Frontend 镜像:"
ssh -o StrictHostKeyChecking=no $USERNAME@$SERVER_IP "docker images | grep watm-dt-frontend || echo '未找到镜像'"

echo ""
echo "Backend 镜像:"
ssh -o StrictHostKeyChecking=no $USERNAME@$SERVER_IP "docker images | grep watm-dt-backend || echo '未找到镜像'"

echo ""
echo ""

# 5. 检查容器内的文件
echo "5️⃣ 容器内的前端文件"
echo "--------------------------------"
CONTAINER_RUNNING=$(ssh -o StrictHostKeyChecking=no $USERNAME@$SERVER_IP "docker ps -q -f name=watm-dt-frontend")

if [ -n "$CONTAINER_RUNNING" ]; then
    echo "✅ Frontend 容器正在运行"
    echo ""
    echo "   容器内 Nginx 目录文件列表:"
    ssh -o StrictHostKeyChecking=no $USERNAME@$SERVER_IP "docker exec watm-dt-frontend ls -lh /usr/share/nginx/html/ | head -10"

    echo ""
    echo "   容器内 index.html 的资源引用:"
    ssh -o StrictHostKeyChecking=no $USERNAME@$SERVER_IP "docker exec watm-dt-frontend cat /usr/share/nginx/html/index.html | grep -o 'src=\"[^\"]*\.js\"' | head -3"
else
    echo "❌ Frontend 容器未运行"
fi

echo ""
echo ""

# 6. 检查网络访问
echo "6️⃣ 网络访问测试"
echo "--------------------------------"

# 检查首页
echo "测试首页访问..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$SERVER_IP/)
echo "   HTTP 状态码: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ 前端服务可访问"

    # 获取实际返回的 HTML 内容
    echo ""
    echo "   🔍 实际返回的 HTML 中的资源文件："
    curl -s http://$SERVER_IP/ | grep -o 'src="[^"]*\.js"' | head -3
else
    echo "   ❌ 前端服务无法访问 (HTTP $HTTP_CODE)"
fi

# 检查 API
echo ""
echo "测试 API 访问..."
API_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$SERVER_IP/variables)
echo "   HTTP 状态码: $API_CODE"

if [ "$API_CODE" = "200" ]; then
    echo "   ✅ API 服务可访问"
else
    echo "   ❌ API 服务无法访问 (HTTP $API_CODE)"
fi

echo ""
echo ""

# 7. 诊断结论
echo "📊 诊断总结"
echo "================================"

if [ ! -d "viz/build" ]; then
    echo "⚠️  问题：本地没有构建前端"
    echo "   解决方案: cd viz && npm run build"
    echo ""
fi

if [ "$SERVER_BUILD_EXISTS" = "no" ]; then
    echo "⚠️  问题：服务器上没有构建文件"
    echo "   解决方案: 运行 ./deploy-v2.sh 上传文件"
    echo ""
fi

if [ -z "$CONTAINER_RUNNING" ]; then
    echo "⚠️  问题：Frontend 容器未运行"
    echo "   解决方案: ssh $USERNAME@$SERVER_IP 'cd $SERVER_PATH && docker compose up -d'"
    echo ""
fi

if [ "$HTTP_CODE" != "200" ]; then
    echo "⚠️  问题：前端服务无法访问"
    echo "   解决方案: 检查容器日志"
    echo "   命令: ssh $USERNAME@$SERVER_IP 'cd $SERVER_PATH && docker compose logs frontend'"
    echo ""
fi

echo ""
echo "💡 如果所有检查都通过但浏览器仍显示旧版本："
echo "   1. 比较「本地 index.html」和「服务器返回的 HTML」中的 JS 文件名"
echo "   2. 如果文件名相同 → Docker 镜像缓存问题，运行 ./fix-deployment.sh"
echo "   3. 如果文件名不同 → CDN/代理缓存问题，等待几分钟或联系管理员"
echo ""
echo "🔧 快速修复命令:"
echo "   ./fix-deployment.sh"
