# 安全指南

本文档介绍光伏图像识别系统的安全设计、实施和最佳实践。

## 安全架构

### 安全层次
1. **网络安全**: 防火墙、VPN、DDoS防护
2. **应用安全**: 身份认证、授权、输入验证
3. **数据安全**: 加密存储、传输加密、备份保护
4. **系统安全**: 操作系统加固、容器安全、漏洞管理

### 安全原则
- **最小权限**: 只授予必要的权限
- **深度防御**: 多层安全防护
- **零信任**: 不信任任何内部网络
- **持续监控**: 实时安全监控

## 网络安全

### 防火墙配置
```bash
# 允许必要端口
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3000/tcp  # 应用端口

# 拒绝其他端口
ufw default deny incoming
ufw default allow outgoing

# 启用防火墙
ufw enable
```

### SSL/TLS配置
```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name solar-app.com;
    
    ssl_certificate /etc/ssl/certs/solar-app.crt;
    ssl_certificate_key /etc/ssl/private/solar-app.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
}
```

### DDoS防护
```nginx
# 限制请求速率
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=upload:10m rate=5r/s;

server {
    location /api/ {
        limit_req zone=api burst=20 nodelay;
    }
    
    location /api/upload {
        limit_req zone=upload burst=10 nodelay;
    }
}
```

## 应用安全

### 身份认证
```typescript
// 身份认证中间件
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};
```

### 输入验证
```typescript
// 文件上传验证
export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ error: 'Invalid file type' });
  }

  if (req.file.size > maxSize) {
    return res.status(400).json({ error: 'File too large' });
  }

  next();
};
```

### 数据验证
```typescript
// 使用Joi进行数据验证
import Joi from 'joi';

const analysisSchema = Joi.object({
  imageId: Joi.string().uuid().required(),
  analysisType: Joi.string().valid('defect', 'efficiency', 'maintenance').required(),
  parameters: Joi.object().optional()
});

export const validateAnalysisRequest = (req: Request, res: Response, next: NextFunction) => {
  const { error } = analysisSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};
```

## 数据安全

### 加密存储
```typescript
// 数据加密
import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

export const encryptData = (data: string): string => {
  const cipher = crypto.createCipher(algorithm, key);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

export const decryptData = (encryptedData: string): string => {
  const decipher = crypto.createDecipher(algorithm, key);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};
```

### 传输加密
```typescript
// HTTPS配置
import https from 'https';
import fs from 'fs';

const options = {
  key: fs.readFileSync('private-key.pem'),
  cert: fs.readFileSync('certificate.pem'),
  ca: fs.readFileSync('ca-bundle.pem')
};

const server = https.createServer(options, app);
```

### 数据备份
```bash
#!/bin/bash
# 加密备份脚本
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).tar.gz"
ENCRYPTED_FILE="${BACKUP_FILE}.enc"

# 创建备份
tar -czf "$BACKUP_FILE" src/uploads src/logs

# 加密备份
openssl enc -aes-256-cbc -salt -in "$BACKUP_FILE" -out "$ENCRYPTED_FILE" -pass pass:backup_password

# 删除未加密文件
rm "$BACKUP_FILE"

# 上传到安全存储
aws s3 cp "$ENCRYPTED_FILE" s3://secure-backups/
```

## 系统安全

### 容器安全
```dockerfile
# Dockerfile安全配置
FROM node:18-alpine

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# 设置工作目录
WORKDIR /app

# 复制文件并设置权限
COPY --chown=nextjs:nodejs . .

# 切换到非root用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["npm", "start"]
```

### 操作系统加固
```bash
# 系统更新
apt-get update && apt-get upgrade -y

# 安装安全工具
apt-get install -y fail2ban ufw unattended-upgrades

# 配置自动更新
echo 'Unattended-Upgrade::Automatic-Reboot "false";' >> /etc/apt/apt.conf.d/50unattended-upgrades

# 配置fail2ban
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
EOF

systemctl enable fail2ban
systemctl start fail2ban
```

