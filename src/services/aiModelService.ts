import * as tf from '@tensorflow/tfjs';
import { DetectionResult, PanelCondition, Severity, BoundingBox } from '@/types';

// AI模型配置
interface ModelConfig {
  inputSize: [number, number];
  numClasses: number;
  confidenceThreshold: number;
  nmsThreshold: number;
}

// 模型预测结果
interface ModelPrediction {
  boxes: number[][];
  scores: number[];
  classes: number[];
}

class AIModelService {
  private model: tf.LayersModel | null = null;
  private config: ModelConfig = {
    inputSize: [224, 224],
    numClasses: 5, // normal, leaves, dust, shadow, other
    confidenceThreshold: 0.5,
    nmsThreshold: 0.4,
  };
  private isModelLoaded = false;
  private isLoading = false;

  // 类别标签映射
  private classLabels = {
    0: PanelCondition.NORMAL,
    1: PanelCondition.LEAVES,
    2: PanelCondition.DUST,
    3: PanelCondition.SHADOW,
    4: PanelCondition.OTHER,
  };

  // 严重程度映射
  private severityMapping = {
    [PanelCondition.NORMAL]: Severity.LOW,
    [PanelCondition.LEAVES]: Severity.MEDIUM,
    [PanelCondition.DUST]: Severity.MEDIUM,
    [PanelCondition.SHADOW]: Severity.LOW,
    [PanelCondition.OTHER]: Severity.HIGH,
  };

  // 描述映射
  private descriptionMapping = {
    [PanelCondition.NORMAL]: '正常光伏板区域',
    [PanelCondition.LEAVES]: '检测到树叶遮挡',
    [PanelCondition.DUST]: '检测到灰尘覆盖',
    [PanelCondition.SHADOW]: '检测到阴影遮挡',
    [PanelCondition.OTHER]: '检测到异常情况',
  };

  /**
   * 初始化AI模型
   */
  async initializeModel(): Promise<void> {
    if (this.isModelLoaded || this.isLoading) {
      return;
    }

    this.isLoading = true;
    
    try {
      console.log('正在加载AI模型...');
      
      // 创建一个简单的CNN模型用于演示
      // 实际项目中这里会加载预训练的模型
      this.model = await this.createMockModel();
      
      this.isModelLoaded = true;
      console.log('AI模型加载成功');
    } catch (error) {
      console.error('AI模型加载失败:', error);
      this.isLoading = false;
      throw new Error('AI模型初始化失败');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * 创建模拟模型（用于演示）
   * 实际项目中这里会加载真实的预训练模型
   */
  private async createMockModel(): Promise<tf.LayersModel> {
    const model = tf.sequential({
      layers: [
        tf.layers.conv2d({
          inputShape: [224, 224, 3],
          filters: 32,
          kernelSize: 3,
          activation: 'relu',
        }),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.conv2d({
          filters: 64,
          kernelSize: 3,
          activation: 'relu',
        }),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.conv2d({
          filters: 128,
          kernelSize: 3,
          activation: 'relu',
        }),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.flatten(),
        tf.layers.dense({ units: 512, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.5 }),
        tf.layers.dense({ units: this.config.numClasses, activation: 'softmax' }),
      ],
    });

    // 编译模型
    model.compile({
      optimizer: 'adam',
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
    });

    return model;
  }

  /**
   * 预处理图像
   */
  private preprocessImage(imageElement: HTMLImageElement): tf.Tensor4D {
    // 调整图像大小
    const resized = tf.image.resizeBilinear(
      tf.browser.fromPixels(imageElement),
      this.config.inputSize
    );

    // 归一化到 [0, 1]
    const normalized = resized.div(255.0);

    // 添加批次维度
    const batched = normalized.expandDims(0);

    return batched as tf.Tensor4D;
  }

  /**
   * 后处理预测结果
   */
  private postprocessPredictions(
    predictions: tf.Tensor,
    originalWidth: number,
    originalHeight: number
  ): DetectionResult[] {
    const results: DetectionResult[] = [];
    const predArray = predictions.arraySync() as number[][];

    // 模拟边界框检测（实际项目中会使用更复杂的后处理）
    const mockBoxes = [
      { x: 0.1, y: 0.1, width: 0.3, height: 0.2 }, // 正常区域
      { x: 0.4, y: 0.3, width: 0.2, height: 0.15 }, // 树叶
      { x: 0.6, y: 0.5, width: 0.25, height: 0.2 }, // 灰尘
    ];

    predArray[0].forEach((confidence, classIndex) => {
      if (confidence > this.config.confidenceThreshold) {
        const category = this.classLabels[classIndex as keyof typeof this.classLabels];
        const boxIndex = Math.min(classIndex, mockBoxes.length - 1);
        const box = mockBoxes[boxIndex];

        const boundingBox: BoundingBox = {
          x: Math.round(box.x * originalWidth),
          y: Math.round(box.y * originalHeight),
          width: Math.round(box.width * originalWidth),
          height: Math.round(box.height * originalHeight),
        };

        results.push({
          category,
          confidence,
          boundingBox,
          description: this.descriptionMapping[category],
          severity: this.severityMapping[category],
        });
      }
    });

    // 按置信度排序
    return results.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 分析图像
   */
  async analyzeImage(imageElement: HTMLImageElement): Promise<DetectionResult[]> {
    if (!this.isModelLoaded) {
      await this.initializeModel();
    }

    if (!this.model) {
      throw new Error('AI模型未加载');
    }

    try {
      console.log('开始AI图像分析...');
      
      // 预处理图像
      const preprocessedImage = this.preprocessImage(imageElement);
      
      // 模型预测
      const predictions = this.model.predict(preprocessedImage) as tf.Tensor;
      
      // 后处理结果
      const results = this.postprocessPredictions(
        predictions,
        imageElement.width,
        imageElement.height
      );

      // 清理张量
      preprocessedImage.dispose();
      predictions.dispose();

      console.log('AI分析完成，检测到', results.length, '个区域');
      return results;
    } catch (error) {
      console.error('AI图像分析失败:', error);
      throw new Error('AI图像分析失败');
    }
  }

  /**
   * 批量分析图像
   */
  async batchAnalyzeImages(imageElements: HTMLImageElement[]): Promise<DetectionResult[][]> {
    const results: DetectionResult[][] = [];

    for (const imageElement of imageElements) {
      try {
        const result = await this.analyzeImage(imageElement);
        results.push(result);
      } catch (error) {
        console.error('批量分析中单个图像失败:', error);
        results.push([]);
      }
    }

    return results;
  }

  /**
   * 获取模型信息
   */
  getModelInfo(): {
    isLoaded: boolean;
    isLoading: boolean;
    config: ModelConfig;
    inputSize: [number, number];
    numClasses: number;
  } {
    return {
      isLoaded: this.isModelLoaded,
      isLoading: this.isLoading,
      config: this.config,
      inputSize: this.config.inputSize,
      numClasses: this.config.numClasses,
    };
  }

  /**
   * 更新模型配置
   */
  updateConfig(newConfig: Partial<ModelConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 释放模型资源
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
      this.isModelLoaded = false;
    }
  }
}

// 创建单例实例
export const aiModelService = new AIModelService();

// 在页面卸载时清理资源
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    aiModelService.dispose();
  });
}
