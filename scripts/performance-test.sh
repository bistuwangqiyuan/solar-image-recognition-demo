#!/bin/bash

# 性能测试脚本
# 用于测试应用程序的性能指标

set -e

# 配置变量
APP_URL="http://localhost:3000"
API_URL="http://localhost:3000/api"
TEST_DURATION=60
CONCURRENT_USERS=10
REQUESTS_PER_SECOND=5

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

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."
    
    local missing_deps=()
    
    if ! command -v curl &> /dev/null; then
        missing_deps+=("curl")
    fi
    
    if ! command -v ab &> /dev/null; then
        missing_deps+=("apache2-utils")
    fi
    
    if ! command -v wrk &> /dev/null; then
        missing_deps+=("wrk")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_error "缺少依赖: ${missing_deps[*]}"
        log_info "请安装缺少的依赖后重试"
        exit 1
    fi
    
    log_info "依赖检查完成"
}

# 测试API响应时间
test_api_response_time() {
    log_info "测试API响应时间..."
    
    local endpoints=(
        "/health"
        "/api/health"
        "/api/upload"
        "/api/analysis"
        "/api/demo"
    )
    
    local results_file="performance_results_$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "=== API响应时间测试结果 ==="
        echo "测试时间: $(date)"
        echo "测试URL: $API_URL"
        echo ""
        
        for endpoint in "${endpoints[@]}"; do
            local url="$API_URL$endpoint"
            log_debug "测试端点: $endpoint"
            
            echo "端点: $endpoint"
            echo "URL: $url"
            
            # 使用curl测试响应时间
            local response_time=$(curl -o /dev/null -s -w "%{time_total}" "$url" 2>/dev/null || echo "N/A")
            echo "响应时间: ${response_time}s"
            
            # 使用ab进行压力测试
            if command -v ab &> /dev/null; then
                echo "压力测试结果:"
                ab -n 100 -c 10 "$url" 2>/dev/null | grep -E "(Requests per second|Time per request|Failed requests)" || echo "压力测试失败"
            fi
            
            echo "---"
        done
        
    } > "$results_file"
    
    log_info "API响应时间测试完成，结果保存到: $results_file"
}

# 测试并发性能
test_concurrent_performance() {
    log_info "测试并发性能..."
    
    local test_file="concurrent_test_$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "=== 并发性能测试结果 ==="
        echo "测试时间: $(date)"
        echo "并发用户数: $CONCURRENT_USERS"
        echo "测试持续时间: ${TEST_DURATION}s"
        echo ""
        
        # 测试健康检查端点
        echo "健康检查端点并发测试:"
        ab -n 1000 -c $CONCURRENT_USERS -t $TEST_DURATION "$API_URL/health" 2>/dev/null || echo "并发测试失败"
        
        echo ""
        echo "上传端点并发测试:"
        ab -n 100 -c $CONCURRENT_USERS -t $TEST_DURATION "$API_URL/upload" 2>/dev/null || echo "上传端点并发测试失败"
        
    } > "$test_file"
    
    log_info "并发性能测试完成，结果保存到: $test_file"
}

# 测试负载均衡
test_load_balancing() {
    log_info "测试负载均衡..."
    
    local load_test_file="load_balancing_test_$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "=== 负载均衡测试结果 ==="
        echo "测试时间: $(date)"
        echo "测试URL: $APP_URL"
        echo ""
        
        # 测试Nginx负载均衡
        echo "Nginx负载均衡测试:"
        ab -n 500 -c 20 "$APP_URL" 2>/dev/null || echo "负载均衡测试失败"
        
        echo ""
        echo "静态资源测试:"
        ab -n 200 -c 10 "$APP_URL/static/" 2>/dev/null || echo "静态资源测试失败"
        
    } > "$load_test_file"
    
    log_info "负载均衡测试完成，结果保存到: $load_test_file"
}

# 测试内存使用
test_memory_usage() {
    log_info "测试内存使用..."
    
    local memory_test_file="memory_test_$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "=== 内存使用测试结果 ==="
        echo "测试时间: $(date)"
        echo ""
        
        echo "测试前内存使用:"
        free -h
        echo ""
        
        echo "Docker容器内存使用:"
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
        echo ""
        
        echo "测试后内存使用:"
        free -h
        
    } > "$memory_test_file"
    
    log_info "内存使用测试完成，结果保存到: $memory_test_file"
}

# 测试数据库性能
test_database_performance() {
    log_info "测试数据库性能..."
    
    local db_test_file="database_test_$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "=== 数据库性能测试结果 ==="
        echo "测试时间: $(date)"
        echo ""
        
        echo "Redis性能测试:"
        docker exec redis redis-cli --latency-history -i 1 2>/dev/null || echo "Redis性能测试失败"
        
        echo ""
        echo "Redis内存使用:"
        docker exec redis redis-cli info memory 2>/dev/null | grep -E "(used_memory|used_memory_peak|used_memory_rss)" || echo "Redis内存信息获取失败"
        
    } > "$db_test_file"
    
    log_info "数据库性能测试完成，结果保存到: $db_test_file"
}

# 生成性能报告
generate_performance_report() {
    log_info "生成性能报告..."
    
    local report_file="performance_report_$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "=== 光伏图像识别系统性能报告 ==="
        echo "生成时间: $(date)"
        echo "系统信息: $(uname -a)"
        echo ""
        
        echo "=== 系统资源 ==="
        echo "CPU信息:"
        lscpu | grep -E "(Model name|CPU\(s\)|Thread|Core)"
        echo ""
        
        echo "内存信息:"
        free -h
        echo ""
        
        echo "磁盘信息:"
        df -h
        echo ""
        
        echo "=== 网络性能 ==="
        echo "网络接口:"
        ip addr show | grep -E "(inet |UP)" | head -10
        echo ""
        
        echo "=== 应用程序性能 ==="
        echo "进程信息:"
        ps aux | grep -E "(node|nginx|redis)" | head -10
        echo ""
        
        echo "=== 测试配置 ==="
        echo "测试持续时间: ${TEST_DURATION}s"
        echo "并发用户数: $CONCURRENT_USERS"
        echo "每秒请求数: $REQUESTS_PER_SECOND"
        echo ""
        
    } > "$report_file"
    
    log_info "性能报告已生成: $report_file"
}

# 主函数
main() {
    log_info "开始性能测试..."
    
    # 检查依赖
    check_dependencies
    
    # 执行各项测试
    test_api_response_time
    test_concurrent_performance
    test_load_balancing
    test_memory_usage
    test_database_performance
    
    # 生成报告
    generate_performance_report
    
    log_info "性能测试完成"
    log_info "所有测试结果已保存到相应的文件中"
}

# 执行主函数
main "$@"
