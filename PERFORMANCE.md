# 性能优化指南

本文档介绍光伏图像识别系统的性能优化策略、实施方法和最佳实践。

## 性能架构

### 性能层次
1. **前端性能**: 页面加载、渲染、交互响应
2. **后端性能**: API响应、数据处理、并发处理
3. **数据库性能**: 查询优化、索引设计、连接池
4. **系统性能**: 资源使用、网络延迟、存储I/O

### 性能指标
- **响应时间**: 95%请求响应时间 < 1秒
- **吞吐量**: 支持1000+并发用户
- **可用性**: 99.9%服务可用性
- **资源使用**: CPU < 70%, 内存 < 80%

## 前端性能优化

### 代码分割
```typescript
// 路由级别的代码分割
const HomePage = lazy(() => import('./pages/HomePage'));
const UploadPage = lazy(() => import('./pages/UploadPage'));
const ResultsPage = lazy(() => import('./pages/ResultsPage'));

// 组件级别的代码分割
const CameraCapture = lazy(() => import('./components/upload/CameraCapture'));
const EnhancedResultsDisplay = lazy(() => import('./components/results/EnhancedResultsDisplay'));

// 使用Suspense包装
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/upload" element={<UploadPage />} />
    <Route path="/results" element={<ResultsPage />} />
  </Routes>
</Suspense>
```

### 图像优化
```typescript
// 图像压缩和格式转换
export class ImageOptimizer {
  static async compressImage(file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // 计算新尺寸
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        // 绘制图像
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // 转换为WebP格式
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/webp',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          }
        }, 'image/webp', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }
  
  static async generateThumbnail(file: File, size: number = 200): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        canvas.width = size;
        canvas.height = size;
        
        // 保持宽高比
        const ratio = Math.min(size / img.width, size / img.height);
        const x = (size - img.width * ratio) / 2;
        const y = (size - img.height * ratio) / 2;
        
        ctx.drawImage(img, x, y, img.width * ratio, img.height * ratio);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      
      img.src = URL.createObjectURL(file);
    });
  }
}
```

### 缓存策略
```typescript
// Service Worker缓存
const CACHE_NAME = 'solar-app-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/static/images/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_CACHE_URLS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 返回缓存或网络请求
        return response || fetch(event.request);
      })
  );
});

// React Query缓存
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分钟
      cacheTime: 10 * 60 * 1000, // 10分钟
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
    }
  }
});
```

### 懒加载
```typescript
// 图像懒加载
export const LazyImage: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <div ref={imgRef} className={className}>
      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          style={{ opacity: isLoaded ? 1 : 0 }}
        />
      )}
    </div>
  );
};

// 组件懒加载
export const LazyComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <div ref={ref}>
      {isVisible && children}
    </div>
  );
};
```

## 后端性能优化

### 连接池优化
```typescript
// Redis连接池
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  maxmemoryPolicy: 'allkeys-lru'
});

// 数据库连接池
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'solar_app',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20, // 最大连接数
  min: 5,  // 最小连接数
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

### 缓存策略
```typescript
// 多级缓存
export class CacheManager {
  private static instance: CacheManager;
  private memoryCache: Map<string, any> = new Map();
  private redisCache: Redis;
  
  constructor() {
    this.redisCache = redis;
  }
  
  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }
  
  async get(key: string): Promise<any> {
    // 1. 检查内存缓存
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key);
    }
    
    // 2. 检查Redis缓存
    try {
      const value = await this.redisCache.get(key);
      if (value) {
        const parsedValue = JSON.parse(value);
        this.memoryCache.set(key, parsedValue);
        return parsedValue;
      }
    } catch (error) {
      console.error('Redis cache error:', error);
    }
    
    return null;
  }
  
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    // 1. 设置内存缓存
    this.memoryCache.set(key, value);
    
    // 2. 设置Redis缓存
    try {
      await this.redisCache.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Redis cache error:', error);
    }
  }
  
  async del(key: string): Promise<void> {
    this.memoryCache.delete(key);
    try {
      await this.redisCache.del(key);
    } catch (error) {
      console.error('Redis cache error:', error);
    }
  }
}
```

### 异步处理
```typescript
// 异步任务队列
import Bull from 'bull';

