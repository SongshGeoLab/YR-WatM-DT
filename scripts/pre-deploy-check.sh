#!/bin/bash

# 部署前检查脚本
# 确保所有必要的文件和配置都准备好了

echo "🔍 部署前检查..."
echo ""

ERRORS=0
WARNINGS=0

# 检查必要文件
echo "📋 检查必要文件..."
REQUIRED_FILES=(
    "docker-compose.yml"
    "Dockerfile.backend"
    "Dockerfile.frontend"
    "nginx.conf"
    "pyproject.toml"
    "poetry.lock"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file 缺失"
        ((ERRORS++))
    fi
done

# 检查目录
echo ""
echo "📁 检查必要目录..."
REQUIRED_DIRS=(
    "config"
    "scripts"
    "src"
    "viz"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "  ✅ $dir/"
    else
        echo "  ❌ $dir/ 缺失"
        ((ERRORS++))
    fi
done

# 检查前端构建
echo ""
echo "🏗️  检查前端构建..."
if [ -d "viz/build" ]; then
    BUILD_SIZE=$(du -sh viz/build | cut -f1)
    echo "  ✅ viz/build/ 存在 (大小: $BUILD_SIZE)"
else
    echo "  ⚠️  viz/build/ 不存在"
    echo "     运行 'cd viz && npm run build' 来构建前端"
    ((WARNINGS++))
fi

# 检查数据文件
echo ""
echo "📊 检查数据文件..."
if [ -d "data_parquet" ] && [ -n "$(ls -A data_parquet)" ]; then
    DATA_SIZE=$(du -sh data_parquet | cut -f1)
    FILE_COUNT=$(find data_parquet -type f | wc -l | xargs)
    echo "  ✅ data_parquet/ 存在 ($FILE_COUNT 个文件, 总大小: $DATA_SIZE)"
    echo "     ⚠️  注意: 数据文件很大，首次部署时上传可能需要很长时间"
else
    echo "  ⚠️  data_parquet/ 为空或不存在"
    echo "     如果服务器上没有数据文件，部署将失败"
    ((WARNINGS++))
fi

# 检查 Git 状态
echo ""
echo "🔄 检查 Git 状态..."
if git status > /dev/null 2>&1; then
    BRANCH=$(git branch --show-current)
    UNCOMMITTED=$(git status --porcelain | wc -l | xargs)
    echo "  当前分支: $BRANCH"
    if [ "$UNCOMMITTED" -gt 0 ]; then
        echo "  ⚠️  有 $UNCOMMITTED 个未提交的更改"
        ((WARNINGS++))
    else
        echo "  ✅ 工作目录干净"
    fi
    
    UNPUSHED=$(git log origin/$BRANCH..$BRANCH --oneline 2>/dev/null | wc -l | xargs)
    if [ "$UNPUSHED" -gt 0 ]; then
        echo "  ⚠️  有 $UNPUSHED 个未推送的提交"
        ((WARNINGS++))
    else
        echo "  ✅ 所有提交已推送"
    fi
else
    echo "  ⚠️  不是 Git 仓库"
    ((WARNINGS++))
fi

# 检查 Docker 配置
echo ""
echo "🐳 检查 Docker 配置..."
if docker --version > /dev/null 2>&1; then
    echo "  ✅ Docker 已安装"
    docker --version | sed 's/^/     /'
else
    echo "  ⚠️  本地 Docker 未安装（不影响远程部署）"
    ((WARNINGS++))
fi

if docker compose version > /dev/null 2>&1; then
    echo "  ✅ Docker Compose 已安装"
    docker compose version | sed 's/^/     /'
else
    echo "  ⚠️  本地 Docker Compose 未安装（不影响远程部署）"
    ((WARNINGS++))
fi

# 总结
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ 所有检查通过，可以开始部署！"
    echo ""
    echo "运行以下命令开始部署:"
    echo "  ./deploy-v2.sh"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  检查完成，有 $WARNINGS 个警告"
    echo ""
    echo "可以继续部署，但请注意警告信息"
    echo "运行以下命令开始部署:"
    echo "  ./deploy-v2.sh"
    exit 0
else
    echo "❌ 检查失败，发现 $ERRORS 个错误和 $WARNINGS 个警告"
    echo ""
    echo "请修复错误后再尝试部署"
    exit 1
fi

