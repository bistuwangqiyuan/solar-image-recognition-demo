# 贡献指南

感谢您对光伏图像识别系统的关注和贡献！本文档将指导您如何参与项目开发。

## 贡献方式

### 报告问题
- 使用GitHub Issues报告bug
- 提供详细的问题描述
- 包含复现步骤和环境信息
- 使用标签分类问题类型

### 功能建议
- 使用GitHub Issues提出新功能建议
- 详细描述功能需求和用例
- 讨论实现方案和影响
- 获得社区反馈后开始开发

### 代码贡献
- Fork项目到个人仓库
- 创建功能分支
- 提交代码变更
- 创建Pull Request
- 参与代码审查

## 开发环境

### 环境要求
- Node.js 18.0+
- npm 8.0+ 或 yarn 1.22+
- Docker 20.0+
- Git 2.30+

### 环境搭建
```bash
# 1. Fork项目到个人仓库
# 2. 克隆项目
git clone https://github.com/your-username/solar-image-recognition.git
cd solar-image-recognition

# 3. 添加上游仓库
git remote add upstream https://github.com/original-org/solar-image-recognition.git

# 4. 安装依赖
npm install

# 5. 复制环境变量
cp env.example .env

# 6. 启动开发服务器
npm run dev
```

## 代码规范

### 代码风格
- 使用TypeScript编写代码
- 遵循ESLint规则
- 使用Prettier格式化代码
- 使用有意义的变量和函数名

### 提交规范
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

### 测试要求
- 为新功能编写单元测试
- 保持80%以上的测试覆盖率
- 测试用例要覆盖正常和异常情况
- 使用描述性的测试名称

## 开发流程

### 1. 创建分支
```bash
# 从main分支创建功能分支
git checkout main
git pull upstream main
git checkout -b feature/your-feature-name
```

### 2. 开发功能
```bash
# 编写代码
# 运行测试
npm run test

# 检查代码质量
npm run lint
npm run type-check

# 格式化代码
npm run format
```

### 3. 提交代码
```bash
# 添加变更
git add .

# 提交代码
git commit -m "feat: add your feature"

# 推送分支
git push origin feature/your-feature-name
```

### 4. 创建Pull Request
- 在GitHub上创建Pull Request
- 填写详细的描述信息
- 关联相关Issue
- 请求代码审查

### 5. 代码审查
- 响应审查意见
- 修改代码问题
- 更新测试用例
- 更新文档

### 6. 合并代码
- 通过所有检查
- 获得审查通过
- 合并到main分支
- 删除功能分支

## 项目结构

### 前端结构
```
src/
├── components/         # React组件
│   ├── common/        # 通用组件
│   ├── layout/        # 布局组件
│   ├── upload/        # 上传组件
│   ├── results/       # 结果展示组件
│   └── demo/          # 演示组件
├── pages/             # 页面组件
├── services/          # 服务层
├── utils/             # 工具函数
├── types/             # TypeScript类型
├── contexts/          # React上下文
├── hooks/             # 自定义Hooks
└── test/              # 测试文件
```

### 后端结构
```
src/server/
├── routes/            # 路由定义
├── middleware/        # 中间件
├── utils/             # 工具函数
├── config/            # 配置文件
└── __tests__/         # 测试文件
```

## 测试指南

### 单元测试
```typescript
// 测试工具函数
import { describe, it, expect } from 'vitest';
import { formatFileSize } from '../utils/fileUtils';

describe('formatFileSize', () => {
  it('should format bytes correctly', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1024 * 1024)).toBe('1 MB');
  });
});
```

### 组件测试
```typescript
// 测试React组件
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import UploadComponent from '../UploadComponent';

describe('UploadComponent', () => {
  it('should render upload component', () => {
    render(<UploadComponent onUpload={vi.fn()} />);
    expect(screen.getByText('上传图像')).toBeInTheDocument();
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

## 文档规范

### 代码注释
```typescript
/**
 * 分析图像中的缺陷
 * @param file 图像文件
 * @param options 分析选项
 * @returns 分析结果
 */
export const analyzeImage = async (
  file: File,
  options: AnalysisOptions
): Promise<AnalysisResult> => {
  // 实现逻辑
};
```

### README更新
- 更新功能描述
- 更新安装说明
- 更新使用示例
- 更新API文档

### 文档结构
```
docs/
├── README.md           # 项目说明
├── API.md             # API文档
├── DEVELOPMENT.md     # 开发指南
├── DEPLOYMENT.md      # 部署指南
├── TESTING.md         # 测试指南
├── SECURITY.md        # 安全指南
├── PERFORMANCE.md     # 性能指南
├── MONITORING.md      # 监控指南
└── TROUBLESHOOTING.md # 故障排除
```

## 代码审查

### 审查要点
- **功能正确性**: 确保功能按预期工作
- **代码质量**: 检查代码结构和可读性
- **性能考虑**: 评估性能影响
- **安全性**: 检查安全漏洞
- **测试覆盖**: 确保有足够的测试

### 审查流程
1. **自动检查**: CI/CD自动运行测试和检查
2. **人工审查**: 至少一名维护者审查
3. **修改反馈**: 根据审查意见修改代码
4. **最终确认**: 审查通过后合并代码

## 发布流程

### 版本发布
1. **功能完成**: 所有功能开发完成
2. **测试通过**: 所有测试用例通过
3. **文档更新**: 更新相关文档
4. **版本标记**: 创建版本标签
5. **发布说明**: 编写发布说明

### 版本号规范
- **主版本号**: 不兼容的API修改
- **次版本号**: 向下兼容的功能性新增
- **修订号**: 向下兼容的问题修正

## 社区规范

### 行为准则
- 尊重所有贡献者
- 使用友好和包容的语言
- 接受建设性的批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

### 沟通渠道
- **GitHub Issues**: 问题讨论和功能建议
- **GitHub Discussions**: 一般性讨论
- **Pull Request**: 代码审查和讨论
- **邮件列表**: 重要公告和通知

## 贡献者

### 核心维护者
- **项目负责人**: 负责项目整体规划
- **技术负责人**: 负责技术架构和代码质量
- **文档负责人**: 负责文档维护和更新
- **测试负责人**: 负责测试策略和质量保证

### 贡献者类型
- **代码贡献者**: 编写代码和修复bug
- **文档贡献者**: 编写和更新文档
- **测试贡献者**: 编写测试用例
- **设计贡献者**: 提供UI/UX设计
- **社区贡献者**: 回答问题和管理社区

## 许可证

本项目采用MIT许可证，详情请参见[LICENSE](LICENSE)文件。

## 联系方式

- **项目地址**: https://github.com/your-org/solar-image-recognition
- **问题反馈**: https://github.com/your-org/solar-image-recognition/issues
- **讨论区**: https://github.com/your-org/solar-image-recognition/discussions
- **邮件联系**: maintainers@solar-app.com

---

感谢您的贡献！让我们一起构建更好的光伏图像识别系统。
