import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, RotateCcw, Download, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
  className?: string;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  onClose,
  className = '',
}) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  // 切换摄像头
  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  // 拍照
  const capturePhoto = useCallback(() => {
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

    // 转换为Blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });
        
        onCapture(file);
        toast.success('拍照成功！');
      } else {
        toast.error('照片保存失败');
      }
    }, 'image/jpeg', 0.8);
  }, [onCapture]);

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
          className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all duration-200"
        >
          <X className="w-6 h-6" />
        </button>

        {/* 摄像头状态 */}
        <div className="absolute top-4 left-4 z-10">
          <AnimatePresence>
            {isStreaming && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center space-x-2 px-3 py-1 bg-green-500 text-white rounded-full text-sm"
              >
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span>摄像头已连接</span>
              </motion.div>
            )}
          </AnimatePresence>
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
                <div className="text-center text-white">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
                  <h3 className="text-xl font-semibold mb-2">摄像头启动失败</h3>
                  <p className="text-gray-300 mb-4">{error}</p>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
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
            className="p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="切换摄像头"
          >
            <RotateCcw className="w-6 h-6" />
          </button>

          {/* 拍照按钮 */}
          <button
            onClick={capturePhoto}
            disabled={!isStreaming}
            className="p-4 bg-white text-black rounded-full hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            title="拍照"
          >
            <Camera className="w-8 h-8" />
          </button>

          {/* 重新启动 */}
          <button
            onClick={startCamera}
            className="p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all duration-200"
            title="重新启动摄像头"
          >
            <RotateCcw className="w-6 h-6" />
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
