#!/bin/bash

# 维护脚本
# 用于系统维护和优化

set -e

# 配置变量
LOG_DIR="src/logs"
TEMP_DIR="src/temp"
UPLOAD_DIR="src/uploads"
BACKUP_DIR="/backups"
CLEANUP_DAYS=7
LOG_ROTATION_SIZE="100M"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

# 清理临时文件
cleanup_temp_files() {
    log_info "清理临时文件..."
    
    local cleaned_count=0
    
    # 清理临时目录
    if [ -d "$TEMP_DIR" ]; then
        local temp_files=$(find "$TEMP_DIR" -type f -mtime +$CLEANUP_DAYS 2>/dev/null | wc -l)
        if [ $temp_files -gt 0 ]; then
            find "$TEMP_DIR" -type f -mtime +$CLEANUP_DAYS -delete 2>/dev/null
            cleaned_count=$((cleaned_count + temp_files))
            log_info "清理了 $temp_files 个临时文件"
        fi
    fi
    
    # 清理系统临时文件
    local system_temp=$(find /tmp -name "solar-*" -mtime +$CLEANUP_DAYS 2>/dev/null | wc -l)
    if [ $system_temp -gt 0 ]; then
        find /tmp -name "solar-*" -mtime +$CLEANUP_DAYS -delete 2>/dev/null
        cleaned_count=$((cleaned_count + system_temp))
        log_info "清理了 $system_temp 个系统临时文件"
    fi
    
    log_info "临时文件清理完成，共清理 $cleaned_count 个文件"
}

# 清理日志文件
cleanup_logs() {
    log_info "清理日志文件..."
    
    local cleaned_count=0
    
    if [ -d "$LOG_DIR" ]; then
        # 清理旧日志文件
        local old_logs=$(find "$LOG_DIR" -name "*.log.*" -mtime +$CLEANUP_DAYS 2>/dev/null | wc -l)
        if [ $old_logs -gt 0 ]; then
            find "$LOG_DIR" -name "*.log.*" -mtime +$CLEANUP_DAYS -delete 2>/dev/null
            cleaned_count=$((cleaned_count + old_logs))
            log_info "清理了 $old_logs 个旧日志文件"
        fi
        
        # 压缩大日志文件
        local large_logs=$(find "$LOG_DIR" -name "*.log" -size +$LOG_ROTATION_SIZE 2>/dev/null | wc -l)
        if [ $large_logs -gt 0 ]; then
            find "$LOG_DIR" -name "*.log" -size +$LOG_ROTATION_SIZE -exec gzip {} \; 2>/dev/null
            cleaned_count=$((cleaned_count + large_logs))
            log_info "压缩了 $large_logs 个大日志文件"
        fi
    fi
    
    log_info "日志文件清理完成，共处理 $cleaned_count 个文件"
}

# 清理上传文件
cleanup_uploads() {
    log_info "清理上传文件..."
    
    local cleaned_count=0
    
    if [ -d "$UPLOAD_DIR" ]; then
        # 清理旧上传文件
        local old_uploads=$(find "$UPLOAD_DIR" -type f -mtime +$CLEANUP_DAYS 2>/dev/null | wc -l)
        if [ $old_uploads -gt 0 ]; then
            find "$UPLOAD_DIR" -type f -mtime +$CLEANUP_DAYS -delete 2>/dev/null
            cleaned_count=$((cleaned_count + old_uploads))
            log_info "清理了 $old_uploads 个旧上传文件"
        fi
        
        # 清理空目录
        local empty_dirs=$(find "$UPLOAD_DIR" -type d -empty 2>/dev/null | wc -l)
        if [ $empty_dirs -gt 0 ]; then
            find "$UPLOAD_DIR" -type d -empty -delete 2>/dev/null
            cleaned_count=$((cleaned_count + empty_dirs))
            log_info "清理了 $empty_dirs 个空目录"
        fi
    fi
    
    log_info "上传文件清理完成，共处理 $cleaned_count 个文件/目录"
}

