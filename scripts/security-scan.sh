#!/bin/bash

# 安全扫描脚本
# 用于扫描应用程序的安全漏洞

set -e

# 配置变量
SCAN_DIR="."
EXCLUDE_DIRS="node_modules|.git|dist|build|coverage"
SCAN_RESULTS_DIR="security_scan_results"

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

# 创建结果目录
create_results_dir() {
    mkdir -p "$SCAN_RESULTS_DIR"
    log_info "创建安全扫描结果目录: $SCAN_RESULTS_DIR"
}

# 检查依赖
check_dependencies() {
    log_info "检查安全扫描工具..."
    
    local missing_tools=()
    
    if ! command -v npm &> /dev/null; then
        missing_tools+=("npm")
    fi
    
    if ! command -v docker &> /dev/null; then
        missing_tools+=("docker")
    fi
    
    if ! command -v trivy &> /dev/null; then
        missing_tools+=("trivy")
    fi
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        log_warn "缺少工具: ${missing_tools[*]}"
        log_info "将跳过相关扫描"
    fi
    
    log_info "依赖检查完成"
}

# 扫描npm依赖漏洞
scan_npm_vulnerabilities() {
    log_info "扫描npm依赖漏洞..."
    
    local npm_audit_file="$SCAN_RESULTS_DIR/npm_audit.txt"
    
    {
        echo "=== NPM依赖漏洞扫描结果 ==="
        echo "扫描时间: $(date)"
        echo ""
        
        if command -v npm &> /dev/null; then
            echo "执行npm audit..."
            npm audit --audit-level=moderate 2>&1 || echo "npm audit执行失败"
            
            echo ""
            echo "执行npm audit fix..."
            npm audit fix --dry-run 2>&1 || echo "npm audit fix执行失败"
        else
            echo "npm未安装，跳过npm依赖扫描"
        fi
        
    } > "$npm_audit_file"
    
    log_info "npm依赖漏洞扫描完成，结果保存到: $npm_audit_file"
}

# 扫描Docker镜像漏洞
scan_docker_vulnerabilities() {
    log_info "扫描Docker镜像漏洞..."
    
    local docker_scan_file="$SCAN_RESULTS_DIR/docker_scan.txt"
    
    {
        echo "=== Docker镜像漏洞扫描结果 ==="
        echo "扫描时间: $(date)"
        echo ""
        
        if command -v trivy &> /dev/null; then
            echo "扫描应用程序镜像..."
            trivy image solar-image-recognition:latest 2>&1 || echo "Docker镜像扫描失败"
            
            echo ""
            echo "扫描Redis镜像..."
            trivy image redis:7-alpine 2>&1 || echo "Redis镜像扫描失败"
            
            echo ""
            echo "扫描Nginx镜像..."
            trivy image nginx:alpine 2>&1 || echo "Nginx镜像扫描失败"
        else
            echo "Trivy未安装，跳过Docker镜像扫描"
        fi
        
    } > "$docker_scan_file"
    
    log_info "Docker镜像漏洞扫描完成，结果保存到: $docker_scan_file"
}

# 扫描代码安全问题
scan_code_security() {
    log_info "扫描代码安全问题..."
    
    local code_scan_file="$SCAN_RESULTS_DIR/code_scan.txt"
    
    {
        echo "=== 代码安全问题扫描结果 ==="
        echo "扫描时间: $(date)"
        echo ""
        
        echo "扫描敏感信息泄露..."
        # 扫描可能的敏感信息
        grep -r -i "password\|secret\|key\|token" --exclude-dir=node_modules --exclude-dir=.git "$SCAN_DIR" 2>/dev/null || echo "未发现明显的敏感信息泄露"
        
        echo ""
        echo "扫描硬编码凭据..."
        grep -r -i "admin\|root\|test" --exclude-dir=node_modules --exclude-dir=.git "$SCAN_DIR" 2>/dev/null || echo "未发现硬编码凭据"
        
        echo ""
        echo "扫描SQL注入风险..."
        grep -r -i "select\|insert\|update\|delete" --exclude-dir=node_modules --exclude-dir=.git "$SCAN_DIR" 2>/dev/null || echo "未发现SQL查询语句"
        
        echo ""
        echo "扫描XSS风险..."
        grep -r -i "innerHTML\|eval\|document.write" --exclude-dir=node_modules --exclude-dir=.git "$SCAN_DIR" 2>/dev/null || echo "未发现XSS风险代码"
        
    } > "$code_scan_file"
    
    log_info "代码安全问题扫描完成，结果保存到: $code_scan_file"
}

