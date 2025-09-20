import winston from 'winston';
import path from 'path';
import { config } from '../config/index.js';

// 自定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// 控制台格式
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss',
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// 创建logger实例
export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'solar-image-recognition' },
  transports: [
    // 错误日志文件
    new winston.transports.File({
      filename: path.join(path.dirname(config.logging.file), 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // 所有日志文件
    new winston.transports.File({
      filename: config.logging.file,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// 开发环境添加控制台输出
if (config.env !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
}

// 生产环境只记录warn级别以上的日志到控制台
if (config.env === 'production') {
  logger.add(new winston.transports.Console({
    level: 'warn',
    format: consoleFormat,
  }));
}

// 导出便捷方法
export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta);
};

export const logError = (message: string, error?: Error | any) => {
  logger.error(message, { error: error?.message || error, stack: error?.stack });
};

export const logWarn = (message: string, meta?: any) => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta);
};

