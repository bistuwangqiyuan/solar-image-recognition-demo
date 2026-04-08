import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  CheckCircle,
  Loader2,
  Brain,
  ImageIcon,
  BarChart3,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Cpu,
  Zap,
} from 'lucide-react';
import { DetectionResult, PanelCondition } from '@/types';
import { aiModelService } from '@/services/aiModelService';
import { demoData } from '@/services/demoService';

type Phase = 'idle' | 'init-model' | 'processing' | 'summary';

interface ImageAnalysis {
  id: string;
  title: string;
  imageUrl: string;
  category: PanelCondition;
  status: 'pending' | 'loading-image' | 'analyzing' | 'done';
  results: DetectionResult[];
  elapsed: number;
}

const CATEGORY_LABELS: Record<PanelCondition, string> = {
  [PanelCondition.NORMAL]: '正常',
  [PanelCondition.LEAVES]: '树叶遮挡',
  [PanelCondition.DUST]: '灰尘覆盖',
  [PanelCondition.SHADOW]: '阴影遮挡',
  [PanelCondition.OTHER]: '其他异常',
};

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-success-50 border-success-200 text-success-700',
  medium: 'bg-warning-50 border-warning-200 text-warning-700',
  high: 'bg-error-50 border-error-200 text-error-700',
};

