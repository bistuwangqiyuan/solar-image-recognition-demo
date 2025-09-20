import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';
import { ApiResponse } from '../../types/index.js';
import fs from 'fs';
import path from 'path';

const router = Router();

// 基础健康检查
router.get('/', async (req: Request, res: Response) => {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.env,
      version: '1.0.0',
      services: {
        server: 'healthy',
        database: 'healthy', // 这里可以添加数据库连接检查
        redis: 'healthy',    // 这里可以添加Redis连接检查
        ai: 'healthy',       // 这里可以添加AI模型检查
      },
      system: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version,
      },
    };

    const response: ApiResponse = {
      success: true,
      data: healthData,
      timestamp: new Date(),
    };

    res.json(response);
  } catch (error) {
    logger.error('健康检查失败', error);
    
    const response: ApiResponse = {
      success: false,
      error: {
        type: 'HEALTH_CHECK_FAILED',
        message: '健康检查失败',
        retryable: true,
      },
      timestamp: new Date(),
    };

    res.status(503).json(response);
  }
});

// 详细健康检查
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    const detailedHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.env,
      version: '1.0.0',
      
      // 服务状态检查
      services: {
        server: {
          status: 'healthy',
          port: config.server.port,
          host: config.server.host,
        },
        uploads: {
          status: fs.existsSync(config.server.uploadDir) ? 'healthy' : 'unhealthy',
          path: config.server.uploadDir,
          writable: true, // 这里可以添加写入权限检查
        },
        temp: {
          status: fs.existsSync(config.server.tempDir) ? 'healthy' : 'unhealthy',
          path: config.server.tempDir,
          writable: true,
        },
        ai: {
          status: 'healthy',
          modelPath: config.server.ai.modelPath,
          confidenceThreshold: config.server.ai.confidenceThreshold,
        },
      },
      
      // 系统资源
      system: {
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024),
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        },
        cpu: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version,
        pid: process.pid,
      },
      
      // 配置信息
      config: {
        maxFileSize: config.server.maxFileSize,
        corsOrigins: config.server.corsOrigins,
        rateLimitMax: config.server.security.rateLimitMax,
        sessionTimeout: config.server.security.sessionTimeout,
      },
    };

    const response: ApiResponse = {
      success: true,
      data: detailedHealth,
      timestamp: new Date(),
    };

    res.json(response);
  } catch (error) {
    logger.error('详细健康检查失败', error);
    
    const response: ApiResponse = {
      success: false,
      error: {
        type: 'DETAILED_HEALTH_CHECK_FAILED',
        message: '详细健康检查失败',
        retryable: true,
      },
      timestamp: new Date(),
    };

    res.status(503).json(response);
  }
});

// 就绪检查
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // 检查关键服务是否就绪
    const checks = {
      uploads: fs.existsSync(config.server.uploadDir),
      temp: fs.existsSync(config.server.tempDir),
      // 这里可以添加更多检查，如数据库连接、Redis连接等
    };

    const allReady = Object.values(checks).every(check => check === true);

    if (allReady) {
      const response: ApiResponse = {
        success: true,
        data: {
          status: 'ready',
          checks,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date(),
      };
      res.json(response);
    } else {
      const response: ApiResponse = {
        success: false,
        error: {
          type: 'NOT_READY',
          message: '服务未就绪',
          details: checks,
          retryable: true,
        },
        timestamp: new Date(),
      };
      res.status(503).json(response);
    }
  } catch (error) {
    logger.error('就绪检查失败', error);
    
    const response: ApiResponse = {
      success: false,
      error: {
        type: 'READINESS_CHECK_FAILED',
        message: '就绪检查失败',
        retryable: true,
      },
      timestamp: new Date(),
    };

    res.status(503).json(response);
  }
});

// 存活检查
router.get('/live', (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    data: {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    timestamp: new Date(),
  };
  
  res.json(response);
});

export { router as healthRoutes };

