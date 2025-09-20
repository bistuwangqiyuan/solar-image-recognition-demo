// 移动端检测工具
export class MobileDetector {
  private static instance: MobileDetector;
  private isMobile: boolean = false;
  private isTablet: boolean = false;
  private isDesktop: boolean = false;
  private deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';

  static getInstance(): MobileDetector {
    if (!MobileDetector.instance) {
      MobileDetector.instance = new MobileDetector();
    }
    return MobileDetector.instance;
  }

  constructor() {
    this.detectDevice();
    this.setupResizeListener();
  }

  private detectDevice(): void {
    const userAgent = navigator.userAgent.toLowerCase();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // 检测移动设备
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    this.isMobile = mobileRegex.test(userAgent) || screenWidth < 768;

    // 检测平板设备
    this.isTablet = (screenWidth >= 768 && screenWidth < 1024) || 
                   (screenHeight >= 768 && screenHeight < 1024);

    // 检测桌面设备
    this.isDesktop = screenWidth >= 1024 && !this.isMobile;

    // 确定设备类型
    if (this.isMobile) {
      this.deviceType = 'mobile';
    } else if (this.isTablet) {
      this.deviceType = 'tablet';
    } else {
      this.deviceType = 'desktop';
    }
  }

  private setupResizeListener(): void {
    let resizeTimeout: NodeJS.Timeout;
    
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.detectDevice();
      }, 250);
    });
  }

  // 获取设备信息
  getDeviceInfo(): {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    deviceType: 'mobile' | 'tablet' | 'desktop';
    screenWidth: number;
    screenHeight: number;
    orientation: 'portrait' | 'landscape';
  } {
    return {
      isMobile: this.isMobile,
      isTablet: this.isTablet,
      isDesktop: this.isDesktop,
      deviceType: this.deviceType,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
    };
  }

  // 检查是否为移动设备
  isMobileDevice(): boolean {
    return this.isMobile;
  }

  // 检查是否为平板设备
  isTabletDevice(): boolean {
    return this.isTablet;
  }

  // 检查是否为桌面设备
  isDesktopDevice(): boolean {
    return this.isDesktop;
  }

  // 获取设备类型
  getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    return this.deviceType;
  }
}

// 触摸手势工具
export class TouchGestureHandler {
  private element: HTMLElement;
  private startX: number = 0;
  private startY: number = 0;
  private currentX: number = 0;
  private currentY: number = 0;
  private isDragging: boolean = false;
  private callbacks: {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
    onPinch?: (scale: number) => void;
    onTap?: () => void;
    onLongPress?: () => void;
  } = {};

  constructor(element: HTMLElement) {
    this.element = element;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
  }

  private handleTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.startX = touch.clientX;
      this.startY = touch.clientY;
      this.currentX = touch.clientX;
      this.currentY = touch.clientY;
      this.isDragging = false;
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.currentX = touch.clientX;
      this.currentY = touch.clientY;

      const deltaX = this.currentX - this.startX;
      const deltaY = this.currentY - this.startY;

      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        this.isDragging = true;
      }
    } else if (event.touches.length === 2) {
      // 处理双指缩放
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );

      if (this.callbacks.onPinch) {
        this.callbacks.onPinch(distance / 100); // 简化的缩放比例
      }
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    if (!this.isDragging && event.changedTouches.length === 1) {
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - this.startX;
      const deltaY = touch.clientY - this.startY;

      if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
        // 点击
        if (this.callbacks.onTap) {
          this.callbacks.onTap();
        }
      } else {
        // 滑动
        const minSwipeDistance = 50;
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // 水平滑动
          if (deltaX > minSwipeDistance && this.callbacks.onSwipeRight) {
            this.callbacks.onSwipeRight();
          } else if (deltaX < -minSwipeDistance && this.callbacks.onSwipeLeft) {
            this.callbacks.onSwipeLeft();
          }
        } else {
          // 垂直滑动
          if (deltaY > minSwipeDistance && this.callbacks.onSwipeDown) {
            this.callbacks.onSwipeDown();
          } else if (deltaY < -minSwipeDistance && this.callbacks.onSwipeUp) {
            this.callbacks.onSwipeUp();
          }
        }
      }
    }

    this.isDragging = false;
  }

  // 设置回调函数
  onSwipeLeft(callback: () => void): TouchGestureHandler {
    this.callbacks.onSwipeLeft = callback;
    return this;
  }

  onSwipeRight(callback: () => void): TouchGestureHandler {
    this.callbacks.onSwipeRight = callback;
    return this;
  }

  onSwipeUp(callback: () => void): TouchGestureHandler {
    this.callbacks.onSwipeUp = callback;
    return this;
  }

  onSwipeDown(callback: () => void): TouchGestureHandler {
    this.callbacks.onSwipeDown = callback;
    return this;
  }

  onPinch(callback: (scale: number) => void): TouchGestureHandler {
    this.callbacks.onPinch = callback;
    return this;
  }

  onTap(callback: () => void): TouchGestureHandler {
    this.callbacks.onTap = callback;
    return this;
  }

  onLongPress(callback: () => void): TouchGestureHandler {
    this.callbacks.onLongPress = callback;
    return this;
  }

  // 销毁事件监听器
  destroy(): void {
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
  }
}

