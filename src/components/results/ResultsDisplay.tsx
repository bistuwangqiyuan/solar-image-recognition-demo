import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  Share2,
  Eye,
  EyeOff,
  Maximize2
} from 'lucide-react';
import { ResultsDisplayProps, DetectionResult, PanelCondition, Severity } from '@/types';

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  result,
  imageUrl,
  onExport,
  onRetry,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [selectedDetection, setSelectedDetection] = useState<DetectionResult | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const categoryColors = {
    [PanelCondition.NORMAL]: '#22c55e',
    [PanelCondition.LEAVES]: '#f59e0b',
    [PanelCondition.DUST]: '#6b7280',
    [PanelCondition.SHADOW]: '#3b82f6',
    [PanelCondition.OTHER]: '#ef4444',
  };

  const severityColors = {
    [Severity.LOW]: '#22c55e',
    [Severity.MEDIUM]: '#f59e0b',
    [Severity.HIGH]: '#ef4444',
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  const drawAnnotations = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !showAnnotations) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置canvas尺寸
    canvas.width = image.offsetWidth;
    canvas.height = image.offsetHeight;

    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制检测框
    result.results.forEach((detection, index) => {
      const { boundingBox, category, confidence, severity } = detection;
      
      // 计算实际坐标（相对于显示图像）
      const scaleX = image.offsetWidth / image.naturalWidth;
      const scaleY = image.offsetHeight / image.naturalHeight;
      
      const x = boundingBox.x * scaleX;
      const y = boundingBox.y * scaleY;
      const width = boundingBox.width * scaleX;
      const height = boundingBox.height * scaleY;

      // 设置样式
      const color = categoryColors[category] || '#6b7280';
      const isSelected = selectedDetection === detection;
      
      ctx.strokeStyle = color;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.setLineDash(isSelected ? [] : [5, 5]);
      
      // 绘制边界框
      ctx.strokeRect(x, y, width, height);
      
      // 绘制标签背景
      const labelText = `${category} (${Math.round(confidence * 100)}%)`;
      const labelWidth = ctx.measureText(labelText).width + 16;
      const labelHeight = 24;
      
      ctx.fillStyle = color;
      ctx.fillRect(x, y - labelHeight, labelWidth, labelHeight);
      
      // 绘制标签文字
      ctx.fillStyle = 'white';
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText(labelText, x + 8, y - 6);
      
      // 绘制严重程度指示器
      if (severity !== Severity.LOW) {
        const severityColor = severityColors[severity];
        ctx.fillStyle = severityColor;
        ctx.beginPath();
        ctx.arc(x + width - 8, y + 8, 6, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
  };

  useEffect(() => {
    drawAnnotations();
  }, [result.results, showAnnotations, selectedDetection, zoom, rotation]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // 查找点击的检测框
    const clickedDetection = result.results.find(detection => {
      const scaleX = image.offsetWidth / image.naturalWidth;
      const scaleY = image.offsetHeight / image.naturalHeight;
      
      const detectionX = detection.boundingBox.x * scaleX;
      const detectionY = detection.boundingBox.y * scaleY;
      const detectionWidth = detection.boundingBox.width * scaleX;
      const detectionHeight = detection.boundingBox.height * scaleY;
      
      return x >= detectionX && x <= detectionX + detectionWidth &&
             y >= detectionY && y <= detectionY + detectionHeight;
    });

    setSelectedDetection(clickedDetection || null);
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      canvasRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-secondary-900">
            图像分析结果
          </h3>
          
          <div className="flex items-center space-x-2">
            {/* 控制按钮 */}
            <div className="flex items-center space-x-1 bg-secondary-100 rounded-lg p-1">
              <button
                onClick={handleZoomOut}
                className="p-2 text-secondary-600 hover:text-secondary-900 hover:bg-white rounded-md transition-all duration-200"
                title="缩小"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              
              <span className="text-sm font-medium text-secondary-700 px-2">
                {Math.round(zoom * 100)}%
              </span>
              
              <button
                onClick={handleZoomIn}
                className="p-2 text-secondary-600 hover:text-secondary-900 hover:bg-white rounded-md transition-all duration-200"
                title="放大"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              
              <button
                onClick={handleRotate}
                className="p-2 text-secondary-600 hover:text-secondary-900 hover:bg-white rounded-md transition-all duration-200"
                title="旋转"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              
              <button
                onClick={handleReset}
                className="p-2 text-secondary-600 hover:text-secondary-900 hover:bg-white rounded-md transition-all duration-200"
                title="重置"
              >
                <div className="w-4 h-4 border border-current rounded"></div>
              </button>
            </div>

            {/* 显示控制 */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setShowAnnotations(!showAnnotations)}
                className={`p-2 rounded-md transition-all duration-200 ${
                  showAnnotations
                    ? 'text-primary-600 bg-primary-100'
                    : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100'
                }`}
                title={showAnnotations ? '隐藏标注' : '显示标注'}
              >
                {showAnnotations ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              
              <button
                onClick={handleFullscreen}
                className="p-2 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded-md transition-all duration-200"
                title="全屏显示"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card-body">
        {/* 图像显示区域 */}
        <div className="relative overflow-hidden rounded-lg bg-secondary-100">
          <div
            className="relative"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
              transition: 'transform 0.3s ease',
            }}
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt="分析图像"
              className="w-full h-auto max-h-96 object-contain"
              onLoad={drawAnnotations}
            />
            
            {/* 标注画布 */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full cursor-pointer"
              onClick={handleCanvasClick}
            />
          </div>
        </div>

        {/* 选中检测项详情 */}
        {selectedDetection && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-primary-50 rounded-lg border border-primary-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-primary-900 mb-2">
                  {selectedDetection.description}
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-primary-700">类别:</span>
                    <span className="ml-2 font-medium text-primary-900">
                      {selectedDetection.category}
                    </span>
                  </div>
                  <div>
                    <span className="text-primary-700">置信度:</span>
                    <span className="ml-2 font-medium text-primary-900">
                      {Math.round(selectedDetection.confidence * 100)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-primary-700">严重程度:</span>
                    <span className="ml-2 font-medium text-primary-900">
                      {selectedDetection.severity}
                    </span>
                  </div>
                  <div>
                    <span className="text-primary-700">位置:</span>
                    <span className="ml-2 font-medium text-primary-900">
                      ({selectedDetection.boundingBox.x}, {selectedDetection.boundingBox.y})
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setSelectedDetection(null)}
                className="p-1 text-primary-600 hover:text-primary-800 hover:bg-primary-100 rounded-md transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* 图例 */}
        <div className="mt-4 p-4 bg-secondary-50 rounded-lg">
          <h4 className="font-medium text-secondary-900 mb-3">图例说明</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(categoryColors).map(([category, color]) => (
              <div key={category} className="flex items-center space-x-2">
                <div
                  className="w-4 h-4 rounded border-2 border-white shadow-sm"
                  style={{ backgroundColor: color }}
                ></div>
                <span className="text-sm text-secondary-700 capitalize">
                  {category}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