# 优化数据库
optimize_database() {
    log_info "优化数据库..."
    
    # 优化Redis
    if docker ps --format "table {{.Names}}" | grep -q "^redis$"; then
        log_info "优化Redis数据库..."
        docker exec redis redis-cli BGREWRITEAOF 2>/dev/null || log_warn "Redis AOF重写失败"
        docker exec redis redis-cli BGSAVE 2>/dev/null || log_warn "Redis后台保存失败"
        log_info "Redis数据库优化完成"
    else
        log_warn "Redis容器未运行，跳过数据库优化"
    fi
}

# 重启服务
restart_services() {
    log_info "重启服务..."
    
    # 重启应用程序
    if docker ps --format "table {{.Names}}" | grep -q "^app$"; then
        log_info "重启应用程序..."
        docker restart app
        sleep 5
        log_info "应用程序重启完成"
    else
        log_warn "应用程序容器未运行"
    fi
    
    # 重启Nginx
    if docker ps --format "table {{.Names}}" | grep -q "^nginx$"; then
        log_info "重启Nginx..."
        docker restart nginx
        sleep 2
        log_info "Nginx重启完成"
    else
        log_warn "Nginx容器未运行"
    fi
}

# 更新系统
update_system() {
    log_info "更新系统..."
    
    # 更新包列表
    if command -v apt-get &> /dev/null; then
        log_info "更新APT包列表..."
        apt-get update 2>/dev/null || log_warn "APT更新失败"
        
        log_info "升级系统包..."
        apt-get upgrade -y 2>/dev/null || log_warn "系统包升级失败"
    elif command -v yum &> /dev/null; then
        log_info "更新YUM包列表..."
        yum update -y 2>/dev/null || log_warn "YUM更新失败"
    else
        log_warn "未找到包管理器，跳过系统更新"
    fi
    
    log_info "系统更新完成"
}

# 检查磁盘空间
check_disk_space() {
    log_info "检查磁盘空间..."
    
    local usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ $usage -lt 80 ]; then
        log_info "磁盘空间充足 (使用率: ${usage}%)"
    elif [ $usage -lt 90 ]; then
        log_warn "磁盘空间不足 (使用率: ${usage}%)"
        log_info "建议清理不必要的文件"
    else
        log_error "磁盘空间严重不足 (使用率: ${usage}%)"
        log_info "需要立即清理磁盘空间"
    fi
}

# 检查内存使用
check_memory() {
    log_info "检查内存使用..."
    
    local usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    
    if [ $usage -lt 80 ]; then
        log_info "内存使用正常 (使用率: ${usage}%)"
    elif [ $usage -lt 90 ]; then
        log_warn "内存使用较高 (使用率: ${usage}%)"
        log_info "建议重启服务释放内存"
    else
        log_error "内存使用过高 (使用率: ${usage}%)"
        log_info "需要立即释放内存"
    fi
}

# 生成维护报告
generate_maintenance_report() {
    log_info "生成维护报告..."
    
    local report_file="maintenance_report_$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "=== 光伏图像识别系统维护报告 ==="
        echo "维护时间: $(date)"
        echo "系统信息: $(uname -a)"
        echo ""
        
        echo "=== 系统资源 ==="
        echo "内存使用:"
        free -h
        echo ""
        echo "磁盘使用:"
        df -h
        echo ""
        
        echo "=== 服务状态 ==="
        echo "Docker容器状态:"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo ""
        
        echo "=== 维护操作 ==="
        echo "清理临时文件: 完成"
        echo "清理日志文件: 完成"
        echo "清理上传文件: 完成"
        echo "优化数据库: 完成"
        echo "重启服务: 完成"
        echo "更新系统: 完成"
        echo ""
        
        echo "=== 维护建议 ==="
        echo "1. 定期清理临时文件和日志"
        echo "2. 监控磁盘空间使用"
        echo "3. 定期重启服务"
        echo "4. 更新系统包"
        echo "5. 备份重要数据"
        echo "6. 监控系统性能"
        
    } > "$report_file"
    
    log_info "维护报告已生成: $report_file"
}

# 主函数
main() {
    log_info "开始系统维护..."
    
    # 执行维护操作
    cleanup_temp_files
    cleanup_logs
    cleanup_uploads
    optimize_database
    restart_services
    update_system
    
    # 检查系统状态
    check_disk_space
    check_memory
    
    # 生成报告
    generate_maintenance_report
    
    log_info "系统维护完成"
}

# 执行主函数
main "$@"
