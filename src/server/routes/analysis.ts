import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';
import { 
  ApiResponse, 
  AnalysisRequest, 
  AnalysisResponse, 
  DetectionResult, 
  AnalysisSummary,
  Recommendation,
  PanelCondition,
  Severity,
  ErrorType 
} from '../../types/index.js';
import { asyncHandler, createValidationError, createAIError } from '../middleware/errorHandler.js';
import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// 请求验证模式
const analysisSchema = Joi.object({
  imageId: Joi.string().uuid().required(),
  options: Joi.object({
    confidence: Joi.number().min(0).max(1).default(0.7),
    detailLevel: Joi.string().valid('basic', 'detailed').default('detailed'),
  }).optional(),
});

// 模拟AI识别结果（实际项目中这里会调用真实的AI模型）
const simulateAIResults = async (imageId: string, options: any): Promise<DetectionResult[]> => {
  // 模拟处理时间
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

  // 模拟识别结果
  const mockResults: DetectionResult[] = [
    {
      category: PanelCondition.NORMAL,
      confidence: 0.95,
      boundingBox: { x: 50, y: 50, width: 200, height: 150 },
      description: '正常光伏板区域',
      severity: Severity.LOW,
    },
    {
      category: PanelCondition.LEAVES,
      confidence: 0.82,
      boundingBox: { x: 300, y: 100, width: 80, height: 60 },
      description: '检测到树叶遮挡',
      severity: Severity.MEDIUM,
    },
    {
      category: PanelCondition.DUST,
      confidence: 0.75,
      boundingBox: { x: 150, y: 200, width: 120, height: 90 },
      description: '检测到灰尘覆盖',
      severity: Severity.MEDIUM,
    },
  ];

  // 根据置信度阈值过滤结果
  return mockResults.filter(result => result.confidence >= options.confidence);
};

// 生成维护建议
const generateRecommendations = (results: DetectionResult[]): Recommendation[] => {
  const recommendations: Recommendation[] = [];

  const hasLeaves = results.some(r => r.category === PanelCondition.LEAVES);
  const hasDust = results.some(r => r.category === PanelCondition.DUST);
  const hasShadow = results.some(r => r.category === PanelCondition.SHADOW);
  const hasOther = results.some(r => r.category === PanelCondition.OTHER);

  if (hasLeaves) {
    recommendations.push({
      type: 'cleaning',
      priority: Severity.MEDIUM,
      description: '建议清理光伏板表面的树叶遮挡，以提高发电效率',
      estimatedCost: 200,
      estimatedTime: '2-4小时',
    });
  }

  if (hasDust) {
    recommendations.push({
      type: 'cleaning',
      priority: Severity.MEDIUM,
      description: '建议清洁光伏板表面的灰尘，定期维护可提高发电效率15-20%',
      estimatedCost: 150,
      estimatedTime: '1-2小时',
    });
  }

  if (hasShadow) {
    recommendations.push({
      type: 'inspection',
      priority: Severity.LOW,
      description: '检测到阴影遮挡，建议检查周围环境是否有新的遮挡物',
      estimatedCost: 100,
      estimatedTime: '1小时',
    });
  }

  if (hasOther) {
    recommendations.push({
      type: 'inspection',
      priority: Severity.HIGH,
      description: '检测到异常情况，建议进行详细检查以确定具体问题',
      estimatedCost: 500,
      estimatedTime: '4-6小时',
    });
  }

  // 如果没有检测到问题，添加定期维护建议
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'maintenance',
      priority: Severity.LOW,
      description: '光伏板状态良好，建议定期进行预防性维护',
      estimatedCost: 300,
      estimatedTime: '2-3小时',
    });
  }

  return recommendations;
};

// 计算分析摘要
const calculateSummary = (results: DetectionResult[], processingTime: number): AnalysisSummary => {
  const totalIssues = results.filter(r => r.category !== PanelCondition.NORMAL).length;
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
  
  let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
  
  if (totalIssues === 0) {
    overallStatus = 'healthy';
  } else if (results.some(r => r.severity === Severity.HIGH)) {
    overallStatus = 'critical';
  } else if (results.some(r => r.severity === Severity.MEDIUM)) {
    overallStatus = 'warning';
  }

  return {
    overallStatus,
    totalIssues,
    processingTime,
    confidence: avgConfidence,
  };
};

