import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ResultsDisplay } from '@/components/results/ResultsDisplay';
import { AnalysisSummary } from '@/components/results/AnalysisSummary';
import { DetectionResults } from '@/components/results/DetectionResults';
import { Recommendations } from '@/components/results/Recommendations';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { analysisService } from '@/services/analysisService';
import { uploadService } from '@/services/uploadService';
import { AnalysisResult, ApiError, ErrorType } from '@/types';

export const ResultsPage: React.FC = () => {
  const { imageId } = useParams<{ imageId: string }>();
  const navigate = useNavigate();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (imageId) {
      loadAnalysisResult();
    }
  }, [imageId]);

  const loadAnalysisResult = async () => {
    if (!imageId) return;

    setIsLoading(true);
    setError(null);

    try {
      // 这里应该从实际的分析结果中获取数据
      // 目前使用模拟数据
      const mockResult: AnalysisResult = {
        imageId,
        results: [
          {
            category: 'normal' as any,
            confidence: 0.95,
            boundingBox: { x: 50, y: 50, width: 200, height: 150 },
            description: '正常光伏板区域',
            severity: 'low' as any,
          },
          {
            category: 'leaves' as any,
            confidence: 0.82,
            boundingBox: { x: 300, y: 100, width: 80, height: 60 },
            description: '检测到树叶遮挡',
            severity: 'medium' as any,
          },
          {
            category: 'dust' as any,
            confidence: 0.75,
            boundingBox: { x: 150, y: 200, width: 120, height: 90 },
            description: '检测到灰尘覆盖',
            severity: 'medium' as any,
          },
        ],
        summary: {
          overallStatus: 'warning',
          totalIssues: 2,
          processingTime: 3500,
          confidence: 0.84,
        },
        recommendations: [
          {
            type: 'cleaning',
            priority: 'medium' as any,
            description: '建议清理光伏板表面的树叶遮挡，以提高发电效率',
            estimatedCost: 200,
            estimatedTime: '2-4小时',
          },
          {
            type: 'cleaning',
            priority: 'medium' as any,
            description: '建议清洁光伏板表面的灰尘，定期维护可提高发电效率15-20%',
            estimatedCost: 150,
            estimatedTime: '1-2小时',
          },
        ],
        createdAt: new Date(),
      };

      setAnalysisResult(mockResult);
      setImageUrl(`/uploads/${imageId}.jpg`); // 模拟图片URL
      
    } catch (error) {
      console.error('加载分析结果失败:', error);
      const apiError = error as ApiError;
      setError(apiError.message || '加载分析结果失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async () => {
    if (!imageId) return;

    setIsRetrying(true);
    try {
      await analysisService.analyzeImage(imageId);
      await loadAnalysisResult();
      toast.success('重新分析完成！');
    } catch (error) {
      console.error('重新分析失败:', error);
      toast.error('重新分析失败，请重试');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleExport = () => {
    // 实现导出功能
    toast.success('报告导出功能正在开发中...');
  };

  const handleShare = () => {
    // 实现分享功能
    if (navigator.share) {
      navigator.share({
        title: '光伏板分析结果',
        text: '查看我的光伏板分析结果',
        url: window.location.href,
      });
    } else {
      // 复制链接到剪贴板
      navigator.clipboard.writeText(window.location.href);
      toast.success('链接已复制到剪贴板');
    }
  };

  const handleGoBack = () => {
    navigate('/upload');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <LoadingSpinner size="xl" text="加载分析结果中..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-secondary-50 py-12">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto">
            <div className="card border-error-200 bg-error-50">
              <div className="card-body text-center">
                <AlertCircle className="w-16 h-16 text-error-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-error-800 mb-2">
                  加载失败
                </h2>
                <p className="text-error-600 mb-6">{error}</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleRetry}
                    disabled={isRetrying}
                    className="btn btn-error btn-md flex items-center justify-center space-x-2"
                  >
                    {isRetrying ? (
                      <LoadingSpinner size="sm" color="white" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    <span>重试</span>
                  </button>
                  <button
                    onClick={handleGoBack}
                    className="btn btn-outline btn-md"
                  >
                    返回上传
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analysisResult) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-secondary-600 mb-2">
            未找到分析结果
          </h2>
          <p className="text-secondary-500 mb-6">
            请检查链接是否正确，或重新进行分析
          </p>
          <button
            onClick={handleGoBack}
            className="btn btn-primary btn-md"
          >
            返回上传
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50 py-8">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          {/* 页面头部 */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleGoBack}
                className="btn btn-ghost btn-md flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>返回</span>
              </button>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-secondary-900">
                  分析结果
                </h1>
                <p className="text-secondary-600">
                  图像ID: {imageId}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="btn btn-outline btn-md flex items-center space-x-2"
              >
                {isRetrying ? (
                  <LoadingSpinner size="sm" color="primary" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>重新分析</span>
              </button>
              
              <button
                onClick={handleExport}
                className="btn btn-outline btn-md flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>导出报告</span>
              </button>
              
              <button
                onClick={handleShare}
                className="btn btn-outline btn-md flex items-center space-x-2"
              >
                <Share2 className="w-4 h-4" />
                <span>分享</span>
              </button>
            </div>
          </div>

          {/* 主要内容区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 左侧：图像和标注 */}
            <div className="lg:col-span-2 space-y-6">
              <ResultsDisplay
                result={analysisResult}
                imageUrl={imageUrl}
                onExport={handleExport}
                onRetry={handleRetry}
              />
            </div>

            {/* 右侧：分析摘要和详细信息 */}
            <div className="space-y-6">
              <AnalysisSummary summary={analysisResult.summary} />
              
              <DetectionResults results={analysisResult.results} />
              
              <Recommendations recommendations={analysisResult.recommendations} />
            </div>
          </div>

          {/* 底部信息 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-12"
          >
            <div className="card">
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <Clock className="w-5 h-5 text-primary-600" />
                    <div>
                      <div className="font-semibold text-secondary-900">
                        {analysisResult.summary.processingTime}ms
                      </div>
                      <div className="text-sm text-secondary-600">处理时间</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-success-600" />
                    <div>
                      <div className="font-semibold text-secondary-900">
                        {Math.round(analysisResult.summary.confidence * 100)}%
                      </div>
                      <div className="text-sm text-secondary-600">识别置信度</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-warning-600" />
                    <div>
                      <div className="font-semibold text-secondary-900">
                        {analysisResult.results.length}
                      </div>
                      <div className="text-sm text-secondary-600">检测区域</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

