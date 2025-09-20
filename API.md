# API文档

本文档介绍光伏图像识别系统的API接口规范、使用方法和示例。

## API概览

### 基础信息
- **基础URL**: `https://api.solar-app.com`
- **API版本**: v1
- **认证方式**: Bearer Token
- **数据格式**: JSON
- **字符编码**: UTF-8

### 响应格式
```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 错误格式
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "参数验证失败",
    "details": {
      "field": "filename",
      "reason": "文件名不能为空"
    }
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 认证接口

### 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password123"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user123",
      "username": "user@example.com",
      "role": "user"
    },
    "expires_in": 3600
  }
}
```

### 用户注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

### 刷新令牌
```http
POST /api/auth/refresh
Authorization: Bearer <token>
```

### 用户登出
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

## 图像上传接口

### 单文件上传
```http
POST /api/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <image_file>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "img123",
    "filename": "solar-panel.jpg",
    "size": 1024000,
    "type": "image/jpeg",
    "url": "/uploads/img123.jpg",
    "uploaded_at": "2024-01-01T00:00:00Z"
  }
}
```

### 批量上传
```http
POST /api/upload/batch
Authorization: Bearer <token>
Content-Type: multipart/form-data

files: <image_file1>
files: <image_file2>
files: <image_file3>
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "img123",
      "filename": "solar-panel1.jpg",
      "size": 1024000,
      "type": "image/jpeg",
      "url": "/uploads/img123.jpg",
      "uploaded_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": "img124",
      "filename": "solar-panel2.jpg",
      "size": 2048000,
      "type": "image/jpeg",
      "url": "/uploads/img124.jpg",
      "uploaded_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 获取上传状态
```http
GET /api/upload/status/{upload_id}
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "upload123",
    "status": "completed",
    "progress": 100,
    "files": [
      {
        "id": "img123",
        "filename": "solar-panel.jpg",
        "status": "uploaded"
      }
    ]
  }
}
```

## 图像分析接口

### 单图像分析
```http
POST /api/analysis
Authorization: Bearer <token>
Content-Type: application/json

