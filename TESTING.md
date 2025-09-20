# 测试指南

本文档介绍光伏图像识别系统的测试策略、实施方法和最佳实践。

## 测试架构

### 测试层次
1. **单元测试**: 组件和函数级别测试
2. **集成测试**: 模块间交互测试
3. **端到端测试**: 完整用户流程测试
4. **性能测试**: 系统性能测试
5. **安全测试**: 安全漏洞测试

### 测试工具
- **Vitest**: 单元测试框架
- **React Testing Library**: React组件测试
- **Cypress**: 端到端测试
- **Jest**: 测试运行器
- **Supertest**: API测试

## 单元测试

### 组件测试
```typescript
// src/components/upload/__tests__/UploadComponent.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import UploadComponent from '../UploadComponent';

describe('UploadComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders upload component', () => {
    render(<UploadComponent onUpload={vi.fn()} />);
    
    expect(screen.getByText('上传图像')).toBeInTheDocument();
    expect(screen.getByText('拖拽文件到此处或点击选择')).toBeInTheDocument();
  });

  it('handles file drop', async () => {
    const mockOnUpload = vi.fn();
    render(<UploadComponent onUpload={mockOnUpload} />);
    
    const dropZone = screen.getByTestId('drop-zone');
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [file]
      }
    });
    
    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith(file);
    });
  });

  it('validates file type', async () => {
    const mockOnUpload = vi.fn();
    render(<UploadComponent onUpload={mockOnUpload} />);
    
    const dropZone = screen.getByTestId('drop-zone');
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [file]
      }
    });
    
    await waitFor(() => {
      expect(screen.getByText('不支持的文件类型')).toBeInTheDocument();
    });
    
    expect(mockOnUpload).not.toHaveBeenCalled();
  });

  it('validates file size', async () => {
    const mockOnUpload = vi.fn();
    render(<UploadComponent onUpload={mockOnUpload} />);
    
    const dropZone = screen.getByTestId('drop-zone');
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    // 模拟大文件
    Object.defineProperty(file, 'size', { value: 20 * 1024 * 1024 });
    
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [file]
      }
    });
    
    await waitFor(() => {
      expect(screen.getByText('文件大小超过限制')).toBeInTheDocument();
    });
    
    expect(mockOnUpload).not.toHaveBeenCalled();
  });
});
```

### 服务测试
```typescript
// src/services/__tests__/analysisService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalysisService } from '../analysisService';

describe('AnalysisService', () => {
  let analysisService: AnalysisService;
  
  beforeEach(() => {
    analysisService = new AnalysisService();
    vi.clearAllMocks();
  });

  describe('analyzeImage', () => {
    it('should analyze image successfully', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockResponse = {
        success: true,
        data: {
          defects: ['crack', 'discoloration'],
          confidence: 0.95,
          recommendations: ['检查裂纹', '清洁面板']
        }
      };
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });
      
      const result = await analysisService.analyzeImage(mockFile);
      
      expect(result).toEqual(mockResponse.data);
      expect(global.fetch).toHaveBeenCalledWith('/api/analysis', {
        method: 'POST',
        body: expect.any(FormData)
      });
    });

    it('should handle analysis error', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });
      
      await expect(analysisService.analyzeImage(mockFile)).rejects.toThrow('分析失败');
    });

    it('should handle network error', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      
      await expect(analysisService.analyzeImage(mockFile)).rejects.toThrow('网络错误');
    });
  });

  describe('analyzeImageWithClientAI', () => {
    it('should analyze image with client AI', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockResult = {
        defects: ['crack'],
        confidence: 0.9,
        recommendations: ['检查裂纹']
      };
      
      // Mock TensorFlow.js
      const mockModel = {
        predict: vi.fn().mockReturnValue([[0.9, 0.1]])
      };
      
      global.tf = {
        loadLayersModel: vi.fn().mockResolvedValue(mockModel),
        browser: {
          fromPixels: vi.fn().mockReturnValue({}),
          resizeBilinear: vi.fn().mockReturnValue({}),
          toFloat: vi.fn().mockReturnValue({}),
          div: vi.fn().mockReturnValue({}),
          expandDims: vi.fn().mockReturnValue({})
        }
      };
      
      const result = await analysisService.analyzeImageWithClientAI(mockFile);
      
      expect(result).toEqual(mockResult);
      expect(mockModel.predict).toHaveBeenCalled();
    });
  });

  describe('getAnalysisHistory', () => {
    it('should get analysis history', async () => {
      const mockHistory = [
        { id: '1', filename: 'test1.jpg', result: 'normal', created_at: '2024-01-01' },
        { id: '2', filename: 'test2.jpg', result: 'defect', created_at: '2024-01-02' }
      ];
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockHistory)
      });
      
      const result = await analysisService.getAnalysisHistory();
      
      expect(result).toEqual(mockHistory);
      expect(global.fetch).toHaveBeenCalledWith('/api/analysis/history');
    });
  });

  describe('batchAnalyze', () => {
    it('should batch analyze images', async () => {
      const mockFiles = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })
      ];
      
      const mockResults = [
        { filename: 'test1.jpg', result: 'normal' },
        { filename: 'test2.jpg', result: 'defect' }
      ];
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResults)
      });
      
      const result = await analysisService.batchAnalyze(mockFiles);
      
      expect(result).toEqual(mockResults);
      expect(global.fetch).toHaveBeenCalledWith('/api/analysis/batch', {
        method: 'POST',
        body: expect.any(FormData)
      });
    });
  });
});
```

