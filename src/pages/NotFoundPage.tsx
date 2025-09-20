import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  ArrowLeft, 
  Search,
  AlertTriangle
} from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-secondary-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* 404图标 */}
          <div className="w-24 h-24 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-12 h-12 text-error-600" />
          </div>

          {/* 错误信息 */}
          <h1 className="text-6xl font-bold text-secondary-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-secondary-700 mb-4">
            页面未找到
          </h2>
          <p className="text-secondary-600 mb-8 leading-relaxed">
            抱歉，您访问的页面不存在或已被移除。
            <br />
            请检查URL是否正确，或返回首页继续浏览。
          </p>

          {/* 操作按钮 */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/"
                className="btn btn-primary btn-lg flex items-center justify-center space-x-2"
              >
                <Home className="w-5 h-5" />
                <span>返回首页</span>
              </Link>
              
              <button
                onClick={() => window.history.back()}
                className="btn btn-outline btn-lg flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>返回上页</span>
              </button>
            </div>

            {/* 快速导航 */}
            <div className="pt-6 border-t border-secondary-200">
              <p className="text-sm text-secondary-600 mb-4">
                或者访问以下页面：
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Link
                  to="/upload"
                  className="btn btn-ghost btn-sm flex items-center space-x-1"
                >
                  <Search className="w-3 h-3" />
                  <span>图像分析</span>
                </Link>
                <Link
                  to="/demo"
                  className="btn btn-ghost btn-sm flex items-center space-x-1"
                >
                  <span>演示展示</span>
                </Link>
              </div>
            </div>
          </div>

          {/* 帮助信息 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-12 p-4 bg-secondary-100 rounded-lg"
          >
            <h3 className="font-medium text-secondary-900 mb-2">
              需要帮助？
            </h3>
            <p className="text-sm text-secondary-600 mb-3">
              如果您认为这是一个错误，请联系我们的技术支持团队
            </p>
            <a
              href="mailto:support@solar-recognition.com"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors duration-200"
            >
              support@solar-recognition.com
            </a>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

