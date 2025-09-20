import axios from 'axios';
import { UploadResponse, ApiResponse, ApiError, ErrorType } from '@/types';

class UploadService {
  private baseURL = '/api';

  async uploadFile(file: File): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post<ApiResponse<UploadResponse>>(
        `${this.baseURL}/upload/single`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000, // 30秒超时
          onUploadProgress: (progressEvent) => {
            // 这里可以添加上传进度回调
            const progress = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            console.log(`上传进度: ${progress}%`);
          },
        }
      );

      if (!response.data.success || !response.data.data) {
        throw new Error('上传响应格式错误');
      }

      return response.data.data;
    } catch (error) {
      console.error('文件上传失败:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.error) {
          const apiError = error.response.data.error;
          throw {
            type: apiError.type || ErrorType.UPLOAD_ERROR,
            message: apiError.message || '上传失败',
            retryable: apiError.retryable || false,
            details: apiError.details,
          } as ApiError;
        }
        
        if (error.code === 'ECONNABORTED') {
          throw {
            type: ErrorType.NETWORK_ERROR,
            message: '上传超时，请检查网络连接',
            retryable: true,
          } as ApiError;
        }
        
        if (error.response?.status === 413) {
          throw {
            type: ErrorType.FILE_TOO_LARGE,
            message: '文件大小超过限制',
            retryable: false,
          } as ApiError;
        }
      }
      
      throw {
        type: ErrorType.UPLOAD_ERROR,
        message: '上传失败，请重试',
        retryable: true,
      } as ApiError;
    }
  }

  async uploadMultipleFiles(files: File[]): Promise<{
    successful: UploadResponse[];
    failed: string[];
    total: number;
    successCount: number;
    failureCount: number;
  }> {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await axios.post<ApiResponse<{
        successful: UploadResponse[];
        failed: string[];
        total: number;
        successCount: number;
        failureCount: number;
      }>>(
        `${this.baseURL}/upload/multiple`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000, // 60秒超时
        }
      );

      if (!response.data.success || !response.data.data) {
        throw new Error('批量上传响应格式错误');
      }

      return response.data.data;
    } catch (error) {
      console.error('批量文件上传失败:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.error) {
          const apiError = error.response.data.error;
          throw {
            type: apiError.type || ErrorType.UPLOAD_ERROR,
            message: apiError.message || '批量上传失败',
            retryable: apiError.retryable || false,
            details: apiError.details,
          } as ApiError;
        }
      }
      
      throw {
        type: ErrorType.UPLOAD_ERROR,
        message: '批量上传失败，请重试',
        retryable: true,
      } as ApiError;
    }
  }

  async getUploadStatus(imageId: string): Promise<{
    imageId: string;
    status: 'uploaded' | 'processing' | 'completed' | 'failed';
    exists: boolean;
  }> {
    try {
      const response = await axios.get<ApiResponse<{
        imageId: string;
        status: 'uploaded' | 'processing' | 'completed' | 'failed';
        exists: boolean;
      }>>(`${this.baseURL}/upload/status/${imageId}`);

      if (!response.data.success || !response.data.data) {
        throw new Error('状态查询响应格式错误');
      }

      return response.data.data;
    } catch (error) {
      console.error('查询上传状态失败:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.error) {
          const apiError = error.response.data.error;
          throw {
            type: apiError.type || ErrorType.SERVER_ERROR,
            message: apiError.message || '状态查询失败',
            retryable: apiError.retryable || false,
            details: apiError.details,
          } as ApiError;
        }
      }
      
      throw {
        type: ErrorType.SERVER_ERROR,
        message: '状态查询失败，请重试',
        retryable: true,
      } as ApiError;
    }
  }

  async deleteUploadedFile(imageId: string): Promise<{
    imageId: string;
    deleted: boolean;
  }> {
    try {
      const response = await axios.delete<ApiResponse<{
        imageId: string;
        deleted: boolean;
      }>>(`${this.baseURL}/upload/${imageId}`);

      if (!response.data.success || !response.data.data) {
        throw new Error('删除响应格式错误');
      }

      return response.data.data;
    } catch (error) {
      console.error('删除文件失败:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.error) {
          const apiError = error.response.data.error;
          throw {
            type: apiError.type || ErrorType.SERVER_ERROR,
            message: apiError.message || '删除失败',
            retryable: apiError.retryable || false,
            details: apiError.details,
          } as ApiError;
        }
      }
      
      throw {
        type: ErrorType.SERVER_ERROR,
        message: '删除失败，请重试',
        retryable: true,
      } as ApiError;
    }
  }
}

export const uploadService = new UploadService();

