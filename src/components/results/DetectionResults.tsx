import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, 
  EyeOff, 
  Filter, 
  SortAsc, 
  SortDesc,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { DetectionResult, PanelCondition, Severity } from '@/types';

interface DetectionResultsProps {
  results: DetectionResult[];
}

export const DetectionResults: React.FC<DetectionResultsProps> = ({ results }) => {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [showOnlyIssues, setShowOnlyIssues] = useState(false);
  const [sortBy, setSortBy] = useState<'confidence' | 'severity' | 'category'>('confidence');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const categoryLabels = {
    [PanelCondition.NORMAL]: '正常光伏板',
    [PanelCondition.LEAVES]: '树叶遮挡',
    [PanelCondition.DUST]: '灰尘覆盖',
    [PanelCondition.SHADOW]: '云彩阴影',
    [PanelCondition.OTHER]: '其他异常',
  };

  const severityLabels = {
    [Severity.LOW]: '低',
    [Severity.MEDIUM]: '中',
    [Severity.HIGH]: '高',
  };

  const severityColors = {
    [Severity.LOW]: 'text-success-600 bg-success-100',
    [Severity.MEDIUM]: 'text-warning-600 bg-warning-100',
    [Severity.HIGH]: 'text-error-600 bg-error-100',
  };

  const categoryColors = {
    [PanelCondition.NORMAL]: 'text-success-600 bg-success-100',
    [PanelCondition.LEAVES]: 'text-warning-600 bg-warning-100',
    [PanelCondition.DUST]: 'text-secondary-600 bg-secondary-100',
    [PanelCondition.SHADOW]: 'text-primary-600 bg-primary-100',
    [PanelCondition.OTHER]: 'text-error-600 bg-error-100',
  };

  const filteredResults = results.filter(result => 
    !showOnlyIssues || result.category !== PanelCondition.NORMAL
  );

  const sortedResults = [...filteredResults].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'confidence':
        comparison = a.confidence - b.confidence;
        break;
      case 'severity':
        const severityOrder = { [Severity.LOW]: 1, [Severity.MEDIUM]: 2, [Severity.HIGH]: 3 };
        comparison = severityOrder[a.severity] - severityOrder[b.severity];
        break;
      case 'category':
        comparison = a.category.localeCompare(b.category);
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="card"
    >
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-secondary-900">
            检测结果
          </h3>
          <span className="text-sm text-secondary-600">
            {sortedResults.length} 项
          </span>
        </div>
      </div>

      <div className="card-body space-y-4">
        {/* 控制栏 */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowOnlyIssues(!showOnlyIssues)}
              className={`btn btn-sm flex items-center space-x-1 ${
                showOnlyIssues ? 'btn-primary' : 'btn-outline'
              }`}
            >
              {showOnlyIssues ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span>仅显示问题</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-secondary-600">排序:</span>
            <div className="flex items-center space-x-1">
              {(['confidence', 'severity', 'category'] as const).map((sortType) => (
                <button
                  key={sortType}
                  onClick={() => handleSort(sortType)}
                  className={`btn btn-sm flex items-center space-x-1 ${
                    sortBy === sortType ? 'btn-primary' : 'btn-ghost'
                  }`}
                >
                  <span className="capitalize">
                    {sortType === 'confidence' ? '置信度' :
                     sortType === 'severity' ? '严重程度' : '类别'}
                  </span>
                  {sortBy === sortType && (
                    sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 结果列表 */}
        <div className="space-y-3">
          {sortedResults.length === 0 ? (
            <div className="text-center py-8 text-secondary-500">
              <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>没有找到符合条件的检测结果</p>
            </div>
          ) : (
            sortedResults.map((result, index) => {
              const isExpanded = expandedItems.has(index);
              const categoryLabel = categoryLabels[result.category];
              const severityLabel = severityLabels[result.severity];
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="border border-secondary-200 rounded-lg overflow-hidden hover:shadow-industrial transition-all duration-200"
                >
                  {/* 结果项头部 */}
                  <div
                    className="p-4 cursor-pointer hover:bg-secondary-50 transition-colors duration-200"
                    onClick={() => toggleExpanded(index)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-secondary-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-secondary-500" />
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className={`badge ${categoryColors[result.category]}`}>
                            {categoryLabel}
                          </span>
                          <span className={`badge ${severityColors[result.severity]}`}>
                            {severityLabel}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm font-semibold text-secondary-900">
                            {Math.round(result.confidence * 100)}%
                          </div>
                          <div className="text-xs text-secondary-500">置信度</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2">
                      <p className="text-sm text-secondary-700">
                        {result.description}
                      </p>
                    </div>
                  </div>

                  {/* 展开详情 */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-secondary-200 bg-secondary-50"
                    >
                      <div className="p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-secondary-600">位置坐标:</span>
                            <div className="font-mono text-secondary-900">
                              ({result.boundingBox.x}, {result.boundingBox.y})
                            </div>
                          </div>
                          <div>
                            <span className="text-secondary-600">尺寸:</span>
                            <div className="font-mono text-secondary-900">
                              {result.boundingBox.width} × {result.boundingBox.height}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <span className="text-secondary-600 text-sm">详细描述:</span>
                          <p className="text-sm text-secondary-800 leading-relaxed">
                            {result.description}
                          </p>
                        </div>

                        {/* 置信度进度条 */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-secondary-600">识别置信度</span>
                            <span className="font-medium text-secondary-900">
                              {Math.round(result.confidence * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-secondary-200 rounded-full h-2">
                            <div
                              className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${result.confidence * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>

        {/* 统计信息 */}
        {results.length > 0 && (
          <div className="pt-4 border-t border-secondary-200">
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="font-semibold text-secondary-900">
                  {results.filter(r => r.category === PanelCondition.NORMAL).length}
                </div>
                <div className="text-secondary-600">正常区域</div>
              </div>
              <div>
                <div className="font-semibold text-secondary-900">
                  {results.filter(r => r.category !== PanelCondition.NORMAL).length}
                </div>
                <div className="text-secondary-600">问题区域</div>
              </div>
              <div>
                <div className="font-semibold text-secondary-900">
                  {Math.round(results.reduce((sum, r) => sum + r.confidence, 0) / results.length * 100)}%
                </div>
                <div className="text-secondary-600">平均置信度</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