// 分析图像
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  // 验证请求参数
  const { error: validationError, value } = analysisSchema.validate(req.body);
  if (validationError) {
    throw createValidationError('请求参数验证失败', validationError.details);
  }

  const { imageId, options = {} } = value as AnalysisRequest;
  const startTime = Date.now();

  logger.info('开始AI图像分析', {
    imageId,
    options,
    timestamp: new Date().toISOString(),
  });

  try {
    // 模拟AI处理
    const results = await simulateAIResults(imageId, options);
    const processingTime = Date.now() - startTime;

    // 生成建议
    const recommendations = generateRecommendations(results);

    // 计算摘要
    const summary = calculateSummary(results, processingTime);

    const analysisResponse: AnalysisResponse = {
      results,
      summary,
      recommendations,
      processingTime,
    };

    logger.info('AI图像分析完成', {
      imageId,
      processingTime,
      resultCount: results.length,
      overallStatus: summary.overallStatus,
      totalIssues: summary.totalIssues,
    });

    const response: ApiResponse<AnalysisResponse> = {
      success: true,
      data: analysisResponse,
      timestamp: new Date(),
    };

    res.json(response);
  } catch (error) {
    logger.error('AI图像分析失败', {
      imageId,
      error: error instanceof Error ? error.message : error,
      processingTime: Date.now() - startTime,
    });
    
    throw createAIError('AI图像分析失败', error);
  }
}));

// 获取分析历史
router.get('/history/:imageId', asyncHandler(async (req: Request, res: Response) => {
  const { imageId } = req.params;
  const { limit = 10, offset = 0 } = req.query;

  if (!imageId) {
    throw createValidationError('缺少图像ID参数');
  }

  // 这里可以实现分析历史查询逻辑
  // 实际项目中会从数据库查询历史分析记录

  const mockHistory = [
    {
      id: uuidv4(),
      imageId,
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      summary: {
        overallStatus: 'warning' as const,
        totalIssues: 2,
        processingTime: 3500,
        confidence: 0.85,
      },
    },
    {
      id: uuidv4(),
      imageId,
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      summary: {
        overallStatus: 'healthy' as const,
        totalIssues: 0,
        processingTime: 2800,
        confidence: 0.92,
      },
    },
  ];

  const response: ApiResponse<{
    history: any[];
    total: number;
    limit: number;
    offset: number;
  }> = {
    success: true,
    data: {
      history: mockHistory,
      total: mockHistory.length,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    },
    timestamp: new Date(),
  };

  res.json(response);
}));

// 批量分析
router.post('/batch', asyncHandler(async (req: Request, res: Response) => {
  const { imageIds, options = {} } = req.body;

  if (!Array.isArray(imageIds) || imageIds.length === 0) {
    throw createValidationError('imageIds必须是非空数组');
  }

  if (imageIds.length > 10) {
    throw createValidationError('批量分析最多支持10张图像');
  }

  logger.info('开始批量AI分析', {
    imageCount: imageIds.length,
    options,
  });

  const batchResults = [];
  const errors = [];

  for (const imageId of imageIds) {
    try {
      const startTime = Date.now();
      const results = await simulateAIResults(imageId, options);
      const processingTime = Date.now() - startTime;
      const recommendations = generateRecommendations(results);
      const summary = calculateSummary(results, processingTime);

      batchResults.push({
        imageId,
        results,
        summary,
        recommendations,
        processingTime,
      });
    } catch (error) {
      errors.push({
        imageId,
        error: error instanceof Error ? error.message : '分析失败',
      });
    }
  }

  const response: ApiResponse<{
    successful: any[];
    failed: any[];
    total: number;
    successCount: number;
    failureCount: number;
  }> = {
    success: true,
    data: {
      successful: batchResults,
      failed: errors,
      total: imageIds.length,
      successCount: batchResults.length,
      failureCount: errors.length,
    },
    timestamp: new Date(),
  };

  res.json(response);
}));

export { router as analysisRoutes };

