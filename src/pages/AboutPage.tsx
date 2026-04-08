import React from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Brain,
  Shield,
  Users,
  Target,
  Cpu,
  Github,
  Download,
  ExternalLink,
} from 'lucide-react';

const GITHUB_REPO = 'https://github.com/bistuwangqiyuan/solar-image-recognition-demo';
const GITHUB_ZIP = `${GITHUB_REPO}/archive/refs/heads/master.zip`;

export const AboutPage: React.FC = () => {
  const features = [
    {
      icon: Brain,
      title: 'AI 智能识别',
      desc: '基于 MobileNet V2 + KNN 分类器，在浏览器端实时完成光伏板状态检测。',
    },
    {
      icon: Target,
      title: '多类别检测',
      desc: '支持正常、树叶遮挡、灰尘覆盖、阴影遮挡、异常情况等 5 大类别。',
    },
    {
      icon: Cpu,
      title: '纯前端推理',
      desc: '使用 TensorFlow.js 在客户端运行模型，无需上传图片到服务器，保护隐私。',
    },
    {
      icon: Shield,
      title: '开源透明',
      desc: '项目完全开源，代码和数据集均可免费获取、学习和二次开发。',
    },
  ];

  const techStack = [
    'React 18', 'TypeScript', 'Vite', 'TensorFlow.js',
    'MobileNet V2', 'KNN Classifier', 'Tailwind CSS',
    'Framer Motion', 'React Router', 'Express',
  ];

  return (
    <div className="min-h-screen bg-secondary-50 py-12">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-16">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-secondary-900 mb-4">
              关于光伏识别系统
            </h1>
            <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
              基于先进 AI 技术的智能光伏板状态监测系统，为光伏行业提供精准的图像识别和诊断方案
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
                  className="card hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="card-body flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-secondary-900 mb-1">{f.title}</h3>
                      <p className="text-secondary-600 text-sm">{f.desc}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Tech Stack */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="card mb-16"
          >
            <div className="card-body text-center">
              <h2 className="text-2xl font-bold text-secondary-900 mb-6">技术栈</h2>
              <div className="flex flex-wrap justify-center gap-3">
                {techStack.map(tech => (
                  <span
                    key={tech}
                    className="px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-medium border border-primary-100"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Source Code */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="card border-2 border-primary-200 bg-gradient-to-br from-primary-50 via-white to-primary-50 mb-16"
          >
            <div className="card-body text-center py-10">
              <Github className="w-12 h-12 text-secondary-900 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-secondary-900 mb-2">获取源码</h2>
              <p className="text-secondary-600 mb-8 max-w-lg mx-auto">
                项目完全开源，包含全部前后端代码、AI 模型配置、示例图片等资源，欢迎 Star 和 Fork
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href={GITHUB_REPO}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-lg flex items-center space-x-2"
                >
                  <Github className="w-5 h-5" />
                  <span>GitHub 仓库</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
                <a
                  href={GITHUB_ZIP}
                  className="btn btn-outline btn-lg flex items-center space-x-2"
                >
                  <Download className="w-5 h-5" />
                  <span>下载源码 ZIP</span>
                </a>
              </div>
            </div>
          </motion.div>

          {/* Team */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="text-center"
          >
            <div className="card inline-block">
              <div className="card-body flex items-center space-x-4 px-8">
                <Users className="w-10 h-10 text-primary-600" />
                <div className="text-left">
                  <h3 className="font-semibold text-secondary-900">Solar Image Recognition Team</h3>
                  <p className="text-sm text-secondary-500">基于 React + TypeScript + TensorFlow.js 构建</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
