import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { aiModelService } from '@/services/aiModelService';
import * as tf from '@tensorflow/tfjs';

// Mock TensorFlow.js
vi.mock('@tensorflow/tfjs', () => ({
  sequential: vi.fn(),
  layers: {
    conv2d: vi.fn(),
    maxPooling2d: vi.fn(),
    flatten: vi.fn(),
    dense: vi.fn(),
    dropout: vi.fn(),
  },
  image: {
    resizeBilinear: vi.fn(),
  },
  browser: {
    fromPixels: vi.fn(),
  },
}));

// Mock HTMLImageElement
const mockImageElement = {
  width: 224,
  height: 224,
  naturalWidth: 224,
  naturalHeight: 224,
} as HTMLImageElement;

describe('AIModelService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    aiModelService.dispose();
  });

  describe('initializeModel', () => {
    it('should initialize model successfully', async () => {
      const mockModel = {
        compile: vi.fn(),
        dispose: vi.fn(),
      };
      
      (tf.sequential as any).mockReturnValue(mockModel);

      await aiModelService.initializeModel();

      expect(tf.sequential).toHaveBeenCalled();
      expect(mockModel.compile).toHaveBeenCalled();
    });

    it('should not initialize model if already loaded', async () => {
      const mockModel = {
        compile: vi.fn(),
        dispose: vi.fn(),
      };
      
      (tf.sequential as any).mockReturnValue(mockModel);

      await aiModelService.initializeModel();
      await aiModelService.initializeModel();

      expect(tf.sequential).toHaveBeenCalledTimes(1);
    });

    it('should handle initialization errors', async () => {
      (tf.sequential as any).mockImplementation(() => {
        throw new Error('Model creation failed');
      });

      await expect(aiModelService.initializeModel()).rejects.toThrow('AI模型初始化失败');
    });
  });

  describe('analyzeImage', () => {
    beforeEach(async () => {
      const mockModel = {
        compile: vi.fn(),
        dispose: vi.fn(),
        predict: vi.fn().mockReturnValue({
          arraySync: vi.fn().mockReturnValue([[0.1, 0.2, 0.3, 0.4, 0.5]]),
          dispose: vi.fn(),
        }),
      };
      
      (tf.sequential as any).mockReturnValue(mockModel);
      (tf.image.resizeBilinear as any).mockReturnValue({
        div: vi.fn().mockReturnValue({
          expandDims: vi.fn().mockReturnValue({}),
        }),
      });
      (tf.browser.fromPixels as any).mockReturnValue({});

      await aiModelService.initializeModel();
    });

    it('should analyze image successfully', async () => {
      const results = await aiModelService.analyzeImage(mockImageElement);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should throw error if model not loaded', async () => {
      aiModelService.dispose();

      await expect(aiModelService.analyzeImage(mockImageElement)).rejects.toThrow('AI模型未加载');
    });
  });

  describe('getModelInfo', () => {
    it('should return model information', () => {
      const info = aiModelService.getModelInfo();

      expect(info).toHaveProperty('isLoaded');
      expect(info).toHaveProperty('isLoading');
      expect(info).toHaveProperty('config');
      expect(info).toHaveProperty('inputSize');
      expect(info).toHaveProperty('numClasses');
    });
  });

  describe('updateConfig', () => {
    it('should update model configuration', () => {
      const newConfig = {
        confidenceThreshold: 0.8,
        nmsThreshold: 0.5,
      };

      expect(() => aiModelService.updateConfig(newConfig)).not.toThrow();
    });
  });

  describe('dispose', () => {
    it('should dispose model resources', () => {
      expect(() => aiModelService.dispose()).not.toThrow();
    });
  });
});
