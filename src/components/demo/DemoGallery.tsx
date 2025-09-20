import React from 'react';
import { motion } from 'framer-motion';
import { DemoData } from '@/types';

interface DemoGalleryProps {
  demos: DemoData[];
  onDemoSelect: (demo: DemoData) => void;
  onRunDemo: (demo: DemoData) => void;
}

export const DemoGallery: React.FC<DemoGalleryProps> = ({
  demos,
  onDemoSelect,
  onRunDemo,
}) => {
  if (demos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-secondary-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🔍</span>
        </div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-2">
          没有找到演示案例
        </h3>
        <p className="text-secondary-600">
          请尝试调整搜索条件或选择其他类别
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {demos.map((demo, index) => (
        <motion.div
          key={demo.id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="card hover:shadow-industrial-lg transition-all duration-300 group cursor-pointer"
          onClick={() => onDemoSelect(demo)}
        >
          {/* 图像预览 */}
          <div className="relative overflow-hidden rounded-t-xl">
            <div className="aspect-video bg-gradient-to-br from-secondary-100 to-secondary-200 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🔋</span>
                </div>
                <p className="text-sm text-secondary-600">演示图像</p>
              </div>
            </div>
            
            {/* 悬停效果 */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">👁️</span>
                </div>
                <span className="text-white text-sm font-medium">查看详情</span>
              </div>
            </div>
          </div>

          {/* 内容区域 */}
          <div className="card-body">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors duration-200">
                {demo.title}
              </h3>
              <span className={`badge ${
                demo.category === 'normal' ? 'badge-success' :
                demo.category === 'leaves' ? 'badge-warning' :
                demo.category === 'dust' ? 'badge-secondary' :
                demo.category === 'shadow' ? 'badge-primary' :
                'badge-error'
              }`}>
                {demo.category === 'normal' ? '正常' :
                 demo.category === 'leaves' ? '树叶' :
                 demo.category === 'dust' ? '灰尘' :
                 demo.category === 'shadow' ? '阴影' :
                 '其他'}
              </span>
            </div>

            <p className="text-secondary-600 text-sm mb-4 line-clamp-2">
              {demo.description}
            </p>

            {/* 预期结果预览 */}
            <div className="mb-4">
              <div className="text-xs text-secondary-500 mb-2">预期检测结果:</div>
              <div className="flex flex-wrap gap-1">
                {demo.expectedResults.slice(0, 3).map((result, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-1 bg-secondary-100 text-secondary-700 rounded-full"
                  >
                    {result.category} ({Math.round(result.confidence * 100)}%)
                  </span>
                ))}
                {demo.expectedResults.length > 3 && (
                  <span className="text-xs px-2 py-1 bg-secondary-100 text-secondary-700 rounded-full">
                    +{demo.expectedResults.length - 3}
                  </span>
                )}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center justify-between">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRunDemo(demo);
                }}
                className="btn btn-primary btn-sm flex items-center space-x-2"
              >
                <span>运行演示</span>
                <span>▶️</span>
              </button>
              
              <div className="flex items-center space-x-2 text-xs text-secondary-500">
                <span>👁️ {demo.expectedResults.length}</span>
                <span>•</span>
                <span>⚡ 95%</span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

