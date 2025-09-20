import React, { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, FileImage, AlertCircle, Camera, X } from 'lucide-react';
import { UploadComponentProps, ApiError, ErrorType } from '@/types';
import { MobileDetector, TouchGestureHandler } from '@/utils/mobileAdapter';
import { ImageOptimizer } from '@/utils/performanceOptimizer';
import toast from 'react-hot-toast';

export const MobileOptimizedUploadComponent: React.FC<UploadComponentProps> = ({
  onUpload,
  onError,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  disabled = false,
  className = '',
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [deviceDetector] = useState(() => MobileDetector.getInstance());
  const [deviceInfo, setDeviceInfo] = useState(deviceDetector.getDeviceInfo());

  // 更新设备信息
  useEffect(() => {
    const updateDeviceInfo = () => {
      setDeviceInfo(deviceDetector.getDeviceInfo());
    };

    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, [deviceDetector]);

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    // 处理被拒绝的文件
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      let errorMessage = '文件上传失败';
      
      if (rejection.errors[0]?.code === 'file-too-large') {
        errorMessage = `文件大小超过限制，最大支持 ${Math.round(maxSize / 1024 / 1024)}MB`;
        onError({
          type: ErrorType.FILE_TOO_LARGE,
          message: errorMessage,
          retryable: false,
        });
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        errorMessage = '不支持的文件格式，请选择JPG、PNG或WEBP格式的图片';
        onError({
          type: ErrorType.UNSUPPORTED_FORMAT,
          message: errorMessage,
          retryable: false,
        });
      } else {
        onError({
          type: ErrorType.UPLOAD_ERROR,
          message: errorMessage,
          retryable: true,
        });
      }
      return;
    }

    // 处理接受的文件
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setIsProcessing(true);

      try {
        // 移动端优化：压缩图像
        let optimizedFile = file;
        if (deviceInfo.isMobile) {
          optimizedFile = await ImageOptimizer.optimizeImage(file);
          toast.success('图像已优化');
        }

        onUpload(optimizedFile);
      } catch (error) {
        console.error('图像优化失败:', error);
        onError({
          type: ErrorType.UPLOAD_ERROR,
          message: '图像处理失败，请重试',
          retryable: true,
        });
      } finally {
        setIsProcessing(false);
      }
    }
  }, [onUpload, onError, maxSize, deviceInfo.isMobile]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxSize,
    multiple: false,
    disabled: disabled || isProcessing,
  });

  const getDropzoneClassName = () => {
    let baseClass = 'relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer';
    
    if (disabled || isProcessing) {
      baseClass += ' opacity-50 cursor-not-allowed';
    } else if (isDragReject) {
      baseClass += ' border-error-500 bg-error-50 text-error-600';
    } else if (isDragActive) {
      baseClass += ' border-primary-500 bg-primary-50 text-primary-600';
    } else {
      baseClass += ' border-secondary-300 bg-white hover:border-primary-400 hover:bg-primary-50';
    }
    
    // 移动端优化
    if (deviceInfo.isMobile) {
      baseClass += ' min-h-[200px] touch-target';
    }
    
    return `${baseClass} ${className}`;
  };

  return (
    <div {...getRootProps()} className={getDropzoneClassName()}>
      <input {...getInputProps()} />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        {/* 图标 */}
        <div className="flex justify-center">
          {isDragReject ? (
            <AlertCircle className={`text-error-500 ${deviceInfo.isMobile ? 'w-16 h-16' : 'w-12 h-12'}`} />
          ) : (
            <motion.div
              animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Upload className={`text-primary-500 ${deviceInfo.isMobile ? 'w-16 h-16' : 'w-12 h-12'}`} />
            </motion.div>
          )}
        </div>

        {/* 文本内容 */}
        <div className="space-y-2">
          {isDragReject ? (
            <>
              <h3 className={`font-semibold text-error-600 ${deviceInfo.isMobile ? 'text-xl' : 'text-lg'}`}>
                文件格式不支持
              </h3>
              <p className={`text-error-500 ${deviceInfo.isMobile ? 'text-base' : 'text-sm'}`}>
                请选择JPG、PNG或WEBP格式的图片文件
              </p>
            </>
          ) : isDragActive ? (
            <>
              <h3 className={`font-semibold text-primary-600 ${deviceInfo.isMobile ? 'text-xl' : 'text-lg'}`}>
                释放文件开始上传
              </h3>
              <p className={`text-primary-500 ${deviceInfo.isMobile ? 'text-base' : 'text-sm'}`}>
                拖拽文件到此处即可上传
              </p>
            </>
          ) : (
            <>
              <h3 className={`font-semibold text-secondary-900 ${deviceInfo.isMobile ? 'text-xl' : 'text-lg'}`}>
                {deviceInfo.isMobile ? '点击选择图片' : '拖拽文件到此处'}
              </h3>
              <p className={`text-secondary-600 ${deviceInfo.isMobile ? 'text-base' : 'text-sm'}`}>
                {deviceInfo.isMobile ? '或使用摄像头拍照' : '或者 点击选择文件'}
              </p>
            </>
          )}
        </div>

        {/* 文件信息 */}
        <div className={`text-secondary-500 space-y-1 ${deviceInfo.isMobile ? 'text-sm' : 'text-xs'}`}>
          <div className="flex items-center justify-center space-x-2">
            <FileImage className="w-3 h-3" />
            <span>支持 JPG、PNG、WEBP 格式</span>
          </div>
          <div>最大文件大小：{Math.round(maxSize / 1024 / 1024)}MB</div>
          {deviceInfo.isMobile && (
            <div className="text-primary-600 font-medium">
              移动端已自动优化图像质量
            </div>
          )}
        </div>

        {/* 处理状态 */}
        {isProcessing && (
          <div className="flex items-center justify-center space-x-2 text-primary-600">
            <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">正在优化图像...</span>
          </div>
        )}
      </motion.div>

      {/* 拖拽状态指示器 */}
      {isDragActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-primary-100/50 rounded-xl pointer-events-none"
        />
      )}
    </div>
  );
};

