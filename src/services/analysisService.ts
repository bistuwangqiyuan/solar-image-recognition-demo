import axios from 'axios';
import { 
  AnalysisRequest, 
  AnalysisResponse, 
  ApiResponse, 
  ApiError, 
  ErrorType 
} from '@/types';
import { aiModelService } from './aiModelService';
import { ImageProcessor } from '@/utils/imageProcessor';

class AnalysisService {
  private baseURL = '/api';

  /**
   * 使用客户端AI模型分析图像
   */
  async analyzeImageWithClientAI(
    imageElement: HTMLImageElement,
    options?: {
      confidence?: number;
      detailLevel?: 'basic' | 'detailed';
    }
  ): Promise<AnalysisResponse> {
    try {
      console.log('开始客户端AI分析...');
      
      // 初始化AI模型
      await aiModelService.initializeModel();
      
      // 图像预处理
      const enhancedImage = ImageProcessor.enhanceImage(imageElement);
      
      // 创建新的图像元素用于分析
      const analysisImage = new Image();
      analysisImage.src = ImageProcessor.canvasToDataURL(enhancedImage);
      
      return new Promise((resolve, reject) => {
        analysisImage.onload = async () => {
          try {
            // 使用AI模型分析
            const results = await aiModelService.analyzeImage(analysisImage);
            
            // 生成建议
            const recommendations = this.generateRecommendations(results);
            
            // 计算摘要
            const summary = this.calculateSummary(results, 0);
            
            const analysisResponse: AnalysisResponse = {
              results,
              summary,
              recommendations,
              processingTime: Date.now(),
            };
            
            resolve(analysisResponse);
          } catch (error) {
            reject(error);
          }
        };
        
        analysisImage.onerror = () => {
          reject(new Error('图像加载失败'));
        };
      });
    } catch (error) {
      console.error('客户端AI分析失败:', error);
      throw {
        type: ErrorType.AI_PROCESSING_ERROR,
        message: '客户端AI分析失败',
        retryable: true,
      } as ApiError;
    }
  }

  /**
   * 服务器端分析（原有方法）
   */
  async analyzeImage(
    imageId: string, 
    options?: {
      confidence?: number;
      detailLevel?: 'basic' | 'detailed';
    }
  ): Promise<AnalysisResponse> {
    try {
      const requestData: AnalysisRequest = {
        imageId,
        options: {
          confidence: options?.confidence || 0.7,
          detailLevel: options?.detailLevel || 'detailed',
        },
      };

      const response = await axios.post<ApiResponse<AnalysisResponse>>(
        `${this.baseURL}/analysis`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 60000, // 60秒超时
        }
      );

      if (!response.data.success || !response.data.data) {
        throw new Error('分析响应格式错误');
      }

      return response.data.data;
    } catch (error) {
      console.error('图像分析失败:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.error) {
          const apiError = error.response.data.error;
          throw {
            type: apiError.type || ErrorType.AI_PROCESSING_ERROR,
            message: apiError.message || 'AI分析失败',
            retryable: apiError.retryable || true,
            details: apiError.details,
          } as ApiError;
        }
        
        if (error.code === 'ECONNABORTED') {
          throw {
            type: ErrorType.AI_PROCESSING_ERROR,
            message: '分析超时，请重试',
            retryable: true,
          } as ApiError;
        }
      }
      
