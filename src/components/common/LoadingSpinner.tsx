import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white';
  text?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const colorClasses = {
  primary: 'text-primary-600',
  secondary: 'text-secondary-600',
  white: 'text-white',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  text,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <Loader2 className={`${sizeClasses[size]} ${colorClasses[color]}`} />
      </motion.div>
      
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`text-sm ${colorClasses[color]}`}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

// 全屏加载组件
export const FullScreenLoader: React.FC<{ text?: string }> = ({ text = '加载中...' }) => {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="card p-8">
        <LoadingSpinner size="xl" text={text} />
      </div>
    </div>
  );
};

// 内联加载组件
export const InlineLoader: React.FC<{ text?: string }> = ({ text }) => {
  return (
    <div className="flex items-center justify-center py-8">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
};

// 按钮加载状态
export const ButtonLoader: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'sm' }) => {
  return (
    <LoadingSpinner 
      size={size} 
      color="white" 
      className="inline-flex"
    />
  );
};

