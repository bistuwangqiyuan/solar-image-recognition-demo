import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../../../.env') });

interface ServerConfig {
  port: number;
  host: string;
  corsOrigins: string[];
  maxFileSize: number;
  uploadDir: string;
  tempDir: string;
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  ai: {
    modelPath: string;
    confidenceThreshold: number;
    maxProcessingTime: number;
  };
  security: {
    jwtSecret: string;
    sessionTimeout: number;
    rateLimitWindow: number;
    rateLimitMax: number;
  };
}

interface Config {
  env: string;
  server: ServerConfig;
  logging: {
    level: string;
    format: string;
    file: string;
  };
}

const config: Config = {
  env: process.env.NODE_ENV || 'development',
  
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    host: process.env.HOST || 'localhost',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
    uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'),
    tempDir: process.env.TEMP_DIR || path.join(__dirname, '../../temp'),
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0', 10),
    },
    ai: {
      modelPath: process.env.AI_MODEL_PATH || path.join(__dirname, '../../models'),
      confidenceThreshold: parseFloat(process.env.AI_CONFIDENCE_THRESHOLD || '0.7'),
      maxProcessingTime: parseInt(process.env.AI_MAX_PROCESSING_TIME || '30000', 10), // 30秒
    },
    security: {
      jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '86400000', 10), // 24小时
      rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15分钟
      rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    },
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
    file: process.env.LOG_FILE || path.join(__dirname, '../../logs/app.log'),
  },
};

// 验证必需的配置
const requiredEnvVars = [
  'NODE_ENV',
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ 缺少必需的环境变量:', missingEnvVars.join(', '));
  process.exit(1);
}

// 创建必要的目录
import fs from 'fs';

const createDirIfNotExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 创建目录: ${dirPath}`);
  }
};

createDirIfNotExists(config.server.uploadDir);
createDirIfNotExists(config.server.tempDir);
createDirIfNotExists(path.dirname(config.logging.file));

export { config };