### 漏洞管理
```bash
#!/bin/bash
# 安全扫描脚本
echo "开始安全扫描..."

# 扫描系统漏洞
if command -v apt-get &> /dev/null; then
    apt-get update
    apt-get upgrade -y
fi

# 扫描Docker镜像
if command -v trivy &> /dev/null; then
    trivy image solar-image-recognition:latest
fi

# 扫描npm依赖
if command -v npm &> /dev/null; then
    npm audit --audit-level=moderate
fi

echo "安全扫描完成"
```

## 安全监控

### 入侵检测
```typescript
// 异常行为检测
export const detectAnomalies = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip;
  const userAgent = req.get('User-Agent');
  const requestPath = req.path;
  
  // 检查可疑请求
  const suspiciousPatterns = [
    /\.\.\//,  // 路径遍历
    /<script/i,  // XSS尝试
    /union.*select/i,  // SQL注入
    /eval\(/i  // 代码注入
  ];
  
  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(requestPath) || pattern.test(userAgent)
  );
  
  if (isSuspicious) {
    logger.warn('Suspicious request detected', {
      ip: clientIP,
      userAgent,
      path: requestPath,
      timestamp: new Date()
    });
    
    // 可以在这里实施额外的安全措施
    // 如临时封禁IP、发送告警等
  }
  
  next();
};
```

### 安全日志
```typescript
// 安全事件日志
export const logSecurityEvent = (event: string, details: any) => {
  logger.info('Security Event', {
    event,
    details,
    timestamp: new Date(),
    severity: 'HIGH'
  });
  
  // 发送到安全监控系统
  if (process.env.SECURITY_WEBHOOK_URL) {
    fetch(process.env.SECURITY_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, details, timestamp: new Date() })
    });
  }
};
```

## 安全最佳实践

### 开发安全
1. **代码审查**: 所有代码变更必须经过审查
2. **安全测试**: 集成安全测试到CI/CD流程
3. **依赖管理**: 定期更新和扫描依赖包
4. **错误处理**: 避免泄露敏感信息

### 运维安全
1. **访问控制**: 实施最小权限原则
2. **监控告警**: 实时监控安全事件
3. **备份恢复**: 定期测试备份和恢复流程
4. **应急响应**: 建立安全事件响应流程

### 用户安全
1. **密码策略**: 强制复杂密码
2. **会话管理**: 安全的会话处理
3. **数据保护**: 用户数据加密存储
4. **隐私保护**: 遵循数据保护法规

## 安全工具

### 扫描工具
- **Trivy**: 容器镜像漏洞扫描
- **npm audit**: npm依赖漏洞扫描
- **OWASP ZAP**: Web应用安全测试
- **Nessus**: 网络漏洞扫描

### 监控工具
- **Prometheus**: 指标监控
- **Grafana**: 可视化监控
- **ELK Stack**: 日志分析
- **Falco**: 运行时安全监控

## 应急响应

### 安全事件处理
1. **事件识别**: 通过监控和告警
2. **影响评估**: 确定影响范围
3. **隔离措施**: 隔离受影响系统
4. **证据收集**: 保存相关日志和证据
5. **问题修复**: 修复安全漏洞
6. **恢复服务**: 恢复正常服务
7. **事后分析**: 总结经验教训

### 应急联系
- **安全团队**: security@company.com
- **技术负责人**: tech-lead@company.com
- **管理层**: management@company.com

## 合规要求

### 数据保护
- **GDPR**: 欧盟数据保护法规
- **CCPA**: 加州消费者隐私法案
- **HIPAA**: 健康保险可携性和责任法案

### 安全标准
- **ISO 27001**: 信息安全管理体系
- **SOC 2**: 服务组织控制
- **PCI DSS**: 支付卡行业数据安全标准

## 安全培训

### 开发团队
- 安全编码实践
- 常见漏洞类型
- 安全测试方法
- 应急响应流程

### 运维团队
- 系统安全配置
- 监控和告警
- 漏洞管理
- 事件响应

---

**注意**: 安全是一个持续的过程，需要定期评估和改进。建议定期进行安全审计和渗透测试。
