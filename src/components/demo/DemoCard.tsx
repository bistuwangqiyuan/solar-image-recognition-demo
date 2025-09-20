import React from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Eye, 
  Download, 
  Share2, 
  X,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { DemoData, PanelCondition, Severity } from '@/types';

interface DemoCardProps {
  demo: DemoData;
  onClose: () => void;
  onRunDemo: () => void;
}

export const DemoCard: React.FC<DemoCardProps> = ({
  demo,
  onClose,
  onRunDemo,
}) => {
  const categoryLabels = {
    [PanelCondition.NORMAL]: '正常光伏板',
    [PanelCondition.LEAVES]: '树叶遮挡',
    [PanelCondition.DUST]: '灰尘覆盖',
    [PanelCondition.SHADOW]: '云彩阴影',
    [PanelCondition.OTHER]: '其他异常',
  };

  const severityIcons = {
    [Severity.LOW]: CheckCircle,
    [Severity.MEDIUM]: AlertTriangle,
    [Severity.HIGH]: Info,
  };

  const severityColors = {
    [Severity.LOW]: 'text-success-600 bg-success-100',
    [Severity.MEDIUM]: 'text-warning-600 bg-warning-100',
    [Severity.HIGH]: 'text-error-600 bg-error-100',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-secondary-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">🔋</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-secondary-900">
                {demo.title}
              </h2>
              <p className="text-sm text-secondary-600">
                {categoryLabels[demo.category]}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 rounded-lg transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左侧：图像和描述 */}
            <div className="space-y-4">
              {/* 图像预览 */}
              <div className="aspect-video bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🔋</span>
                  </div>
                  <p className="text-secondary-600">演示图像预览</p>
                </div>
              </div>

              {/* 描述 */}
              <div className="card">
                <div className="card-body">
                  <h3 className="font-semibold text-secondary-900 mb-2">
                    案例描述
                  </h3>
                  <p className="text-secondary-700 leading-relaxed">
                    {demo.description}
                  </p>
                </div>
              </div>

              {/* 技术特点 */}
              <div className="card">
                <div className="card-body">
                  <h3 className="font-semibold text-secondary-900 mb-3">
                    技术特点
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-success-600" />
                      <span className="text-secondary-700">高精度AI识别</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-success-600" />
                      <span className="text-secondary-700">实时分析处理</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-success-600" />
                      <span className="text-secondary-700">详细检测报告</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-success-600" />
                      <span className="text-secondary-700">维护建议生成</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧：预期结果 */}
            <div className="space-y-4">
              <div className="card">
                <div className="card-header">
                  <h3 className="font-semibold text-secondary-900">
                    预期检测结果
                  </h3>
                </div>
                <div className="card-body">
                  <div className="space-y-3">
                    {demo.expectedResults.map((result, index) => {
                      const SeverityIcon = severityIcons[result.severity];
                      
                      return (
                        <div
                          key={index}
                          className="flex items-start space-x-3 p-3 bg-secondary-50 rounded-lg"
                        >
                          <div className={`w-8 h-8 ${severityColors[result.severity]} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <SeverityIcon className="w-4 h-4" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-secondary-900">
                                {result.description}
                              </span>
                              <span className="text-sm font-semibold text-primary-600">
                                {Math.round(result.confidence * 100)}%
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-2 text-xs text-secondary-600">
                              <span className="badge badge-secondary">
                                {result.category}
                              </span>
                              <span className="badge badge-outline">
                                {result.severity}
                              </span>
                            </div>
                            
                            <div className="mt-2">
                              <div className="w-full bg-secondary-200 rounded-full h-1.5">
                                <div
                                  className="bg-primary-600 h-1.5 rounded-full transition-all duration-500"
                                  style={{ width: `${result.confidence * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 统计信息 */}
              <div className="card">
                <div className="card-body">
                  <h3 className="font-semibold text-secondary-900 mb-3">
                    检测统计
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary-600">
                        {demo.expectedResults.length}
                      </div>
                      <div className="text-sm text-secondary-600">检测区域</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-success-600">
                        {Math.round(
                          demo.expectedResults.reduce((sum, r) => sum + r.confidence, 0) / 
                          demo.expectedResults.length * 100
                        )}%
                      </div>
                      <div className="text-sm text-secondary-600">平均置信度</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="space-y-3">
                <button
                  onClick={onRunDemo}
                  className="btn btn-primary btn-lg w-full flex items-center justify-center space-x-2"
                >
                  <Play className="w-5 h-5" />
                  <span>运行演示</span>
                </button>
                
                <div className="grid grid-cols-2 gap-3">
                  <button className="btn btn-outline btn-md flex items-center justify-center space-x-2">
                    <Eye className="w-4 h-4" />
                    <span>预览</span>
                  </button>
                  <button className="btn btn-outline btn-md flex items-center justify-center space-x-2">
                    <Download className="w-4 h-4" />
                    <span>下载</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