// 移动端摄像头组件
interface MobileCameraProps {
  onCapture: (file: File) => void;
  onClose: () => void;
  className?: string;
}

export const MobileCamera: React.FC<MobileCameraProps> = ({
  onCapture,
  onClose,
  className = '',
}) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  // 启动摄像头
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
        setHasPermission(true);
      }
    } catch (err) {
      console.error('摄像头启动失败:', err);
      setHasPermission(false);
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('摄像头权限被拒绝，请在浏览器设置中允许摄像头访问');
        } else if (err.name === 'NotFoundError') {
          setError('未找到摄像头设备');
        } else if (err.name === 'NotSupportedError') {
          setError('当前浏览器不支持摄像头功能');
        } else {
          setError('摄像头启动失败，请检查设备连接');
        }
      } else {
        setError('摄像头启动失败');
      }
    }
  }, [facingMode]);

  // 停止摄像头
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  // 拍照
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error('摄像头未就绪');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      toast.error('无法获取画布上下文');
      return;
    }

    // 设置画布尺寸
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 绘制视频帧到画布
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 转换为Blob并优化
    canvas.toBlob(async (blob) => {
      if (blob) {
        try {
          const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
            type: 'image/jpeg',
          });
          
          // 移动端优化
          const optimizedFile = await ImageOptimizer.optimizeImage(file);
          
          onCapture(optimizedFile);
          toast.success('拍照成功！');
        } catch (error) {
          console.error('图像优化失败:', error);
          toast.error('图像处理失败');
        }
      } else {
        toast.error('照片保存失败');
      }
    }, 'image/jpeg', 0.8);
  }, [onCapture]);

  // 切换摄像头
  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  // 组件挂载时启动摄像头
  useEffect(() => {
    startCamera();
    
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // 切换摄像头时重新启动
  useEffect(() => {
    if (isStreaming) {
      stopCamera();
      startCamera();
    }
  }, [facingMode, isStreaming, startCamera, stopCamera]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center ${className}`}
    >
      <div className="relative w-full h-full max-w-4xl max-h-[90vh] bg-black rounded-lg overflow-hidden">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all duration-200 touch-target"
        >
          <X className="w-6 h-6" />
        </button>

        {/* 摄像头状态 */}
        <div className="absolute top-4 left-4 z-10">
          {isStreaming && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center space-x-2 px-3 py-1 bg-green-500 text-white rounded-full text-sm"
            >
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>摄像头已连接</span>
            </motion.div>
          )}
        </div>

        {/* 视频预览 */}
        <div className="relative w-full h-full">
          {isStreaming ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
              {error ? (
                <div className="text-center text-white p-4">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
                  <h3 className="text-xl font-semibold mb-2">摄像头启动失败</h3>
                  <p className="text-gray-300 mb-4">{error}</p>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 touch-target"
                  >
                    重试
                  </button>
                </div>
              ) : (
                <div className="text-center text-white">
                  <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2">正在启动摄像头...</h3>
                  <p className="text-gray-300">请稍候</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 控制按钮 */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
          {/* 切换摄像头 */}
          <button
            onClick={switchCamera}
            disabled={!isStreaming}
            className="p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-target"
            title="切换摄像头"
          >
            <Camera className="w-6 h-6" />
          </button>

          {/* 拍照按钮 */}
          <button
            onClick={capturePhoto}
            disabled={!isStreaming}
            className="p-4 bg-white text-black rounded-full hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg touch-target"
            title="拍照"
          >
            <Camera className="w-8 h-8" />
          </button>
        </div>

        {/* 使用说明 */}
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center text-white">
          <p className="text-sm text-gray-300">
            将光伏板对准摄像头，点击拍照按钮进行拍摄
          </p>
        </div>

        {/* 隐藏的画布用于拍照 */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </motion.div>
  );
};
