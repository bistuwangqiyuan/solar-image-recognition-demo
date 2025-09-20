// 光伏板状态枚举
export enum PanelCondition {
  NORMAL = 'normal',
  LEAVES = 'leaves',
  DUST = 'dust',
  SHADOW = 'shadow',
  OTHER = 'other',
}

// 严重程度枚举
export enum Severity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

// 错误类型枚举
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  AI_PROCESSING_ERROR = 'AI_PROCESSING_ERROR',
  UPLOAD_ERROR = 'UPLOAD_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
}

// 边界框接口
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 图像元数据接口
export interface ImageMetadata {
  size: number;
  dimensions: { width: number; height: number };
  format: string;
  uploadTime: Date;
}

// 图像数据接口
export interface ImageData {
  id: string;
  originalName: string;
  url: string;
  thumbnailUrl: string;
  metadata: ImageMetadata;
  sessionId: string;
  expiresAt: Date;
}

// 检测结果接口
export interface DetectionResult {
  category: PanelCondition;
  confidence: number;
  boundingBox: BoundingBox;
  description: string;
  severity: Severity;
}

// 推荐建议接口
export interface Recommendation {
  type: 'maintenance' | 'cleaning' | 'inspection' | 'replacement';
  priority: Severity;
  description: string;
  estimatedCost?: number;
  estimatedTime?: string;
}

// 分析结果摘要接口
export interface AnalysisSummary {
  overallStatus: 'healthy' | 'warning' | 'critical';
  totalIssues: number;
  processingTime: number;
  confidence: number;
}

// 完整分析结果接口
export interface AnalysisResult {
  imageId: string;
  results: DetectionResult[];
  summary: AnalysisSummary;
  recommendations: Recommendation[];
  createdAt: Date;
}

// API响应基础接口
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: Date;
}

// API错误接口
export interface ApiError {
  type: ErrorType;
  message: string;
  details?: any;
  retryable: boolean;
  code?: string;
}

// 上传请求接口
export interface UploadRequest {
  file: File;
  sessionId?: string;
}

// 上传响应接口
export interface UploadResponse {
  imageId: string;
  originalUrl: string;
  thumbnailUrl: string;
  metadata: ImageMetadata;
}

// 分析请求接口
export interface AnalysisRequest {
  imageId: string;
  options?: {
    confidence: number;
    detailLevel: 'basic' | 'detailed';
  };
}

// 分析响应接口
export interface AnalysisResponse {
  results: DetectionResult[];
  summary: AnalysisSummary;
  recommendations: Recommendation[];
  processingTime: number;
}

// 会话数据接口
export interface SessionData {
  id: string;
  images: ImageData[];
  analyses: AnalysisResult[];
  createdAt: Date;
  lastAccessed: Date;
  expiresAt: Date;
}

// 用户配置接口
export interface UserConfig {
  theme: 'light' | 'dark' | 'auto';
  language: 'zh-CN' | 'en-US';
  notifications: boolean;
  autoDelete: boolean;
  deleteAfterHours: number;
}

// 应用状态接口
export interface AppState {
  isLoading: boolean;
  error: ApiError | null;
  currentSession: SessionData | null;
  userConfig: UserConfig;
}

// 组件Props基础接口
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// 上传组件Props接口
export interface UploadComponentProps extends BaseComponentProps {
  onUpload: (file: File) => void;
  onError: (error: ApiError) => void;
  maxSize?: number;
  acceptedTypes?: string[];
  disabled?: boolean;
}

// 结果展示组件Props接口
export interface ResultsDisplayProps extends BaseComponentProps {
  result: AnalysisResult;
  imageUrl: string;
  onExport?: () => void;
  onRetry?: () => void;
}

// 演示数据接口
export interface DemoData {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  expectedResults: DetectionResult[];
  category: PanelCondition;
}

// 统计信息接口
export interface Statistics {
  totalUploads: number;
  totalAnalyses: number;
  averageProcessingTime: number;
  accuracyRate: number;
  mostCommonIssue: PanelCondition;
  lastUpdated: Date;
}