### 工具函数测试
```typescript
// src/utils/__tests__/imageProcessor.test.ts
import { describe, it, expect, vi } from 'vitest';
import { ImageProcessor } from '../imageProcessor';

describe('ImageProcessor', () => {
  describe('preprocessImage', () => {
    it('should preprocess image correctly', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockCanvas = {
        getContext: vi.fn().mockReturnValue({
          drawImage: vi.fn(),
          getImageData: vi.fn().mockReturnValue({
            data: new Uint8ClampedArray(4)
          })
        }),
        width: 224,
        height: 224
      };
      
      global.HTMLCanvasElement = vi.fn().mockImplementation(() => mockCanvas);
      global.Image = vi.fn().mockImplementation(() => ({
        onload: null,
        src: ''
      }));
      
      const result = await ImageProcessor.preprocessImage(mockFile);
      
      expect(result).toBeDefined();
      expect(result.length).toBe(224 * 224 * 3);
    });
  });

  describe('enhanceImage', () => {
    it('should enhance image quality', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockCanvas = {
        getContext: vi.fn().mockReturnValue({
          drawImage: vi.fn(),
          putImageData: vi.fn(),
          getImageData: vi.fn().mockReturnValue({
            data: new Uint8ClampedArray(4)
          })
        }),
        width: 224,
        height: 224
      };
      
      global.HTMLCanvasElement = vi.fn().mockImplementation(() => mockCanvas);
      global.Image = vi.fn().mockImplementation(() => ({
        onload: null,
        src: ''
      }));
      
      const result = await ImageProcessor.enhanceImage(mockFile);
      
      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(File);
    });
  });
});
```

## 集成测试

### API测试
```typescript
// src/server/__tests__/routes/analysis.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import multer from 'multer';
import { analysisRouter } from '../../routes/analysis';

describe('Analysis API', () => {
  let app: express.Application;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(multer().single('image'));
    app.use('/api/analysis', analysisRouter);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/analysis', () => {
    it('should analyze image successfully', async () => {
      const response = await request(app)
        .post('/api/analysis')
        .attach('image', Buffer.from('test'), 'test.jpg')
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('defects');
      expect(response.body.data).toHaveProperty('confidence');
      expect(response.body.data).toHaveProperty('recommendations');
    });

    it('should handle missing image', async () => {
      const response = await request(app)
        .post('/api/analysis')
        .expect(400);
      
      expect(response.body).toHaveProperty('error', 'No image uploaded');
    });

    it('should handle invalid file type', async () => {
      const response = await request(app)
        .post('/api/analysis')
        .attach('image', Buffer.from('test'), 'test.txt')
        .expect(400);
      
      expect(response.body).toHaveProperty('error', 'Invalid file type');
    });

    it('should handle large file', async () => {
      const largeBuffer = Buffer.alloc(20 * 1024 * 1024); // 20MB
      
      const response = await request(app)
        .post('/api/analysis')
        .attach('image', largeBuffer, 'large.jpg')
        .expect(400);
      
      expect(response.body).toHaveProperty('error', 'File too large');
    });
  });

  describe('GET /api/analysis/history', () => {
    it('should get analysis history', async () => {
      const response = await request(app)
        .get('/api/analysis/history')
        .expect(200);
      
      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/analysis/batch', () => {
    it('should batch analyze images', async () => {
      const response = await request(app)
        .post('/api/analysis/batch')
        .attach('images', Buffer.from('test1'), 'test1.jpg')
        .attach('images', Buffer.from('test2'), 'test2.jpg')
        .expect(200);
      
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(2);
    });
  });
});
```

