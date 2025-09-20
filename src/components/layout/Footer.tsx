import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Zap, 
  Github, 
  Mail, 
  Phone, 
  MapPin,
  ExternalLink,
  Heart
} from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: '功能特性', href: '/#features' },
      { name: '演示展示', href: '/demo' },
      { name: '技术文档', href: '/docs' },
      { name: 'API接口', href: '/api-docs' },
    ],
    support: [
      { name: '帮助中心', href: '/help' },
      { name: '常见问题', href: '/faq' },
      { name: '联系我们', href: '/contact' },
      { name: '技术支持', href: '/support' },
    ],
    company: [
      { name: '关于我们', href: '/about' },
      { name: '新闻动态', href: '/news' },
      { name: '招聘信息', href: '/careers' },
      { name: '合作伙伴', href: '/partners' },
    ],
    legal: [
      { name: '隐私政策', href: '/privacy' },
      { name: '服务条款', href: '/terms' },
      { name: 'Cookie政策', href: '/cookies' },
      { name: '免责声明', href: '/disclaimer' },
    ],
  };

  const socialLinks = [
    {
      name: 'GitHub',
      href: 'https://github.com/solar-image-recognition',
      icon: Github,
    },
    {
      name: '邮箱',
      href: 'mailto:contact@solar-recognition.com',
      icon: Mail,
    },
    {
      name: '电话',
      href: 'tel:+86-400-123-4567',
      icon: Phone,
    },
  ];

  return (
    <footer className="bg-secondary-900 text-white">
      <div className="container-custom">
        {/* 主要内容区域 */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* 品牌信息 */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">光伏识别系统</span>
            </div>
            
            <p className="text-secondary-300 mb-6 max-w-md">
              基于先进AI技术的智能光伏板状态监测系统，为光伏行业提供精准的图像识别和诊断解决方案。
            </p>

            {/* 联系信息 */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-secondary-300">
                <MapPin className="w-4 h-4 text-primary-400" />
                <span>北京市朝阳区科技园区创新大厦</span>
              </div>
              <div className="flex items-center space-x-3 text-secondary-300">
                <Phone className="w-4 h-4 text-primary-400" />
                <span>+86-400-123-4567</span>
              </div>
              <div className="flex items-center space-x-3 text-secondary-300">
                <Mail className="w-4 h-4 text-primary-400" />
                <span>contact@solar-recognition.com</span>
              </div>
            </div>
          </div>

          {/* 产品链接 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">产品</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-secondary-300 hover:text-primary-400 transition-colors duration-200 flex items-center group"
                  >
                    {link.name}
                    <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 支持链接 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">支持</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-secondary-300 hover:text-primary-400 transition-colors duration-200 flex items-center group"
                  >
                    {link.name}
                    <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 公司链接 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">公司</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-secondary-300 hover:text-primary-400 transition-colors duration-200 flex items-center group"
                  >
                    {link.name}
                    <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 分割线 */}
        <div className="border-t border-secondary-700 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            {/* 版权信息 */}
            <div className="flex items-center space-x-2 text-secondary-400">
              <span>© {currentYear} 光伏识别系统. 保留所有权利.</span>
              <Heart className="w-4 h-4 text-error-500" />
            </div>

            {/* 社交媒体链接 */}
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-secondary-400 hover:text-primary-400 hover:bg-secondary-800 rounded-lg transition-all duration-200"
                    title={social.name}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>

            {/* 法律链接 */}
            <div className="flex items-center space-x-6 text-sm">
              {footerLinks.legal.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-secondary-400 hover:text-primary-400 transition-colors duration-200"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* 技术信息 */}
        <div className="border-t border-secondary-700 py-4">
          <div className="text-center text-sm text-secondary-500">
            <p>
              基于 React + TypeScript + TensorFlow.js 构建 | 
              版本 1.0.0 | 
              最后更新: {new Date().toLocaleDateString('zh-CN')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

