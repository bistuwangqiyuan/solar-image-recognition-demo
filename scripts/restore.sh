#!/bin/bash

# 恢复脚本
# 用于从备份文件恢复应用程序数据

set -e

# 配置变量
BACKUP_DIR="/backups"
RESTORE_DIR="/restore"

# 显示帮助信息
show_help() {
    echo "使用方法: $0 [选项]"
    echo "选项:"
    echo "  -d, --date DATE     指定备份日期 (格式: YYYYMMDD_HHMMSS)"
    echo "  -t, --type TYPE     指定恢复类型 (all|uploads|config|database|logs)"
    echo "  -h, --help          显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 -d 20240101_120000 -t all"
    echo "  $0 -d 20240101_120000 -t uploads"
}

# 恢复上传文件
restore_uploads() {
    local backup_date=$1
    local backup_file="$BACKUP_DIR/uploads_$backup_date.tar.gz"
    
    if [ ! -f "$backup_file" ]; then
        echo "错误: 备份文件 $backup_file 不存在"
        exit 1
    fi
    
    echo "恢复上传文件..."
    mkdir -p src/uploads
    tar -xzf "$backup_file" -C .
    echo "上传文件恢复完成"
}

# 恢复配置文件
restore_config() {
    local backup_date=$1
    local backup_file="$BACKUP_DIR/config_$backup_date.tar.gz"
    
    if [ ! -f "$backup_file" ]; then
        echo "错误: 备份文件 $backup_file 不存在"
        exit 1
    fi
    
    echo "恢复配置文件..."
    tar -xzf "$backup_file"
    echo "配置文件恢复完成"
}

# 恢复数据库
restore_database() {
    local backup_date=$1
    local backup_file="$BACKUP_DIR/redis_$backup_date.rdb"
    
    if [ ! -f "$backup_file" ]; then
        echo "错误: 备份文件 $backup_file 不存在"
        exit 1
    fi
    
    echo "恢复数据库..."
    
    # 停止Redis服务
    docker stop redis || true
    
    # 恢复Redis数据
    docker cp "$backup_file" redis:/data/dump.rdb
    
    # 启动Redis服务
    docker start redis
    
    echo "数据库恢复完成"
}

# 恢复日志
restore_logs() {
    local backup_date=$1
    local backup_file="$BACKUP_DIR/logs_$backup_date.tar.gz"
    
    if [ ! -f "$backup_file" ]; then
        echo "错误: 备份文件 $backup_file 不存在"
        exit 1
    fi
    
    echo "恢复日志..."
    mkdir -p src/logs
    tar -xzf "$backup_file" -C .
    echo "日志恢复完成"
}

# 恢复所有
restore_all() {
    local backup_date=$1
    
    echo "恢复所有数据..."
    restore_uploads "$backup_date"
    restore_config "$backup_date"
    restore_database "$backup_date"
    restore_logs "$backup_date"
    echo "所有数据恢复完成"
}

# 主函数
main() {
    local backup_date=""
    local restore_type="all"
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -d|--date)
                backup_date="$2"
                shift 2
                ;;
            -t|--type)
                restore_type="$2"
                shift 2
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                echo "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 检查必需参数
    if [ -z "$backup_date" ]; then
        echo "错误: 必须指定备份日期"
        show_help
        exit 1
    fi
    
    # 检查备份目录
    if [ ! -d "$BACKUP_DIR" ]; then
        echo "错误: 备份目录 $BACKUP_DIR 不存在"
        exit 1
    fi
    
    echo "开始恢复流程 - 日期: $backup_date, 类型: $restore_type"
    
    # 根据类型执行恢复
    case $restore_type in
        all)
            restore_all "$backup_date"
            ;;
        uploads)
            restore_uploads "$backup_date"
            ;;
        config)
            restore_config "$backup_date"
            ;;
        database)
            restore_database "$backup_date"
            ;;
        logs)
            restore_logs "$backup_date"
            ;;
        *)
            echo "错误: 未知的恢复类型 $restore_type"
            show_help
            exit 1
            ;;
    esac
    
    echo "恢复流程完成"
}

# 执行主函数
main "$@"