# 扫描配置文件安全
scan_config_security() {
    log_info "扫描配置文件安全..."
    
    local config_scan_file="$SCAN_RESULTS_DIR/config_scan.txt"
    
    {
        echo "=== 配置文件安全扫描结果 ==="
        echo "扫描时间: $(date)"
        echo ""
        
        echo "检查Docker配置..."
        if [ -f "Dockerfile" ]; then
            echo "Dockerfile安全检查:"
            grep -n "USER\|RUN\|COPY\|ADD" Dockerfile 2>/dev/null || echo "Dockerfile检查完成"
        else
            echo "Dockerfile不存在"
        fi
        
        echo ""
        echo "检查Docker Compose配置..."
        if [ -f "docker-compose.yml" ]; then
            echo "Docker Compose安全检查:"
            grep -n "privileged\|cap_add\|security_opt" docker-compose.yml 2>/dev/null || echo "Docker Compose检查完成"
        else
            echo "docker-compose.yml不存在"
        fi
        
        echo ""
        echo "检查Nginx配置..."
        if [ -f "nginx.conf" ]; then
            echo "Nginx配置安全检查:"
            grep -n "server_tokens\|add_header\|ssl" nginx.conf 2>/dev/null || echo "Nginx配置检查完成"
        else
            echo "nginx.conf不存在"
        fi
        
    } > "$config_scan_file"
    
    log_info "配置文件安全扫描完成，结果保存到: $config_scan_file"
}

# 扫描网络安全
scan_network_security() {
    log_info "扫描网络安全..."
    
    local network_scan_file="$SCAN_RESULTS_DIR/network_scan.txt"
    
    {
        echo "=== 网络安全扫描结果 ==="
        echo "扫描时间: $(date)"
        echo ""
        
        echo "检查开放端口..."
        netstat -tuln 2>/dev/null || echo "端口检查失败"
        
        echo ""
        echo "检查防火墙状态..."
        if command -v ufw &> /dev/null; then
            ufw status 2>/dev/null || echo "UFW状态检查失败"
        elif command -v iptables &> /dev/null; then
            iptables -L 2>/dev/null || echo "iptables状态检查失败"
        else
            echo "防火墙工具未找到"
        fi
        
        echo ""
        echo "检查SSL证书..."
        if command -v openssl &> /dev/null; then
            echo "检查本地SSL证书..."
            openssl s_client -connect localhost:443 -servername localhost 2>/dev/null | grep -E "(subject|issuer|notAfter)" || echo "SSL证书检查失败"
        else
            echo "OpenSSL未安装，跳过SSL检查"
        fi
        
    } > "$network_scan_file"
    
    log_info "网络安全扫描完成，结果保存到: $network_scan_file"
}

# 生成安全报告
generate_security_report() {
    log_info "生成安全报告..."
    
    local report_file="$SCAN_RESULTS_DIR/security_report_$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "=== 光伏图像识别系统安全报告 ==="
        echo "生成时间: $(date)"
        echo "系统信息: $(uname -a)"
        echo ""
        
        echo "=== 扫描范围 ==="
        echo "扫描目录: $SCAN_DIR"
        echo "排除目录: $EXCLUDE_DIRS"
        echo ""
        
        echo "=== 扫描工具 ==="
        echo "npm audit: $(command -v npm >/dev/null && echo "已安装" || echo "未安装")"
        echo "Trivy: $(command -v trivy >/dev/null && echo "已安装" || echo "未安装")"
        echo "Docker: $(command -v docker >/dev/null && echo "已安装" || echo "未安装")"
        echo ""
        
        echo "=== 扫描结果文件 ==="
        ls -la "$SCAN_RESULTS_DIR"/*.txt 2>/dev/null || echo "无扫描结果文件"
        echo ""
        
        echo "=== 安全建议 ==="
        echo "1. 定期更新依赖包"
        echo "2. 使用最小权限原则"
        echo "3. 启用HTTPS"
        echo "4. 配置防火墙规则"
        echo "5. 定期进行安全扫描"
        echo "6. 监控异常活动"
        echo "7. 备份重要数据"
        echo "8. 使用强密码策略"
        
    } > "$report_file"
    
    log_info "安全报告已生成: $report_file"
}

# 主函数
main() {
    log_info "开始安全扫描..."
    
    # 创建结果目录
    create_results_dir
    
    # 检查依赖
    check_dependencies
    
    # 执行各项扫描
    scan_npm_vulnerabilities
    scan_docker_vulnerabilities
    scan_code_security
    scan_config_security
    scan_network_security
    
    # 生成报告
    generate_security_report
    
    log_info "安全扫描完成"
    log_info "所有扫描结果已保存到: $SCAN_RESULTS_DIR"
}

# 执行主函数
main "$@"
