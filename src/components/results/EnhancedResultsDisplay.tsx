import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Share2, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Info,
  X
} from 'lucide-react';
import { DetectionResult, AnalysisResult, PanelCondition, Severity } from '@/types';
import toast from 'react-hot-toast';

interface EnhancedResultsDisplayProps {
  result: AnalysisResult;
  imageUrl: string;
  onExport?: () => void;
  onRetry?: () => void;
  className?: string;
}

export const EnhancedResultsDisplay: React.FC<EnhancedResultsDisplayProps> = ({
  result,
  imageUrl,
  onExport,
  onRetry,
  className = '',
}) => {
  const [selectedResult, setSelectedResult] = useState<DetectionResult | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 绘制边界框
  const drawBoundingBoxes = () => {
    if (!imageRef.current || !canvasRef.current || !showBoundingBoxes) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    if (!ctx || !img) return;

    // 设置画布尺寸
    canvas.width = img.offsetWidth;
    canvas.height = img.offsetHeight;

    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制边界框
    result.results.forEach((detection, index) => {
      const { boundingBox, category, confidence, severity } = detection;
      
      // 计算缩放后的坐标
      const x = (boundingBox.x / img.naturalWidth) * img.offsetWidth;
      const y = (boundingBox.y / img.naturalHeight) * img.offsetHeight;
      const width = (boundingBox.width / img.naturalWidth) * img.offsetWidth;
      const height = (boundingBox.height / img.naturalHeight) * img.offsetHeight;

      // 设置颜色
      let color = '#10B981'; // 默认绿色
      if (severity === Severity.HIGH) color = '#EF4444';
      else if (severity === Severity.MEDIUM) color = '#F59E0B';
      else if (severity === Severity.LOW) color = '#10B981';

      // 绘制边界框
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      // 绘制标签背景
      const labelText = `${category} (${(confidence * 100).toFixed(1)}%)`;
      const textMetrics = ctx.measureText(labelText);
      const labelWidth = textMetrics.width + 16;
      const labelHeight = 24;

      ctx.fillStyle = color;
      ctx.fillRect(x, y - labelHeight, labelWidth, labelHeight);

      // 绘制标签文字
      ctx.fillStyle = 'white';
      ctx.font = '12px sans-serif';
      ctx.fillText(labelText, x + 8, y - 6);

      // 如果是选中的结果，高亮显示
      if (selectedResult === detection) {
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 3;
        ctx.strokeRect(x - 2, y - 2, width + 4, height + 4);
      }
    });
  };

  // 图像加载完成后绘制边界框
  React.useEffect(() => {
    if (imageLoaded) {
      drawBoundingBoxes();
    }
  }, [imageLoaded, showBoundingBoxes, selectedResult, result.results]);

  // 处理图像点击
  const handleImageClick = (event: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // 查找点击的检测结果
    const clickedResult = result.results.find(detection => {
      const img = imageRef.current!;
      const boxX = (detection.boundingBox.x / img.naturalWidth) * img.offsetWidth;
      const boxY = (detection.boundingBox.y / img.naturalHeight) * img.offsetHeight;
      const boxWidth = (detection.boundingBox.width / img.naturalWidth) * img.offsetWidth;
      const boxHeight = (detection.boundingBox.height / img.naturalHeight) * img.offsetHeight;

      return x >= boxX && x <= boxX + boxWidth && y >= boxY && y <= boxY + boxHeight;
    });

    setSelectedResult(clickedResult || null);
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-success-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning-600" />;
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-error-600" />;
      default:
        return <Info className="w-5 h-5 text-secondary-600" />;
    }
  };

  // 获取严重程度颜色
  const getSeverityColor = (severity: Severity) => {
    switch (severity) {
      case Severity.HIGH:
        return 'text-error-600 bg-error-50 border-error-200';
      case Severity.MEDIUM:
        return 'text-warning-600 bg-warning-50 border-warning-200';
      case Severity.LOW:
        return 'text-success-600 bg-success-50 border-success-200';
      default:
        return 'text-secondary-600 bg-secondary-50 border-secondary-200';
    }
  };

  // 导出报告
  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      toast.success('报告导出功能开发中...');
    }
  };

  // 分享结果
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '光伏板分析结果',
          text: `检测到${result.summary.totalIssues}个问题，整体状态：${result.summary.overallStatus}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('分享失败:', error);
      }
    } else {
      // 复制链接到剪贴板
      navigator.clipboard.writeText(window.location.href);
      toast.success('链接已复制到剪贴板');
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 分析摘要 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="card-header">
          <div className="flex items-center space-x-3">
            {getStatusIcon(result.summary.overallStatus)}
            <h3 className="text-lg font-semibold text-secondary-900">
              分析摘要
            </h3>
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary-900">
                {result.summary.totalIssues}
              </div>
              <div className="text-sm text-secondary-600">检测问题</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary-900">
                {(result.summary.confidence * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-secondary-600">平均置信度</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary-900">
                {result.summary.processingTime}ms
              </div>
              <div className="text-sm text-secondary-600">处理时间</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                result.summary.overallStatus === 'healthy' ? 'text-success-600' :
                result.summary.overallStatus === 'warning' ? 'text-warning-600' :
                'text-error-600'
              }`}>
                {result.summary.overallStatus === 'healthy' ? '良好' :
                 result.summary.overallStatus === 'warning' ? '警告' : '严重'}
              </div>
              <div className="text-sm text-secondary-600">整体状态</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 图像和检测结果 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 图像显示区域 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card"
        >
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-secondary-900">
                检测结果可视化
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    showBoundingBoxes 
                      ? 'bg-primary-100 text-primary-600' 
                      : 'bg-secondary-100 text-secondary-600'
                  }`}
                  title={showBoundingBoxes ? '隐藏边界框' : '显示边界框'}
                >
                  {showBoundingBoxes ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                  className="p-2 bg-secondary-100 text-secondary-600 rounded-lg hover:bg-secondary-200 transition-colors duration-200"
                  title="缩小"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-sm text-secondary-600 min-w-[3rem] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                  className="p-2 bg-secondary-100 text-secondary-600 rounded-lg hover:bg-secondary-200 transition-colors duration-200"
                  title="放大"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setRotation((rotation + 90) % 360)}
                  className="p-2 bg-secondary-100 text-secondary-600 rounded-lg hover:bg-secondary-200 transition-colors duration-200"
                  title="旋转"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowFullscreen(!showFullscreen)}
                  className="p-2 bg-secondary-100 text-secondary-600 rounded-lg hover:bg-secondary-200 transition-colors duration-200"
                  title={showFullscreen ? '退出全屏' : '全屏显示'}
                >
                  {showFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <div className="card-body">
            <div className="relative overflow-hidden rounded-lg bg-secondary-100">
              <img
                ref={imageRef}
                src={imageUrl}
                alt="分析图像"
                className={`w-full h-auto transition-all duration-300 ${
                  showFullscreen ? 'max-h-[80vh]' : 'max-h-96'
                }`}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: 'center',
                }}
                onClick={handleImageClick}
                onLoad={() => setImageLoaded(true)}
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none"
                style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
              />
            </div>
          </div>
        </motion.div>

        {/* 检测结果列表 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card"
        >
          <div className="card-header">
            <h3 className="text-lg font-semibold text-secondary-900">
              检测结果详情
            </h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {result.results.map((detection, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    selectedResult === detection
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-secondary-200 bg-white hover:border-secondary-300'
                  }`}
                  onClick={() => setSelectedResult(detection)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(detection.severity)}`}>
                          {detection.severity === Severity.HIGH ? '高' :
                           detection.severity === Severity.MEDIUM ? '中' : '低'}
                        </span>
                        <span className="text-sm font-medium text-secondary-900">
                          {detection.category}
                        </span>
                      </div>
                      <p className="text-sm text-secondary-600 mb-2">
                        {detection.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-secondary-500">
                        <span>置信度: {(detection.confidence * 100).toFixed(1)}%</span>
                        <span>位置: ({detection.boundingBox.x}, {detection.boundingBox.y})</span>
                      </div>
                    </div>
                    {selectedResult === detection && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedResult(null);
                        }}
                        className="p-1 text-secondary-400 hover:text-secondary-600 transition-colors duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* 维护建议 */}
      {result.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="card-header">
            <h3 className="text-lg font-semibold text-secondary-900">
              维护建议
            </h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {result.recommendations.map((recommendation, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-secondary-50 rounded-lg border border-secondary-200"
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      recommendation.priority === 'high' ? 'bg-error-100' :
                      recommendation.priority === 'medium' ? 'bg-warning-100' :
                      'bg-success-100'
                    }`}>
                      <span className={`text-xs font-bold ${
                        recommendation.priority === 'high' ? 'text-error-600' :
                        recommendation.priority === 'medium' ? 'text-warning-600' :
                        'text-success-600'
                      }`}>
                        {recommendation.priority === 'high' ? 'H' :
                         recommendation.priority === 'medium' ? 'M' : 'L'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-secondary-900 font-medium mb-1">
                        {recommendation.description}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-secondary-600">
                        <span>类型: {recommendation.type}</span>
                        {recommendation.estimatedCost && (
                          <span>预估费用: ¥{recommendation.estimatedCost}</span>
                        )}
                        {recommendation.estimatedTime && (
                          <span>预估时间: {recommendation.estimatedTime}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* 操作按钮 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center space-x-4"
      >
        <button
          onClick={handleExport}
          className="btn btn-outline btn-lg flex items-center space-x-2"
        >
          <Download className="w-5 h-5" />
          <span>导出报告</span>
        </button>
        <button
          onClick={handleShare}
          className="btn btn-outline btn-lg flex items-center space-x-2"
        >
          <Share2 className="w-5 h-5" />
          <span>分享结果</span>
        </button>
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn btn-primary btn-lg flex items-center space-x-2"
          >
            <RotateCw className="w-5 h-5" />
            <span>重新分析</span>
          </button>
        )}
      </motion.div>
    </div>
  );
};
