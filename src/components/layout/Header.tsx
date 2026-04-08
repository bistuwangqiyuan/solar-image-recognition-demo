import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  Zap,
  Upload,
  PlayCircle,
  Image as ImageIcon,
  Info,
  Github,
  Download,
  ExternalLink,
  Code2,
  ChevronDown,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { AIModelStatusIndicator } from '@/contexts/AIModelContext';

const GITHUB_REPO = 'https://github.com/bistuwangqiyuan/solar-image-recognition-demo';
const GITHUB_ZIP = `${GITHUB_REPO}/archive/refs/heads/master.zip`;

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRepoOpen, setIsRepoOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('light');
  const location = useLocation();
  const repoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (repoRef.current && !repoRef.current.contains(e.target as Node)) {
        setIsRepoOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const navigation = [
    { name: '首页', href: '/', icon: Zap },
    { name: '上传分析', href: '/upload', icon: Upload },
    { name: '图片库', href: '/gallery', icon: ImageIcon },
    { name: '演示', href: '/demo', icon: PlayCircle },
    { name: '关于我们', href: '/about', icon: Info },
  ];

  const toggleTheme = () => {
    const themes: ('light' | 'dark' | 'auto')[] = ['light', 'dark', 'auto'];
    setTheme(prev => themes[(themes.indexOf(prev) + 1) % themes.length]);
  };

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'auto' ? Monitor : Sun;

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
            <span className="text-xl font-bold text-gradient">光伏识别系统</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navigation.map(item => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
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

            {/* 源码仓库 dropdown */}
            <div className="relative" ref={repoRef}>
              <button
                onClick={() => setIsRepoOpen(o => !o)}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 transition-all duration-200"
              >
                <Github className="w-4 h-4" />
                <span>源码仓库</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${isRepoOpen ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {isRepoOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-60 bg-white rounded-lg shadow-lg border border-secondary-200 overflow-hidden z-50"
                  >
                    <div className="px-4 py-2.5 bg-secondary-50 border-b border-secondary-200">
                      <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                        源码与下载
                      </p>
                    </div>
                    <div className="py-1">
                      <a
                        href={GITHUB_REPO}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsRepoOpen(false)}
                        className="flex items-center space-x-3 px-4 py-3 text-sm text-secondary-700 hover:bg-primary-50 hover:text-primary-700 transition-colors duration-150"
                      >
                        <Code2 className="w-4 h-4 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium">GitHub 仓库</div>
                          <div className="text-xs text-secondary-400">查看源码、Star、Fork</div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 text-secondary-400" />
                      </a>
                      <a
                        href={GITHUB_ZIP}
                        onClick={() => setIsRepoOpen(false)}
                        className="flex items-center space-x-3 px-4 py-3 text-sm text-secondary-700 hover:bg-primary-50 hover:text-primary-700 transition-colors duration-150"
                      >
                        <Download className="w-4 h-4 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium">下载源码 (ZIP)</div>
                          <div className="text-xs text-secondary-400">包含全部代码、图片等资源</div>
                        </div>
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* Right section */}
          <div className="flex items-center space-x-3">
            <div className="hidden lg:block">
              <AIModelStatusIndicator />
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded-lg transition-all duration-200"
              title={`当前主题: ${theme === 'light' ? '浅色' : theme === 'dark' ? '深色' : '自动'}`}
            >
              <ThemeIcon className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsMenuOpen(o => !o)}
              className="md:hidden p-2 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded-lg transition-all duration-200"
              aria-label="切换菜单"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-secondary-200 bg-white"
            >
              <nav className="py-4 space-y-1">
                {navigation.map(item => {
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

                <div className="border-t border-secondary-200 pt-2 mt-2 space-y-1">
                  <div className="px-4 py-1">
                    <p className="text-xs font-semibold text-secondary-400 uppercase tracking-wider">
                      源码仓库
                    </p>
                  </div>
                  <a
                    href={GITHUB_REPO}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 transition-all duration-200"
                  >
                    <Github className="w-5 h-5" />
                    <span>GitHub 仓库</span>
                    <ExternalLink className="w-3.5 h-3.5 text-secondary-400" />
                  </a>
                  <a
                    href={GITHUB_ZIP}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 transition-all duration-200"
                  >
                    <Download className="w-5 h-5" />
                    <span>下载源码 (ZIP)</span>
                  </a>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};
