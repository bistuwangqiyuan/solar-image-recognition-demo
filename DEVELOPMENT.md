# 开发指南

本文档介绍光伏图像识别系统的开发环境搭建、代码规范、开发流程和最佳实践。

## 开发环境

### 系统要求
- **操作系统**: Windows 10+, macOS 10.15+, Ubuntu 18.04+
- **Node.js**: 18.0+
- **npm**: 8.0+ 或 yarn 1.22+
- **Docker**: 20.0+
- **Git**: 2.30+

### 开发工具
- **IDE**: VS Code (推荐)
- **浏览器**: Chrome, Firefox, Safari (最新版本)
- **调试工具**: Chrome DevTools, React DevTools
- **版本控制**: Git

### 环境搭建
```bash
# 克隆项目
git clone https://github.com/your-org/solar-image-recognition.git
cd solar-image-recognition

# 安装依赖
npm install

# 复制环境变量文件
cp env.example .env

# 启动开发服务器
npm run dev
```

## 项目结构

### 目录结构
```
solarimagekirocs/
├── src/                    # 源代码
│   ├── components/         # React组件
│   │   ├── common/        # 通用组件
│   │   ├── layout/        # 布局组件
│   │   ├── upload/        # 上传组件
│   │   ├── results/       # 结果展示组件
│   │   └── demo/          # 演示组件
│   ├── pages/             # 页面组件
│   ├── services/          # 服务层
│   ├── utils/             # 工具函数
│   ├── types/             # TypeScript类型
│   ├── contexts/          # React上下文
│   ├── hooks/             # 自定义Hooks
│   └── test/              # 测试文件
├── scripts/               # 脚本文件
├── monitoring/            # 监控配置
├── k8s/                   # Kubernetes配置
├── docs/                  # 文档
└── tests/                 # 测试文件
```

### 文件命名规范
- **组件文件**: PascalCase (如: `UploadComponent.tsx`)
- **工具文件**: camelCase (如: `imageProcessor.ts`)
- **类型文件**: camelCase (如: `index.ts`)
- **测试文件**: camelCase + `.test.ts` (如: `uploadComponent.test.ts`)
- **配置文件**: kebab-case (如: `vitest.config.ts`)

## 代码规范

### TypeScript规范
```typescript
// 接口定义
interface ImageAnalysisResult {
  defects: Defect[];
  confidence: number;
  recommendations: string[];
}

// 类型定义
type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';

// 枚举定义
enum DefectType {
  CRACK = 'crack',
  DISCOLORATION = 'discoloration',
  DIRT = 'dirt'
}

// 函数定义
export const analyzeImage = async (file: File): Promise<ImageAnalysisResult> => {
  // 实现逻辑
};

// 类定义
export class ImageProcessor {
  private readonly maxSize: number;
  
  constructor(maxSize: number = 10 * 1024 * 1024) {
    this.maxSize = maxSize;
  }
  
  public async process(file: File): Promise<File> {
    // 实现逻辑
  }
}
```

### React组件规范
```typescript
// 组件定义
interface UploadComponentProps {
  onUpload: (file: File) => void;
  maxSize?: number;
  allowedTypes?: string[];
  className?: string;
}

export const UploadComponent: React.FC<UploadComponentProps> = ({
  onUpload,
  maxSize = 10 * 1024 * 1024,
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  className
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(event.dataTransfer.files);
    const file = files[0];
    
    if (!file) return;
    
    if (!allowedTypes.includes(file.type)) {
      setError('不支持的文件类型');
      return;
    }
    
    if (file.size > maxSize) {
      setError('文件大小超过限制');
      return;
    }
    
    setError(null);
    onUpload(file);
  }, [onUpload, maxSize, allowedTypes]);
  
  return (
    <div
      className={`upload-component ${className || ''}`}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
    >
      {error && <div className="error">{error}</div>}
      {/* 组件内容 */}
    </div>
  );
};
```

### 样式规范
```css
/* CSS类命名: BEM方法 */
.upload-component {
  /* 块级元素 */
}

.upload-component__drop-zone {
  /* 元素 */
}

.upload-component__drop-zone--dragging {
  /* 修饰符 */
}

.upload-component__error {
  /* 元素 */
}

.upload-component__error--visible {
  /* 修饰符 */
}
```

### 测试规范
```typescript
// 测试文件结构
describe('UploadComponent', () => {
  // 测试组件的渲染
  describe('rendering', () => {
    it('should render upload component', () => {
      // 测试逻辑
    });
  });
  
  // 测试用户交互
  describe('user interaction', () => {
    it('should handle file drop', () => {
      // 测试逻辑
    });
  });
  
  // 测试错误处理
  describe('error handling', () => {
    it('should handle invalid file type', () => {
      // 测试逻辑
    });
  });
});
```

## 开发流程

### Git工作流
```bash
# 创建功能分支
git checkout -b feature/image-upload

# 提交代码
git add .
git commit -m "feat: add image upload functionality"

# 推送分支
git push origin feature/image-upload

# 创建Pull Request
# 在GitHub上创建PR，请求代码审查
```

### 提交信息规范
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**类型说明**:
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

**示例**:
```
feat(upload): add drag and drop file upload

- Add drag and drop functionality
- Add file type validation
- Add file size validation
- Add error handling

Closes #123
```

