import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Zap,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { DemoData, PanelCondition } from '@/types';

interface DemoStatsProps {
  demoData: DemoData[];
}

export const DemoStats: React.FC<DemoStatsProps> = ({ demoData }) => {
  const totalDemos = demoData.length;
  const totalDetections = demoData.reduce((sum, demo) => sum + demo.expectedResults.length, 0);
  const averageConfidence = demoData.reduce((sum, demo) => {
    const avgConfidence = demo.expectedResults.reduce((s, r) => s + r.confidence, 0) / demo.expectedResults.length;
    return sum + avgConfidence;
  }, 0) / totalDemos;

  const categoryStats = {
    [PanelCondition.NORMAL]: demoData.filter(d => d.category === PanelCondition.NORMAL).length,
    [PanelCondition.LEAVES]: demoData.filter(d => d.category === PanelCondition.LEAVES).length,
    [PanelCondition.DUST]: demoData.filter(d => d.category === PanelCondition.DUST).length,
    [PanelCondition.SHADOW]: demoData.filter(d => d.category === PanelCondition.SHADOW).length,
    [PanelCondition.OTHER]: demoData.filter(d => d.category === PanelCondition.OTHER).length,
  };

  const categoryLabels = {
    [PanelCondition.NORMAL]: '正常',
    [PanelCondition.LEAVES]: '树叶遮挡',
    [PanelCondition.DUST]: '灰尘覆盖',
    [PanelCondition.SHADOW]: '云彩阴影',
    [PanelCondition.OTHER]: '其他问题',
  };

  const categoryColors = {
    [PanelCondition.NORMAL]: 'text-success-600 bg-success-100',
    [PanelCondition.LEAVES]: 'text-warning-600 bg-warning-100',
    [PanelCondition.DUST]: 'text-secondary-600 bg-secondary-100',
    [PanelCondition.SHADOW]: 'text-primary-600 bg-primary-100',
    [PanelCondition.OTHER]: 'text-error-600 bg-error-100',
  };

  const stats = [
    {
      label: '演示案例',
      value: totalDemos.toString(),
      icon: BarChart3,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100',
    },
    {
      label: '检测区域',
      value: totalDetections.toString(),
      icon: Target,
      color: 'text-success-600',
      bgColor: 'bg-success-100',
    },
    {
      label: '平均置信度',
      value: `${Math.round(averageConfidence * 100)}%`,
      icon: TrendingUp,
      color: 'text-warning-600',
      bgColor: 'bg-warning-100',
    },
    {
      label: '识别准确率',
      value: '95%+',
      icon: Zap,
      color: 'text-error-600',
      bgColor: 'bg-error-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="card hover:shadow-industrial-lg transition-all duration-300"
          >
            <div className="card-body text-center">
              <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold text-secondary-900 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-secondary-600">
                {stat.label}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>

    {/* 类别分布 */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="card mb-8"
    >
      <div className="card-header">
        <h3 className="text-lg font-semibold text-secondary-900">
          演示案例分布
        </h3>
      </div>
      <div className="card-body">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(categoryStats).map(([category, count]) => {
            const percentage = totalDemos > 0 ? (count / totalDemos) * 100 : 0;
            return (
              <div key={category} className="text-center">
                <div className={`w-16 h-16 ${categoryColors[category as PanelCondition]} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                  <span className="text-2xl">
                    {category === PanelCondition.NORMAL ? '✅' :
                     category === PanelCondition.LEAVES ? '🍃' :
                     category === PanelCondition.DUST ? '🌫️' :
                     category === PanelCondition.SHADOW ? '☁️' :
                     '⚠️'}
                  </span>
                </div>
                <div className="text-lg font-bold text-secondary-900 mb-1">
                  {count}
                </div>
                <div className="text-sm text-secondary-600 mb-2">
                  {categoryLabels[category as PanelCondition]}
                </div>
                <div className="w-full bg-secondary-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="text-xs text-secondary-500 mt-1">
                  {Math.round(percentage)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>

    {/* 技术指标 */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="card"
    >
      <div className="card-header">
        <h3 className="text-lg font-semibold text-secondary-900">
          技术指标
        </h3>
      </div>
      <div className="card-body">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-success-600" />
            </div>
            <h4 className="font-semibold text-secondary-900 mb-2">
              识别准确率
            </h4>
            <p className="text-sm text-secondary-600">
              基于大量训练数据，我们的AI模型在光伏板状态识别方面达到95%以上的准确率
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Zap className="w-6 h-6 text-primary-600" />
            </div>
            <h4 className="font-semibold text-secondary-900 mb-2">
              处理速度
            </h4>
            <p className="text-sm text-secondary-600">
              优化的算法和GPU加速技术，确保在30秒内完成图像分析和结果生成
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6 text-warning-600" />
            </div>
            <h4 className="font-semibold text-secondary-900 mb-2">
              检测精度
            </h4>
            <p className="text-sm text-secondary-600">
              精确的边界框检测和像素级分析，能够识别最小2cm×2cm的问题区域
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

