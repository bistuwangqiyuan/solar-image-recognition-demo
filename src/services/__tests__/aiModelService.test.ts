import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { aiModelService } from '@/services/aiModelService';

vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { success: true } }),
    post: vi.fn(),
    isAxiosError: vi.fn().mockReturnValue(false),
  },
}));

describe('AIModelService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    aiModelService.dispose();
  });

  describe('initializeModel', () => {
    it('should initialize successfully', async () => {
      await aiModelService.initializeModel();
      const info = aiModelService.getModelInfo();
      expect(info.isLoaded).toBe(true);
    });

    it('should not re-initialize if already loaded', async () => {
      await aiModelService.initializeModel();
      await aiModelService.initializeModel();
      const info = aiModelService.getModelInfo();
      expect(info.isLoaded).toBe(true);
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
      expect(() => aiModelService.updateConfig({
        confidenceThreshold: 0.8,
        nmsThreshold: 0.5,
      })).not.toThrow();
    });
  });

  describe('dispose', () => {
    it('should dispose model resources', () => {
      expect(() => aiModelService.dispose()).not.toThrow();
      const info = aiModelService.getModelInfo();
      expect(info.isLoaded).toBe(false);
    });
  });

  describe('getLastMetadata', () => {
    it('should return null before analysis', () => {
      expect(aiModelService.getLastMetadata()).toBeNull();
    });
  });
});
