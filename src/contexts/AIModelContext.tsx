import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { aiModelService } from '@/services/aiModelService';

// AI模型状态接口
interface AIModelState {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  modelInfo: {
    inputSize: [number, number];
    numClasses: number;
    confidenceThreshold: number;
    nmsThreshold: number;
  } | null;
}

// AI模型上下文接口
interface AIModelContextType {
  state: AIModelState;
  initializeModel: () => Promise<void>;
  disposeModel: () => void;
  updateConfig: (config: Partial<any>) => void;
}

// 创建上下文
const AIModelContext = createContext<AIModelContextType | undefined>(undefined);

// AI模型提供者组件
interface AIModelProviderProps {
  children: ReactNode;
}

export const AIModelProvider: React.FC<AIModelProviderProps> = ({ children }) => {
  const [state, setState] = useState<AIModelState>({
    isLoaded: false,
    isLoading: false,
    error: null,
    modelInfo: null,
  });

  // 初始化模型
  const initializeModel = async () => {
    if (state.isLoaded || state.isLoading) {
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await aiModelService.initializeModel();
      const modelInfo = aiModelService.getModelInfo();
      
      setState(prev => ({
        ...prev,
        isLoaded: true,
        isLoading: false,
        modelInfo: {
          inputSize: modelInfo.inputSize,
          numClasses: modelInfo.numClasses,
          confidenceThreshold: modelInfo.config.confidenceThreshold,
          nmsThreshold: modelInfo.config.nmsThreshold,
        },
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '模型初始化失败',
      }));
    }
  };

  // 释放模型
  const disposeModel = () => {
    aiModelService.dispose();
    setState(prev => ({
      ...prev,
      isLoaded: false,
      isLoading: false,
      error: null,
      modelInfo: null,
    }));
  };

  // 更新配置
  const updateConfig = (config: Partial<any>) => {
    aiModelService.updateConfig(config);
    const modelInfo = aiModelService.getModelInfo();
    
    setState(prev => ({
      ...prev,
      modelInfo: prev.modelInfo ? {
        ...prev.modelInfo,
        confidenceThreshold: modelInfo.config.confidenceThreshold,
        nmsThreshold: modelInfo.config.nmsThreshold,
      } : null,
    }));
  };

  // 组件挂载时自动初始化模型
  useEffect(() => {
    initializeModel();
  }, []);

  const contextValue: AIModelContextType = {
    state,
    initializeModel,
    disposeModel,
    updateConfig,
  };

  return (
    <AIModelContext.Provider value={contextValue}>
      {children}
    </AIModelContext.Provider>
  );
};

// 使用AI模型上下文的Hook
export const useAIModel = (): AIModelContextType => {
  const context = useContext(AIModelContext);
  if (context === undefined) {
    throw new Error('useAIModel must be used within an AIModelProvider');
  }
  return context;
};

// AI模型状态指示器组件
export const AIModelStatusIndicator: React.FC = () => {
  const { state } = useAIModel();

  if (state.isLoading) {
    return (
      <div className="flex items-center space-x-2 text-primary-600">
        <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm">AI模型加载中...</span>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="flex items-center space-x-2 text-error-600">
        <div className="w-4 h-4 bg-error-600 rounded-full"></div>
        <span className="text-sm">AI模型加载失败</span>
      </div>
    );
  }

  if (state.isLoaded) {
    return (
      <div className="flex items-center space-x-2 text-success-600">
        <div className="w-4 h-4 bg-success-600 rounded-full"></div>
        <span className="text-sm">AI模型已就绪</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-secondary-500">
      <div className="w-4 h-4 bg-secondary-400 rounded-full"></div>
      <span className="text-sm">AI模型未初始化</span>
    </div>
  );
};

// AI模型配置组件
export const AIModelConfig: React.FC = () => {
  const { state, updateConfig } = useAIModel();
  const [confidence, setConfidence] = useState(0.5);
  const [nmsThreshold, setNmsThreshold] = useState(0.4);

  useEffect(() => {
    if (state.modelInfo) {
      setConfidence(state.modelInfo.confidenceThreshold);
      setNmsThreshold(state.modelInfo.nmsThreshold);
    }
  }, [state.modelInfo]);

  const handleConfidenceChange = (value: number) => {
    setConfidence(value);
    updateConfig({ confidenceThreshold: value });
  };

  const handleNmsThresholdChange = (value: number) => {
    setNmsThreshold(value);
    updateConfig({ nmsThreshold: value });
  };

  if (!state.isLoaded) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-secondary-900">AI模型配置</h3>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            置信度阈值: {confidence.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={confidence}
            onChange={(e) => handleConfidenceChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-secondary-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-secondary-500 mt-1">
            <span>0.0</span>
            <span>0.5</span>
            <span>1.0</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            NMS阈值: {nmsThreshold.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={nmsThreshold}
            onChange={(e) => handleNmsThresholdChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-secondary-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-secondary-500 mt-1">
            <span>0.0</span>
            <span>0.5</span>
            <span>1.0</span>
          </div>
        </div>
      </div>

      {state.modelInfo && (
        <div className="text-sm text-secondary-600 space-y-1">
          <div>输入尺寸: {state.modelInfo.inputSize[0]}×{state.modelInfo.inputSize[1]}</div>
          <div>分类数量: {state.modelInfo.numClasses}</div>
        </div>
      )}
    </div>
  );
};
