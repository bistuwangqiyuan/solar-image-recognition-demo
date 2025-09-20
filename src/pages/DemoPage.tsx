import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Eye, 
  Download,
  Star,
  Clock,
  TrendingUp,
  BarChart3,
  Zap,
  X
} from 'lucide-react';
import { DemoData, PanelCondition } from '@/types';
import { demoService } from '@/services/demoService';
import { analysisService } from '@/services/analysisService';
import toast from 'react-hot-toast';

export const DemoPage: React.FC = () => {
  const [demos, setDemos] = useState<DemoData[]>([]);
  const [filteredDemos, setFilteredDemos] = useState<DemoData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<PanelCondition | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<DemoData | null>(null);
  const [showDemoModal, setShowDemoModal] = useState(false);

  // 加载演示数据
  useEffect(() => {
    const loadDemos = () => {
      setIsLoading(true);
      try {
        const allDemos = demoService.getAllDemos();
        setDemos(allDemos);
        setFilteredDemos(allDemos);
      } catch (error) {
        console.error('加载演示数据失败:', error);
        toast.error('加载演示数据失败');
      } finally {
        setIsLoading(false);
      }
    };

    loadDemos();
  }, []);

  // 过滤演示数据
  useEffect(() => {
    let filtered = demos;

    // 按类别过滤
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(demo => demo.category === selectedCategory);
    }

    // 按搜索查询过滤
    if (searchQuery.trim()) {
      filtered = filtered.filter(demo =>
        demo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        demo.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredDemos(filtered);
  }, [demos, selectedCategory, searchQuery]);

  // 运行演示
  const runDemo = async (demo: DemoData) => {
    try {
      setIsLoading(true);
      
      // 模拟分析过程
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 显示结果
      setSelectedDemo(demo);
      setShowDemoModal(true);
      
      toast.success('演示分析完成！');
    } catch (error) {
      console.error('演示运行失败:', error);
      toast.error('演示运行失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 获取类别标签
  const getCategoryLabel = (category: PanelCondition) => {
    const labels = {
      [PanelCondition.NORMAL]: '正常',
      [PanelCondition.LEAVES]: '树叶遮挡',
      [PanelCondition.DUST]: '灰尘覆盖',
      [PanelCondition.SHADOW]: '阴影遮挡',
      [PanelCondition.OTHER]: '其他异常',
    };
    return labels[category];
  };

  // 获取类别颜色
  const getCategoryColor = (category: PanelCondition) => {
    const colors = {
      [PanelCondition.NORMAL]: 'bg-success-100 text-success-800',
      [PanelCondition.LEAVES]: 'bg-warning-100 text-warning-800',
      [PanelCondition.DUST]: 'bg-warning-100 text-warning-800',
      [PanelCondition.SHADOW]: 'bg-info-100 text-info-800',
      [PanelCondition.OTHER]: 'bg-error-100 text-error-800',
    };
    return colors[category];
  };

  // 获取统计信息
  const stats = demoService.getDemoStatistics();
  const categories = demoService.getCategories();

  return (
    <div className="min-h-screen bg-secondary-50 py-12">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* 页面标题 */}
          <div className="text-center mb-12">
            <h1 className="text-3xl lg:text-4xl font-bold text-secondary-900 mb-4">
              AI识别演示
            </h1>
            <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
              体验我们的AI光伏板识别技术，查看各种场景下的检测效果
            </p>
          </div>

          {/* 统计信息 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <div className="card text-center">
              <div className="card-body">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="w-6 h-6 text-primary-600" />
                </div>
                <div className="text-2xl font-bold text-secondary-900 mb-1">
                  {stats.total}
                </div>
                <div className="text-sm text-secondary-600">演示案例</div>
              </div>
            </div>

            <div className="card text-center">
              <div className="card-body">
                <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-success-600" />
                </div>
                <div className="text-2xl font-bold text-secondary-900 mb-1">
                  {(stats.averageConfidence * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-secondary-600">平均准确率</div>
              </div>
            </div>

            <div className="card text-center">
              <div className="card-body">
                <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-warning-600" />
                </div>
                <div className="text-2xl font-bold text-secondary-900 mb-1">
                  &lt;3s
                </div>
                <div className="text-sm text-secondary-600">分析时间</div>
              </div>
            </div>

            <div className="card text-center">
              <div className="card-body">
                <div className="w-12 h-12 bg-info-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-6 h-6 text-info-600" />
                </div>
                <div className="text-2xl font-bold text-secondary-900 mb-1">
                  5
                </div>
                <div className="text-sm text-secondary-600">检测类别</div>
              </div>
            </div>
          </motion.div>

          {/* 搜索和过滤 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="card mb-8"
          >
            <div className="card-body">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
                {/* 搜索框 */}
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
                    <input
                      type="text"
                      placeholder="搜索演示案例..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* 类别过滤 */}
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-secondary-600" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as PanelCondition | 'all')}
                    className="px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">所有类别</option>
                    {categories.map(category => (
                      <option key={category.category} value={category.category}>
                        {category.label} ({category.count})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 视图模式切换 */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors duration-200 ${
                      viewMode === 'grid' 
                        ? 'bg-primary-100 text-primary-600' 
                        : 'bg-secondary-100 text-secondary-600'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-colors duration-200 ${
                      viewMode === 'list' 
                        ? 'bg-primary-100 text-primary-600' 
                        : 'bg-secondary-100 text-secondary-600'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 演示列表 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-secondary-600">加载中...</span>
              </div>
            ) : filteredDemos.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-secondary-400" />
                </div>
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                  未找到演示案例
                </h3>
                <p className="text-secondary-600">
                  请尝试调整搜索条件或选择其他类别
                </p>
              </div>
            ) : (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {filteredDemos.map((demo, index) => (
                  <motion.div
                    key={demo.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="card hover:shadow-lg transition-all duration-300"
                  >
                    <div className="card-body">
                      {viewMode === 'grid' ? (
                        <>
                          {/* 网格视图 */}
                          <div className="aspect-video bg-secondary-100 rounded-lg mb-4 overflow-hidden">
                            <img
                              src={demo.imageUrl}
                              alt={demo.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/static/placeholder-image.jpg';
                              }}
                            />
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold text-secondary-900">
                                {demo.title}
                              </h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(demo.category)}`}>
                                {getCategoryLabel(demo.category)}
                              </span>
                            </div>
                            <p className="text-sm text-secondary-600 line-clamp-2">
                              {demo.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 text-xs text-secondary-500">
                                <Eye className="w-3 h-3" />
                                <span>{demo.expectedResults.length} 个检测区域</span>
                              </div>
                              <button
                                onClick={() => runDemo(demo)}
                                disabled={isLoading}
                                className="btn btn-primary btn-sm flex items-center space-x-1"
                              >
                                <Play className="w-3 h-3" />
                                <span>运行演示</span>
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* 列表视图 */}
                          <div className="flex items-center space-x-4">
                            <div className="w-20 h-20 bg-secondary-100 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={demo.imageUrl}
                                alt={demo.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = '/static/placeholder-image.jpg';
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold text-secondary-900 truncate">
                                  {demo.title}
                                </h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(demo.category)}`}>
                                  {getCategoryLabel(demo.category)}
                                </span>
                              </div>
                              <p className="text-sm text-secondary-600 mb-3 line-clamp-2">
                                {demo.description}
                              </p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4 text-xs text-secondary-500">
                                  <div className="flex items-center space-x-1">
                                    <Eye className="w-3 h-3" />
                                    <span>{demo.expectedResults.length} 个检测区域</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Star className="w-3 h-3" />
                                    <span>{(demo.expectedResults.reduce((sum, r) => sum + r.confidence, 0) / demo.expectedResults.length * 100).toFixed(1)}% 准确率</span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => runDemo(demo)}
                                  disabled={isLoading}
                                  className="btn btn-primary btn-sm flex items-center space-x-1"
                                >
                                  <Play className="w-3 h-3" />
                                  <span>运行演示</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* 演示模态框 */}
      <AnimatePresence>
        {showDemoModal && selectedDemo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowDemoModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-secondary-900">
                    {selectedDemo.title} - 演示结果
                  </h2>
                  <button
                    onClick={() => setShowDemoModal(false)}
                    className="p-2 text-secondary-400 hover:text-secondary-600 transition-colors duration-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <img
                      src={selectedDemo.imageUrl}
                      alt={selectedDemo.title}
                      className="w-full h-auto rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = '/static/placeholder-image.jpg';
                      }}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                        检测结果
                      </h3>
                      <div className="space-y-2">
                        {selectedDemo.expectedResults.map((result, index) => (
                          <div key={index} className="p-3 bg-secondary-50 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-secondary-900">
                                {result.description}
                              </span>
                              <span className="text-sm text-secondary-600">
                                {(result.confidence * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="text-xs text-secondary-500">
                              位置: ({result.boundingBox.x}, {result.boundingBox.y}) 
                              尺寸: {result.boundingBox.width}×{result.boundingBox.height}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                        描述
                      </h3>
                      <p className="text-secondary-600">
                        {selectedDemo.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};