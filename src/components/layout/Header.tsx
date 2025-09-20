import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  Zap, 
  Upload, 
  BarChart3, 
  PlayCircle,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import { AIModelStatusIndicator } from '@/contexts/AIModelContext';

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('light');
  const location = useLocation();

  const navigation = [
    { name: '首页', href: '/', icon: Zap },
    { name: '上传分析', href: '/upload', icon: Upload },
    { name: '演示', href: '/demo', icon: PlayCircle },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleTheme = () => {
    const themes: ('light' | 'dark' | 'auto')[] = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return Sun;
      case 'dark':
        return Moon;
      case 'auto':
        return Monitor;
      default:
        return Sun;
    }
  };

  const ThemeIcon = getThemeIcon();

  return (
    <header className="bg-white shadow-industrial border-b border-secondary-200 sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-colors duration-200"
          >
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient">
              光伏识别系统
            </span>
          </Link>

          {/* 桌面导航 */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* 右侧操作区 */}
          <div className="flex items-center space-x-4">
            {/* AI模型状态 */}
            <div className="hidden lg:block">
              <AIModelStatusIndicator />
            </div>

            {/* 主题切换 */}
            <button
              onClick={toggleTheme}
              className="p-2 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded-lg transition-all duration-200"
              title={`当前主题: ${theme === 'light' ? '浅色' : theme === 'dark' ? '深色' : '自动'}`}
            >
              <ThemeIcon className="w-5 h-5" />
            </button>

            {/* 移动端菜单按钮 */}
            <button
              onClick={toggleMenu}
              className="md:hidden p-2 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded-lg transition-all duration-200"
              aria-label="切换菜单"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* 移动端导航菜单 */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-secondary-200 bg-white"
            >
              <nav className="py-4 space-y-2">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  const Icon = item.icon;
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

