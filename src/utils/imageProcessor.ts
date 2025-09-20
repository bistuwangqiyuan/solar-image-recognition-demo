import * as tf from '@tensorflow/tfjs';

// 图像处理工具类
export class ImageProcessor {
  /**
   * 调整图像大小
   */
  static resizeImage(
    imageElement: HTMLImageElement,
    targetWidth: number,
    targetHeight: number
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('无法获取Canvas上下文');
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // 计算缩放比例，保持宽高比
    const scale = Math.min(targetWidth / imageElement.width, targetHeight / imageElement.height);
    const scaledWidth = imageElement.width * scale;
    const scaledHeight = imageElement.height * scale;

    // 居中绘制
    const x = (targetWidth - scaledWidth) / 2;
    const y = (targetHeight - scaledHeight) / 2;

    ctx.drawImage(imageElement, x, y, scaledWidth, scaledHeight);

    return canvas;
  }

  /**
   * 裁剪图像
   */
  static cropImage(
    imageElement: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('无法获取Canvas上下文');
    }

    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(
      imageElement,
      x, y, width, height,
      0, 0, width, height
    );

    return canvas;
  }

  /**
   * 图像增强
   */
  static enhanceImage(imageElement: HTMLImageElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('无法获取Canvas上下文');
    }

    canvas.width = imageElement.width;
    canvas.height = imageElement.height;

    // 绘制原图
    ctx.drawImage(imageElement, 0, 0);

    // 获取图像数据
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // 应用对比度和亮度调整
    for (let i = 0; i < data.length; i += 4) {
      // 对比度调整
      data[i] = Math.max(0, Math.min(255, (data[i] - 128) * 1.2 + 128));     // R
      data[i + 1] = Math.max(0, Math.min(255, (data[i + 1] - 128) * 1.2 + 128)); // G
      data[i + 2] = Math.max(0, Math.min(255, (data[i + 2] - 128) * 1.2 + 128)); // B
    }

    // 应用锐化滤镜
    const sharpenedData = this.applySharpenFilter(data, canvas.width, canvas.height);
    
    // 将处理后的数据绘制回canvas
    const newImageData = new ImageData(sharpenedData, canvas.width, canvas.height);
    ctx.putImageData(newImageData, 0, 0);

    return canvas;
  }

  /**
   * 应用锐化滤镜
   */
  private static applySharpenFilter(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ): Uint8ClampedArray {
    const sharpenedData = new Uint8ClampedArray(data);
    const kernel = [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) { // RGB channels
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const pixelIndex = ((y + ky) * width + (x + kx)) * 4 + c;
              const kernelIndex = (ky + 1) * 3 + (kx + 1);
              sum += data[pixelIndex] * kernel[kernelIndex];
            }
          }
          const pixelIndex = (y * width + x) * 4 + c;
          sharpenedData[pixelIndex] = Math.max(0, Math.min(255, sum));
        }
      }
    }

    return sharpenedData;
  }

  /**
   * 检测图像中的边缘
   */
  static detectEdges(imageElement: HTMLImageElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('无法获取Canvas上下文');
    }

    canvas.width = imageElement.width;
    canvas.height = imageElement.height;

    // 绘制原图
    ctx.drawImage(imageElement, 0, 0);

    // 获取图像数据
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // 转换为灰度图
    const grayData = new Uint8ClampedArray(canvas.width * canvas.height);
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      grayData[i / 4] = gray;
    }

    // 应用Sobel边缘检测
    const edgeData = this.applySobelFilter(grayData, canvas.width, canvas.height);

    // 创建边缘图像
    const edgeImageData = new ImageData(canvas.width, canvas.height);
    for (let i = 0; i < edgeData.length; i++) {
      const value = edgeData[i];
      edgeImageData.data[i * 4] = value;     // R
      edgeImageData.data[i * 4 + 1] = value; // G
      edgeImageData.data[i * 4 + 2] = value; // B
      edgeImageData.data[i * 4 + 3] = 255;   // A
    }

    ctx.putImageData(edgeImageData, 0, 0);

    return canvas;
  }

  /**
   * 应用Sobel边缘检测
   */
  private static applySobelFilter(
    grayData: Uint8ClampedArray,
    width: number,
    height: number
  ): Uint8ClampedArray {
    const edgeData = new Uint8ClampedArray(width * height);
    
    // Sobel X kernel
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    // Sobel Y kernel
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixelIndex = (y + ky) * width + (x + kx);
            const kernelIndex = (ky + 1) * 3 + (kx + 1);
            gx += grayData[pixelIndex] * sobelX[kernelIndex];
            gy += grayData[pixelIndex] * sobelY[kernelIndex];
          }
        }
        
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        edgeData[y * width + x] = Math.min(255, magnitude);
      }
    }

    return edgeData;
  }

  /**
   * 生成图像缩略图
   */
  static generateThumbnail(
    imageElement: HTMLImageElement,
    maxWidth: number = 200,
    maxHeight: number = 200
  ): HTMLCanvasElement {
    return this.resizeImage(imageElement, maxWidth, maxHeight);
  }

  /**
   * 将Canvas转换为Blob
   */
  static canvasToBlob(canvas: HTMLCanvasElement, quality: number = 0.8): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas转换失败'));
        }
      }, 'image/jpeg', quality);
    });
  }

  /**
   * 将Canvas转换为DataURL
   */
  static canvasToDataURL(canvas: HTMLCanvasElement, quality: number = 0.8): string {
    return canvas.toDataURL('image/jpeg', quality);
  }

  /**
   * 计算图像直方图
   */
  static calculateHistogram(imageElement: HTMLImageElement): {
    red: number[];
    green: number[];
    blue: number[];
    gray: number[];
  } {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('无法获取Canvas上下文');
    }

    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    ctx.drawImage(imageElement, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const redHist = new Array(256).fill(0);
    const greenHist = new Array(256).fill(0);
    const blueHist = new Array(256).fill(0);
    const grayHist = new Array(256).fill(0);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

      redHist[r]++;
      greenHist[g]++;
      blueHist[b]++;
      grayHist[gray]++;
    }

    return {
      red: redHist,
      green: greenHist,
      blue: blueHist,
      gray: grayHist,
    };
  }

  /**
   * 检测图像质量指标
   */
  static analyzeImageQuality(imageElement: HTMLImageElement): {
    brightness: number;
    contrast: number;
    sharpness: number;
    noise: number;
  } {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('无法获取Canvas上下文');
    }

    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    ctx.drawImage(imageElement, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let totalBrightness = 0;
    let totalContrast = 0;
    let totalSharpness = 0;
    let totalNoise = 0;
    let pixelCount = 0;

    // 计算亮度和对比度
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      
      totalBrightness += gray;
      pixelCount++;
    }

    const avgBrightness = totalBrightness / pixelCount;

    // 计算对比度
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      
      totalContrast += Math.abs(gray - avgBrightness);
    }

    const contrast = totalContrast / pixelCount;

    // 计算锐度（使用拉普拉斯算子）
    for (let y = 1; y < canvas.height - 1; y++) {
      for (let x = 1; x < canvas.width - 1; x++) {
        const center = (y * canvas.width + x) * 4;
        const gray = Math.round(0.299 * data[center] + 0.587 * data[center + 1] + 0.114 * data[center + 2]);
        
        const top = ((y - 1) * canvas.width + x) * 4;
        const topGray = Math.round(0.299 * data[top] + 0.587 * data[top + 1] + 0.114 * data[top + 2]);
        
        const bottom = ((y + 1) * canvas.width + x) * 4;
        const bottomGray = Math.round(0.299 * data[bottom] + 0.587 * data[bottom + 1] + 0.114 * data[bottom + 2]);
        
        const left = (y * canvas.width + (x - 1)) * 4;
        const leftGray = Math.round(0.299 * data[left] + 0.587 * data[left + 1] + 0.114 * data[left + 2]);
        
        const right = (y * canvas.width + (x + 1)) * 4;
        const rightGray = Math.round(0.299 * data[right] + 0.587 * data[right + 1] + 0.114 * data[right + 2]);
        
        const laplacian = Math.abs(4 * gray - topGray - bottomGray - leftGray - rightGray);
        totalSharpness += laplacian;
      }
    }

    const sharpness = totalSharpness / ((canvas.width - 2) * (canvas.height - 2));

    // 计算噪声（简化版本）
    const noise = Math.random() * 0.1; // 实际项目中需要更复杂的噪声检测算法

    return {
      brightness: avgBrightness / 255,
      contrast: contrast / 255,
      sharpness: sharpness / 255,
      noise,
    };
  }
}
