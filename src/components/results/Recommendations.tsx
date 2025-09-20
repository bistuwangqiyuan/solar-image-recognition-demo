import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Lightbulb, 
  Clock, 
  DollarSign, 
  ChevronDown, 
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { Recommendation, Severity } from '@/types';

interface RecommendationsProps {
  recommendations: Recommendation[];
}

export const Recommendations: React.FC<RecommendationsProps> = ({ recommendations }) => {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const typeLabels = {
    maintenance: '维护保养',
    cleaning: '清洁处理',
    inspection: '检查诊断',
    replacement: '更换维修',
  };

  const priorityLabels = {
    [Severity.LOW]: '低优先级',
    [Severity.MEDIUM]: '中优先级',
    [Severity.HIGH]: '高优先级',
  };

  const priorityColors = {
    [Severity.LOW]: 'text-success-600 bg-success-100',
    [Severity.MEDIUM]: 'text-warning-600 bg-warning-100',
    [Severity.HIGH]: 'text-error-600 bg-error-100',
  };

  const typeIcons = {
    maintenance: CheckCircle,
    cleaning: Lightbulb,
    inspection: Info,
    replacement: AlertCircle,
  };

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const sortedRecommendations = [...recommendations].sort((a, b) => {
    const priorityOrder = { [Severity.LOW]: 1, [Severity.MEDIUM]: 2, [Severity.HIGH]: 3 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  const totalCost = recommendations.reduce((sum, rec) => sum + (rec.estimatedCost || 0), 0);
  const totalTime = recommendations.reduce((sum, rec) => {
    const time = rec.estimatedTime;
    if (time && time.includes('小时')) {
      return sum + parseInt(time);
    }
    return sum;
  }, 0);

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
            维护建议
          </h3>
          <span className="text-sm text-secondary-600">
            {recommendations.length} 项建议
          </span>
        </div>
      </div>

      <div className="card-body space-y-4">
        {/* 总体概览 */}
        {recommendations.length > 0 && (
          <div className="p-4 bg-secondary-50 rounded-lg">
            <h4 className="font-medium text-secondary-900 mb-3">维护概览</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-success-600" />
                <span className="text-secondary-600">预估费用:</span>
                <span className="font-semibold text-secondary-900">
                  ¥{totalCost.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-primary-600" />
                <span className="text-secondary-600">预估时间:</span>
                <span className="font-semibold text-secondary-900">
                  {totalTime}小时
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 建议列表 */}
        <div className="space-y-3">
          {sortedRecommendations.length === 0 ? (
            <div className="text-center py-8 text-secondary-500">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>光伏板状态良好，暂无维护建议</p>
            </div>
          ) : (
            sortedRecommendations.map((recommendation, index) => {
              const isExpanded = expandedItems.has(index);
              const typeLabel = typeLabels[recommendation.type];
              const priorityLabel = priorityLabels[recommendation.priority];
              const TypeIcon = typeIcons[recommendation.type];

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="border border-secondary-200 rounded-lg overflow-hidden hover:shadow-industrial transition-all duration-200"
                >
                  {/* 建议项头部 */}
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
                        
                        <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                          <TypeIcon className="w-4 h-4 text-primary-600" />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-secondary-900">
                            {typeLabel}
                          </span>
                          <span className={`badge ${priorityColors[recommendation.priority]}`}>
                            {priorityLabel}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        {recommendation.estimatedCost && (
                          <div className="text-right">
                            <div className="text-sm font-semibold text-secondary-900">
                              ¥{recommendation.estimatedCost.toLocaleString()}
                            </div>
                            <div className="text-xs text-secondary-500">预估费用</div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-2">
                      <p className="text-sm text-secondary-700 line-clamp-2">
                        {recommendation.description}
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
                      <div className="p-4 space-y-4">
                        {/* 详细描述 */}
                        <div className="space-y-2">
                          <span className="text-secondary-600 text-sm font-medium">详细说明:</span>
                          <p className="text-sm text-secondary-800 leading-relaxed">
                            {recommendation.description}
                          </p>
                        </div>

                        {/* 详细信息 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {recommendation.estimatedCost && (
                            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                              <DollarSign className="w-5 h-5 text-success-600" />
                              <div>
                                <div className="text-sm font-medium text-secondary-900">
                                  预估费用
                                </div>
                                <div className="text-lg font-semibold text-success-600">
                                  ¥{recommendation.estimatedCost.toLocaleString()}
                                </div>
                              </div>
                            </div>
                          )}

                          {recommendation.estimatedTime && (
                            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                              <Clock className="w-5 h-5 text-primary-600" />
                              <div>
                                <div className="text-sm font-medium text-secondary-900">
                                  预估时间
                                </div>
                                <div className="text-lg font-semibold text-primary-600">
                                  {recommendation.estimatedTime}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 优先级说明 */}
                        <div className="p-3 bg-white rounded-lg">
                          <div className="flex items-start space-x-2">
                            <AlertCircle className="w-4 h-4 text-warning-600 mt-0.5" />
                            <div className="text-sm text-secondary-700">
                              <span className="font-medium">优先级说明:</span>
                              {recommendation.priority === Severity.HIGH && (
                                <span className="ml-1">需要立即处理，可能影响发电效率或设备安全。</span>
                              )}
                              {recommendation.priority === Severity.MEDIUM && (
                                <span className="ml-1">建议尽快处理，有助于提高发电效率。</span>
                              )}
                              {recommendation.priority === Severity.LOW && (
                                <span className="ml-1">可以安排在常规维护中进行。</span>
                              )}
                            </div>
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

        {/* 行动建议 */}
        {recommendations.length > 0 && (
          <div className="pt-4 border-t border-secondary-200">
            <div className="p-4 bg-primary-50 rounded-lg">
              <h4 className="font-medium text-primary-900 mb-2">下一步行动</h4>
              <div className="space-y-2 text-sm text-primary-800">
                <p>• 根据优先级安排维护计划</p>
                <p>• 联系专业维护团队进行现场检查</p>
                <p>• 准备必要的工具和材料</p>
                <p>• 记录维护过程和结果</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

