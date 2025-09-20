#!/bin/bash

# 健康检查脚本
# 用于检查应用程序和服务的健康状态

set -e

# 配置变量
APP_URL="http://localhost:3000"
API_URL="http://localhost:3000/api"
REDIS_URL="redis://localhost:6379"
NGINX_URL="http://localhost:80"
TIMEOUT=30

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# 检查HTTP服务
check_http_service() {
    local url=$1
    local service_name=$2
    
    log_info "检查 $service_name 服务..."
    
    if curl -s --max-time $TIMEOUT "$url" > /dev/null; then
        log_info "$service_name 服务正常"
        return 0
    else
        log_error "$service_name 服务异常"
        return 1
    fi
}

# 检查API端点
check_api_endpoints() {
    log_info "检查API端点..."
    
    local endpoints=(
        "/health"
        "/api/health"
        "/api/upload"
        "/api/analysis"
        "/api/demo"
    )
    
    local failed_count=0
    
    for endpoint in "${endpoints[@]}"; do
        local url="$API_URL$endpoint"
        if curl -s --max-time $TIMEOUT "$url" > /dev/null; then
            log_info "API端点 $endpoint 正常"
        else
            log_error "API端点 $endpoint 异常"
            ((failed_count++))
        fi
    done
    
    if [ $failed_count -eq 0 ]; then
        log_info "所有API端点正常"
        return 0
    else
        log_error "$failed_count 个API端点异常"
        return 1
    fi
}

# 检查Redis连接
check_redis() {
    log_info "检查Redis连接..."
    
    if docker exec redis redis-cli ping > /dev/null 2>&1; then
        log_info "Redis连接正常"
        return 0
    else
        log_error "Redis连接异常"
        return 1
    fi
}

# 检查磁盘空间
check_disk_space() {
    log_info "检查磁盘空间..."
    
    local usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ $usage -lt 80 ]; then
        log_info "磁盘空间充足 (使用率: ${usage}%)"
        return 0
    elif [ $usage -lt 90 ]; then
        log_warn "磁盘空间不足 (使用率: ${usage}%)"
        return 1
    else
        log_error "磁盘空间严重不足 (使用率: ${usage}%)"
        return 1
    fi
}

# 检查内存使用
check_memory() {
    log_info "检查内存使用..."
    
    local usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    
    if [ $usage -lt 80 ]; then
        log_info "内存使用正常 (使用率: ${usage}%)"
        return 0
    elif [ $usage -lt 90 ]; then
        log_warn "内存使用较高 (使用率: ${usage}%)"
        return 1
    else
        log_error "内存使用过高 (使用率: ${usage}%)"
        return 1
    fi
}

# 检查Docker容器
check_docker_containers() {
    log_info "检查Docker容器..."
    
    local containers=("app" "redis" "nginx")
    local failed_count=0
    
    for container in "${containers[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "^$container$"; then
            log_info "容器 $container 运行正常"
        else
            log_error "容器 $container 未运行"
            ((failed_count++))
        fi
    done
    
    if [ $failed_count -eq 0 ]; then
        log_info "所有容器运行正常"
        return 0
    else
        log_error "$failed_count 个容器异常"
        return 1
    fi
}

# 检查日志文件
check_logs() {
    log_info "检查日志文件..."
    
    local log_files=(
        "src/logs/app.log"
        "src/logs/error.log"
        "src/logs/access.log"
    )
    
    local failed_count=0
    
    for log_file in "${log_files[@]}"; do
        if [ -f "$log_file" ]; then
            local size=$(stat -c%s "$log_file" 2>/dev/null || echo "0")
            if [ $size -gt 0 ]; then
                log_info "日志文件 $log_file 存在且非空"
            else
                log_warn "日志文件 $log_file 为空"
            fi
        else
            log_warn "日志文件 $log_file 不存在"
            ((failed_count++))
        fi
    done
    
    if [ $failed_count -eq 0 ]; then
        log_info "日志文件检查完成"
        return 0
    else
        log_warn "$failed_count 个日志文件异常"
        return 1
    fi
}

# 生成健康报告
generate_health_report() {
    local report_file="health_report_$(date +%Y%m%d_%H%M%S).txt"
    
    log_info "生成健康报告: $report_file"
    
    {
        echo "=== 光伏图像识别系统健康报告 ==="
        echo "生成时间: $(date)"
        echo "系统信息: $(uname -a)"
        echo ""
        
        echo "=== Docker容器状态 ==="
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo ""
        
        echo "=== 系统资源使用 ==="
        echo "内存使用:"
        free -h
        echo ""
        echo "磁盘使用:"
        df -h
        echo ""
        
        echo "=== 服务状态 ==="
        echo "应用程序: $APP_URL"
        echo "API服务: $API_URL"
        echo "Redis: $REDIS_URL"
        echo "Nginx: $NGINX_URL"
        echo ""
        
        echo "=== 最近错误日志 ==="
        if [ -f "src/logs/error.log" ]; then
            tail -20 src/logs/error.log
        else
            echo "错误日志文件不存在"
        fi
        
    } > "$report_file"
    
    log_info "健康报告已生成: $report_file"
}

# 主函数
main() {
    log_info "开始健康检查..."
    
    local total_checks=0
    local failed_checks=0
    
    # 执行各项检查
    check_http_service "$APP_URL" "应用程序" || ((failed_checks++))
    ((total_checks++))
    
    check_api_endpoints || ((failed_checks++))
    ((total_checks++))
    
    check_redis || ((failed_checks++))
    ((total_checks++))
    
    check_disk_space || ((failed_checks++))
    ((total_checks++))
    
    check_memory || ((failed_checks++))
    ((total_checks++))
    
    check_docker_containers || ((failed_checks++))
    ((total_checks++))
    
    check_logs || ((failed_checks++))
    ((total_checks++))
    
    # 生成报告
    generate_health_report
    
    # 输出总结
    echo ""
    log_info "健康检查完成"
    log_info "总检查项: $total_checks"
    log_info "失败项: $failed_checks"
    
    if [ $failed_checks -eq 0 ]; then
        log_info "系统健康状态: 良好"
        exit 0
    else
        log_warn "系统健康状态: 存在问题"
        exit 1
    fi
}

# 执行主函数
main "$@"