const imageProcessingQueue = new Bull('image processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  }
});

// 添加任务到队列
export const addImageProcessingTask = async (imageData: any) => {
  const job = await imageProcessingQueue.add('process-image', imageData, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 10,
    removeOnFail: 5
  });
  
  return job.id;
};

// 处理任务
imageProcessingQueue.process('process-image', async (job) => {
  const { imageData } = job.data;
  
  try {
    // 执行图像处理
    const result = await processImage(imageData);
    
    // 更新任务状态
    job.progress(100);
    
    return result;
  } catch (error) {
    console.error('Image processing error:', error);
    throw error;
  }
});
```

### 数据库优化
```typescript
// 查询优化
export class DatabaseOptimizer {
  // 使用索引
  static async createIndexes() {
    const queries = [
      'CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_analysis_image_id ON analysis(image_id)',
      'CREATE INDEX IF NOT EXISTS idx_analysis_created_at ON analysis(created_at)'
    ];
    
    for (const query of queries) {
      await pool.query(query);
    }
  }
  
  // 查询优化
  static async getOptimizedAnalysis(imageId: string) {
    const query = `
      SELECT 
        a.*,
        i.filename,
        i.upload_date
      FROM analysis a
      JOIN images i ON a.image_id = i.id
      WHERE a.image_id = $1
      ORDER BY a.created_at DESC
      LIMIT 1
    `;
    
    const result = await pool.query(query, [imageId]);
    return result.rows[0];
  }
  
  // 批量操作
  static async batchInsertAnalysis(analyses: any[]) {
    const values = analyses.map((_, index) => 
      `($${index * 4 + 1}, $${index * 4 + 2}, $${index * 4 + 3}, $${index * 4 + 4})`
    ).join(', ');
    
    const query = `
      INSERT INTO analysis (image_id, result, confidence, created_at)
      VALUES ${values}
    `;
    
    const params = analyses.flatMap(analysis => [
      analysis.imageId,
      analysis.result,
      analysis.confidence,
      new Date()
    ]);
    
    await pool.query(query, params);
  }
}
```

## 系统性能优化

### 资源监控
```typescript
// 性能监控
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // 保持最近100个值
    if (values.length > 100) {
      values.shift();
    }
  }
  
  getMetricStats(name: string) {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return null;
    
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    
    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }
  
  // 中间件
  static middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        PerformanceMonitor.getInstance().recordMetric('response_time', duration);
        PerformanceMonitor.getInstance().recordMetric('request_count', 1);
      });
      
      next();
    };
  }
}
```

### 负载均衡
```nginx
# nginx负载均衡配置
upstream app_backend {
    least_conn;
    server app1:3000 weight=3 max_fails=3 fail_timeout=30s;
    server app2:3000 weight=3 max_fails=3 fail_timeout=30s;
    server app3:3000 weight=2 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

server {
    listen 80;
    server_name solar-app.com;
    
    location / {
        proxy_pass http://app_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
        
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    location /api/upload {
        proxy_pass http://app_backend;
        client_max_body_size 10M;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }
}
```

### 内存优化
```typescript
// 内存管理
export class MemoryManager {
  private static instance: MemoryManager;
  private memoryUsage: NodeJS.MemoryUsage;
  
  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }
  
  getMemoryUsage() {
    this.memoryUsage = process.memoryUsage();
    return {
      rss: this.memoryUsage.rss,
      heapTotal: this.memoryUsage.heapTotal,
      heapUsed: this.memoryUsage.heapUsed,
      external: this.memoryUsage.external,
      arrayBuffers: this.memoryUsage.arrayBuffers
    };
  }
  
  checkMemoryPressure() {
    const usage = this.getMemoryUsage();
    const heapUsagePercent = (usage.heapUsed / usage.heapTotal) * 100;
    
    if (heapUsagePercent > 80) {
      console.warn('High memory usage detected:', heapUsagePercent.toFixed(2) + '%');
      
      // 触发垃圾回收
      if (global.gc) {
        global.gc();
      }
      
      // 清理缓存
      CacheManager.getInstance().clearOldCache();
    }
  }
  
  // 定期检查内存使用
  startMemoryMonitoring() {
    setInterval(() => {
      this.checkMemoryPressure();
    }, 30000); // 每30秒检查一次
  }
}
```

## 性能测试

### 压力测试
```bash
#!/bin/bash
# 压力测试脚本
echo "开始压力测试..."

# 使用ab进行压力测试
ab -n 1000 -c 10 http://localhost:3000/api/health

# 使用wrk进行压力测试
wrk -t12 -c400 -d30s http://localhost:3000/api/health

# 使用artillery进行压力测试
artillery run artillery-config.yml

echo "压力测试完成"
```

### 性能基准
```typescript
// 性能基准测试
export class PerformanceBenchmark {
  static async benchmarkImageProcessing() {
    const testImage = await loadTestImage();
    const iterations = 100;
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await processImage(testImage);
      const end = performance.now();
      times.push(end - start);
    }
    
    const stats = this.calculateStats(times);
    console.log('Image processing benchmark:', stats);
    
    return stats;
  }
  
  static async benchmarkDatabaseQueries() {
    const iterations = 1000;
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await pool.query('SELECT * FROM images LIMIT 10');
      const end = performance.now();
      times.push(end - start);
    }
    
    const stats = this.calculateStats(times);
    console.log('Database query benchmark:', stats);
    
    return stats;
  }
  
  private static calculateStats(times: number[]) {
    const sorted = [...times].sort((a, b) => a - b);
    const sum = times.reduce((a, b) => a + b, 0);
    
    return {
      count: times.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / times.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }
}
```

## 性能监控

### 实时监控
```typescript
// 实时性能监控
export class RealTimeMonitor {
  private static instance: RealTimeMonitor;
  private metrics: Map<string, any> = new Map();
  
