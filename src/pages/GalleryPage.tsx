import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image as ImageIcon,
  ZoomIn,
  X,
  ArrowRight,
  Tag,
  Info,
  Scan,
} from 'lucide-react';
import { solarSamples, SolarSample } from '@/data/solarSamples';

export const GalleryPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<SolarSample | null>(null);

  const handleAnalyze = (sample: SolarSample) => {
    navigate('/upload', { state: { exampleImage: sample } });
  };

  return (
    <div className="min-h-screen bg-secondary-50 py-12">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl lg:text-4xl font-bold text-secondary-900 mb-4">
              典型光伏板图片库
            </h1>
            <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
              真实光伏板图片集合，可直接用于 AI 识别分析
            </p>
          </div>

          {/* Info Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="card mb-8 border-l-4 border-l-primary-500"
          >
            <div className="card-body flex items-start space-x-4">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Info className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-secondary-900 mb-1">
                  关于这些图片
                </h3>
                <p className="text-secondary-600 text-sm">
                  这些图片来源于真实光伏电站现场采集，涵盖不同安装方式、角度和环境条件。
                  您可以点击任意图片查看大图，或直接选择图片进入 AI 识别分析流程。
                </p>
              </div>
            </div>
          </motion.div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {solarSamples.map((sample, index) => (
              <motion.div
                key={sample.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 + index * 0.1 }}
                className="card group hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                {/* Image */}
                <div
                  className="relative aspect-[4/3] bg-secondary-100 cursor-pointer overflow-hidden"
                  onClick={() => setSelectedImage(sample)}
                >
                  <img
                    src={sample.imageUrl}
                    alt={sample.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                    <ZoomIn className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg" />
                  </div>
                </div>

                {/* Content */}
                <div className="card-body">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-secondary-900">
                      {sample.name}
                    </h3>
                    <span className="text-xs text-secondary-500 bg-secondary-100 px-2 py-1 rounded-full flex-shrink-0 ml-2">
                      {sample.source}
                    </span>
                  </div>
                  <p className="text-sm text-secondary-600 mb-4">
                    {sample.description}
                  </p>

                  {/* Tags */}
                  <div className="flex items-center flex-wrap gap-2 mb-4">
                    {sample.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center text-xs px-2 py-1 bg-primary-50 text-primary-700 rounded-full"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Action */}
                  <button
                    onClick={() => handleAnalyze(sample)}
                    className="btn btn-primary btn-md w-full flex items-center justify-center space-x-2"
                  >
                    <Scan className="w-4 h-4" />
                    <span>使用此图片进行 AI 识别</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-12 text-center"
          >
            <div className="card inline-block">
              <div className="card-body text-center px-12">
                <ImageIcon className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                  也可以上传自己的图片
                </h3>
                <p className="text-secondary-600 mb-4">
                  支持 JPG、PNG、WEBP 格式，最大 10MB
                </p>
                <button
                  onClick={() => navigate('/upload')}
                  className="btn btn-outline btn-md"
                >
                  前往上传页面
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-5xl w-full max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 right-0 text-white hover:text-secondary-300 transition-colors"
              >
                <X className="w-8 h-8" />
              </button>
              <img
                src={selectedImage.imageUrl}
                alt={selectedImage.name}
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <h3 className="text-white text-lg font-semibold">
                    {selectedImage.name}
                  </h3>
                  <p className="text-secondary-300 text-sm">
                    {selectedImage.description}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    handleAnalyze(selectedImage);
                  }}
                  className="btn btn-primary btn-md flex items-center space-x-2 flex-shrink-0 ml-4"
                >
                  <Scan className="w-4 h-4" />
                  <span>AI 识别</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
