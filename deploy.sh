#!/bin/bash

# 光伏图像识别演示网站部署脚本
# 作者: Solar Image Recognition Team
# 版本: 1.0.0

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    log_info "检查系统依赖..."
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    # 检查Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        log_warning "Node.js未安装，将使用Docker构建"
    fi
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        log_warning "npm未安装，将使用Docker构建"
    fi
    
    log_success "依赖检查完成"
}

# 环境检查
check_environment() {
    log_info "检查环境配置..."
    
    # 检查环境变量文件
    if [ ! -f ".env" ]; then
        log_warning ".env文件不存在，将使用默认配置"
        if [ -f "env.example" ]; then
            cp env.example .env
            log_info "已创建.env文件，请根据需要修改配置"
        fi
    fi
    
    # 检查必要的目录
    mkdir -p src/uploads src/logs src/temp src/models src/static/demo
    log_success "环境检查完成"
}

# 构建应用
build_application() {
    log_info "构建应用..."
    
    # 清理旧的构建
    if [ -d "dist" ]; then
        rm -rf dist
        log_info "已清理旧的构建文件"
    fi
    
    # 安装依赖
    log_info "安装依赖..."
    npm ci
    
    # 运行测试
    log_info "运行测试..."
    if npm run test -- --run; then
        log_success "测试通过"
    else
        log_warning "测试失败，但继续构建"
    fi
    
    # 构建应用
    log_info "构建生产版本..."
    npm run build
    
    log_success "应用构建完成"
}

# 构建Docker镜像
build_docker_image() {
    log_info "构建Docker镜像..."
    
    # 构建镜像
    docker build -t solar-image-recognition:latest .
    
    log_success "Docker镜像构建完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."
    
    # 停止现有服务
    docker-compose down
    
    # 启动服务
    docker-compose up -d
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 10
    
    # 检查服务状态
    if docker-compose ps | grep -q "Up"; then
        log_success "服务启动成功"
    else
        log_error "服务启动失败"
        docker-compose logs
        exit 1
    fi
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 检查应用健康状态
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3000/api/health &> /dev/null; then
            log_success "应用健康检查通过"
            break
        fi
        
        log_info "健康检查尝试 $attempt/$max_attempts..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        log_error "健康检查失败"
        docker-compose logs app
        exit 1
    fi
}

# 显示部署信息
show_deployment_info() {
    log_success "部署完成！"
    echo ""
    echo "服务访问地址："
    echo "  应用主页: http://localhost"
    echo "  API接口: http://localhost:3000"
    echo "  健康检查: http://localhost:3000/api/health"
    echo ""
    echo "管理命令："
    echo "  查看日志: docker-compose logs -f"
    echo "  停止服务: docker-compose down"
    echo "  重启服务: docker-compose restart"
    echo "  查看状态: docker-compose ps"
    echo ""
    echo "监控服务（可选）："
    echo "  启动监控: docker-compose --profile monitoring up -d"
    echo "  Prometheus: http://localhost:9090"
    echo "  Grafana: http://localhost:3001 (admin/admin)"
    echo ""
}

# 清理函数
cleanup() {
    log_info "清理临时文件..."
    # 这里可以添加清理逻辑
}

# 主函数
main() {
    log_info "开始部署光伏图像识别演示网站..."
    
    # 设置错误处理
    trap cleanup EXIT
    
    # 执行部署步骤
    check_dependencies
    check_environment
    
    # 选择构建方式
    if command -v npm &> /dev/null; then
        build_application
    else
        log_info "使用Docker构建..."
    fi
    
    build_docker_image
    start_services
    health_check
    show_deployment_info
    
    log_success "部署完成！"
}

# 脚本参数处理
case "${1:-}" in
    "build")
        check_dependencies
        check_environment
        build_application
        build_docker_image
        ;;
    "start")
        start_services
        health_check
        ;;
    "stop")
        docker-compose down
        ;;
    "restart")
        docker-compose restart
        health_check
        ;;
    "logs")
        docker-compose logs -f
        ;;
    "status")
        docker-compose ps
        ;;
    "health")
        health_check
        ;;
    "monitoring")
        docker-compose --profile monitoring up -d
        ;;
    "clean")
        docker-compose down -v
        docker system prune -f
        ;;
    *)
        main
        ;;
esac
