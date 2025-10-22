# 🚀 快速部署指南

## 一键部署（推荐）

```bash
# 1. 检查部署准备
bash scripts/pre-deploy-check.sh

# 2. 开始部署
./deploy-v2.sh
```

就这么简单！脚本会自动完成所有部署步骤。

## 📋 部署前确认

### 必须完成
- [ ] 前端已构建（`cd viz && npm run build`）
- [ ] 代码已提交到 Git
- [ ] SSH 连接正常（`ssh ubuntu@43.165.1.18`）

### 首次部署额外步骤
- [ ] 服务器已安装 Docker 和 Docker Compose
- [ ] 安全组开放端口 22, 80, 443

## 🔧 常用命令

### 查看服务状态
```bash
ssh ubuntu@43.165.1.18 'cd /home/ubuntu/watm-dt && docker compose ps'
```

### 查看日志
```bash
ssh ubuntu@43.165.1.18 'cd /home/ubuntu/watm-dt && docker compose logs -f'
```

### 重启服务
```bash
ssh ubuntu@43.165.1.18 'cd /home/ubuntu/watm-dt && docker compose restart'
```

### 停止服务
```bash
ssh ubuntu@43.165.1.18 'cd /home/ubuntu/watm-dt && docker compose down'
```

## 🌐 访问地址

部署成功后，访问：
- **主页**: http://43.165.1.18
- **API 文档**: http://43.165.1.18/docs

## 📚 详细文档

完整的部署指南请查看 [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)

## ⚠️ 注意事项

1. **首次部署**: 数据文件上传可能需要 30-60 分钟
2. **增量部署**: 如果服务器上已有数据文件，部署只需 5-10 分钟
3. **网络要求**: 确保本地到服务器的网络连接稳定

## 🆘 遇到问题？

1. 运行 `bash scripts/pre-deploy-check.sh` 检查配置
2. 查看 [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) 的故障排查部分
3. 检查服务日志：`ssh ubuntu@43.165.1.18 'cd /home/ubuntu/watm-dt && docker compose logs'`

