import { Router, Request, Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';
import { ApiResponse, UploadResponse, ImageMetadata, ErrorType } from '../../types/index.js';
import { asyncHandler, createUploadError, createValidationError } from '../middleware/errorHandler.js';
import Joi from 'joi';

const router = Router();

// 文件存储配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.server.uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// 文件过滤器
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(createUploadError('不支持的文件格式，仅支持 JPG、PNG、WEBP 格式'));
  }
};

// Multer配置
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.server.maxFileSize,
    files: 1,
  },
});

// 文件验证模式
const uploadSchema = Joi.object({
  sessionId: Joi.string().uuid().optional(),
});

// 图像处理函数
const processImage = async (filePath: string, originalName: string): Promise<{
  metadata: ImageMetadata;
  thumbnailPath: string;
}> => {
  try {
    // 获取图像信息
    const imageInfo = await sharp(filePath).metadata();
    
    // 生成缩略图
    const thumbnailName = `thumb-${path.basename(filePath)}`;
    const thumbnailPath = path.join(config.server.uploadDir, thumbnailName);
    
    await sharp(filePath)
      .resize(300, 300, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

    const metadata: ImageMetadata = {
      size: fs.statSync(filePath).size,
      dimensions: {
        width: imageInfo.width || 0,
        height: imageInfo.height || 0,
      },
      format: imageInfo.format || 'unknown',
      uploadTime: new Date(),
    };

    return { metadata, thumbnailPath };
  } catch (error) {
    logger.error('图像处理失败', error);
    throw createUploadError('图像处理失败', error);
  }
};

// 上传单个文件
router.post('/single', upload.single('file'), asyncHandler(async (req: Request, res: Response) => {
  // 验证请求参数
  const { error: validationError, value } = uploadSchema.validate(req.body);
  if (validationError) {
    throw createValidationError('请求参数验证失败', validationError.details);
  }

  if (!req.file) {
    throw createUploadError('未找到上传的文件');
  }

  const { sessionId } = value;
  const file = req.file;

  logger.info('开始处理文件上传', {
    originalName: file.originalname,
    filename: file.filename,
    size: file.size,
    mimetype: file.mimetype,
    sessionId,
  });

  try {
    // 处理图像
    const { metadata, thumbnailPath } = await processImage(file.path, file.originalname);
    
    // 生成图像ID
    const imageId = uuidv4();
    
    // 构建响应数据
    const uploadResponse: UploadResponse = {
      imageId,
      originalUrl: `/uploads/${file.filename}`,
      thumbnailUrl: `/uploads/${path.basename(thumbnailPath)}`,
      metadata,
    };

    // 记录成功日志
    logger.info('文件上传成功', {
      imageId,
      originalName: file.originalname,
      filename: file.filename,
      size: file.size,
      dimensions: metadata.dimensions,
      sessionId,
    });

    const response: ApiResponse<UploadResponse> = {
      success: true,
      data: uploadResponse,
      timestamp: new Date(),
    };

    res.json(response);
  } catch (error) {
    // 清理上传的文件
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw error;
  }
}));

// 批量上传文件
router.post('/multiple', upload.array('files', 5), asyncHandler(async (req: Request, res: Response) => {
  // 验证请求参数
  const { error: validationError, value } = uploadSchema.validate(req.body);
  if (validationError) {
    throw createValidationError('请求参数验证失败', validationError.details);
  }

  const files = req.files as Express.Multer.File[];
  const { sessionId } = value;

  if (!files || files.length === 0) {
    throw createUploadError('未找到上传的文件');
  }

  logger.info('开始处理批量文件上传', {
    fileCount: files.length,
    sessionId,
  });

  const uploadResults: UploadResponse[] = [];
  const errors: string[] = [];

  for (const file of files) {
    try {
      // 处理图像
      const { metadata, thumbnailPath } = await processImage(file.path, file.originalname);
      
      // 生成图像ID
      const imageId = uuidv4();
      
      // 构建响应数据
      const uploadResponse: UploadResponse = {
        imageId,
        originalUrl: `/uploads/${file.filename}`,
        thumbnailUrl: `/uploads/${path.basename(thumbnailPath)}`,
        metadata,
      };

      uploadResults.push(uploadResponse);

      logger.info('批量上传文件处理成功', {
        imageId,
        originalName: file.originalname,
        filename: file.filename,
        size: file.size,
        sessionId,
      });
    } catch (error) {
      // 清理失败的文件
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      
      errors.push(`${file.originalname}: ${error instanceof Error ? error.message : '处理失败'}`);
      logger.error('批量上传文件处理失败', {
        originalName: file.originalname,
        error: error instanceof Error ? error.message : error,
        sessionId,
      });
    }
  }

  const response: ApiResponse<{
    successful: UploadResponse[];
    failed: string[];
    total: number;
    successCount: number;
    failureCount: number;
  }> = {
    success: true,
    data: {
      successful: uploadResults,
      failed: errors,
      total: files.length,
      successCount: uploadResults.length,
      failureCount: errors.length,
    },
    timestamp: new Date(),
  };

  res.json(response);
}));

// 获取上传状态
router.get('/status/:imageId', asyncHandler(async (req: Request, res: Response) => {
  const { imageId } = req.params;

  if (!imageId) {
    throw createValidationError('缺少图像ID参数');
  }

  // 这里可以实现更复杂的状态检查逻辑
  // 比如检查文件是否存在、是否正在处理等
  
  const response: ApiResponse<{
    imageId: string;
    status: 'uploaded' | 'processing' | 'completed' | 'failed';
    exists: boolean;
  }> = {
    success: true,
    data: {
      imageId,
      status: 'uploaded',
      exists: true,
    },
    timestamp: new Date(),
  };

  res.json(response);
}));

// 删除上传的文件
router.delete('/:imageId', asyncHandler(async (req: Request, res: Response) => {
  const { imageId } = req.params;

  if (!imageId) {
    throw createValidationError('缺少图像ID参数');
  }

  // 这里可以实现文件删除逻辑
  // 注意：实际实现中需要根据imageId找到对应的文件路径
  
  logger.info('删除文件请求', { imageId });

  const response: ApiResponse<{
    imageId: string;
    deleted: boolean;
  }> = {
    success: true,
    data: {
      imageId,
      deleted: true,
    },
    timestamp: new Date(),
  };

  res.json(response);
}));

export { router as uploadRoutes };