### 数据库测试
```typescript
// src/server/__tests__/database.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Pool } from 'pg';
import { createTestDatabase, cleanupTestDatabase } from '../utils/testDatabase';

describe('Database Integration', () => {
  let pool: Pool;
  
  beforeEach(async () => {
    pool = await createTestDatabase();
  });
  
  afterEach(async () => {
    await cleanupTestDatabase(pool);
  });

  describe('Images Table', () => {
    it('should create image record', async () => {
      const result = await pool.query(
        'INSERT INTO images (filename, filepath, user_id) VALUES ($1, $2, $3) RETURNING *',
        ['test.jpg', '/uploads/test.jpg', 'user123']
      );
      
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toHaveProperty('filename', 'test.jpg');
      expect(result.rows[0]).toHaveProperty('filepath', '/uploads/test.jpg');
      expect(result.rows[0]).toHaveProperty('user_id', 'user123');
    });

    it('should get image by id', async () => {
      const insertResult = await pool.query(
        'INSERT INTO images (filename, filepath, user_id) VALUES ($1, $2, $3) RETURNING id',
        ['test.jpg', '/uploads/test.jpg', 'user123']
      );
      
      const imageId = insertResult.rows[0].id;
      
      const result = await pool.query(
        'SELECT * FROM images WHERE id = $1',
        [imageId]
      );
      
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toHaveProperty('id', imageId);
    });
  });

  describe('Analysis Table', () => {
    it('should create analysis record', async () => {
      const imageResult = await pool.query(
        'INSERT INTO images (filename, filepath, user_id) VALUES ($1, $2, $3) RETURNING id',
        ['test.jpg', '/uploads/test.jpg', 'user123']
      );
      
      const imageId = imageResult.rows[0].id;
      
      const result = await pool.query(
        'INSERT INTO analysis (image_id, result, confidence) VALUES ($1, $2, $3) RETURNING *',
        [imageId, '{"defects": ["crack"]}', 0.95]
      );
      
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toHaveProperty('image_id', imageId);
      expect(result.rows[0]).toHaveProperty('result', '{"defects": ["crack"]}');
      expect(result.rows[0]).toHaveProperty('confidence', 0.95);
    });
  });
});
```

## 端到端测试

### Cypress测试
```typescript
// cypress/e2e/upload-flow.cy.ts
describe('Image Upload Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should complete image upload flow', () => {
    // 导航到上传页面
    cy.get('[data-testid="upload-link"]').click();
    cy.url().should('include', '/upload');
    
    // 上传图像
    cy.get('[data-testid="file-input"]').selectFile('cypress/fixtures/test-image.jpg');
    
    // 等待上传完成
    cy.get('[data-testid="upload-progress"]').should('be.visible');
    cy.get('[data-testid="upload-success"]').should('be.visible');
    
    // 等待分析完成
    cy.get('[data-testid="analysis-progress"]').should('be.visible');
    cy.get('[data-testid="analysis-results"]').should('be.visible');
    
    // 验证结果
    cy.get('[data-testid="defects-list"]').should('contain', 'crack');
    cy.get('[data-testid="confidence-score"]').should('contain', '95%');
    cy.get('[data-testid="recommendations"]').should('contain', '检查裂纹');
  });

  it('should handle upload error', () => {
    cy.get('[data-testid="upload-link"]').click();
    
    // 上传无效文件
    cy.get('[data-testid="file-input"]').selectFile('cypress/fixtures/test-file.txt');
    
    // 验证错误消息
    cy.get('[data-testid="upload-error"]').should('contain', '不支持的文件类型');
  });

  it('should handle large file', () => {
    cy.get('[data-testid="upload-link"]').click();
    
    // 上传大文件
    cy.get('[data-testid="file-input"]').selectFile('cypress/fixtures/large-image.jpg');
    
    // 验证错误消息
    cy.get('[data-testid="upload-error"]').should('contain', '文件大小超过限制');
  });
});

// cypress/e2e/demo-flow.cy.ts
describe('Demo Flow', () => {
  beforeEach(() => {
    cy.visit('/demo');
  });

  it('should display demo images', () => {
    cy.get('[data-testid="demo-gallery"]').should('be.visible');
    cy.get('[data-testid="demo-image"]').should('have.length.at.least', 1);
  });

  it('should show demo analysis', () => {
    cy.get('[data-testid="demo-image"]').first().click();
    
    cy.get('[data-testid="demo-results"]').should('be.visible');
    cy.get('[data-testid="demo-defects"]').should('be.visible');
    cy.get('[data-testid="demo-confidence"]').should('be.visible');
  });
});
```

