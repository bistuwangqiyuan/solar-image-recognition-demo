# 故障排除指南

本文档介绍光伏图像识别系统常见问题的诊断和解决方法。

## 常见问题

### 服务启动问题

#### 问题1: 服务无法启动
**症状**: 应用服务启动失败，返回错误信息

**可能原因**:
- 端口被占用
- 依赖服务未启动
- 配置文件错误
- 权限不足

**解决方法**:
```bash
# 检查端口占用
netstat -tuln | grep :3000
lsof -i :3000

# 检查依赖服务
docker ps | grep redis
docker ps | grep nginx

# 检查配置文件
cat .env
cat docker-compose.yml

# 检查权限
ls -la src/
chmod 755 src/
```

#### 问题2: 数据库连接失败
**症状**: 应用无法连接到数据库

**可能原因**:
- 数据库服务未启动
- 连接配置错误
- 网络问题
- 认证失败

**解决方法**:
```bash
# 检查Redis服务
docker ps | grep redis
docker logs redis

# 测试连接
redis-cli ping

# 检查配置
echo $REDIS_URL
cat .env | grep REDIS

# 重启服务
docker-compose restart redis
```

#### 问题3: 文件上传失败
**症状**: 用户无法上传文件

**可能原因**:
- 文件大小超限
- 文件类型不支持
- 存储空间不足
- 权限问题

**解决方法**:
```bash
# 检查文件大小限制
grep UPLOAD_MAX_SIZE .env

# 检查存储空间
df -h src/uploads/

# 检查权限
ls -la src/uploads/
chmod 755 src/uploads/

# 检查Nginx配置
cat nginx.conf | grep client_max_body_size
```

### 性能问题

#### 问题1: 响应时间过长
**症状**: API响应时间超过预期

**可能原因**:
- 数据库查询慢
- 网络延迟
- 服务器负载高
- 缓存失效

**解决方法**:
```bash
# 检查系统负载
top
htop

# 检查内存使用
free -h
docker stats

# 检查磁盘I/O
iostat -x 1

# 检查网络延迟
ping api.solar-app.com
traceroute api.solar-app.com

# 检查数据库性能
redis-cli --latency
redis-cli --stat
```

#### 问题2: 内存使用过高
**症状**: 系统内存使用率超过80%

**可能原因**:
- 内存泄漏
- 缓存过多
- 并发请求过多
- 垃圾回收问题

**解决方法**:
```bash
# 检查内存使用
free -h
docker stats

# 检查进程内存
ps aux --sort=-%mem | head -10

# 检查Node.js内存
node --max-old-space-size=4096 app.js

# 重启服务释放内存
docker-compose restart app
```

#### 问题3: CPU使用率过高
**症状**: CPU使用率持续超过80%

**可能原因**:
- 计算密集型任务
- 无限循环
- 死锁
- 资源竞争

**解决方法**:
```bash
# 检查CPU使用
top
htop

# 检查进程CPU使用
ps aux --sort=-%cpu | head -10

# 检查系统负载
uptime
cat /proc/loadavg

# 检查Docker容器资源
docker stats
```

### 网络问题

#### 问题1: 无法访问应用
**症状**: 浏览器无法访问应用

**可能原因**:
- 服务未启动
- 端口未开放
- 防火墙阻止
- DNS解析问题

**解决方法**:
```bash
# 检查服务状态
docker ps
systemctl status nginx

# 检查端口开放
netstat -tuln | grep :80
netstat -tuln | grep :443

# 检查防火墙
ufw status
iptables -L

# 检查DNS
nslookup api.solar-app.com
dig api.solar-app.com
```

#### 问题2: SSL证书问题
**症状**: HTTPS访问失败

**可能原因**:
- 证书过期
- 证书配置错误
- 证书链不完整
- 域名不匹配

**解决方法**:
```bash
# 检查证书有效期
openssl x509 -in /etc/ssl/certs/solar-app.crt -text -noout | grep "Not After"

# 检查证书配置
openssl s_client -connect api.solar-app.com:443 -servername api.solar-app.com

# 检查Nginx配置
cat nginx.conf | grep ssl
nginx -t

# 更新证书
certbot renew
```

### 数据问题

#### 问题1: 数据丢失
**症状**: 用户数据或分析结果丢失

**可能原因**:
- 数据库故障
- 存储故障
- 备份失败
- 人为错误

**解决方法**:
```bash
# 检查数据库状态
redis-cli info
redis-cli --latency

# 检查数据文件
ls -la src/uploads/
ls -la src/logs/

# 检查备份
ls -la /backups/
./scripts/restore.sh -d 20240101_120000 -t all

# 检查日志
tail -f src/logs/error.log
```

#### 问题2: 数据不一致
**症状**: 数据在不同服务间不一致

**可能原因**:
- 缓存问题
- 同步延迟
- 事务失败
- 并发问题

**解决方法**:
```bash
# 清除缓存
redis-cli flushall

# 检查数据同步
redis-cli --latency
redis-cli --stat

# 检查事务日志
tail -f src/logs/app.log | grep transaction

# 重启服务
docker-compose restart
```

## 诊断工具

### 系统监控
```bash
#!/bin/bash
# 系统监控脚本
echo "=== 系统状态 ==="
echo "时间: $(date)"
echo "负载: $(uptime)"
echo "内存: $(free -h)"
echo "磁盘: $(df -h)"

echo "=== 服务状态 ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo "=== 网络状态 ==="
netstat -tuln | grep -E ":80|:443|:3000|:6379"

echo "=== 进程状态 ==="
ps aux --sort=-%mem | head -5
ps aux --sort=-%cpu | head -5
```

