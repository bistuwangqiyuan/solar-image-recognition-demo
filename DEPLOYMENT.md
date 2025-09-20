# 光伏图像识别演示网站

一个基于AI技术的光伏图像识别演示网站，提供图像上传、AI分析、结果展示等功能。

## 功能特性

### 核心功能
- **图像上传**: 支持拖拽上传、相机拍摄、文件选择
- **AI识别**: 基于TensorFlow.js的客户端AI分析
- **结果展示**: 详细的识别结果和可视化
- **演示功能**: 预置示例图像和结果展示

### 技术特性
- **现代化UI**: 基于Tailwind CSS的工业级设计
- **响应式设计**: 完美适配桌面和移动设备
- **性能优化**: 图像压缩、懒加载、缓存策略
- **安全防护**: HTTPS、输入验证、数据加密

## 技术栈

### 前端
- **React 18**: 现代化前端框架
- **TypeScript**: 类型安全的JavaScript
- **Tailwind CSS**: 实用优先的CSS框架
- **Framer Motion**: 流畅的动画效果
- **React Query**: 数据状态管理
- **TensorFlow.js**: 客户端AI推理

### 后端
- **Node.js**: JavaScript运行时
- **Express**: Web应用框架
- **Multer**: 文件上传处理
- **Sharp**: 图像处理库
- **Redis**: 缓存和会话存储

### 部署
- **Docker**: 容器化部署
- **Nginx**: 反向代理和负载均衡
- **Prometheus**: 监控数据收集
- **Grafana**: 监控数据可视化

## 项目结构

```
solarimagekirocs/
├── src/                    # 源代码
│   ├── components/         # React组件
│   ├── pages/             # 页面组件
│   ├── services/          # 服务层
│   ├── utils/             # 工具函数
│   ├── types/             # TypeScript类型
│   └── contexts/          # React上下文
├── scripts/               # 脚本文件
├── monitoring/           # 监控配置
├── k8s/                  # Kubernetes配置
├── docker-compose.yml    # Docker编排
├── Dockerfile           # Docker镜像
└── package.json         # 项目配置
```

## 快速开始

### 环境要求
- Node.js 18+
- Docker & Docker Compose
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 开发环境
```bash
# 启动开发服务器
npm run dev

# 启动后端服务
npm run dev:server
```

### 生产环境
```bash
# 构建应用
npm run build

# 启动Docker服务
docker-compose up -d
```

## 部署指南

### Docker部署
```bash
# 构建镜像
docker build -t solar-image-recognition .

# 启动服务
docker-compose up -d
```

### Kubernetes部署
```bash
# 应用配置
kubectl apply -f k8s/deployment.yaml

# 检查状态
kubectl get pods
```

### 监控部署
```bash
# 启动监控服务
docker-compose -f monitoring/docker-compose.monitoring.yml up -d

# 访问Grafana
open http://localhost:3001
```

## 脚本工具

### 健康检查
```bash
./scripts/health-check.sh
```

### 性能测试
```bash
./scripts/performance-test.sh
```

### 安全扫描
```bash
./scripts/security-scan.sh
```

### 系统维护
```bash
./scripts/maintenance.sh
```

### 数据备份
```bash
./scripts/backup.sh
```

### 数据恢复
```bash
./scripts/restore.sh -d 20240101_120000 -t all
```

## API接口

### 健康检查
```http
GET /api/health
```

### 文件上传
```http
POST /api/upload
Content-Type: multipart/form-data
```

### 图像分析
```http
POST /api/analysis
Content-Type: application/json
```

### 演示数据
```http
GET /api/demo
```

## 配置说明

### 环境变量
```bash
# 应用配置
PORT=3000
NODE_ENV=production

# 上传配置
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/webp

# Redis配置
REDIS_URL=redis://redis:6379

# 日志配置
LOG_LEVEL=info
```

### Docker配置
- **应用服务**: 端口3000，自动重启
- **Redis服务**: 端口6379，持久化存储
- **Nginx服务**: 端口80/443，负载均衡

## 监控和日志

### 监控指标
- 请求速率和响应时间
- 错误率和成功率
- 系统资源使用
- 数据库性能

### 日志管理
- 应用日志: `src/logs/`
- 访问日志: Nginx访问日志
- 错误日志: 集中错误收集

## 安全特性

### 数据安全
- HTTPS加密传输
- 输入验证和过滤
- 文件类型检查
- 自动数据清理

### 系统安全
- 容器隔离
- 最小权限原则
- 定期安全扫描
- 漏洞监控

## 性能优化

### 前端优化
- 代码分割和懒加载
- 图像压缩和WebP转换
- 缓存策略
- Service Worker

### 后端优化
- Redis缓存
- 图像预处理
- 连接池
- 负载均衡

## 故障排除

### 常见问题
1. **服务无法启动**: 检查端口占用和依赖
2. **上传失败**: 检查文件大小和类型
3. **AI分析失败**: 检查模型加载和内存
4. **性能问题**: 检查资源使用和缓存

### 日志查看
```bash
# 查看应用日志
docker logs app

# 查看Nginx日志
docker logs nginx

# 查看Redis日志
docker logs redis
```

## 贡献指南

### 开发流程
1. Fork项目
2. 创建功能分支
3. 提交代码
4. 创建Pull Request

### 代码规范
- 使用TypeScript
- 遵循ESLint规则
- 编写单元测试
- 更新文档

## 许可证

MIT License

## 联系方式

- 项目地址: [GitHub Repository]
- 问题反馈: [Issues]
- 文档更新: [Wiki]

---

**注意**: 这是一个演示项目，请勿在生产环境中使用未经充分测试的代码。
