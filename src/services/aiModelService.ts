import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as knnClassifier from '@tensorflow-models/knn-classifier';
import { DetectionResult, PanelCondition, Severity, BoundingBox } from '@/types';

interface ModelConfig {
  inputSize: [number, number];
  numClasses: number;
  confidenceThreshold: number;
  nmsThreshold: number;
}

interface ColorAnalysisResult {
  greenRatio: number;
  dustRatio: number;
  shadowRatio: number;
  normalRatio: number;
  greenRegion: number;
  dustRegion: number;
  shadowRegion: number;
  normalRegion: number;
}

const REFERENCE_IMAGES: Record<string, string> = {
  [PanelCondition.NORMAL]: '/static/demo/normal-panel.jpg',
  [PanelCondition.LEAVES]: '/static/demo/leaves-cover.jpg',
  [PanelCondition.DUST]: '/static/demo/dust-cover.jpg',
  [PanelCondition.SHADOW]: '/static/demo/cloud-shadow.jpg',
  [PanelCondition.OTHER]: '/static/demo/abnormal-condition.jpg',
};

const SEVERITY_MAP: Record<PanelCondition, Severity> = {
  [PanelCondition.NORMAL]: Severity.LOW,
  [PanelCondition.LEAVES]: Severity.MEDIUM,
  [PanelCondition.DUST]: Severity.MEDIUM,
  [PanelCondition.SHADOW]: Severity.LOW,
  [PanelCondition.OTHER]: Severity.HIGH,
};

const DESCRIPTION_MAP: Record<PanelCondition, string> = {
  [PanelCondition.NORMAL]: '正常光伏板区域',
  [PanelCondition.LEAVES]: '检测到树叶遮挡',
  [PanelCondition.DUST]: '检测到灰尘覆盖',
  [PanelCondition.SHADOW]: '检测到阴影遮挡',
  [PanelCondition.OTHER]: '检测到异常情况',
};

class AIModelService {
  private mobileNetModel: mobilenet.MobileNet | null = null;
  private classifier: knnClassifier.KNNClassifier | null = null;
  private config: ModelConfig = {
    inputSize: [224, 224],
    numClasses: 5,
    confidenceThreshold: 0.3,
    nmsThreshold: 0.4,
  };
  private isModelLoaded = false;
  private isLoading = false;

  async initializeModel(): Promise<void> {
    if (this.isModelLoaded || this.isLoading) return;
    this.isLoading = true;

    try {
      console.log('正在加载 MobileNet V2 模型...');

      this.mobileNetModel = await mobilenet.load({ version: 2, alpha: 1.0 });
      this.classifier = knnClassifier.create();

      await this.trainClassifier();

      this.isModelLoaded = true;
      console.log('AI模型加载成功 — MobileNet V2 + KNN 分类器就绪');
    } catch (error) {
      console.error('AI模型加载失败:', error);
      throw new Error('AI模型初始化失败');
    } finally {
      this.isLoading = false;
    }
  }

  private async trainClassifier(): Promise<void> {
    if (!this.mobileNetModel || !this.classifier) return;
    console.log('正在使用参考图片训练 KNN 分类器...');

    for (const [category, imageUrl] of Object.entries(REFERENCE_IMAGES)) {
      try {
        const img = await this.loadImage(imageUrl);
        this.addTrainingExample(img, category);

        tf.tidy(() => {
          const pixels = tf.browser.fromPixels(img).toFloat().expandDims(0) as tf.Tensor4D;
          const flipped = tf.image.flipLeftRight(pixels).squeeze([0]);
          const flippedEmbedding = this.mobileNetModel!.infer(flipped as tf.Tensor3D, true);
          this.classifier!.addExample(flippedEmbedding, category);
        });

        console.log(`  已训练类别: ${category}`);
      } catch (err) {
        console.warn(`参考图片处理失败 (${category}): ${imageUrl}`, err);
      }
    }

    try {
      const mixedImg = await this.loadImage('/static/demo/mixed-issues.jpg');
      this.addTrainingExample(mixedImg, PanelCondition.OTHER);
    } catch { /* optional extra example */ }

    console.log('KNN 分类器训练完成');
  }