### 性能分析
```bash
#!/bin/bash
# 性能分析脚本
echo "=== CPU使用率 ==="
top -bn1 | grep "Cpu(s)"

echo "=== 内存使用率 ==="
free | grep Mem | awk '{printf "%.2f%%\n", $3/$2 * 100.0}'

echo "=== 磁盘使用率 ==="
df -h | grep -E "/$|/var"

echo "=== 网络连接数 ==="
netstat -an | grep ESTABLISHED | wc -l

echo "=== 文件描述符 ==="
lsof | wc -l
```

### 日志分析
```bash
#!/bin/bash
# 日志分析脚本
echo "=== 错误日志统计 ==="
grep -c "ERROR" src/logs/app.log
grep -c "WARN" src/logs/app.log

echo "=== 最近错误 ==="
tail -20 src/logs/error.log

echo "=== 访问统计 ==="
tail -1000 src/logs/access.log | awk '{print $1}' | sort | uniq -c | sort -nr | head -10

echo "=== 响应时间统计 ==="
tail -1000 src/logs/access.log | awk '{print $NF}' | sort -n | tail -10
```

## 应急响应

### 服务中断
```bash
#!/bin/bash
# 服务中断应急响应
echo "开始应急响应..."

# 1. 检查服务状态
echo "检查服务状态..."
docker ps
systemctl status nginx

# 2. 重启服务
echo "重启服务..."
docker-compose restart

# 3. 检查服务健康
echo "检查服务健康..."
curl -f http://localhost:3000/api/health
curl -f http://localhost:80/api/health

# 4. 通知相关人员
echo "服务已重启，请检查功能是否正常"
```

### 数据恢复
```bash
#!/bin/bash
# 数据恢复应急响应
echo "开始数据恢复..."

# 1. 停止服务
echo "停止服务..."
docker-compose down

# 2. 恢复数据
echo "恢复数据..."
./scripts/restore.sh -d 20240101_120000 -t all

# 3. 启动服务
echo "启动服务..."
docker-compose up -d

# 4. 验证数据
echo "验证数据..."
curl -f http://localhost:3000/api/health
```

### 安全事件
```bash
#!/bin/bash
# 安全事件应急响应
echo "开始安全事件响应..."

# 1. 隔离系统
echo "隔离系统..."
docker-compose down

# 2. 收集证据
echo "收集证据..."
cp -r src/logs /evidence/
cp -r src/uploads /evidence/

# 3. 分析日志
echo "分析日志..."
grep -i "attack\|hack\|exploit" src/logs/*.log

# 4. 修复漏洞
echo "修复漏洞..."
# 根据具体情况执行修复操作

# 5. 重启服务
echo "重启服务..."
docker-compose up -d
```

## 预防措施

### 监控告警
```bash
#!/bin/bash
# 监控告警脚本
echo "设置监控告警..."

# 1. 设置CPU告警
if [ $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1) -gt 80 ]; then
    echo "CPU使用率过高" | mail -s "告警" admin@company.com
fi

# 2. 设置内存告警
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ $MEMORY_USAGE -gt 80 ]; then
    echo "内存使用率过高: ${MEMORY_USAGE}%" | mail -s "告警" admin@company.com
fi

# 3. 设置磁盘告警
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | cut -d'%' -f1)
if [ $DISK_USAGE -gt 80 ]; then
    echo "磁盘使用率过高: ${DISK_USAGE}%" | mail -s "告警" admin@company.com
fi
```

### 定期维护
```bash
#!/bin/bash
# 定期维护脚本
echo "开始定期维护..."

# 1. 清理日志
echo "清理日志..."
find src/logs -name "*.log.*" -mtime +7 -delete

# 2. 清理临时文件
echo "清理临时文件..."
find src/temp -type f -mtime +1 -delete

# 3. 优化数据库
echo "优化数据库..."
redis-cli BGREWRITEAOF
redis-cli BGSAVE

# 4. 更新系统
echo "更新系统..."
apt-get update && apt-get upgrade -y

# 5. 重启服务
echo "重启服务..."
docker-compose restart
```

### 备份策略
```bash
#!/bin/bash
# 备份策略脚本
echo "开始备份..."

# 1. 备份数据
echo "备份数据..."
./scripts/backup.sh

# 2. 备份配置
echo "备份配置..."
tar -czf config_backup_$(date +%Y%m%d).tar.gz docker-compose.yml nginx.conf .env

# 3. 备份代码
echo "备份代码..."
git bundle create code_backup_$(date +%Y%m%d).bundle --all

# 4. 上传备份
echo "上传备份..."
aws s3 cp *.tar.gz s3://backups/
aws s3 cp *.bundle s3://backups/
```

## 联系支持

### 内部支持
- **技术负责人**: tech-lead@company.com
- **运维团队**: ops@company.com
- **安全团队**: security@company.com

### 外部支持
- **云服务商**: support@cloud-provider.com
- **第三方服务**: support@third-party.com
- **紧急联系**: +86-xxx-xxxx-xxxx

### 支持流程
1. **问题报告**: 详细描述问题和影响
2. **初步诊断**: 收集相关日志和状态信息
3. **问题分析**: 分析问题原因和影响范围
4. **解决方案**: 制定和实施解决方案
5. **验证测试**: 验证问题是否解决
6. **总结改进**: 总结经验教训和改进措施

---

**注意**: 遇到问题时请保持冷静，按照流程逐步排查，必要时及时联系技术支持。