// 移动端UI适配工具
export class MobileUIAdapter {
  private static instance: MobileUIAdapter;
  private deviceDetector: MobileDetector;

  static getInstance(): MobileUIAdapter {
    if (!MobileUIAdapter.instance) {
      MobileUIAdapter.instance = new MobileUIAdapter();
    }
    return MobileUIAdapter.instance;
  }

  constructor() {
    this.deviceDetector = MobileDetector.getInstance();
    this.setupMobileOptimizations();
  }

  private setupMobileOptimizations(): void {
    // 设置视口元标签
    this.setupViewport();
    
    // 禁用双击缩放
    this.disableDoubleTapZoom();
    
    // 设置移动端样式
    this.applyMobileStyles();
    
    // 优化触摸体验
    this.optimizeTouchExperience();
  }

  private setupViewport(): void {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.setAttribute('name', 'viewport');
      document.head.appendChild(viewport);
    }
    
    viewport.setAttribute('content', 
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
    );
  }

  private disableDoubleTapZoom(): void {
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
      const now = new Date().getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, false);
  }

  private applyMobileStyles(): void {
    const deviceInfo = this.deviceDetector.getDeviceInfo();
    
    if (deviceInfo.isMobile) {
      document.body.classList.add('mobile-device');
      
      // 添加移动端特定的CSS变量
      const root = document.documentElement;
      root.style.setProperty('--mobile-safe-area-top', 'env(safe-area-inset-top)');
      root.style.setProperty('--mobile-safe-area-bottom', 'env(safe-area-inset-bottom)');
      root.style.setProperty('--mobile-safe-area-left', 'env(safe-area-inset-left)');
      root.style.setProperty('--mobile-safe-area-right', 'env(safe-area-inset-right)');
    }
  }

  private optimizeTouchExperience(): void {
    // 优化触摸目标大小
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 768px) {
        button, .btn, input, select, textarea {
          min-height: 44px;
          min-width: 44px;
        }
        
        .touch-target {
          min-height: 44px;
          min-width: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        /* 优化滚动 */
        .scroll-container {
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
        }
        
        /* 优化文本选择 */
        .selectable-text {
          -webkit-user-select: text;
          user-select: text;
        }
        
        /* 禁用文本选择 */
        .no-select {
          -webkit-user-select: none;
          user-select: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // 获取移动端优化的配置
  getMobileConfig(): {
    imageQuality: number;
    maxImageSize: number;
    animationDuration: number;
    touchDelay: number;
  } {
    const deviceInfo = this.deviceDetector.getDeviceInfo();
    
    if (deviceInfo.isMobile) {
      return {
        imageQuality: 0.7,
        maxImageSize: 1024,
        animationDuration: 200,
        touchDelay: 100,
      };
    } else if (deviceInfo.isTablet) {
      return {
        imageQuality: 0.8,
        maxImageSize: 1536,
        animationDuration: 300,
        touchDelay: 50,
      };
    } else {
      return {
        imageQuality: 0.9,
        maxImageSize: 2048,
        animationDuration: 400,
        touchDelay: 0,
      };
    }
  }

  // 适配图片尺寸
  adaptImageSize(originalWidth: number, originalHeight: number): {
    width: number;
    height: number;
  } {
    const deviceInfo = this.deviceDetector.getDeviceInfo();
    const maxWidth = deviceInfo.screenWidth * 0.9;
    const maxHeight = deviceInfo.screenHeight * 0.6;

    if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
      return { width: originalWidth, height: originalHeight };
    }

    const aspectRatio = originalWidth / originalHeight;
    let width = originalWidth;
    let height = originalHeight;

    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }

    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    return { width: Math.round(width), height: Math.round(height) };
  }

  // 获取移动端友好的字体大小
  getMobileFontSize(baseSize: number): number {
    const deviceInfo = this.deviceDetector.getDeviceInfo();
    
    if (deviceInfo.isMobile) {
      return Math.max(baseSize, 14); // 最小14px
    } else if (deviceInfo.isTablet) {
      return Math.max(baseSize, 16); // 最小16px
    } else {
      return baseSize;
    }
  }

  // 检查是否支持某些功能
  supportsFeature(feature: string): boolean {
    const deviceInfo = this.deviceDetector.getDeviceInfo();
    
    switch (feature) {
      case 'camera':
        return 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
      case 'geolocation':
        return 'geolocation' in navigator;
      case 'vibration':
        return 'vibrate' in navigator;
      case 'orientation':
        return 'orientation' in window;
      case 'fullscreen':
        return 'requestFullscreen' in document.documentElement;
      default:
        return false;
    }
  }

  // 获取设备方向
  getOrientation(): 'portrait' | 'landscape' {
    const deviceInfo = this.deviceDetector.getDeviceInfo();
    return deviceInfo.orientation;
  }

  // 监听方向变化
  onOrientationChange(callback: (orientation: 'portrait' | 'landscape') => void): void {
    const handleOrientationChange = () => {
      const orientation = this.getOrientation();
      callback(orientation);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
  }
}

// 移动端性能优化工具
export class MobilePerformanceOptimizer {
  private static instance: MobilePerformanceOptimizer;
  private deviceDetector: MobileDetector;

  static getInstance(): MobilePerformanceOptimizer {
    if (!MobilePerformanceOptimizer.instance) {
      MobilePerformanceOptimizer.instance = new MobilePerformanceOptimizer();
    }
    return MobilePerformanceOptimizer.instance;
  }

  constructor() {
    this.deviceDetector = MobileDetector.getInstance();
    this.setupOptimizations();
  }

  private setupOptimizations(): void {
    // 预加载关键资源
    this.preloadCriticalResources();
    
    // 优化图片加载
    this.optimizeImageLoading();
    
    // 减少重绘和重排
    this.optimizeRendering();
    
    // 优化内存使用
    this.optimizeMemoryUsage();
  }

  private preloadCriticalResources(): void {
    const deviceInfo = this.deviceDetector.getDeviceInfo();
    
    if (deviceInfo.isMobile) {
      // 预加载关键CSS
      const criticalCSS = document.createElement('link');
      criticalCSS.rel = 'preload';
      criticalCSS.href = '/static/css/critical.css';
      criticalCSS.as = 'style';
      document.head.appendChild(criticalCSS);
    }
  }

  private optimizeImageLoading(): void {
    // 使用Intersection Observer进行懒加载
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.classList.remove('lazy');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      // 观察所有懒加载图片
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  private optimizeRendering(): void {
    // 使用requestAnimationFrame优化动画
    const optimizeAnimations = () => {
      const animatedElements = document.querySelectorAll('.animate');
      animatedElements.forEach(element => {
        element.style.willChange = 'transform, opacity';
      });
    };

    // 使用CSS containment
    const style = document.createElement('style');
    style.textContent = `
      .contain-layout {
        contain: layout;
      }
      
      .contain-paint {
        contain: paint;
      }
      
      .contain-strict {
        contain: strict;
      }
    `;
    document.head.appendChild(style);
  }

  private optimizeMemoryUsage(): void {
    // 清理未使用的资源
    const cleanup = () => {
      // 清理未使用的图片
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (!img.complete && !img.src) {
          img.remove();
        }
      });
    };

    // 定期清理
    setInterval(cleanup, 30000); // 每30秒清理一次
  }

  // 获取移动端性能配置
  getPerformanceConfig(): {
    enableAnimations: boolean;
    enableTransitions: boolean;
    enableShadows: boolean;
    enableBlur: boolean;
    maxConcurrentRequests: number;
  } {
    const deviceInfo = this.deviceDetector.getDeviceInfo();
    
    if (deviceInfo.isMobile) {
      return {
        enableAnimations: true,
        enableTransitions: true,
        enableShadows: false,
        enableBlur: false,
        maxConcurrentRequests: 3,
      };
    } else if (deviceInfo.isTablet) {
      return {
        enableAnimations: true,
        enableTransitions: true,
        enableShadows: true,
        enableBlur: false,
        maxConcurrentRequests: 5,
      };
    } else {
      return {
        enableAnimations: true,
        enableTransitions: true,
        enableShadows: true,
        enableBlur: true,
        maxConcurrentRequests: 10,
      };
    }
  }
}
