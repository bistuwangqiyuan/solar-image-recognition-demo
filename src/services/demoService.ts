import { DemoData, PanelCondition, DetectionResult, Severity } from '@/types';

// 演示数据
export const demoData: DemoData[] = [
  {
    id: 'demo-1',
    title: '正常光伏板',
    description: '展示状态良好的光伏板，无遮挡和污染',
    imageUrl: '/static/demo/normal-panel.jpg',
    category: PanelCondition.NORMAL,
    expectedResults: [
      {
        category: PanelCondition.NORMAL,
        confidence: 0.95,
        boundingBox: { x: 50, y: 50, width: 300, height: 200 },
        description: '正常光伏板区域',
        severity: Severity.LOW,
      },
    ],
  },
  {
    id: 'demo-2',
    title: '树叶遮挡',
    description: '光伏板表面被树叶遮挡，影响发电效率',
    imageUrl: '/static/demo/leaves-obstruction.jpg',
    category: PanelCondition.LEAVES,
    expectedResults: [
      {
        category: PanelCondition.NORMAL,
        confidence: 0.88,
        boundingBox: { x: 100, y: 80, width: 200, height: 150 },
        description: '正常光伏板区域',
        severity: Severity.LOW,
      },
      {
        category: PanelCondition.LEAVES,
        confidence: 0.92,
        boundingBox: { x: 250, y: 120, width: 80, height: 60 },
        description: '检测到树叶遮挡',
        severity: Severity.MEDIUM,
      },
    ],
  },
  {
    id: 'demo-3',
    title: '灰尘覆盖',
    description: '光伏板表面积累大量灰尘，需要清洁维护',
    imageUrl: '/static/demo/dust-coverage.jpg',
    category: PanelCondition.DUST,
    expectedResults: [
      {
        category: PanelCondition.NORMAL,
        confidence: 0.75,
        boundingBox: { x: 80, y: 60, width: 180, height: 120 },
        description: '正常光伏板区域',
        severity: Severity.LOW,
      },
      {
        category: PanelCondition.DUST,
        confidence: 0.89,
        boundingBox: { x: 200, y: 100, width: 120, height: 90 },
        description: '检测到灰尘覆盖',
        severity: Severity.MEDIUM,
      },
    ],
  },
  {
    id: 'demo-4',
    title: '云彩阴影',
    description: '云彩在光伏板上形成阴影，暂时影响发电',
    imageUrl: '/static/demo/cloud-shadow.jpg',
    category: PanelCondition.SHADOW,
    expectedResults: [
      {
        category: PanelCondition.NORMAL,
        confidence: 0.82,
        boundingBox: { x: 60, y: 40, width: 220, height: 160 },
        description: '正常光伏板区域',
        severity: Severity.LOW,
      },
      {
        category: PanelCondition.SHADOW,
        confidence: 0.78,
        boundingBox: { x: 180, y: 80, width: 100, height: 80 },
        description: '检测到阴影遮挡',
        severity: Severity.LOW,
      },
    ],
  },
  {
    id: 'demo-5',
    title: '异常情况',
    description: '光伏板出现异常情况，需要详细检查',
    imageUrl: '/static/demo/abnormal-condition.jpg',
    category: PanelCondition.OTHER,
    expectedResults: [
      {
        category: PanelCondition.NORMAL,
        confidence: 0.65,
        boundingBox: { x: 40, y: 30, width: 150, height: 100 },
        description: '正常光伏板区域',
        severity: Severity.LOW,
      },
      {
        category: PanelCondition.OTHER,
        confidence: 0.85,
        boundingBox: { x: 200, y: 80, width: 120, height: 100 },
        description: '检测到异常情况',
        severity: Severity.HIGH,
      },
    ],
  },
  {
    id: 'demo-6',
    title: '混合问题',
    description: '光伏板同时存在多种问题，需要综合处理',
    imageUrl: '/static/demo/mixed-issues.jpg',
    category: PanelCondition.OTHER,
    expectedResults: [
      {
        category: PanelCondition.NORMAL,
        confidence: 0.70,
        boundingBox: { x: 50, y: 40, width: 180, height: 120 },
        description: '正常光伏板区域',
        severity: Severity.LOW,
      },
      {
        category: PanelCondition.LEAVES,
        confidence: 0.83,
        boundingBox: { x: 200, y: 60, width: 60, height: 45 },
        description: '检测到树叶遮挡',
        severity: Severity.MEDIUM,
      },
      {
        category: PanelCondition.DUST,
        confidence: 0.76,
        boundingBox: { x: 150, y: 120, width: 100, height: 75 },
        description: '检测到灰尘覆盖',
        severity: Severity.MEDIUM,
      },
    ],
  },
];

