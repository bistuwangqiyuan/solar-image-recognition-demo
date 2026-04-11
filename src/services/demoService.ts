import { DemoData, PanelCondition, DetectionResult, Severity } from '@/types';

// 演示数据 — 使用真实光伏板故障图片
export const demoData: DemoData[] = [
  {
    id: 'demo-1',
    title: '正常光伏板',
    description: '太阳能电站中状态良好的光伏板，表面清洁无遮挡',
    imageUrl: '/static/demo/normal-panel.jpg',
    category: PanelCondition.NORMAL,
    expectedResults: [
      {
        category: PanelCondition.NORMAL,
        confidence: 0.95,
        boundingBox: { x: 100, y: 80, width: 500, height: 300 },
        description: '光伏板表面清洁，状态良好',
        severity: Severity.LOW,
      },
    ],
  },
  {
    id: 'demo-2',
    title: '植被遮挡',
    description: '光伏板被杂草和藤蔓严重覆盖，大面积遮挡',
    imageUrl: '/static/demo/leaves-cover.jpg',
    category: PanelCondition.LEAVES,
    expectedResults: [
      {
        category: PanelCondition.LEAVES,
        confidence: 0.94,
        boundingBox: { x: 50, y: 30, width: 400, height: 300 },
        description: '光伏板被大量植被覆盖，严重影响发电效率',
        severity: Severity.HIGH,
      },
    ],
  },
  {
    id: 'demo-3',
    title: '灰尘覆盖',
    description: '光伏板表面积累大量灰尘污渍，透光性明显下降',
    imageUrl: '/static/demo/dust-cover.jpg',
    category: PanelCondition.DUST,
    expectedResults: [
      {
        category: PanelCondition.DUST,
        confidence: 0.91,
        boundingBox: { x: 40, y: 20, width: 350, height: 280 },
        description: '光伏板表面灰尘污渍覆盖，透光性下降',
        severity: Severity.MEDIUM,
      },
    ],
  },
  {
    id: 'demo-4',
    title: '阴影遮挡',
    description: '外部物体在光伏板上形成条形阴影，部分电池被遮挡',
    imageUrl: '/static/demo/cloud-shadow.jpg',
    category: PanelCondition.SHADOW,
    expectedResults: [
      {
        category: PanelCondition.SHADOW,
        confidence: 0.88,
        boundingBox: { x: 30, y: 60, width: 300, height: 100 },
        description: '光伏板上存在条形阴影遮挡',
        severity: Severity.MEDIUM,
      },
    ],
  },
  {
    id: 'demo-5',
    title: '热斑故障',
    description: '光伏板电池片出现局部发黑热斑，存在安全隐患',
    imageUrl: '/static/demo/abnormal-condition.jpg',
    category: PanelCondition.OTHER,
    expectedResults: [
      {
        category: PanelCondition.OTHER,
        confidence: 0.90,
        boundingBox: { x: 60, y: 80, width: 80, height: 160 },
        description: '检测到电池片热斑/损坏区域，局部发黑',
        severity: Severity.HIGH,
      },
    ],
  },
  {
    id: 'demo-6',
    title: '混合问题',
    description: '光伏板同时存在落叶和周边植被遮挡等多种问题',
    imageUrl: '/static/demo/mixed-issues.jpg',
    category: PanelCondition.OTHER,
    expectedResults: [
      {
        category: PanelCondition.LEAVES,
        confidence: 0.86,
        boundingBox: { x: 150, y: 120, width: 100, height: 80 },
        description: '检测到落叶附着在面板表面',
        severity: Severity.MEDIUM,
      },
      {
        category: PanelCondition.LEAVES,
        confidence: 0.82,
        boundingBox: { x: 300, y: 100, width: 120, height: 150 },
        description: '面板边缘有植被遮挡',
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