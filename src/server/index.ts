import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { uploadRoutes } from './routes/upload.js';
import { analysisRoutes } from './routes/analysis.js';
import { healthRoutes } from './routes/health.js';
import { demoRoutes } from './routes/demo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Server {
  private app: express.Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = config.server.port;
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // 安全中间件
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "blob:"],
          scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
          connectSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));

    // CORS配置
    this.app.use(cors({
      origin: config.server.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

    // 速率限制
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 100, // 限制每个IP 15分钟内最多100个请求
      message: {
        success: false,
        error: {
          type: 'RATE_LIMIT_EXCEEDED',
          message: '请求过于频繁，请稍后再试',
          retryable: true,
        },
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api', limiter);

    // 请求日志
    this.app.use(requestLogger);

    // 解析JSON和URL编码
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 静态文件服务
    this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
    this.app.use('/static', express.static(path.join(__dirname, '../static')));
  }

  private initializeRoutes(): void {
    // 健康检查路由
    this.app.use('/api/health', healthRoutes);
    
    // 文件上传路由
    this.app.use('/api/upload', uploadRoutes);
    
    // AI分析路由
    this.app.use('/api/analysis', analysisRoutes);
    
    // 演示数据路由
    this.app.use('/api/demo', demoRoutes);

    // 根路径
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        data: {
          message: '光伏图像识别API服务',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
        },
      });
    });

    // 404处理
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: {
          type: 'NOT_FOUND',
          message: '请求的资源不存在',
          retryable: false,
        },
        timestamp: new Date(),
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public start(): void {
    this.app.listen(this.port, () => {
      logger.info(`🚀 服务器启动成功`);
      logger.info(`📡 端口: ${this.port}`);
      logger.info(`🌍 环境: ${config.env}`);
      logger.info(`📊 健康检查: http://localhost:${this.port}/api/health`);
      logger.info(`📁 上传目录: ${path.join(__dirname, '../uploads')}`);
    });

    // 优雅关闭
    process.on('SIGTERM', () => {
      logger.info('收到SIGTERM信号，开始优雅关闭...');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      logger.info('收到SIGINT信号，开始优雅关闭...');
      process.exit(0);
    });

    // 未捕获的异常处理
    process.on('uncaughtException', (error) => {
      logger.error('未捕获的异常:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('未处理的Promise拒绝:', reason);
      process.exit(1);
    });
  }
}

// 启动服务器
const server = new Server();
server.start();

