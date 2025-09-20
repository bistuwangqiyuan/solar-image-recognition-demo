import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger.js';
import { ApiResponse, DemoData, PanelCondition } from '../../types/index.js';
import { asyncHandler, createValidationError } from '../middleware/errorHandler.js';

const router = Router();

// 演示数据
const demoImages: DemoData[] = [
  {
    id: 'demo-001',
    title: '正常光伏板',
    description: '展示状态良好的光伏板，无遮挡和污染',
    imageUrl: '/static/demo/normal-panel.jpg',
    expectedResults: [
      {
        category: PanelCondition.NORMAL,
        confidence: 0.95,
        boundingBox: { x: 50, y: 50, width: 300, height: 200 },
        description: '正常光伏板区域',
        severity: 'low' as const,
      },
    ],
    category: PanelCondition.NORMAL,
  },
  {
    id: 'demo-002',
    title: '树叶遮挡',
    description: '展示被树叶遮挡的光伏板，影响发电效率',
    imageUrl: '/static/demo/leaves-cover.jpg',
    expectedResults: [
      {
        category: PanelCondition.NORMAL,
        confidence: 0.88,
        boundingBox: { x: 50, y: 50, width: 200, height: 150 },
        description: '正常光伏板区域',
        severity: 'low' as const,
      },
      {
        category: PanelCondition.LEAVES,
        confidence: 0.92,
        boundingBox: { x: 250, y: 80, width: 100, height: 80 },
        description: '检测到树叶遮挡',
        severity: 'medium' as const,
      },
    ],
    category: PanelCondition.LEAVES,
  },
  {
    id: 'demo-003',
    title: '灰尘覆盖',
    description: '展示被灰尘覆盖的光伏板，需要清洁维护',
    imageUrl: '/static/demo/dust-cover.jpg',
    expectedResults: [
      {
        category: PanelCondition.NORMAL,
        confidence: 0.75,
        boundingBox: { x: 50, y: 50, width: 150, height: 100 },
        description: '部分正常光伏板区域',
        severity: 'low' as const,
      },
      {
        category: PanelCondition.DUST,
        confidence: 0.89,
        boundingBox: { x: 200, y: 50, width: 150, height: 200 },
        description: '检测到灰尘覆盖',
        severity: 'medium' as const,
      },
    ],
    category: PanelCondition.DUST,
  },
  {
    id: 'demo-004',
    title: '云彩阴影',
    description: '展示被云彩阴影遮挡的光伏板',
    imageUrl: '/static/demo/cloud-shadow.jpg',
    expectedResults: [
      {
        category: PanelCondition.NORMAL,
        confidence: 0.82,
        boundingBox: { x: 50, y: 100, width: 200, height: 150 },
        description: '正常光伏板区域',
        severity: 'low' as const,
      },
      {
        category: PanelCondition.SHADOW,
        confidence: 0.85,
        boundingBox: { x: 250, y: 50, width: 100, height: 200 },
        description: '检测到云彩阴影',
        severity: 'low' as const,
      },
    ],
    category: PanelCondition.SHADOW,
  },
  {
    id: 'demo-005',
    title: '混合问题',
    description: '展示同时存在多种问题的光伏板',
    imageUrl: '/static/demo/mixed-issues.jpg',
    expectedResults: [
      {
        category: PanelCondition.NORMAL,
        confidence: 0.70,
        boundingBox: { x: 50, y: 150, width: 100, height: 100 },
        description: '部分正常光伏板区域',
        severity: 'low' as const,
      },
      {
        category: PanelCondition.LEAVES,
        confidence: 0.88,
        boundingBox: { x: 150, y: 50, width: 80, height: 60 },
        description: '检测到树叶遮挡',
        severity: 'medium' as const,
      },
      {
        category: PanelCondition.DUST,
        confidence: 0.82,
        boundingBox: { x: 200, y: 100, width: 120, height: 90 },
        description: '检测到灰尘覆盖',
        severity: 'medium' as const,
      },
      {
        category: PanelCondition.SHADOW,
        confidence: 0.75,
        boundingBox: { x: 300, y: 50, width: 100, height: 150 },
        description: '检测到阴影遮挡',
        severity: 'low' as const,
      },
    ],
    category: PanelCondition.OTHER,
  },
];

