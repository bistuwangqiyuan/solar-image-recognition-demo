import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, FileImage, AlertCircle } from 'lucide-react';
import { UploadComponentProps, ApiError, ErrorType } from '@/types';

export const UploadComponent: React.FC<UploadComponentProps> = ({
  onUpload,
  onError,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  disabled = false,
  className = '',
}) => {
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
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
      onUpload(file);
    }
  }, [onUpload, onError, maxSize]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxSize,
    multiple: false,
    disabled,
  });

  const getDropzoneClassName = () => {
    let baseClass = 'relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer';
    
    if (disabled) {
      baseClass += ' opacity-50 cursor-not-allowed';
    } else if (isDragReject) {
      baseClass += ' border-error-500 bg-error-50 text-error-600';
    } else if (isDragActive) {
      baseClass += ' border-primary-500 bg-primary-50 text-primary-600';
    } else {
      baseClass += ' border-secondary-300 bg-white hover:border-primary-400 hover:bg-primary-50';
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
            <AlertCircle className="w-12 h-12 text-error-500" />
          ) : (
            <motion.div
              animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Upload className="w-12 h-12 text-primary-500" />
            </motion.div>
          )}
        </div>

        {/* 文本内容 */}
        <div className="space-y-2">
          {isDragReject ? (
            <>
              <h3 className="text-lg font-semibold text-error-600">
                文件格式不支持
              </h3>
              <p className="text-sm text-error-500">
                请选择JPG、PNG或WEBP格式的图片文件
              </p>
            </>
          ) : isDragActive ? (
            <>
              <h3 className="text-lg font-semibold text-primary-600">
                释放文件开始上传
              </h3>
              <p className="text-sm text-primary-500">
                拖拽文件到此处即可上传
              </p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-secondary-900">
                拖拽文件到此处
              </h3>
              <p className="text-sm text-secondary-600">
                或者 <span className="text-primary-600 font-medium">点击选择文件</span>
              </p>
            </>
          )}
        </div>

        {/* 文件信息 */}
        <div className="text-xs text-secondary-500 space-y-1">
          <div className="flex items-center justify-center space-x-2">
            <FileImage className="w-3 h-3" />
            <span>支持 JPG、PNG、WEBP 格式</span>
          </div>
          <div>最大文件大小：{Math.round(maxSize / 1024 / 1024)}MB</div>
        </div>
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