### 移动端测试
```typescript
// cypress/e2e/mobile-flow.cy.ts
describe('Mobile Flow', () => {
  beforeEach(() => {
    cy.viewport('iphone-x');
    cy.visit('/');
  });

  it('should work on mobile devices', () => {
    // 测试移动端导航
    cy.get('[data-testid="mobile-menu"]').click();
    cy.get('[data-testid="mobile-nav"]').should('be.visible');
    
    // 测试移动端上传
    cy.get('[data-testid="mobile-upload"]').click();
    cy.get('[data-testid="camera-button"]').should('be.visible');
    
    // 测试移动端结果展示
    cy.get('[data-testid="mobile-results"]').should('be.visible');
  });

  it('should handle touch interactions', () => {
    cy.get('[data-testid="touch-area"]').trigger('touchstart');
    cy.get('[data-testid="touch-feedback"]').should('be.visible');
    
    cy.get('[data-testid="touch-area"]').trigger('touchend');
    cy.get('[data-testid="touch-feedback"]').should('not.be.visible');
  });
});
```

## 性能测试

### 负载测试
```typescript
// tests/performance/load-test.ts
import { describe, it, expect } from 'vitest';
import { performance } from 'perf_hooks';

describe('Performance Tests', () => {
  describe('Image Processing Performance', () => {
    it('should process image within time limit', async () => {
      const start = performance.now();
      
      // 模拟图像处理
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(200); // 200ms限制
    });
  });

  describe('API Response Time', () => {
    it('should respond within time limit', async () => {
      const start = performance.now();
      
      const response = await fetch('/api/health');
      await response.json();
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(100); // 100ms限制
    });
  });

  describe('Memory Usage', () => {
    it('should not exceed memory limit', () => {
      const memoryUsage = process.memoryUsage();
      const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
      
      expect(heapUsedMB).toBeLessThan(100); // 100MB限制
    });
  });
});
```

### 压力测试
```bash
#!/bin/bash
# tests/performance/stress-test.sh
echo "开始压力测试..."

# 使用ab进行压力测试
ab -n 1000 -c 10 http://localhost:3000/api/health

# 使用wrk进行压力测试
wrk -t12 -c400 -d30s http://localhost:3000/api/health

# 使用artillery进行压力测试
artillery run artillery-config.yml

echo "压力测试完成"
```

## 安全测试

### 安全漏洞测试
```typescript
// tests/security/security.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { app } from '../../src/server';

describe('Security Tests', () => {
  describe('Input Validation', () => {
    it('should prevent SQL injection', async () => {
      const maliciousInput = "'; DROP TABLE images; --";
      
      const response = await request(app)
        .get(`/api/images?search=${maliciousInput}`)
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
    });

    it('should prevent XSS attacks', async () => {
      const maliciousScript = '<script>alert("xss")</script>';
      
      const response = await request(app)
        .post('/api/analysis')
        .send({ comment: maliciousScript })
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('File Upload Security', () => {
    it('should prevent malicious file upload', async () => {
      const maliciousFile = Buffer.from('<?php system($_GET["cmd"]); ?>');
      
      const response = await request(app)
        .post('/api/upload')
        .attach('file', maliciousFile, 'malicious.php')
        .expect(400);
      
      expect(response.body).toHaveProperty('error', 'Invalid file type');
    });

    it('should prevent zip bombs', async () => {
      const zipBomb = Buffer.alloc(1024 * 1024 * 100); // 100MB
      
      const response = await request(app)
        .post('/api/upload')
        .attach('file', zipBomb, 'bomb.zip')
        .expect(400);
      
      expect(response.body).toHaveProperty('error', 'File too large');
    });
  });

  describe('Authentication Security', () => {
    it('should require authentication for protected routes', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .expect(401);
      
      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should prevent brute force attacks', async () => {
      const attempts = 10;
      
      for (let i = 0; i < attempts; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({ username: 'admin', password: 'wrong' })
          .expect(401);
      }
      
      // 验证账户被锁定
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'correct' })
        .expect(429);
      
      expect(response.body).toHaveProperty('error', 'Too many attempts');
    });
  });
});
```

## 测试配置

### Vitest配置
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/services': path.resolve(__dirname, './src/services')
    }
  }
});
```

### Cypress配置
```typescript
// cypress.config.ts
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite'
    }
  }
});
```

## 测试最佳实践

### 测试策略
1. **测试金字塔**: 单元测试 > 集成测试 > 端到端测试
2. **测试覆盖**: 目标80%以上代码覆盖率
3. **测试隔离**: 每个测试独立运行
4. **测试数据**: 使用测试专用数据

### 测试维护
1. **定期更新**: 保持测试用例最新
2. **重构测试**: 优化测试代码结构
3. **性能监控**: 监控测试执行时间
4. **失败分析**: 及时分析测试失败原因

### 持续集成
1. **自动化测试**: 集成到CI/CD流程
2. **并行执行**: 提高测试执行效率
3. **测试报告**: 生成详细测试报告
4. **质量门禁**: 设置质量检查点

---

**注意**: 测试是保证软件质量的重要手段，需要持续投入和维护。建议定期审查和更新测试用例。