{
  "image_id": "img123",
  "analysis_type": "defect_detection",
  "parameters": {
    "confidence_threshold": 0.8,
    "detection_types": ["crack", "discoloration", "dirt"]
  }
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "analysis123",
    "image_id": "img123",
    "status": "completed",
    "result": {
      "defects": [
        {
          "type": "crack",
          "confidence": 0.95,
          "bbox": {
            "x": 100,
            "y": 150,
            "width": 50,
            "height": 30
          },
          "severity": "high"
        }
      ],
      "overall_confidence": 0.92,
      "recommendations": [
        "检查裂纹区域",
        "建议更换受损面板"
      ]
    },
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### 批量分析
```http
POST /api/analysis/batch
Authorization: Bearer <token>
Content-Type: application/json

{
  "image_ids": ["img123", "img124", "img125"],
  "analysis_type": "defect_detection",
  "parameters": {
    "confidence_threshold": 0.8
  }
}
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "analysis123",
      "image_id": "img123",
      "status": "completed",
      "result": {
        "defects": [
          {
            "type": "crack",
            "confidence": 0.95,
            "bbox": {
              "x": 100,
              "y": 150,
              "width": 50,
              "height": 30
            },
            "severity": "high"
          }
        ],
        "overall_confidence": 0.92,
        "recommendations": [
          "检查裂纹区域",
          "建议更换受损面板"
        ]
      }
    },
    {
      "id": "analysis124",
      "image_id": "img124",
      "status": "completed",
      "result": {
        "defects": [],
        "overall_confidence": 0.98,
        "recommendations": [
          "面板状态良好",
          "建议定期清洁"
        ]
      }
    }
  ]
}
```

### 获取分析结果
```http
GET /api/analysis/{analysis_id}
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "analysis123",
    "image_id": "img123",
    "status": "completed",
    "result": {
      "defects": [
        {
          "type": "crack",
          "confidence": 0.95,
          "bbox": {
            "x": 100,
            "y": 150,
            "width": 50,
            "height": 30
          },
          "severity": "high"
        }
      ],
      "overall_confidence": 0.92,
      "recommendations": [
        "检查裂纹区域",
        "建议更换受损面板"
      ]
    },
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### 获取分析历史
```http
GET /api/analysis/history
Authorization: Bearer <token>
Query Parameters:
  - page: 页码 (默认: 1)
  - limit: 每页数量 (默认: 20)
  - status: 状态过滤 (可选: pending, processing, completed, failed)
  - start_date: 开始日期 (可选: YYYY-MM-DD)
  - end_date: 结束日期 (可选: YYYY-MM-DD)
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "analyses": [
      {
        "id": "analysis123",
        "image_id": "img123",
        "status": "completed",
        "result": {
          "defects": [
            {
              "type": "crack",
              "confidence": 0.95,
              "bbox": {
                "x": 100,
                "y": 150,
                "width": 50,
                "height": 30
              },
              "severity": "high"
            }
          ],
          "overall_confidence": 0.92,
          "recommendations": [
            "检查裂纹区域",
            "建议更换受损面板"
          ]
        },
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

## 演示接口

### 获取演示图像列表
```http
GET /api/demo/images
Query Parameters:
  - category: 分类过滤 (可选: defect, efficiency, maintenance)
  - limit: 数量限制 (默认: 20)
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "demo123",
      "filename": "crack-example.jpg",
      "category": "defect",
      "description": "裂纹检测示例",
      "url": "/demo/images/crack-example.jpg",
      "thumbnail_url": "/demo/thumbnails/crack-example.jpg"
    },
    {
      "id": "demo124",
      "filename": "efficiency-example.jpg",
      "category": "efficiency",
      "description": "效率分析示例",
      "url": "/demo/images/efficiency-example.jpg",
      "thumbnail_url": "/demo/thumbnails/efficiency-example.jpg"
    }
  ]
}
```

### 获取演示图像详情
```http
GET /api/demo/images/{image_id}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "demo123",
    "filename": "crack-example.jpg",
    "category": "defect",
    "description": "裂纹检测示例",
    "url": "/demo/images/crack-example.jpg",
    "thumbnail_url": "/demo/thumbnails/crack-example.jpg",
    "analysis_result": {
      "defects": [
        {
          "type": "crack",
          "confidence": 0.95,
          "bbox": {
            "x": 100,
            "y": 150,
            "width": 50,
            "height": 30
          },
          "severity": "high"
        }
      ],
      "overall_confidence": 0.92,
      "recommendations": [
        "检查裂纹区域",
        "建议更换受损面板"
      ]
    }
  }
}
```

### 获取演示统计信息
```http
GET /api/demo/stats
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "total_images": 50,
    "categories": {
      "defect": 20,
      "efficiency": 15,
      "maintenance": 15
    },
    "analysis_types": {
      "defect_detection": 20,
      "efficiency_analysis": 15,
      "maintenance_recommendation": 15
    }
  }
}
```

## 用户管理接口

### 获取用户信息
```http
GET /api/user/profile
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "user123",
    "username": "user@example.com",
    "role": "user",
    "created_at": "2024-01-01T00:00:00Z",
    "last_login": "2024-01-01T00:00:00Z",
    "preferences": {
      "language": "zh-CN",
      "theme": "light",
      "notifications": true
    }
  }
}
```

### 更新用户信息
```http
PUT /api/user/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "preferences": {
    "language": "en-US",
    "theme": "dark",
    "notifications": false
  }
}
```

### 获取用户统计
```http
GET /api/user/stats
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "total_uploads": 100,
    "total_analyses": 95,
    "successful_analyses": 90,
    "failed_analyses": 5,
    "total_storage_used": 1024000000,
    "last_upload": "2024-01-01T00:00:00Z",
    "last_analysis": "2024-01-01T00:00:00Z"
  }
}
```

## 系统接口

### 健康检查
```http
GET /api/health
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00Z",
    "version": "1.0.0",
    "services": {
      "database": "healthy",
      "redis": "healthy",
      "ai_model": "healthy"
    }
  }
}
```

### 系统状态
```http
GET /api/system/status
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "uptime": 86400,
    "memory_usage": {
      "used": 512000000,
      "total": 1024000000,
      "percentage": 50
    },
    "cpu_usage": {
      "percentage": 25
    },
    "disk_usage": {
      "used": 10240000000,
      "total": 102400000000,
      "percentage": 10
    },
    "active_connections": 150,
    "requests_per_minute": 1000
  }
}
```

### 系统配置
```http
GET /api/system/config
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "upload": {
      "max_file_size": 10485760,
      "allowed_types": ["image/jpeg", "image/png", "image/webp"],
      "max_files_per_batch": 10
    },
    "analysis": {
      "max_concurrent": 5,
      "timeout": 300,
      "retry_attempts": 3
    },
    "ai_model": {
      "version": "1.0.0",
      "confidence_threshold": 0.8,
      "supported_types": ["defect_detection", "efficiency_analysis"]
    }
  }
}
```

## 错误码说明

### HTTP状态码
- **200**: 请求成功
- **201**: 创建成功
- **400**: 请求参数错误
- **401**: 未授权
- **403**: 禁止访问
- **404**: 资源不存在
- **409**: 资源冲突
- **422**: 数据验证失败
- **429**: 请求频率限制
- **500**: 服务器内部错误
- **503**: 服务不可用

### 业务错误码
- **VALIDATION_ERROR**: 参数验证失败
- **AUTHENTICATION_ERROR**: 认证失败
- **AUTHORIZATION_ERROR**: 授权失败
- **RESOURCE_NOT_FOUND**: 资源不存在
- **RESOURCE_CONFLICT**: 资源冲突
- **UPLOAD_ERROR**: 上传失败
- **ANALYSIS_ERROR**: 分析失败
- **RATE_LIMIT_EXCEEDED**: 请求频率超限
- **SERVICE_UNAVAILABLE**: 服务不可用
- **INTERNAL_ERROR**: 内部错误

## 使用示例

### JavaScript示例
```javascript
// 上传图像
const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  return await response.json();
};

// 分析图像
const analyzeImage = async (imageId) => {
  const response = await fetch('/api/analysis', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      image_id: imageId,
      analysis_type: 'defect_detection'
    })
  });
  
  return await response.json();
};

// 获取分析结果
const getAnalysisResult = async (analysisId) => {
  const response = await fetch(`/api/analysis/${analysisId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};
```

### Python示例
```python
import requests
import json

# 上传图像
def upload_image(file_path, token):
    url = 'https://api.solar-app.com/api/upload'
    headers = {'Authorization': f'Bearer {token}'}
    
    with open(file_path, 'rb') as f:
        files = {'file': f}
        response = requests.post(url, headers=headers, files=files)
    
    return response.json()

# 分析图像
def analyze_image(image_id, token):
    url = 'https://api.solar-app.com/api/analysis'
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    data = {
        'image_id': image_id,
        'analysis_type': 'defect_detection'
    }
    
    response = requests.post(url, headers=headers, json=data)
    return response.json()

# 获取分析结果
def get_analysis_result(analysis_id, token):
    url = f'https://api.solar-app.com/api/analysis/{analysis_id}'
    headers = {'Authorization': f'Bearer {token}'}
    
    response = requests.get(url, headers=headers)
    return response.json()
```

### cURL示例
```bash
# 上传图像
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -F "file=@solar-panel.jpg" \
  https://api.solar-app.com/api/upload

# 分析图像
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"image_id": "img123", "analysis_type": "defect_detection"}' \
  https://api.solar-app.com/api/analysis

# 获取分析结果
curl -X GET \
  -H "Authorization: Bearer <token>" \
  https://api.solar-app.com/api/analysis/analysis123
```

## 最佳实践

### 请求优化
1. **使用HTTPS**: 确保数据传输安全
2. **设置超时**: 避免长时间等待
3. **重试机制**: 处理网络异常
4. **缓存策略**: 减少重复请求

### 错误处理
1. **检查状态码**: 验证响应状态
2. **处理错误信息**: 解析错误详情
3. **用户友好**: 提供清晰的错误提示
4. **日志记录**: 记录错误信息

### 性能优化
1. **批量操作**: 减少请求次数
2. **分页查询**: 避免大量数据
3. **压缩传输**: 减少网络开销
4. **异步处理**: 提高响应速度

---

**注意**: API接口可能会根据业务需求进行调整，建议定期查看更新日志。
