import axios from 'axios';
import { DetectionResult, PanelCondition, Severity } from '@/types';
import { analyzeImageOffline } from './offlineAnalysis';

type AnalysisEngine = 'vision-api' | 'python-cv' | 'offline';

interface ModelConfig {
  inputSize: [number, number];
  numClasses: number;
  confidenceThreshold: number;
  nmsThreshold: number;
}

interface AnalysisMetadata {
  engine: AnalysisEngine;
  provider?: string;
  processingTime: number;
}

class AIModelService {
  private config: ModelConfig = {
    inputSize: [256, 256],
    numClasses: 8,
    confidenceThreshold: 0.3,
    nmsThreshold: 0.4,
  };
  private isModelLoaded = false;
  private isLoading = false;
  private lastMetadata: AnalysisMetadata | null = null;

  async initializeModel(): Promise<void> {
    if (this.isModelLoaded || this.isLoading) return;
    this.isLoading = true;

    try {
      console.log('正在连接 Vision API 分析引擎...');
      const response = await axios.get('/api/health', { timeout: 10000 });
      if (response.data?.success) {
        this.isModelLoaded = true;
        console.log('服务端分析引擎已就绪 (Vision API + Python CV)');
      }
    } catch {
      console.warn('服务端健康检查未通过，将在分析时尝试连接或使用离线模式');
      this.isModelLoaded = true;
    } finally {
      this.isLoading = false;
    }
  }

  async analyzeImage(imageElement: HTMLImageElement): Promise<DetectionResult[]> {
    if (!this.isModelLoaded) await this.initializeModel();

    const startTime = performance.now();

    // Tier 1: Vision API (Groq / Mistral / 智谱 auto-fallback)
    try {
      console.log('[Tier 1] 尝试 Vision API 分析...');
      const results = await this.analyzeWithVisionAPI(imageElement);
      const elapsed = Math.round(performance.now() - startTime);
      console.log(`Vision API 分析完成，耗时 ${elapsed}ms，检测到 ${results.length} 个区域`);
      return results;
    } catch (visionError) {
      console.warn('[Tier 1] Vision API 失败:', visionError);
    }

    // Tier 2: Python CV Pipeline
    try {
      console.log('[Tier 2] 尝试 Python CV 分析...');
      const results = await this.analyzeWithPythonCV(imageElement);
      const elapsed = Math.round(performance.now() - startTime);
      console.log(`Python CV 分析完成，耗时 ${elapsed}ms，检测到 ${results.length} 个区域`);
      return results;
    } catch (pythonError) {
      console.warn('[Tier 2] Python CV 失败:', pythonError);
    }

    // Tier 3: Browser offline analysis
    console.log('[Tier 3] 使用浏览器端离线分析...');
    const results = analyzeImageOffline(imageElement);
    const elapsed = Math.round(performance.now() - startTime);
    this.lastMetadata = { engine: 'offline', processingTime: elapsed };
    console.log(`离线分析完成，耗时 ${elapsed}ms，检测到 ${results.length} 个区域`);
    return results;
  }

  private async analyzeWithVisionAPI(imageElement: HTMLImageElement): Promise<DetectionResult[]> {
    const { base64, width, height } = await this.imageToBase64(imageElement);

    const response = await axios.post('/api/analyze-vision', {
      image: base64,
      width,
      height,
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000,
    });

    if (!response.data?.success || !response.data?.data?.results) {
      if (response.data?.fallback) {
        throw new Error('Vision API unavailable, fallback requested');
      }
      throw new Error('Vision API 响应格式错误');
    }

    this.lastMetadata = {
      engine: 'vision-api',
      provider: response.data.data.provider,
      processingTime: response.data.data.processingTime,
    };

    return response.data.data.results.map((r: any) => ({
      category: this.mapCategory(r.category),
      confidence: r.confidence,
      boundingBox: r.boundingBox,
      description: r.description,
      severity: r.severity as Severity,
    }));
  }

  private async analyzeWithPythonCV(imageElement: HTMLImageElement): Promise<DetectionResult[]> {
    const blob = await this.imageToBlob(imageElement);
    const formData = new FormData();
    formData.append('file', blob, 'analysis.jpg');

    const response = await axios.post('/api/analyze-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });

    if (!response.data?.success || !response.data?.data?.results) {
      throw new Error('Python CV 响应格式错误');
    }

    this.lastMetadata = {
      engine: 'python-cv',
      processingTime: response.data.data.processingTime || 0,
    };

    return response.data.data.results.map((r: any) => ({
      category: r.category as PanelCondition,
      confidence: r.confidence,
      boundingBox: r.boundingBox,
      description: r.description,
      severity: r.severity as Severity,
    }));
  }

  private mapCategory(cat: string): PanelCondition {
    const mapping: Record<string, PanelCondition> = {
      normal: PanelCondition.NORMAL,
      leaves: PanelCondition.LEAVES,
      dust: PanelCondition.DUST,
      shadow: PanelCondition.SHADOW,
      crack: PanelCondition.OTHER,
      hotspot: PanelCondition.OTHER,
      corrosion: PanelCondition.OTHER,
      other: PanelCondition.OTHER,
    };
    return mapping[cat] ?? PanelCondition.OTHER;
  }

  private imageToBase64(imageElement: HTMLImageElement): Promise<{ base64: string; width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('无法创建 Canvas')); return; }

      const origW = imageElement.naturalWidth || imageElement.width;
      const origH = imageElement.naturalHeight || imageElement.height;

      const MAX_DIM = 1536;
      let w = origW, h = origH;
      if (w > MAX_DIM || h > MAX_DIM) {
        const scale = MAX_DIM / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }

      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(imageElement, 0, 0, w, h);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      resolve({ base64: dataUrl, width: w, height: h });
    });
  }

  private imageToBlob(imageElement: HTMLImageElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('无法创建 Canvas')); return; }

      canvas.width = imageElement.naturalWidth || imageElement.width;
      canvas.height = imageElement.naturalHeight || imageElement.height;
      ctx.drawImage(imageElement, 0, 0);

      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('图像转换失败')),
        'image/jpeg',
        0.92,
      );
    });
  }

  async batchAnalyzeImages(imageElements: HTMLImageElement[]): Promise<DetectionResult[][]> {
    const results: DetectionResult[][] = [];
    for (const img of imageElements) {
      try {
        results.push(await this.analyzeImage(img));
      } catch {
        results.push([]);
      }
    }
    return results;
  }

  getLastMetadata(): AnalysisMetadata | null {
    return this.lastMetadata;
  }

  getModelInfo() {
    return {
      isLoaded: this.isModelLoaded,
      isLoading: this.isLoading,
      config: this.config,
      inputSize: this.config.inputSize,
      numClasses: this.config.numClasses,
    };
  }

  updateConfig(newConfig: Partial<ModelConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  dispose(): void {
    this.isModelLoaded = false;
    this.lastMetadata = null;
  }
}

export const aiModelService = new AIModelService();
