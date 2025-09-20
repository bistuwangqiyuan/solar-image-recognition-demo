import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, FileImage, Download, Eye } from 'lucide-react';

interface ImagePreviewProps {
  file: File;
  onRemove: () => void;
  disabled?: boolean;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  file,
  onRemove,
  disabled = false,
}) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showFullscreen, setShowFullscreen] = useState(false);

  // 创建图片预览URL
  React.useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setIsLoading(false);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatFileType = (type: string): string => {
    const typeMap: { [key: string]: string } = {
      'image/jpeg': 'JPEG',
      'image/jpg': 'JPG',
      'image/png': 'PNG',
      'image/webp': 'WebP',
    };
    return typeMap[type] || type;
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="card"
      >
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileImage className="w-5 h-5 text-primary-600" />
              <span className="font-medium text-secondary-900">文件预览</span>
            </div>
            {!disabled && (
              <button
                onClick={onRemove}
                className="p-1 text-secondary-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-all duration-200"
                title="移除文件"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="card-body">
          {/* 图片预览 */}
          <div className="relative mb-4">
            {isLoading ? (
              <div className="aspect-video bg-secondary-100 rounded-lg flex items-center justify-center">
                <div className="loading-spinner w-8 h-8"></div>
              </div>
            ) : (
              <div className="relative group">
                <img
                  src={imageUrl}
                  alt="预览图片"
                  className="w-full h-48 object-cover rounded-lg border border-secondary-200"
                />
                
                {/* 悬停操作按钮 */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center space-x-2">
                  <button
                    onClick={() => setShowFullscreen(true)}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors duration-200"
                    title="查看大图"
                  >
                    <Eye className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={handleDownload}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors duration-200"
                    title="下载图片"
                  >
                    <Download className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 文件信息 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-secondary-600">文件名</span>
              <span className="font-medium text-secondary-900 truncate max-w-48" title={file.name}>
                {file.name}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-secondary-600">文件类型</span>
              <span className="font-medium text-secondary-900">
                {formatFileType(file.type)}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-secondary-600">文件大小</span>
              <span className="font-medium text-secondary-900">
                {formatFileSize(file.size)}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-secondary-600">最后修改</span>
              <span className="font-medium text-secondary-900">
                {new Date(file.lastModified).toLocaleString('zh-CN')}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 全屏预览模态框 */}
      {showFullscreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowFullscreen(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="relative max-w-4xl max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={imageUrl}
              alt="全屏预览"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            
            <button
              onClick={() => setShowFullscreen(false)}
              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

