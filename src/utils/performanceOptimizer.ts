import { ImageProcessor } from './imageProcessor';

// 性能监控工具
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // 开始性能测量
  startMeasure(name: string): void {
    performance.mark(`${name}-start`);
  }

  // 结束性能测量
  endMeasure(name: string): number {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name, 'measure')[0];
    const duration = measure.duration;
    
    this.metrics.set(name, duration);
    
    // 清理标记
    performance.clearMarks(`${name}-start`);
    performance.clearMarks(`${name}-end`);
    performance.clearMeasures(name);
    
    return duration;
  }

  // 获取性能指标
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  // 获取特定指标
  getMetric(name: string): number | undefined {
    return this.metrics.get(name);
  }

  // 清除所有指标
  clearMetrics(): void {
    this.metrics.clear();
  }

  // 监控Web Vitals
  observeWebVitals(): void {
    if ('PerformanceObserver' in window) {
      // 监控LCP (Largest Contentful Paint)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.set('LCP', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // 监控FID (First Input Delay)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.metrics.set('FID', entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);

      // 监控CLS (Cumulative Layout Shift)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.metrics.set('CLS', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    }
  }

  // 清理观察者
  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// 图像优化工具
export class ImageOptimizer {
  private static readonly MAX_WIDTH = 1920;
  private static readonly MAX_HEIGHT = 1080;
  private static readonly QUALITY = 0.8;
  private static readonly WEBP_QUALITY = 0.85;

  /**
   * 优化图像文件
   */
  static async optimizeImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('无法获取Canvas上下文'));
        return;
      }

      img.onload = () => {
        try {
          // 计算优化后的尺寸
          const { width, height } = this.calculateOptimalSize(
            img.naturalWidth,
            img.naturalHeight
          );

          canvas.width = width;
          canvas.height = height;

          // 绘制优化后的图像
          ctx.drawImage(img, 0, 0, width, height);

          // 转换为Blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const optimizedFile = new File([blob], file.name, {
                  type: this.getOptimizedMimeType(file.type),
                  lastModified: Date.now(),
                });
                resolve(optimizedFile);
              } else {
                reject(new Error('图像优化失败'));
              }
            },
            this.getOptimizedMimeType(file.type),
            this.getQuality(file.type)
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('图像加载失败'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * 计算最优尺寸
   */
  private static calculateOptimalSize(
    originalWidth: number,
    originalHeight: number
  ): { width: number; height: number } {
    if (originalWidth <= this.MAX_WIDTH && originalHeight <= this.MAX_HEIGHT) {
      return { width: originalWidth, height: originalHeight };
    }

    const aspectRatio = originalWidth / originalHeight;

    let width = originalWidth;
    let height = originalHeight;

    if (width > this.MAX_WIDTH) {
      width = this.MAX_WIDTH;
      height = width / aspectRatio;
    }

    if (height > this.MAX_HEIGHT) {
      height = this.MAX_HEIGHT;
      width = height * aspectRatio;
    }

    return { width: Math.round(width), height: Math.round(height) };
  }

  /**
   * 获取优化的MIME类型
   */
  private static getOptimizedMimeType(originalType: string): string {
    if (this.supportsWebP()) {
      return 'image/webp';
    }
    return originalType === 'image/png' ? 'image/jpeg' : originalType;
  }

  /**
   * 获取质量参数
   */
  private static getQuality(mimeType: string): number {
    if (mimeType === 'image/webp') {
      return this.WEBP_QUALITY;
    }
    return this.QUALITY;
  }

  /**
   * 检查是否支持WebP
   */
  private static supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  /**
   * 生成响应式图像
   */
  static async generateResponsiveImages(file: File): Promise<{
    original: File;
    large: File;
    medium: File;
    small: File;
    thumbnail: File;
  }> {
    const sizes = [
      { name: 'large', maxSize: 1920 },
      { name: 'medium', maxSize: 1024 },
      { name: 'small', maxSize: 512 },
      { name: 'thumbnail', maxSize: 200 },
    ];

    const results: any = { original: file };

    for (const size of sizes) {
      const optimizedFile = await this.optimizeToSize(file, size.maxSize);
      results[size.name] = optimizedFile;
    }

    return results;
  }

  /**
   * 优化到指定尺寸
   */
  private static async optimizeToSize(file: File, maxSize: number): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('无法获取Canvas上下文'));
        return;
      }

      img.onload = () => {
        const { width, height } = this.calculateOptimalSize(
          img.naturalWidth,
          img.naturalHeight,
          maxSize
        );

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const optimizedFile = new File([blob], file.name, {
                type: this.getOptimizedMimeType(file.type),
                lastModified: Date.now(),
              });
              resolve(optimizedFile);
            } else {
              reject(new Error('图像优化失败'));
            }
          },
          this.getOptimizedMimeType(file.type),
          this.getQuality(file.type)
        );
      };

      img.onerror = () => {
        reject(new Error('图像加载失败'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * 计算最优尺寸（带最大尺寸限制）
   */
  private static calculateOptimalSize(
    originalWidth: number,
    originalHeight: number,
    maxSize: number
  ): { width: number; height: number } {
    if (originalWidth <= maxSize && originalHeight <= maxSize) {
      return { width: originalWidth, height: originalHeight };
    }

    const aspectRatio = originalWidth / originalHeight;

    let width = originalWidth;
    let height = originalHeight;

    if (width > maxSize) {
      width = maxSize;
      height = width / aspectRatio;
    }

    if (height > maxSize) {
      height = maxSize;
      width = height * aspectRatio;
    }

    return { width: Math.round(width), height: Math.round(height) };
  }
}

// 缓存管理工具
export class CacheManager {
  private static readonly CACHE_PREFIX = 'solar-image-recognition-';
  private static readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
  private static readonly CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24小时

  /**
   * 设置缓存
   */
  static setCache(key: string, data: any, expiry?: number): void {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        expiry: expiry || this.CACHE_EXPIRY,
      };

      localStorage.setItem(
        `${this.CACHE_PREFIX}${key}`,
        JSON.stringify(cacheData)
      );

      this.cleanupCache();
    } catch (error) {
      console.warn('缓存设置失败:', error);
    }
  }

  /**
   * 获取缓存
   */
  static getCache(key: string): any {
    try {
      const cached = localStorage.getItem(`${this.CACHE_PREFIX}${key}`);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const now = Date.now();

      if (now - cacheData.timestamp > cacheData.expiry) {
        this.removeCache(key);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.warn('缓存获取失败:', error);
      return null;
    }
  }

  /**
   * 移除缓存
   */
  static removeCache(key: string): void {
    localStorage.removeItem(`${this.CACHE_PREFIX}${key}`);
  }

  /**
   * 清理过期缓存
   */
  static cleanupCache(): void {
    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();

      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          const cached = localStorage.getItem(key);
          if (cached) {
            const cacheData = JSON.parse(cached);
            if (now - cacheData.timestamp > cacheData.expiry) {
              localStorage.removeItem(key);
            }
          }
        }
      });

      this.enforceCacheSizeLimit();
    } catch (error) {
      console.warn('缓存清理失败:', error);
    }
  }

  /**
   * 强制缓存大小限制
   */
  private static enforceCacheSizeLimit(): void {
    try {
      let totalSize = 0;
      const cacheEntries: Array<{ key: string; size: number; timestamp: number }> = [];

      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          const value = localStorage.getItem(key);
          if (value) {
            const size = new Blob([value]).size;
            totalSize += size;

            const cacheData = JSON.parse(value);
            cacheEntries.push({
              key,
              size,
              timestamp: cacheData.timestamp,
            });
          }
        }
      });

      if (totalSize > this.MAX_CACHE_SIZE) {
        // 按时间戳排序，删除最旧的缓存
        cacheEntries.sort((a, b) => a.timestamp - b.timestamp);

        for (const entry of cacheEntries) {
          localStorage.removeItem(entry.key);
          totalSize -= entry.size;

          if (totalSize <= this.MAX_CACHE_SIZE) {
            break;
          }
        }
      }
    } catch (error) {
      console.warn('缓存大小限制执行失败:', error);
    }
  }

  /**
   * 清除所有缓存
   */
  static clearAllCache(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('清除所有缓存失败:', error);
    }
  }

  /**
   * 获取缓存统计信息
   */
  static getCacheStats(): {
    totalSize: number;
    entryCount: number;
    oldestEntry: number;
    newestEntry: number;
  } {
    let totalSize = 0;
    let entryCount = 0;
    let oldestEntry = Date.now();
    let newestEntry = 0;

    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          const value = localStorage.getItem(key);
          if (value) {
            const size = new Blob([value]).size;
            totalSize += size;
            entryCount++;

            const cacheData = JSON.parse(value);
            oldestEntry = Math.min(oldestEntry, cacheData.timestamp);
            newestEntry = Math.max(newestEntry, cacheData.timestamp);
          }
        }
      });
    } catch (error) {
      console.warn('获取缓存统计失败:', error);
    }

    return {
      totalSize,
      entryCount,
      oldestEntry,
      newestEntry,
    };
  }
}

// 懒加载工具
export class LazyLoader {
  private static observer: IntersectionObserver | null = null;
  private static loadedElements: Set<Element> = new Set();

  /**
   * 初始化懒加载
   */
  static init(): void {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.loadElement(entry.target);
            }
          });
        },
        {
          rootMargin: '50px',
          threshold: 0.1,
        }
      );
    }
  }

  /**
   * 观察元素
   */
  static observe(element: Element): void {
    if (this.observer && !this.loadedElements.has(element)) {
      this.observer.observe(element);
    }
  }

  /**
   * 停止观察元素
   */
  static unobserve(element: Element): void {
    if (this.observer) {
      this.observer.unobserve(element);
    }
  }

  /**
   * 加载元素
   */
  private static loadElement(element: Element): void {
    if (this.loadedElements.has(element)) return;

    const img = element as HTMLImageElement;
    const src = img.dataset.src;

    if (src) {
      img.src = src;
      img.classList.remove('lazy');
      img.classList.add('loaded');
      this.loadedElements.add(element);
      this.unobserve(element);
    }
  }

  /**
   * 销毁观察者
   */
  static destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.loadedElements.clear();
  }
}
