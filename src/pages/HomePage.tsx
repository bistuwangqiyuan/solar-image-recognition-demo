import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Upload, 
  Zap, 
  BarChart3, 
  Shield, 
  Clock, 
  CheckCircle,
  ArrowRight,
  PlayCircle,
  Star,
  Users,
  Award,
  TrendingUp
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const features = [
    {
      icon: Zap,
      title: 'AI智能识别',
      description: '基于先进的深度学习算法，准确识别光伏板的各种状态和问题',
      color: 'text-primary-600',
      bgColor: 'bg-primary-100',
    },
    {
      icon: BarChart3,
      title: '实时分析',
      description: '快速处理图像数据，30秒内提供详细的分析报告和建议',
      color: 'text-success-600',
      bgColor: 'bg-success-100',
    },
    {
      icon: Shield,
      title: '安全可靠',
      description: '企业级安全标准，数据加密传输，24小时自动清理',
      color: 'text-warning-600',
      bgColor: 'bg-warning-100',
    },
    {
      icon: Clock,
      title: '高效便捷',
      description: '支持批量处理，移动端适配，随时随地进行分析',
      color: 'text-error-600',
      bgColor: 'bg-error-100',
    },
  ];

  const recognitionTypes = [
    {
      name: '正常光伏板',
      description: '状态良好的光伏板',
      color: 'bg-success-500',
      count: '95%',
    },
    {
      name: '树叶遮挡',
      description: '被树叶遮挡的光伏板',
      color: 'bg-warning-500',
      count: '89%',
    },
    {
      name: '灰尘覆盖',
      description: '被灰尘覆盖的光伏板',
      color: 'bg-secondary-500',
      count: '92%',
    },
    {
      name: '云彩阴影',
      description: '被阴影遮挡的光伏板',
      color: 'bg-primary-500',
      count: '87%',
    },
  ];

  const stats = [
    { label: '识别准确率', value: '95%+', icon: TrendingUp },
    { label: '处理速度', value: '<30s', icon: Clock },
    { label: '支持格式', value: '5+', icon: Upload },
    { label: '用户满意度', value: '98%', icon: Star },
  ];

  const testimonials = [
    {
      name: '张工程师',
      company: '阳光能源',
      role: '运维总监',
      content: '这个系统大大提高了我们的运维效率，AI识别的准确率非常高，帮助我们及时发现和处理问题。',
      rating: 5,
    },
    {
      name: '李经理',
      company: '绿色电力',
      role: '技术负责人',
      content: '界面简洁易用，功能强大，特别是批量处理功能，让我们能够快速处理大量光伏板图像。',
      rating: 5,
    },
    {
      name: '王专家',
      company: '新能源研究院',
      role: '高级研究员',
      content: '技术先进，识别精度高，为光伏行业提供了很好的智能化解决方案。',
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* 英雄区域 */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container-custom py-20 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                智能光伏板
                <span className="block text-accent-400">状态识别系统</span>
              </h1>
              <p className="text-xl text-primary-100 mb-8 leading-relaxed">
                基于先进AI技术的智能光伏板状态监测系统，准确识别正常、遮挡、污染等各种状态，
                为光伏行业提供精准的诊断和维护建议。
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/upload"
                  className="btn btn-accent btn-lg flex items-center justify-center space-x-2 group"
                >
                  <Upload className="w-5 h-5" />
                  <span>开始分析</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
                <Link
                  to="/demo"
                  className="btn btn-outline btn-lg flex items-center justify-center space-x-2 border-white text-white hover:bg-white hover:text-primary-700"
                >
                  <PlayCircle className="w-5 h-5" />
                  <span>查看演示</span>
                </Link>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="grid grid-cols-2 gap-4">
                  {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                        className="text-center"
                      >
                        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                        <div className="text-sm text-primary-200">{stat.label}</div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 功能特性 */}
      <section id="features" className="py-20 bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-secondary-900 mb-4">
              强大的功能特性
            </h2>
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
              我们提供全面的光伏板状态识别和分析功能，帮助您提高运维效率，降低维护成本
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="card hover:shadow-industrial-lg transition-all duration-300 group"
                >
                  <div className="card-body text-center">
                    <div className={`w-16 h-16 ${feature.bgColor} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-8 h-8 ${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-semibold text-secondary-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-secondary-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 识别类型 */}
      <section className="py-20 bg-secondary-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-secondary-900 mb-4">
              精准识别多种状态
            </h2>
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
              我们的AI模型经过大量数据训练，能够准确识别光伏板的各种状态和问题
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recognitionTypes.map((type, index) => (
              <motion.div
                key={type.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card hover:shadow-industrial-lg transition-all duration-300"
              >
                <div className="card-body text-center">
                  <div className={`w-4 h-4 ${type.color} rounded-full mx-auto mb-4`}></div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                    {type.name}
                  </h3>
                  <p className="text-secondary-600 text-sm mb-3">
                    {type.description}
                  </p>
                  <div className="text-2xl font-bold text-primary-600">
                    {type.count}
                  </div>
                  <div className="text-xs text-secondary-500">识别准确率</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 用户评价 */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-secondary-900 mb-4">
              用户评价
            </h2>
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
              来自行业专家和用户的真实反馈，见证我们的技术实力和服务质量
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card hover:shadow-industrial-lg transition-all duration-300"
              >
                <div className="card-body">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-accent-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-secondary-600 mb-6 leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                      <Users className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-secondary-900">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-secondary-600">
                        {testimonial.role} · {testimonial.company}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA区域 */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container-custom text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              准备开始您的智能光伏监测之旅？
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              立即体验我们的AI识别技术，提升您的光伏运维效率
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/upload"
                className="btn btn-accent btn-lg flex items-center justify-center space-x-2"
              >
                <Upload className="w-5 h-5" />
                <span>立即开始</span>
              </Link>
              <Link
                to="/demo"
                className="btn btn-outline btn-lg flex items-center justify-center space-x-2 border-white text-white hover:bg-white hover:text-primary-700"
              >
                <PlayCircle className="w-5 h-5" />
                <span>查看演示</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