### 代码审查
1. **功能正确性**: 确保功能按预期工作
2. **代码质量**: 检查代码结构和可读性
3. **性能考虑**: 评估性能影响
4. **安全性**: 检查安全漏洞
5. **测试覆盖**: 确保有足够的测试

## 开发工具

### VS Code配置
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

### ESLint配置
```javascript
// .eslintrc.js
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: [
    'react',
    '@typescript-eslint',
    'react-hooks'
  ],
  rules: {
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/no-unused-vars': 'error',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn'
  }
};
```

### Prettier配置
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

## 调试技巧

### 前端调试
```typescript
// 使用React DevTools
import { useState, useEffect } from 'react';

const DebugComponent = () => {
  const [state, setState] = useState({});
  
  useEffect(() => {
    // 在浏览器控制台查看状态
    console.log('Component state:', state);
  }, [state]);
  
  return <div>Debug Component</div>;
};

// 使用Chrome DevTools
// 1. 设置断点
// 2. 查看变量值
// 3. 单步调试
// 4. 查看网络请求
```

### 后端调试
```typescript
// 使用日志记录
import { logger } from './utils/logger';

export const analyzeImage = async (file: File) => {
  logger.info('Starting image analysis', { filename: file.name });
  
  try {
    const result = await processImage(file);
    logger.info('Image analysis completed', { result });
    return result;
  } catch (error) {
    logger.error('Image analysis failed', { error: error.message });
    throw error;
  }
};

// 使用调试器
// 1. 设置断点
// 2. 启动调试模式
// 3. 单步调试
// 4. 查看变量值
```

### 网络调试
```typescript
// 使用fetch拦截器
const originalFetch = window.fetch;

window.fetch = async (...args) => {
  console.log('Fetch request:', args);
  
  try {
    const response = await originalFetch(...args);
    console.log('Fetch response:', response);
    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};
```

## 性能优化

### 前端优化
```typescript
// 使用React.memo
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{data}</div>;
});

// 使用useMemo
const ExpensiveCalculation = ({ items }) => {
  const expensiveValue = useMemo(() => {
    return items.reduce((sum, item) => sum + item.value, 0);
  }, [items]);
  
  return <div>{expensiveValue}</div>;
};

// 使用useCallback
const ParentComponent = () => {
  const [count, setCount] = useState(0);
  
  const handleClick = useCallback(() => {
    setCount(prev => prev + 1);
  }, []);
  
  return <ChildComponent onClick={handleClick} />;
};
```

### 后端优化
```typescript
// 使用缓存
import Redis from 'ioredis';

const redis = new Redis();

export const getCachedData = async (key: string) => {
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }
  
  const data = await fetchDataFromDatabase();
  await redis.setex(key, 3600, JSON.stringify(data));
  return data;
};

// 使用连接池
import { Pool } from 'pg';

const pool = new Pool({
  max: 20,
  min: 5,
  idleTimeoutMillis: 30000
});
```

## 测试策略

### 单元测试
```typescript
// 测试工具函数
import { describe, it, expect } from 'vitest';
import { formatFileSize } from '../utils/fileUtils';

describe('formatFileSize', () => {
  it('should format bytes correctly', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
  });
});
```

### 集成测试
```typescript
// 测试API接口
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../server';

describe('API Integration', () => {
  it('should upload image successfully', async () => {
    const response = await request(app)
      .post('/api/upload')
      .attach('file', Buffer.from('test'), 'test.jpg')
      .expect(200);
    
    expect(response.body).toHaveProperty('success', true);
  });
});
```

### 端到端测试
```typescript
// 测试用户流程
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import UploadComponent from '../components/UploadComponent';

describe('Upload Flow', () => {
  it('should complete upload process', async () => {
    const wrapper = mount(UploadComponent);
    
    // 模拟文件上传
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    await wrapper.vm.handleFileUpload(file);
    
    // 验证结果
    expect(wrapper.vm.uploadStatus).toBe('success');
  });
});
```

## 部署流程

### 开发环境
```bash
# 启动开发服务器
npm run dev

# 启动后端服务
npm run dev:server

# 启动数据库
docker-compose up -d redis
```

### 测试环境
```bash
# 构建测试版本
npm run build:test

# 运行测试
npm run test

# 部署到测试环境
docker-compose -f docker-compose.test.yml up -d
```

### 生产环境
```bash
# 构建生产版本
npm run build

# 运行生产测试
npm run test:prod

# 部署到生产环境
docker-compose -f docker-compose.prod.yml up -d
```

## 最佳实践

### 代码质量
1. **代码审查**: 所有代码必须经过审查
2. **测试覆盖**: 保持80%以上的测试覆盖率
3. **文档更新**: 及时更新相关文档
4. **性能监控**: 持续监控性能指标

### 安全考虑
1. **输入验证**: 验证所有用户输入
2. **权限控制**: 实施最小权限原则
3. **数据加密**: 敏感数据加密存储
4. **安全扫描**: 定期进行安全扫描

### 可维护性
1. **模块化设计**: 保持代码模块化
2. **接口设计**: 设计清晰的接口
3. **错误处理**: 完善的错误处理机制
4. **日志记录**: 详细的日志记录

---

**注意**: 开发过程中请遵循团队规范，保持代码质量和一致性。