export const AutoPipelineDemo: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [analyses, setAnalyses] = useState<ImageAnalysis[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [modelLoadTime, setModelLoadTime] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const abortRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const totalDetections = analyses.reduce((n, a) => n + a.results.length, 0);
  const totalIssues = analyses.reduce(
    (n, a) => n + a.results.filter(r => r.category !== PanelCondition.NORMAL).length,
    0,
  );
  const totalTime = analyses.reduce((n, a) => n + a.elapsed, 0) + modelLoadTime;
  const avgConfidence =
    totalDetections > 0
      ? analyses.reduce(
          (s, a) => s + a.results.reduce((rs, r) => rs + r.confidence, 0),
          0,
        ) / totalDetections
      : 0;

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }, []);

  useEffect(() => {
    if (phase === 'processing') scrollToBottom();
  }, [currentIndex, phase, scrollToBottom]);

  const loadImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`图片加载失败: ${url}`));
      img.src = url;
    });

  const startAutoDemo = async () => {
    abortRef.current = false;
    setExpanded(true);

    const initial: ImageAnalysis[] = demoData.map(d => ({
      id: d.id,
      title: d.title,
      imageUrl: d.imageUrl,
      category: d.category,
      status: 'pending',
      results: [],
      elapsed: 0,
    }));
    setAnalyses(initial);
    setCurrentIndex(-1);

    setPhase('init-model');
    const t0 = performance.now();
    try {
      await aiModelService.initializeModel();
    } catch {
      /* model already loaded */
    }
    const loadMs = Math.round(performance.now() - t0);
    setModelLoadTime(loadMs);

    if (abortRef.current) return;

    setPhase('processing');

    for (let i = 0; i < initial.length; i++) {
      if (abortRef.current) return;
      setCurrentIndex(i);

      setAnalyses(prev => {
        const copy = [...prev];
        copy[i] = { ...copy[i], status: 'loading-image' };
        return copy;
      });

      const img = await loadImage(initial[i].imageUrl);

      if (abortRef.current) return;

      setAnalyses(prev => {
        const copy = [...prev];
        copy[i] = { ...copy[i], status: 'analyzing' };
        return copy;
      });

      const start = performance.now();
      const results = await aiModelService.analyzeImage(img);
      const elapsed = Math.round(performance.now() - start);

      if (abortRef.current) return;

      setAnalyses(prev => {
        const copy = [...prev];
        copy[i] = { ...copy[i], status: 'done', results, elapsed };
        return copy;
      });
    }

    setPhase('summary');
  };

  const resetDemo = () => {
    abortRef.current = true;
    setPhase('idle');
    setAnalyses([]);
    setCurrentIndex(-1);
    setModelLoadTime(0);
  };

  const isRunning = phase === 'init-model' || phase === 'processing';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-10"
    >
      <div className="card overflow-hidden border-2 border-primary-200 bg-gradient-to-br from-primary-50 via-white to-primary-50">
        {/* Header */}
        <div
          className="card-body cursor-pointer select-none"
          onClick={() => !isRunning && setExpanded(e => !e)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-secondary-900">
                  全流程自动演示
                </h2>
                <p className="text-sm text-secondary-500">
                  一键运行 &middot; MobileNet V2 实时推理 &middot; 6 张真实光伏板图像
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {phase === 'idle' && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    startAutoDemo();
                  }}
                  className="btn btn-primary btn-md flex items-center space-x-2"
                >
                  <Play className="w-4 h-4" />
                  <span>开始全自动演示</span>
                </button>
              )}
              {isRunning && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    resetDemo();
                  }}
                  className="btn btn-outline btn-md flex items-center space-x-2 text-error-600 border-error-300"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>停止</span>
                </button>
              )}
              {phase === 'summary' && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    resetDemo();
                    setTimeout(() => startAutoDemo(), 100);
                  }}
                  className="btn btn-primary btn-md flex items-center space-x-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>重新运行</span>
                </button>
              )}
              {!isRunning &&
                (expanded ? (
                  <ChevronUp className="w-5 h-5 text-secondary-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-secondary-400" />
                ))}
            </div>
          </div>

          {/* Progress bar */}
          {isRunning && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-secondary-500 mb-1">
                <span>
                  {phase === 'init-model'
                    ? '加载 MobileNet V2 模型...'
                    : `分析中 ${currentIndex + 1} / ${analyses.length}`}
                </span>
                <span>
                  {phase === 'init-model'
                    ? '0%'
                    : `${Math.round(((currentIndex + 1) / analyses.length) * 100)}%`}
                </span>
              </div>
              <div className="w-full h-2 bg-secondary-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary-500 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{
                    width:
                      phase === 'init-model'
                        ? '10%'
                        : `${((currentIndex + 1) / analyses.length) * 100}%`,
                  }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        <AnimatePresence>
          {expanded && phase !== 'idle' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 space-y-4">
                {/* Phase 1: model loading */}
                <StepIndicator
                  icon={<Brain className="w-4 h-4" />}
                  label="加载 MobileNet V2 预训练模型"
                  status={
                    phase === 'init-model'
                      ? 'running'
                      : modelLoadTime > 0
                        ? 'done'
                        : 'pending'
                  }
                  detail={modelLoadTime > 0 ? `${modelLoadTime}ms` : undefined}
                />

                {/* Phase 2: per-image analysis */}
                {analyses.map((a, i) => (
                  <ImageStepCard
                    key={a.id}
                    analysis={a}
                    isCurrent={phase === 'processing' && i === currentIndex}
                  />
                ))}

                {/* Phase 3: summary */}
                {phase === 'summary' && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-5 rounded-xl bg-gradient-to-r from-primary-50 to-success-50 border border-primary-200"
                  >
                    <h3 className="text-lg font-bold text-secondary-900 mb-4 flex items-center space-x-2">
                      <BarChart3 className="w-5 h-5 text-primary-600" />
                      <span>全流程分析报告</span>
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <SummaryCard
                        label="分析图片"
                        value={`${analyses.length} 张`}
                        color="text-primary-600"
                      />
                      <SummaryCard
                        label="检测区域"
                        value={`${totalDetections} 个`}
                        color="text-success-600"
                      />
                      <SummaryCard
                        label="发现问题"
                        value={`${totalIssues} 处`}
                        color={totalIssues > 0 ? 'text-warning-600' : 'text-success-600'}
                      />
                      <SummaryCard
                        label="总耗时"
                        value={`${(totalTime / 1000).toFixed(1)}s`}
                        color="text-secondary-600"
                      />
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {analyses.map(a => {
                        const primary = a.results[0];
                        return (
                          <div
                            key={a.id}
                            className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-secondary-100"
                          >
                            <img
                              src={a.imageUrl}
                              alt={a.title}
                              className="w-14 h-14 rounded-md object-cover flex-shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm text-secondary-900 truncate">
                                  {a.title}
                                </span>
                                <span className="text-xs text-secondary-400 ml-2">
                                  {a.elapsed}ms
                                </span>
                              </div>
                              {primary && (
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="text-xs text-secondary-600">
                                    {primary.description}
                                  </span>
                                  <span
                                    className={`text-xs font-semibold ${
                                      primary.confidence > 0.7
                                        ? 'text-success-600'
                                        : 'text-warning-600'
                                    }`}
                                  >
                                    {(primary.confidence * 100).toFixed(0)}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 pt-3 border-t border-primary-100 flex items-center justify-between text-sm text-secondary-600">
                      <span>
                        平均置信度:{' '}
                        <span className="font-semibold text-primary-600">
                          {(avgConfidence * 100).toFixed(1)}%
                        </span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Cpu className="w-3.5 h-3.5" />
                        <span>MobileNet V2 + KNN 分类器</span>
                      </span>
                    </div>
                  </motion.div>
                )}

                <div ref={scrollRef} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

/* ---------- Sub-components ---------- */

const StepIndicator: React.FC<{
  icon: React.ReactNode;
  label: string;
  status: 'pending' | 'running' | 'done';
  detail?: string;
}> = ({ icon, label, status, detail }) => (
  <div className="flex items-center space-x-3">
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        status === 'done'
          ? 'bg-success-100 text-success-600'
          : status === 'running'
            ? 'bg-primary-100 text-primary-600 animate-pulse'
            : 'bg-secondary-100 text-secondary-400'
      }`}
    >
      {status === 'done' ? <CheckCircle className="w-4 h-4" /> : icon}
    </div>
    <span
      className={`text-sm font-medium ${
        status === 'done'
          ? 'text-success-700'
          : status === 'running'
            ? 'text-primary-700'
            : 'text-secondary-400'
      }`}
    >
      {label}
    </span>
    {status === 'running' && (
      <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
    )}
    {detail && (
      <span className="text-xs text-secondary-400">{detail}</span>
    )}
  </div>
);

const ImageStepCard: React.FC<{
  analysis: ImageAnalysis;
  isCurrent: boolean;
}> = ({ analysis, isCurrent }) => {
  const { title, imageUrl, category, status, results, elapsed } = analysis;
  const isDone = status === 'done';
  const isActive = status === 'loading-image' || status === 'analyzing';

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      className={`rounded-lg border overflow-hidden transition-all duration-300 ${
        isActive
          ? 'border-primary-300 shadow-md'
          : isDone
            ? 'border-secondary-200'
            : 'border-secondary-100 opacity-60'
      }`}
    >
      <div className="flex items-stretch">
        {/* Thumbnail */}
        <div className="w-24 md:w-32 flex-shrink-0 relative bg-secondary-100">
          <img
            src={imageUrl}
            alt={title}
            className={`w-full h-full object-cover ${isActive ? 'opacity-80' : ''}`}
          />
          {isActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
          {isDone && (
            <div className="absolute top-1 right-1">
              <CheckCircle className="w-5 h-5 text-success-500 drop-shadow" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-3 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2 min-w-0">
              <span className="font-medium text-sm text-secondary-900 truncate">
                {title}
              </span>
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-secondary-100 text-secondary-600 flex-shrink-0">
                {CATEGORY_LABELS[category]}
              </span>
            </div>
            {isDone && (
              <span className="text-xs text-secondary-400 flex-shrink-0 ml-2">
                {elapsed}ms
              </span>
            )}
          </div>

          {isActive && (
            <div className="flex items-center space-x-2 text-xs text-primary-600">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>
                {status === 'loading-image'
                  ? '加载图片中...'
                  : 'MobileNet V2 推理中...'}
              </span>
            </div>
          )}

          {isDone && results.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {results.map((r, j) => (
                <span
                  key={j}
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                    SEVERITY_COLORS[r.severity] ?? SEVERITY_COLORS.low
                  }`}
                >
                  {r.description}{' '}
                  <span className="ml-1 opacity-75">
                    {(r.confidence * 100).toFixed(0)}%
                  </span>
                </span>
              ))}
            </div>
          )}

          {status === 'pending' && (
            <span className="text-xs text-secondary-400">等待中</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const SummaryCard: React.FC<{
  label: string;
  value: string;
  color: string;
}> = ({ label, value, color }) => (
  <div className="text-center p-3 bg-white rounded-lg border border-secondary-100">
    <div className={`text-xl font-bold ${color}`}>{value}</div>
    <div className="text-xs text-secondary-500 mt-0.5">{label}</div>
  </div>
);
