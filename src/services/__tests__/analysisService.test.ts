import { describe, it, expect, beforeEach, vi } from 'vitest';
import { analysisService } from '@/services/analysisService';
import axios from 'axios';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock AI model service
vi.mock('@/services/aiModelService', () => ({
  aiModelService: {
    initializeModel: vi.fn(),
    analyzeImage: vi.fn(),
    getModelInfo: vi.fn(),
    updateConfig: vi.fn(),
    dispose: vi.fn(),
  },
}));

// Mock image processor
vi.mock('@/utils/imageProcessor', () => ({
  ImageProcessor: {
    enhanceImage: vi.fn().mockReturnValue({
      toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,mock'),
    }),
  },
}));

describe('AnalysisService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeImage', () => {
    it('should analyze image successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            results: [
              {
                category: 'normal',
                confidence: 0.95,
                boundingBox: { x: 50, y: 50, width: 200, height: 150 },
                description: '正常光伏板区域',
                severity: 'low',
              },
            ],
            summary: {
              overallStatus: 'healthy',
              totalIssues: 0,
              processingTime: 2500,
              confidence: 0.95,
            },
            recommendations: [],
            processingTime: 2500,
          },
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await analysisService.analyzeImage('test-image-id');

      expect(result).toBeDefined();
      expect(result.results).toHaveLength(1);
      expect(result.summary.overallStatus).toBe('healthy');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/analysis',
        expect.objectContaining({
          imageId: 'test-image-id',
          options: expect.any(Object),
        }),
        expect.any(Object)
      );
    });

    it('should handle analysis errors', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network error'));

      await expect(analysisService.analyzeImage('test-image-id')).rejects.toThrow();
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('timeout');
      (timeoutError as any).code = 'ECONNABORTED';
      mockedAxios.post.mockRejectedValue(timeoutError);

      await expect(analysisService.analyzeImage('test-image-id')).rejects.toThrow('分析超时，请重试');
    });
  });

  describe('analyzeImageWithClientAI', () => {
    it('should analyze image with client AI successfully', async () => {
      const mockImageElement = {
        width: 224,
        height: 224,
        naturalWidth: 224,
        naturalHeight: 224,
      } as HTMLImageElement;

      const { aiModelService } = await import('@/services/aiModelService');
      (aiModelService.initializeModel as any).mockResolvedValue(undefined);
      (aiModelService.analyzeImage as any).mockResolvedValue([
        {
          category: 'normal',
          confidence: 0.95,
          boundingBox: { x: 50, y: 50, width: 200, height: 150 },
          description: '正常光伏板区域',
          severity: 'low',
        },
      ]);

      const result = await analysisService.analyzeImageWithClientAI(mockImageElement);

      expect(result).toBeDefined();
      expect(result.results).toHaveLength(1);
      expect(aiModelService.initializeModel).toHaveBeenCalled();
      expect(aiModelService.analyzeImage).toHaveBeenCalled();
    });

    it('should handle client AI analysis errors', async () => {
      const mockImageElement = {
        width: 224,
        height: 224,
        naturalWidth: 224,
        naturalHeight: 224,
      } as HTMLImageElement;

      const { aiModelService } = await import('@/services/aiModelService');
      (aiModelService.initializeModel as any).mockRejectedValue(new Error('Model error'));

      await expect(analysisService.analyzeImageWithClientAI(mockImageElement)).rejects.toThrow('客户端AI分析失败');
    });
  });

  describe('getAnalysisHistory', () => {
    it('should get analysis history successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            history: [
              {
                id: 'history-1',
                imageId: 'test-image-id',
                timestamp: '2023-01-01T00:00:00Z',
                summary: {
                  overallStatus: 'healthy',
                  totalIssues: 0,
                  processingTime: 2500,
                  confidence: 0.95,
                },
              },
            ],
            total: 1,
            limit: 10,
            offset: 0,
          },
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await analysisService.getAnalysisHistory('test-image-id');

      expect(result).toBeDefined();
      expect(result.history).toHaveLength(1);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/analysis/history/test-image-id',
        expect.any(Object)
      );
    });
  });

  describe('batchAnalyze', () => {
    it('should batch analyze images successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            successful: [
              {
                imageId: 'image-1',
                results: [],
                summary: { overallStatus: 'healthy', totalIssues: 0, processingTime: 2500, confidence: 0.95 },
                recommendations: [],
                processingTime: 2500,
              },
            ],
            failed: [],
            total: 1,
            successCount: 1,
            failureCount: 0,
          },
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await analysisService.batchAnalyze(['image-1']);

      expect(result).toBeDefined();
      expect(result.successful).toHaveLength(1);
      expect(result.failed).toHaveLength(0);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/analysis/batch',
        expect.objectContaining({
          imageIds: ['image-1'],
          options: expect.any(Object),
        }),
        expect.any(Object)
      );
    });

    it('should validate batch analyze input', async () => {
      await expect(analysisService.batchAnalyze([])).rejects.toThrow('图像ID列表不能为空');
      await expect(analysisService.batchAnalyze(new Array(11).fill('image-id'))).rejects.toThrow('批量分析最多支持10张图像');
    });
  });
});
