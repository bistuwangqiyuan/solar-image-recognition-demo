import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  TrendingUp,
  Target,
  Activity
} from 'lucide-react';
import { AnalysisSummary as AnalysisSummaryType } from '@/types';

interface AnalysisSummaryProps {
  summary: AnalysisSummaryType;
}

export const AnalysisSummary: React.FC<AnalysisSummaryProps> = ({ summary }) => {
  const getStatusIcon = () => {
    switch (summary.overallStatus) {
      case 'healthy':
        return CheckCircle;
      case 'warning':
        return AlertTriangle;
      case 'critical':
        return XCircle;
      default:
        return CheckCircle;
    }
  };

  const getStatusColor = () => {
    switch (summary.overallStatus) {
      case 'healthy':
        return 'text-success-600 bg-success-100';
      case 'warning':
        return 'text-warning-600 bg-warning-100';
      case 'critical':
        return 'text-error-600 bg-error-100';
      default:
        return 'text-success-600 bg-success-100';
    }
  };

  const getStatusText = () => {
    switch (summary.overallStatus) {
      case 'healthy':
        return '状态良好';
      case 'warning':
        return '需要关注';
      case 'critical':
        return '需要立即处理';
      default:
        return '状态良好';
    }
  };

  const StatusIcon = getStatusIcon();

  const metrics = [
    {
      label: '处理时间',
      value: `${summary.processingTime}ms`,
      icon: Clock,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100',
    },
    {
      label: '识别置信度',
      value: `${Math.round(summary.confidence * 100)}%`,
      icon: TrendingUp,
      color: 'text-success-600',
      bgColor: 'bg-success-100',
    },
    {
      label: '检测问题数',
      value: summary.totalIssues.toString(),
      icon: Target,
      color: 'text-warning-600',
      bgColor: 'bg-warning-100',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="card"
    >
      <div className="card-header">
        <h3 className="text-lg font-semibold text-secondary-900">
          分析摘要
        </h3>
      </div>

      <div className="card-body space-y-6">
        {/* 整体状态 */}
        <div className="text-center">
          <div className={`w-16 h-16 ${getStatusColor()} rounded-full flex items-center justify-center mx-auto mb-3`}>
            <StatusIcon className="w-8 h-8" />
          </div>
          <h4 className="text-xl font-semibold text-secondary-900 mb-1">
            {getStatusText()}
          </h4>
          <p className="text-secondary-600">
            光伏板整体状态评估
          </p>
        </div>

        {/* 状态指示器 */}
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              summary.overallStatus === 'healthy' ? 'bg-success-500' :
              summary.overallStatus === 'warning' ? 'bg-warning-500' :
              'bg-error-500'
            }`}></div>
            <span className="text-sm font-medium text-secondary-700">
              {summary.overallStatus.toUpperCase()}
            </span>
          </div>
        </div>

        {/* 关键指标 */}
        <div className="space-y-4">
          <h5 className="font-medium text-secondary-900 text-center">
            关键指标
          </h5>
          
          <div className="grid grid-cols-1 gap-3">
            {metrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 ${metric.bgColor} rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${metric.color}`} />
                    </div>
                    <span className="text-sm font-medium text-secondary-700">
                      {metric.label}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-secondary-900">
                    {metric.value}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* 置信度进度条 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-secondary-700">
              整体置信度
            </span>
            <span className="text-sm font-semibold text-secondary-900">
              {Math.round(summary.confidence * 100)}%
            </span>
          </div>
          <div className="w-full bg-secondary-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${summary.confidence * 100}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full"
            />
          </div>
        </div>

        {/* 状态说明 */}
        <div className="p-3 bg-secondary-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Activity className="w-4 h-4 text-secondary-600 mt-0.5" />
            <div className="text-sm text-secondary-700">
              {summary.overallStatus === 'healthy' && (
                <p>光伏板状态良好，无需特殊维护。建议定期检查以保持最佳性能。</p>
              )}
              {summary.overallStatus === 'warning' && (
                <p>检测到一些问题，建议及时处理以提高发电效率。请查看详细建议。</p>
              )}
              {summary.overallStatus === 'critical' && (
                <p>检测到严重问题，需要立即处理以避免影响发电效率或设备安全。</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

