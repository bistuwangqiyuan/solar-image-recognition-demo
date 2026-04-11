# 光伏图像识别演示系统

现代化 AI 驱动的光伏板状态监测系统，基于 **React + Python (FastAPI)** 构建，部署在 **Vercel** 上。

## 技术栈

### 前端
- **React 18** + **TypeScript**
- **Vite 5** 构建工具
- **TailwindCSS** 样式框架
- **TensorFlow.js** 浏览器端 AI 推理 (MobileNet + KNN)
- **Framer Motion** 动画
- **TanStack React Query** 数据管理

### 后端 (Python Serverless)
- **FastAPI** — Python API 框架
- **Vercel Serverless Functions** — 无服务器部署

### 部署
- **Vercel** — 前端静态托管 + Python Serverless API

## 项目结构

```
solar-image-recognition-demo/
├── api/
│   └── index.py              # Python FastAPI API (Vercel Serverless)
├── src/
│   ├── main.tsx               # React 入口
│   ├── App.tsx                # 路由配置
│   ├── pages/                 # 页面组件
│   ├── components/            # UI 组件
│   ├── services/              # API 服务层
│   ├── contexts/              # React Context
│   ├── utils/                 # 工具函数
│   ├── types/                 # TypeScript 类型定义
│   └── data/                  # 静态数据
├── public/                    # 静态资源
├── requirements.txt           # Python 依赖
├── package.json               # Node.js 依赖和脚本
├── vercel.json                # Vercel 部署配置
├── vite.config.ts             # Vite 构建配置
└── tailwind.config.js         # TailwindCSS 配置
```

## 快速开始

### 前置条件
- Node.js >= 18
- Python >= 3.9
- npm

### 安装依赖

```bash
# 安装前端依赖
npm install

# 安装 Python 依赖 (可选，用于本地开发 API)
pip install -r requirements.txt
```

### 本地开发

```bash
# 启动前端开发服务器 (端口 3000)
npm run dev

# 启动 Python API 服务器 (端口 8000，另开终端)
cd api && uvicorn index:app --reload --port 8000
```

前端开发服务器会将 `/api` 请求代理到 `http://localhost:8000`。

### 构建

```bash
npm run build
```

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/demo` | 获取演示数据列表 |
| GET | `/api/demo/:id` | 获取演示详情 |
| POST | `/api/analysis` | 图像分析 (模拟 AI) |
| POST | `/api/upload/single` | 上传图像 |
| GET | `/api/analysis/history/:id` | 分析历史 |

## 部署到 Vercel

1. 安装 Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. 部署:
   ```bash
   vercel
   ```

3. 生产部署:
   ```bash
   vercel --prod
   ```

Vercel 会自动:
- 使用 Vite 构建前端
- 检测 `api/` 目录并部署 Python Serverless Functions
- 根据 `vercel.json` 配置路由规则

## License

MIT
