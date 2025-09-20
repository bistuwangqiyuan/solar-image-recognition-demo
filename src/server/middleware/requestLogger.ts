import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

// 请求日志中间件
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // 记录请求开始
  logger.info('请求开始', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentLength: req.get('Content-Length'),
    contentType: req.get('Content-Type'),
  });

  // 监听响应结束
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      contentLength: res.get('Content-Length'),
    };

    // 根据状态码选择日志级别
    if (res.statusCode >= 500) {
      logger.error('请求完成 - 服务器错误', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('请求完成 - 客户端错误', logData);
    } else {
      logger.info('请求完成', logData);
    }
  });

  next();
};