  private addTrainingExample(img: HTMLImageElement, label: string): void {
    if (!this.mobileNetModel || !this.classifier) return;
    const embedding = this.mobileNetModel.infer(img, true);
    this.classifier.addExample(embedding, label);
    embedding.dispose();
  }

  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`图片加载失败: ${url}`));
      img.src = url;
    });
  }

  async analyzeImage(imageElement: HTMLImageElement): Promise<DetectionResult[]> {
    if (!this.isModelLoaded) await this.initializeModel();
    if (!this.mobileNetModel || !this.classifier) throw new Error('AI模型未加载');

    const startTime = performance.now();
    console.log('开始 AI 图像分析...');

    const imgW = imageElement.naturalWidth || imageElement.width;
    const imgH = imageElement.naturalHeight || imageElement.height;

    const fullEmbedding = this.mobileNetModel.infer(imageElement, true);
    const prediction = await this.classifier.predictClass(fullEmbedding);
    fullEmbedding.dispose();

    const primaryCategory = prediction.label as PanelCondition;
    const primaryConfidence = prediction.confidences[primaryCategory] ?? 0;

    const imagenetPreds = await this.mobileNetModel.classify(imageElement, 5);
    console.log(
      'ImageNet Top-5:',
      imagenetPreds.map(p => `${p.className}: ${(p.probability * 100).toFixed(1)}%`),
    );

    const colorAnalysis = this.analyzeColors(imageElement);

    const results: DetectionResult[] = [];

    results.push({
      category: primaryCategory,
      confidence: clamp(primaryConfidence * 0.85 + 0.1, 0, 0.98),
      boundingBox: {
        x: Math.round(imgW * 0.05),
        y: Math.round(imgH * 0.05),
        width: Math.round(imgW * 0.9),
        height: Math.round(imgH * 0.9),
      },
      description: DESCRIPTION_MAP[primaryCategory],
      severity: SEVERITY_MAP[primaryCategory],
    });

    this.addColorBasedDetections(results, primaryCategory, colorAnalysis, imgW, imgH);

    if (primaryCategory !== PanelCondition.NORMAL && colorAnalysis.normalRatio > 0.2) {
      results.push({
        category: PanelCondition.NORMAL,
        confidence: clamp(colorAnalysis.normalRatio * 1.5, 0, 0.8),
        boundingBox: this.quadrantBox(imgW, imgH, colorAnalysis.normalRegion),
        description: DESCRIPTION_MAP[PanelCondition.NORMAL],
        severity: SEVERITY_MAP[PanelCondition.NORMAL],
      });
    }

    const filtered = results
      .filter(r => r.confidence >= this.config.confidenceThreshold)
      .sort((a, b) => b.confidence - a.confidence);

    const elapsed = Math.round(performance.now() - startTime);
    console.log(`AI 分析完成，耗时 ${elapsed}ms，检测到 ${filtered.length} 个区域`);

    return filtered;
  }

  private addColorBasedDetections(
    results: DetectionResult[],
    primaryCategory: PanelCondition,
    ca: ColorAnalysisResult,
    imgW: number,
    imgH: number,
  ): void {
    const secondary: Array<{
      condition: PanelCondition;
      ratio: number;
      region: number;
      threshold: number;
      scale: number;
    }> = [
      { condition: PanelCondition.LEAVES, ratio: ca.greenRatio, region: ca.greenRegion, threshold: 0.15, scale: 2 },
      { condition: PanelCondition.DUST, ratio: ca.dustRatio, region: ca.dustRegion, threshold: 0.2, scale: 1.5 },
      { condition: PanelCondition.SHADOW, ratio: ca.shadowRatio, region: ca.shadowRegion, threshold: 0.25, scale: 1.2 },
    ];

    for (const s of secondary) {
      if (s.ratio > s.threshold && s.condition !== primaryCategory) {
        results.push({
          category: s.condition,
          confidence: clamp(s.ratio * s.scale, 0, 0.85),
          boundingBox: this.quadrantBox(imgW, imgH, s.region),
          description: DESCRIPTION_MAP[s.condition],
          severity: SEVERITY_MAP[s.condition],
        });
      }
    }
  }

  private analyzeColors(imageElement: HTMLImageElement): ColorAnalysisResult {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const w = Math.min(imageElement.naturalWidth || imageElement.width, 200);
    const h = Math.min(imageElement.naturalHeight || imageElement.height, 200);
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(imageElement, 0, 0, w, h);

    const { data } = ctx.getImageData(0, 0, w, h);
    const totalPixels = w * h;

    let greenPx = 0, dustPx = 0, shadowPx = 0, normalPx = 0;
    const quadrants = {
      green: [0, 0, 0, 0],
      dust: [0, 0, 0, 0],
      shadow: [0, 0, 0, 0],
      normal: [0, 0, 0, 0],
    };

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const brightness = (r + g + b) / 3;
        const q = (y < h / 2 ? 0 : 2) + (x < w / 2 ? 0 : 1);

        if (g > r * 1.2 && g > b * 1.1 && g > 60) { greenPx++; quadrants.green[q]++; }
        if (r > 100 && g > 80 && b < 120 && Math.abs(r - g) < 40 && r > b * 1.2) { dustPx++; quadrants.dust[q]++; }
        if (brightness < 80) { shadowPx++; quadrants.shadow[q]++; }
        if (b > r && b > 80 && brightness > 60 && brightness < 200) { normalPx++; quadrants.normal[q]++; }
      }
    }

    const dominantQuadrant = (arr: number[]) => arr.indexOf(Math.max(...arr));

    return {
      greenRatio: greenPx / totalPixels,
      dustRatio: dustPx / totalPixels,
      shadowRatio: shadowPx / totalPixels,
      normalRatio: normalPx / totalPixels,
      greenRegion: dominantQuadrant(quadrants.green),
      dustRegion: dominantQuadrant(quadrants.dust),
      shadowRegion: dominantQuadrant(quadrants.shadow),
      normalRegion: dominantQuadrant(quadrants.normal),
    };
  }

  private quadrantBox(imgW: number, imgH: number, quadrant: number): BoundingBox {
    const halfW = imgW / 2;
    const halfH = imgH / 2;
    const pad = 0.05;
    const regionW = Math.round(halfW * 0.85);
    const regionH = Math.round(halfH * 0.85);

    switch (quadrant) {
      case 0: return { x: Math.round(imgW * pad), y: Math.round(imgH * pad), width: regionW, height: regionH };
      case 1: return { x: Math.round(halfW + imgW * pad), y: Math.round(imgH * pad), width: regionW, height: regionH };
      case 2: return { x: Math.round(imgW * pad), y: Math.round(halfH + imgH * pad), width: regionW, height: regionH };
      case 3: return { x: Math.round(halfW + imgW * pad), y: Math.round(halfH + imgH * pad), width: regionW, height: regionH };
      default: return { x: Math.round(imgW * 0.1), y: Math.round(imgH * 0.1), width: Math.round(imgW * 0.8), height: Math.round(imgH * 0.8) };
    }
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
    if (this.classifier) {
      this.classifier.dispose();
      this.classifier = null;
    }
    this.mobileNetModel = null;
    this.isModelLoaded = false;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export const aiModelService = new AIModelService();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    aiModelService.dispose();
  });
}