// 演示服务类
class DemoService {
  /**
   * 获取所有演示数据
   */
  getAllDemos(): DemoData[] {
    return demoData;
  }

  /**
   * 根据ID获取演示数据
   */
  getDemoById(id: string): DemoData | undefined {
    return demoData.find(demo => demo.id === id);
  }

  /**
   * 根据类别获取演示数据
   */
  getDemosByCategory(category: PanelCondition): DemoData[] {
    return demoData.filter(demo => demo.category === category);
  }

  /**
   * 获取随机演示数据
   */
  getRandomDemo(): DemoData {
    const randomIndex = Math.floor(Math.random() * demoData.length);
    return demoData[randomIndex];
  }

  /**
   * 搜索演示数据
   */
  searchDemos(query: string): DemoData[] {
    const lowercaseQuery = query.toLowerCase();
    return demoData.filter(demo => 
      demo.title.toLowerCase().includes(lowercaseQuery) ||
      demo.description.toLowerCase().includes(lowercaseQuery) ||
      demo.category.toLowerCase().includes(lowercaseQuery)
    );
  }

  /**
   * 获取演示统计信息
   */
  getDemoStatistics(): {
    total: number;
    byCategory: Record<PanelCondition, number>;
    averageConfidence: number;
  } {
    const total = demoData.length;
    const byCategory = demoData.reduce((acc, demo) => {
      acc[demo.category] = (acc[demo.category] || 0) + 1;
      return acc;
    }, {} as Record<PanelCondition, number>);

    const averageConfidence = demoData.reduce((sum, demo) => {
      const avgConfidence = demo.expectedResults.reduce((s, r) => s + r.confidence, 0) / demo.expectedResults.length;
      return sum + avgConfidence;
    }, 0) / total;

    return {
      total,
      byCategory,
      averageConfidence,
    };
  }

  /**
   * 获取推荐演示
   */
  getRecommendedDemos(limit: number = 3): DemoData[] {
    // 按置信度排序，返回前几个
    return demoData
      .sort((a, b) => {
        const avgConfidenceA = a.expectedResults.reduce((sum, r) => sum + r.confidence, 0) / a.expectedResults.length;
        const avgConfidenceB = b.expectedResults.reduce((sum, r) => sum + r.confidence, 0) / b.expectedResults.length;
        return avgConfidenceB - avgConfidenceA;
      })
      .slice(0, limit);
  }

  /**
   * 获取演示分类列表
   */
  getCategories(): Array<{
    category: PanelCondition;
    count: number;
    label: string;
  }> {
    const categoryLabels = {
      [PanelCondition.NORMAL]: '正常',
      [PanelCondition.LEAVES]: '树叶遮挡',
      [PanelCondition.DUST]: '灰尘覆盖',
      [PanelCondition.SHADOW]: '阴影遮挡',
      [PanelCondition.OTHER]: '其他异常',
    };

    const stats = this.getDemoStatistics();
    
    return Object.entries(stats.byCategory).map(([category, count]) => ({
      category: category as PanelCondition,
      count,
      label: categoryLabels[category as PanelCondition],
    }));
  }
}

// 创建单例实例
export const demoService = new DemoService();