// 获取所有演示数据
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  logger.info('获取演示数据列表');

  const response: ApiResponse<DemoData[]> = {
    success: true,
    data: demoImages,
    timestamp: new Date(),
  };

  res.json(response);
}));

// 根据ID获取演示数据
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    throw createValidationError('缺少演示数据ID参数');
  }

  const demoData = demoImages.find(demo => demo.id === id);

  if (!demoData) {
    throw createValidationError('未找到指定的演示数据');
  }

  logger.info('获取演示数据详情', { id });

  const response: ApiResponse<DemoData> = {
    success: true,
    data: demoData,
    timestamp: new Date(),
  };

  res.json(response);
}));

// 根据类别获取演示数据
router.get('/category/:category', asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.params;

  if (!category) {
    throw createValidationError('缺少类别参数');
  }

  // 验证类别是否有效
  const validCategories = Object.values(PanelCondition);
  if (!validCategories.includes(category as PanelCondition)) {
    throw createValidationError('无效的类别参数');
  }

  const filteredDemos = demoImages.filter(demo => demo.category === category);

  logger.info('根据类别获取演示数据', { category, count: filteredDemos.length });

  const response: ApiResponse<DemoData[]> = {
    success: true,
    data: filteredDemos,
    timestamp: new Date(),
  };

  res.json(response);
}));

// 获取演示统计信息
router.get('/stats/overview', asyncHandler(async (req: Request, res: Response) => {
  const stats = {
    total: demoImages.length,
    byCategory: {
      [PanelCondition.NORMAL]: demoImages.filter(d => d.category === PanelCondition.NORMAL).length,
      [PanelCondition.LEAVES]: demoImages.filter(d => d.category === PanelCondition.LEAVES).length,
      [PanelCondition.DUST]: demoImages.filter(d => d.category === PanelCondition.DUST).length,
      [PanelCondition.SHADOW]: demoImages.filter(d => d.category === PanelCondition.SHADOW).length,
      [PanelCondition.OTHER]: demoImages.filter(d => d.category === PanelCondition.OTHER).length,
    },
    averageConfidence: demoImages.reduce((sum, demo) => {
      const avgConfidence = demo.expectedResults.reduce((s, r) => s + r.confidence, 0) / demo.expectedResults.length;
      return sum + avgConfidence;
    }, 0) / demoImages.length,
    lastUpdated: new Date().toISOString(),
  };

  logger.info('获取演示统计信息', stats);

  const response: ApiResponse<typeof stats> = {
    success: true,
    data: stats,
    timestamp: new Date(),
  };

  res.json(response);
}));

// 搜索演示数据
router.get('/search/:query', asyncHandler(async (req: Request, res: Response) => {
  const { query } = req.params;
  const { category, limit = 10 } = req.query;

  if (!query) {
    throw createValidationError('缺少搜索查询参数');
  }

  let filteredDemos = demoImages;

  // 按类别过滤
  if (category && Object.values(PanelCondition).includes(category as PanelCondition)) {
    filteredDemos = filteredDemos.filter(demo => demo.category === category);
  }

  // 按查询词搜索
  const searchQuery = query.toLowerCase();
  const searchResults = filteredDemos.filter(demo => 
    demo.title.toLowerCase().includes(searchQuery) ||
    demo.description.toLowerCase().includes(searchQuery)
  );

  // 限制结果数量
  const limitedResults = searchResults.slice(0, parseInt(limit as string));

  logger.info('搜索演示数据', { 
    query, 
    category, 
    totalResults: searchResults.length,
    returnedResults: limitedResults.length 
  });

  const response: ApiResponse<{
    results: DemoData[];
    total: number;
    query: string;
    category?: string;
  }> = {
    success: true,
    data: {
      results: limitedResults,
      total: searchResults.length,
      query,
      category: category as string,
    },
    timestamp: new Date(),
  };

  res.json(response);
}));

export { router as demoRoutes };

