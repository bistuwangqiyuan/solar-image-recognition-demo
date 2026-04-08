# 光伏图像识别演示网站

一个现代化、高端、工业化的光伏图像识别演示网站，基于先进的AI技术，能够准确识别和分类光伏板的不同状态，包括正常光伏板、被树叶遮挡、积尘覆盖、云彩阴影等情况。

## 🌟 项目特色

- **AI智能识别**: 基于TensorFlow.js的深度学习模型，识别准确率95%+
- **实时分析**: 30秒内完成图像分析和结果生成
- **现代化UI**: 工业化设计风格，响应式布局，支持移动端
- **完整功能**: 图像上传、AI分析、结果展示、维护建议
- **演示系统**: 预设示例和实时演示功能

## 🚀 技术栈

### 前端技术
- **React 18** + **TypeScript** - 现代化组件开发
- **Tailwind CSS** - 工业化UI设计系统
- **Framer Motion** - 流畅动画效果
- **React Query** - 数据状态管理
- **Vite** - 快速构建工具

### 后端技术
- **Node.js** + **Express** - 高性能API服务
- **TypeScript** - 类型安全开发
- **Multer** - 文件上传处理
- **Sharp** - 图像处理优化
- **Winston** - 日志记录

### AI/ML技术
- **TensorFlow.js** - 浏览器端AI推理
- **自定义CNN模型** - 光伏板状态分类
- **WebGL加速** - 提升推理性能

## 📁 项目结构

```
solar-image-recognition/
├── src/
│   ├── components/          # React组件
│   │   ├── common/         # 通用组件
│   │   ├── demo/           # 演示相关组件
│   │   ├── layout/         # 布局组件
│   │   ├── results/        # 结果展示组件
│   │   └── upload/         # 上传相关组件
│   ├── pages/              # 页面组件
│   ├── services/           # API服务
│   ├── types/              # TypeScript类型定义
│   ├── server/             # 后端服务
│   │   ├── config/         # 配置文件
│   │   ├── middleware/     # 中间件
│   │   ├── routes/         # 路由
│   │   └── utils/          # 工具函数
│   ├── App.tsx             # 应用入口
│   └── main.tsx            # 主入口文件
├── public/                 # 静态资源
├── package.json            # 项目配置
├── tsconfig.json           # TypeScript配置
├── tailwind.config.js      # Tailwind配置
└── vite.config.ts          # Vite配置
```

## 🛠️ 安装和运行

### 环境要求
- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖
```bash
npm install
```

### 环境配置
1. 复制环境变量模板：
```bash
cp env.example .env
```

2. 根据实际情况修改 `.env` 文件中的配置

### 开发模式运行
```bash
# 同时启动前端和后端
npm run dev

# 或者分别启动
npm run dev:client  # 前端 (端口 3000)
npm run dev:server  # 后端 (端口 3001)
```

### 构建生产版本
```bash
npm run build
```

### 预览生产版本
```bash
npm run preview
```

## 📋 功能特性

### 1. 图像上传和处理
- 支持拖拽上传
- 文件格式验证 (JPG, PNG, WEBP)
- 文件大小限制 (10MB)
- 图像压缩和缩略图生成
- 移动端摄像头支持

### 2. AI图像识别
- 光伏板状态分类：
  - 正常光伏板
  - 树叶遮挡
  - 灰尘覆盖
  - 云彩阴影
  - 其他异常情况
- 边界框检测和标注
- 置信度评分
- 严重程度评估

### 3. 结果展示和分析
- 图像标注可视化
- 详细分析报告
- 维护建议生成
- 结果导出功能
- 历史记录查看

### 4. 演示功能
- 预设示例图像库
- 实时演示流程
- 技术指标展示
- 成功案例展示

### 5. 用户体验
- 响应式设计
- 移动端适配
- 流畅动画效果
- 错误处理和重试机制
- 加载状态指示

## 🔧 API接口

### 文件上传
```typescript
POST /api/upload/single
Content-Type: multipart/form-data

Request:
- file: File (图像文件)
- sessionId?: string (会话ID)

Response:
{
  success: boolean,
  data: {
    imageId: string,
    originalUrl: string,
    thumbnailUrl: string,
    metadata: ImageMetadata
  }
}
```

### AI分析
```typescript
POST /api/analysis
Content-Type: application/json

Request:
{
  imageId: string,
  options?: {
    confidence: number,
    detailLevel: 'basic' | 'detailed'
  }
}

Response:
{
  success: boolean,
  data: {
    results: DetectionResult[],
    summary: AnalysisSummary,
    recommendations: Recommendation[],
    processingTime: number
  }
}
```

### 演示数据
```typescript
GET /api/demo
Response: DemoData[]

GET /api/demo/:id
Response: DemoData

GET /api/demo/category/:category
Response: DemoData[]
```

## 🧪 测试

### 运行测试
```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 覆盖率报告
npm run test:coverage
```

### 测试覆盖率目标
- 单元测试覆盖率：≥ 90%
- 集成测试覆盖率：≥ 80%
- E2E测试覆盖率：≥ 70%

## 📦 部署

### 生产环境部署
1. 构建项目：
```bash
npm run build
```

2. 启动生产服务器：
```bash
npm start
```

### Docker部署
```bash
# 构建镜像
docker build -t solar-image-recognition .

# 运行容器
docker run -p 3000:3000 solar-image-recognition
```

## 🔒 安全特性

- HTTPS/TLS 1.3加密
- 输入验证和清理
- 文件类型和大小限制
- 速率限制和防DDoS
- 自动数据清理机制
- 访问日志记录

## 📊 性能优化

- 图像压缩和WebP格式支持
- 懒加载和代码分割
- Service Worker缓存
- CDN静态资源分发
- API响应缓存
- 数据库查询优化

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系我们

- 项目主页: [https://github.com/solar-image-recognition](https://github.com/solar-image-recognition)
- 问题反馈: [Issues](https://github.com/solar-image-recognition/issues)
- 邮箱: contact@solar-recognition.com

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和开源社区。

---

**光伏图像识别演示网站** - 让AI技术为光伏行业赋能 🚀


