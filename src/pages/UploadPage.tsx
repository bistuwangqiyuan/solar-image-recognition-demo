import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Upload, 
  Camera, 
  FileImage, 
  CheckCircle, 
  AlertCircle,
  X,
  Loader2
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { UploadComponent } from '@/components/upload/UploadComponent';
import { MobileOptimizedUploadComponent, MobileCamera } from '@/components/upload/MobileOptimizedUploadComponent';
import { ImagePreview } from '@/components/upload/ImagePreview';
import { CameraCapture } from '@/components/upload/CameraCapture';
import { uploadService } from '@/services/uploadService';
import { analysisService } from '@/services/analysisService';
import { ApiError, ErrorType } from '@/types';
import { MobileDetector } from '@/utils/mobileAdapter';

export const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [deviceDetector] = useState(() => MobileDetector.getInstance());
  const [deviceInfo, setDeviceInfo] = useState(deviceDetector.getDeviceInfo());

  const handleFileSelect = (file: File) => {
    setUploadedFile(file);
    setError(null);
  };

  const handleFileRemove = () => {
    setUploadedFile(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!uploadedFile) {
      toast.error('请先选择要上传的文件');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // 上传文件
      const uploadResult = await uploadService.uploadFile(uploadedFile);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success('文件上传成功！');

      // 开始分析
      setIsAnalyzing(true);
      
      // 创建图像元素用于客户端AI分析
      const imageElement = new Image();
      imageElement.src = URL.createObjectURL(uploadedFile);
      
      imageElement.onload = async () => {
        try {
          // 使用客户端AI分析
          const analysisResult = await analysisService.analyzeImageWithClientAI(imageElement);
          
          toast.success('分析完成！');
          
          // 跳转到结果页面
          navigate(`/results/${uploadResult.imageId}`);
        } catch (error) {
          console.error('客户端AI分析失败，尝试服务器端分析:', error);
          
          // 如果客户端分析失败，回退到服务器端分析
          try {
            const analysisResult = await analysisService.analyzeImage(uploadResult.imageId);
            toast.success('分析完成！');
            navigate(`/results/${uploadResult.imageId}`);
          } catch (serverError) {
            console.error('服务器端分析也失败:', serverError);
            throw serverError;
          }
        } finally {
          setIsAnalyzing(false);
          setUploadProgress(0);
        }
      };
      
      imageElement.onerror = () => {
        setIsAnalyzing(false);
        setUploadProgress(0);
        toast.error('图像加载失败');
      };
      
    } catch (error) {
      console.error('上传或分析失败:', error);
      
      const apiError = error as ApiError;
      let errorMessage = '上传失败，请重试';
      
      if (apiError.type === ErrorType.FILE_TOO_LARGE) {
        errorMessage = '文件大小超过限制，请选择小于10MB的文件';
      } else if (apiError.type === ErrorType.UNSUPPORTED_FORMAT) {
        errorMessage = '不支持的文件格式，请选择JPG、PNG或WEBP格式的图片';
      } else if (apiError.type === ErrorType.AI_PROCESSING_ERROR) {
        errorMessage = 'AI分析失败，请重试';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCameraCapture = () => {
    setShowCamera(true);
  };

  const handleCameraClose = () => {
    setShowCamera(false);
  };

  const handleCameraCaptureFile = (file: File) => {
    setUploadedFile(file);
    setShowCamera(false);
    setError(null);
    toast.success('照片拍摄成功！');
  };

  return (
    <div className="min-h-screen bg-secondary-50 py-12">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          {/* 页面标题 */}
          <div className="text-center mb-12">
            <h1 className="text-3xl lg:text-4xl font-bold text-secondary-900 mb-4">
              上传光伏板图像
            </h1>
            <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
              上传您的光伏板图像，我们的AI系统将自动识别和分析光伏板的状态
            </p>
          </div>

          {/* 上传区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 左侧：上传组件 */}
            <div className="space-y-6">
              {deviceInfo.isMobile ? (
                <MobileOptimizedUploadComponent
                  onUpload={handleFileSelect}
                  onError={(error) => {
                    setError(error.message);
                    toast.error(error.message);
                  }}
                  disabled={isUploading || isAnalyzing}
                />
              ) : (
                <UploadComponent
                  onUpload={handleFileSelect}
                  onError={(error) => {
                    setError(error.message);
                    toast.error(error.message);
                  }}
                  disabled={isUploading || isAnalyzing}
                />
              )}

              {/* 摄像头拍照 */}
              <div className="card">
                <div className="card-body text-center">
                  <Camera className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                    摄像头拍照
                  </h3>
                  <p className="text-secondary-600 mb-4">
                    使用设备摄像头直接拍摄光伏板图像
                  </p>
                  <button
                    onClick={handleCameraCapture}
                    disabled={isUploading || isAnalyzing}
                    className="btn btn-outline btn-md w-full"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    打开摄像头
                  </button>
                </div>
              </div>
            </div>

            {/* 右侧：预览和操作 */}
            <div className="space-y-6">
              {/* 文件预览 */}
              {uploadedFile && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <ImagePreview
                    file={uploadedFile}
                    onRemove={handleFileRemove}
                    disabled={isUploading || isAnalyzing}
                  />
                </motion.div>
              )}

              {/* 上传进度 */}
              {isUploading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="card"
                >
                  <div className="card-body">
                    <div className="flex items-center space-x-3 mb-4">
                      <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
                      <span className="font-medium text-secondary-900">
                        正在上传文件...
                      </span>
                    </div>
                    <div className="w-full bg-secondary-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-secondary-600 mt-2">
                      {uploadProgress}% 完成
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 分析进度 */}
              {isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="card"
                >
                  <div className="card-body">
                    <div className="flex items-center space-x-3 mb-4">
                      <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
                      <span className="font-medium text-secondary-900">
                        AI正在分析图像...
                      </span>
                    </div>
                    <div className="w-full bg-secondary-200 rounded-full h-2">
                      <div className="bg-primary-600 h-2 rounded-full animate-pulse"></div>
                    </div>
                    <div className="text-sm text-secondary-600 mt-2">
                      预计需要30秒
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 错误提示 */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="card border-error-200 bg-error-50"
                >
                  <div className="card-body">
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="w-5 h-5 text-error-600" />
                      <span className="text-error-800">{error}</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 操作按钮 */}
              <div className="space-y-4">
                <button
                  onClick={handleUpload}
                  disabled={!uploadedFile || isUploading || isAnalyzing}
                  className="btn btn-primary btn-lg w-full flex items-center justify-center space-x-2"
                >
                  {isUploading || isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{isUploading ? '上传中...' : '分析中...'}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      <span>开始分析</span>
                    </>
                  )}
                </button>

                <div className="text-center">
                  <p className="text-sm text-secondary-600 mb-2">
                    支持的文件格式：JPG、PNG、WEBP
                  </p>
                  <p className="text-sm text-secondary-500">
                    最大文件大小：10MB
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 使用说明 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-16"
          >
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-secondary-900">
                  使用说明
                </h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <FileImage className="w-6 h-6 text-primary-600" />
                    </div>
                    <h4 className="font-medium text-secondary-900 mb-2">
                      1. 选择图像
                    </h4>
                    <p className="text-sm text-secondary-600">
                      上传清晰的光伏板图像，支持拖拽上传
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Upload className="w-6 h-6 text-success-600" />
                    </div>
                    <h4 className="font-medium text-secondary-900 mb-2">
                      2. 上传分析
                    </h4>
                    <p className="text-sm text-secondary-600">
                      系统自动上传并启动AI分析流程
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-6 h-6 text-warning-600" />
                    </div>
                    <h4 className="font-medium text-secondary-900 mb-2">
                      3. 查看结果
                    </h4>
                    <p className="text-sm text-secondary-600">
                      获得详细的分析报告和维护建议
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* 摄像头拍照组件 */}
      {showCamera && (
        deviceInfo.isMobile ? (
          <MobileCamera
            onCapture={handleCameraCaptureFile}
            onClose={handleCameraClose}
          />
        ) : (
          <CameraCapture
            onCapture={handleCameraCaptureFile}
            onClose={handleCameraClose}
          />
        )
      )}
    </div>
  );
};