  static getInstance(): RealTimeMonitor {
    if (!RealTimeMonitor.instance) {
      RealTimeMonitor.instance = new RealTimeMonitor();
    }
    return RealTimeMonitor.instance;
  }
  
  startMonitoring() {
    // 监控CPU使用率
    setInterval(() => {
      const cpuUsage = process.cpuUsage();
      this.metrics.set('cpu_usage', cpuUsage);
    }, 1000);
    
    // 监控内存使用
    setInterval(() => {
      const memoryUsage = process.memoryUsage();
      this.metrics.set('memory_usage', memoryUsage);
    }, 1000);
    
    // 监控事件循环延迟
    setInterval(() => {
      const start = process.hrtime();
      setImmediate(() => {
        const delta = process.hrtime(start);
        const nanosec = delta[0] * 1e9 + delta[1];
        const millisec = nanosec / 1e6;
        this.metrics.set('event_loop_delay', millisec);
      });
    }, 1000);
  }
  
  getMetrics() {
    return Object.fromEntries(this.metrics);
  }
}
```

## 性能优化最佳实践

### 开发阶段
1. **性能预算**: 设定性能目标
2. **代码审查**: 关注性能问题
3. **自动化测试**: 集成性能测试
4. **监控集成**: 开发环境监控

### 部署阶段
1. **资源分配**: 合理分配资源
2. **缓存策略**: 实施多级缓存
3. **负载均衡**: 配置负载均衡
4. **监控告警**: 设置性能告警

### 运维阶段
1. **持续监控**: 实时性能监控
2. **定期优化**: 定期性能优化
3. **容量规划**: 预测资源需求
4. **故障处理**: 快速性能问题定位

---

**注意**: 性能优化是一个持续的过程，需要根据实际使用情况不断调整和优化。