      throw {
        type: ErrorType.AI_PROCESSING_ERROR,
        message: 'AI分析失败，请重试',
        retryable: true,
      } as ApiError;
    }
  }

  async getAnalysisHistory(
    imageId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<{
    history: any[];
    total: number;
    limit: number;
    offset: number;
  }> {
    try {
      const response = await axios.get<ApiResponse<{
        history: any[];
        total: number;
        limit: number;
        offset: number;
      }>>(
        `${this.baseURL}/analysis/history/${imageId}`,
        {
          params: { limit, offset },
        }
      );

      if (!response.data.success || !response.data.data) {
        throw new Error('历史记录响应格式错误');
      }

      return response.data.data;
    } catch (error) {
      console.error('获取分析历史失败:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.error) {
          const apiError = error.response.data.error;
          throw {
            type: apiError.type || ErrorType.SERVER_ERROR,
            message: apiError.message || '获取历史记录失败',
            retryable: apiError.retryable || false,
            details: apiError.details,
          } as ApiError;
        }
      }
      
      throw {
        type: ErrorType.SERVER_ERROR,
        message: '获取历史记录失败，请重试',
        retryable: true,
      } as ApiError;
    }
  }

  async batchAnalyze(
    imageIds: string[],
    options?: {
      confidence?: number;
      detailLevel?: 'basic' | 'detailed';
    }
  ): Promise<{
    successful: any[];
    failed: any[];
    total: number;
    successCount: number;
    failureCount: number;
  }> {
    try {
      if (imageIds.length === 0) {
        throw {
          type: ErrorType.VALIDATION_ERROR,
          message: '图像ID列表不能为空',
          retryable: false,
        } as ApiError;
      }

      if (imageIds.length > 10) {
        throw {
          type: ErrorType.VALIDATION_ERROR,
          message: '批量分析最多支持10张图像',
          retryable: false,
        } as ApiError;
      }

      const requestData = {
        imageIds,
        options: {
          confidence: options?.confidence || 0.7,
          detailLevel: options?.detailLevel || 'detailed',
        },
      };

      const response = await axios.post<ApiResponse<{
        successful: any[];
        failed: any[];
        total: number;
        successCount: number;
        failureCount: number;
      }>>(
        `${this.baseURL}/analysis/batch`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 300000, // 5分钟超时
        }
      );

      if (!response.data.success || !response.data.data) {
        throw new Error('批量分析响应格式错误');
      }

      return response.data.data;
    } catch (error) {
      console.error('批量分析失败:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.error) {
          const apiError = error.response.data.error;
          throw {
            type: apiError.type || ErrorType.AI_PROCESSING_ERROR,
            message: apiError.message || '批量分析失败',
            retryable: apiError.retryable || true,
            details: apiError.details,
          } as ApiError;
        }
      }
      
      throw {
        type: ErrorType.AI_PROCESSING_ERROR,
        message: '批量分析失败，请重试',
        retryable: true,
      } as ApiError;
    }
  }

  /**
   * 生成维护建议
   */
  private generateRecommendations(results: any[]): any[] {
    const recommendations: any[] = [];
    
    const hasLeaves = results.some(r => r.category === 'leaves');
    const hasDust = results.some(r => r.category === 'dust');
    const hasShadow = results.some(r => r.category === 'shadow');
    const hasOther = results.some(r => r.category === 'other');

    if (hasLeaves) {
      recommendations.push({
        type: 'cleaning',
        priority: 'medium',
        description: '建议清理光伏板表面的树叶遮挡，以提高发电效率',
        estimatedCost: 200,
        estimatedTime: '2-4小时',
      });
    }

    if (hasDust) {
      recommendations.push({
        type: 'cleaning',
        priority: 'medium',
        description: '建议清洁光伏板表面的灰尘，定期维护可提高发电效率15-20%',
        estimatedCost: 150,
        estimatedTime: '1-2小时',
      });
    }

    if (hasShadow) {
      recommendations.push({
        type: 'inspection',
        priority: 'low',
        description: '检测到阴影遮挡，建议检查周围环境是否有新的遮挡物',
        estimatedCost: 100,
        estimatedTime: '1小时',
      });
    }

    if (hasOther) {
      recommendations.push({
        type: 'inspection',
        priority: 'high',
        description: '检测到异常情况，建议进行详细检查以确定具体问题',
        estimatedCost: 500,
        estimatedTime: '4-6小时',
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'maintenance',
        priority: 'low',
        description: '光伏板状态良好，建议定期进行预防性维护',
        estimatedCost: 300,
        estimatedTime: '2-3小时',
      });
    }

    return recommendations;
  }

  /**
   * 计算分析摘要
   */
  private calculateSummary(results: any[], processingTime: number): any {
    const totalIssues = results.filter(r => r.category !== 'normal').length;
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    
    let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (totalIssues === 0) {
      overallStatus = 'healthy';
    } else if (results.some(r => r.severity === 'high')) {
      overallStatus = 'critical';
    } else if (results.some(r => r.severity === 'medium')) {
      overallStatus = 'warning';
    }

    return {
      overallStatus,
      totalIssues,
      processingTime,
      confidence: avgConfidence,
    };
  }
}

export const analysisService = new AnalysisService();

