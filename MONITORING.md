# 监控和运维指南

本文档介绍光伏图像识别系统的监控配置、运维流程和故障排除方法。

## 监控架构

### 监控组件
- **Prometheus**: 指标数据收集和存储
- **Grafana**: 数据可视化和仪表板
- **Node Exporter**: 系统指标收集
- **Redis Exporter**: Redis指标收集
- **ELK Stack**: 日志收集和分析

### 监控层次
1. **应用层**: 请求速率、响应时间、错误率
2. **服务层**: 容器状态、服务健康
3. **系统层**: CPU、内存、磁盘、网络
4. **业务层**: 用户行为、功能使用

## 监控配置

### Prometheus配置
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'solar-app'
    static_configs:
      - targets: ['app:3000']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
    scrape_interval: 10s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
    scrape_interval: 15s
```

### Grafana仪表板
- **应用性能**: 请求速率、响应时间、错误率
- **系统资源**: CPU、内存、磁盘使用
- **服务状态**: 容器健康、服务可用性
- **业务指标**: 用户活跃度、功能使用

## 监控指标

### 应用指标
```javascript
// 请求速率
rate(http_requests_total[5m])

// 响应时间
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

// 错误率
rate(http_requests_total{status=~"5.."}[5m])

// 活跃连接
nginx_connections_active
```

### 系统指标
```javascript
// CPU使用率
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

// 内存使用率
(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100

// 磁盘使用率
100 - ((node_filesystem_avail_bytes * 100) / node_filesystem_size_bytes)
```

### 业务指标
```javascript
// 用户活跃度
rate(user_sessions_total[1h])

// 功能使用率
rate(feature_usage_total[1h])

// 图像处理成功率
rate(image_processing_success_total[1h]) / rate(image_processing_total[1h])
```

## 告警配置

### 告警规则
```yaml
# monitoring/alert-rules.yml
groups:
  - name: solar-app-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "高错误率告警"
          description: "5xx错误率超过10%"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "高响应时间告警"
          description: "95%响应时间超过1秒"

      - alert: HighCPUUsage
        expr: 100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "高CPU使用率告警"
          description: "CPU使用率超过80%"

      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 85
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "高内存使用率告警"
          description: "内存使用率超过85%"

      - alert: DiskSpaceLow
        expr: 100 - ((node_filesystem_avail_bytes * 100) / node_filesystem_size_bytes) > 90
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "磁盘空间不足告警"
          description: "磁盘使用率超过90%"
```

### 告警通知
```yaml
# monitoring/alertmanager.yml
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@solar-app.com'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
  - name: 'web.hook'
    webhook_configs:
      - url: 'http://webhook:5001/'

  - name: 'email'
    email_configs:
      - to: 'admin@solar-app.com'
        subject: 'Solar App Alert: {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          {{ end }}
```

## 日志管理

### 日志收集
```yaml
# monitoring/logstash.conf
input {
  beats {
    port => 5044
  }
  
  tcp {
    port => 5000
    codec => json_lines
  }
}

filter {
  if [fields][service] == "solar-app" {
    grok {
      match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} %{GREEDYDATA:message}" }
    }
    
    date {
      match => [ "timestamp", "ISO8601" ]
    }
    
    mutate {
      add_field => { "service_name" => "solar-image-recognition" }
      add_field => { "environment" => "%{[fields][environment]}" }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "solar-app-logs-%{+YYYY.MM.dd}"
  }
  
  stdout {
    codec => rubydebug
  }
}
```

### 日志分析
```javascript
// 错误日志分析
{
  "query": {
    "bool": {
      "must": [
        { "match": { "level": "error" } },
        { "range": { "@timestamp": { "gte": "now-1h" } } }
      ]
    }
  }
}

// 性能日志分析
{
  "query": {
    "bool": {
      "must": [
        { "match": { "message": "response_time" } },
        { "range": { "response_time": { "gte": 1000 } } }
      ]
    }
  }
}
```

## 运维流程

### 日常运维
1. **健康检查**: 每日检查服务状态
2. **性能监控**: 监控关键指标
3. **日志分析**: 分析错误和异常
4. **容量规划**: 评估资源使用

### 故障处理
1. **问题识别**: 通过监控和告警
2. **影响评估**: 确定影响范围
3. **问题定位**: 分析日志和指标
4. **解决方案**: 实施修复措施
5. **验证测试**: 确认问题解决
6. **总结改进**: 记录经验教训

### 应急响应
```bash
# 服务重启
docker-compose restart app

# 回滚版本
docker-compose down
docker-compose up -d --scale app=1

# 紧急扩容
docker-compose up -d --scale app=3

# 数据恢复
./scripts/restore.sh -d 20240101_120000 -t all
```

## 性能优化

### 监控优化
- 调整采集间隔
- 优化查询性能
- 减少存储空间
- 提高告警精度

### 系统优化
- 资源分配调整
- 缓存策略优化
- 数据库调优
- 网络配置优化

## 故障排除

### 常见问题
1. **服务无法启动**
   - 检查端口占用
   - 验证配置文件
   - 查看启动日志

2. **性能问题**
   - 分析资源使用
   - 检查缓存命中率
   - 优化数据库查询

3. **监控异常**
   - 验证指标收集
   - 检查告警规则
   - 测试通知渠道

### 调试工具
```bash
# 查看容器状态
docker ps -a

# 查看服务日志
docker logs -f app

# 检查网络连接
docker exec app netstat -tuln

# 分析性能
docker exec app top
```

## 最佳实践

### 监控最佳实践
1. **指标设计**: 选择关键业务指标
2. **告警策略**: 避免告警疲劳
3. **仪表板设计**: 突出重要信息
4. **日志管理**: 结构化日志格式

### 运维最佳实践
1. **自动化运维**: 减少人工干预
2. **文档管理**: 及时更新文档
3. **知识分享**: 团队经验共享
4. **持续改进**: 定期优化流程

## 扩展阅读

- [Prometheus官方文档](https://prometheus.io/docs/)
- [Grafana用户指南](https://grafana.com/docs/)
- [ELK Stack指南](https://www.elastic.co/guide/)
- [Docker监控最佳实践](https://docs.docker.com/config/containers/resource_constraints/)

---

**注意**: 监控配置需要根据实际环境进行调整，建议在生产环境中进行充分测试。
