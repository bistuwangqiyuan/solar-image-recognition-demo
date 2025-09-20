import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { ApiError, ErrorType, ApiResponse } from '../../types/index.js';

// 自定义错误类
export class AppError extends Error {
  public statusCode: number;
  public type: ErrorType;
  public retryable: boolean;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    type: ErrorType = ErrorType.SERVER_ERROR,
    retryable: boolean = false,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.retryable = retryable;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 错误处理中间件
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let type = ErrorType.SERVER_ERROR;
  let retryable = false;
  let details: any = undefined;

  // 如果是自定义错误
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    type = error.type;
    retryable = error.retryable;
    details = error.details;
  } else if (error.name === 'ValidationError') {
    // Joi验证错误
    statusCode = 400;
    type = ErrorType.VALIDATION_ERROR;
    retryable = false;
    details = error.message;
  } else if (error.name === 'MulterError') {
    // 文件上传错误
    statusCode = 400;
    type = ErrorType.UPLOAD_ERROR;
    retryable = false;
    details = error.message;
  } else if (error.name === 'SyntaxError' && 'body' in error) {
    // JSON解析错误
    statusCode = 400;
    type = ErrorType.VALIDATION_ERROR;
    retryable = false;
    details = '无效的JSON格式';
  }

  // 记录错误日志
  logger.error('API错误', {
    error: error.message,
    stack: error.stack,
    statusCode,
    type,
    retryable,
    details,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // 构建错误响应
  const errorResponse: ApiResponse = {
    success: false,
    error: {
      type,
      message: error.message,
      details,
      retryable,
    },
    timestamp: new Date(),
  };

  // 发送错误响应
  res.status(statusCode).json(errorResponse);
};

// 异步错误包装器
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404错误处理
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(
    `请求的资源 ${req.originalUrl} 不存在`,
    404,
    ErrorType.SERVER_ERROR,
    false
  );
  next(error);
};

// 验证错误创建器
export const createValidationError = (message: string, details?: any) => {
  return new AppError(message, 400, ErrorType.VALIDATION_ERROR, false, details);
};

// 文件上传错误创建器
export const createUploadError = (message: string, details?: any) => {
  return new AppError(message, 400, ErrorType.UPLOAD_ERROR, false, details);
};

// AI处理错误创建器
export const createAIError = (message: string, details?: any) => {
  return new AppError(message, 500, ErrorType.AI_PROCESSING_ERROR, true, details);
};

// 网络错误创建器
export const createNetworkError = (message: string, details?: any) => {
  return new AppError(message, 503, ErrorType.NETWORK_ERROR, true, details);
};

