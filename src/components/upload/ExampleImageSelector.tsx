import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ImageIcon,
  ChevronDown,
  ChevronUp,
  Check,
  Loader2,
} from 'lucide-react';
import { solarSamples, SolarSample } from '@/data/solarSamples';

interface ExampleImageSelectorProps {
  onSelect: (file: File) => void;
  disabled?: boolean;
}

export const ExampleImageSelector: React.FC<ExampleImageSelectorProps> = ({
  onSelect,
  disabled = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = async (sample: SolarSample) => {
    if (disabled || loadingId) return;

    setLoadingId(sample.id);
    try {
      const response = await fetch(sample.imageUrl);
      const blob = await response.blob();

      const ext = sample.imageUrl.split('.').pop() || 'png';
      const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
      const fileName = `${sample.id}.${ext}`;

      const file = new File([blob], fileName, { type: mimeType });
      setSelectedId(sample.id);
      onSelect(file);
    } catch (err) {
      console.error('加载示例图片失败:', err);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="card">
      <div
        className="card-body cursor-pointer select-none"
        onClick={() => !disabled && setExpanded(e => !e)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-secondary-900">
                示例图片
              </h3>
              <p className="text-sm text-secondary-500">
                选择预置的光伏板图片进行识别
              </p>
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-secondary-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-secondary-400" />
          )}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6">
              <div className="grid grid-cols-2 gap-3">
                {solarSamples.map(sample => {
                  const isSelected = selectedId === sample.id;
                  const isLoading = loadingId === sample.id;
                  return (
                    <button
                      key={sample.id}
                      onClick={e => {
                        e.stopPropagation();
                        handleSelect(sample);
                      }}
                      disabled={disabled || isLoading}
                      className={`relative group rounded-lg overflow-hidden border-2 transition-all duration-200 text-left ${
                        isSelected
                          ? 'border-primary-500 ring-2 ring-primary-200'
                          : 'border-secondary-200 hover:border-primary-300'
                      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="aspect-[4/3] bg-secondary-100 relative">
                        <img
                          src={sample.imageUrl}
                          alt={sample.name}
                          className="w-full h-full object-cover"
                        />
                        {isLoading && (
                          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          </div>
                        )}
                        {isSelected && !isLoading && (
                          <div className="absolute top-2 right-2">
                            <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium text-secondary-900 truncate">
                          {sample.name}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
