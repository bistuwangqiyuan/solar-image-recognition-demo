#!/bin/bash

# 备份脚本
# 用于备份应用程序数据、配置和数据库

set -e

# 配置变量
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份函数
backup_application() {
    echo "开始备份应用程序..."
    
    # 备份上传的文件
    if [ -d "src/uploads" ]; then
        tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz src/uploads/
        echo "上传文件备份完成"
    fi
    
    # 备份配置文件
    tar -czf $BACKUP_DIR/config_$DATE.tar.gz \
        docker-compose.yml \
        Dockerfile \
        nginx.conf \
        package.json \
        tsconfig.json \
        tailwind.config.js \
        postcss.config.js \
        vite.config.ts
    echo "配置文件备份完成"
}

backup_database() {
    echo "开始备份数据库..."
    
    # 备份Redis数据
    docker exec redis redis-cli BGSAVE
    docker cp redis:/data/dump.rdb $BACKUP_DIR/redis_$DATE.rdb
    echo "Redis数据备份完成"
}

backup_logs() {
    echo "开始备份日志..."
    
    # 备份应用日志
    if [ -d "src/logs" ]; then
        tar -czf $BACKUP_DIR/logs_$DATE.tar.gz src/logs/
        echo "应用日志备份完成"
    fi
}

cleanup_old_backups() {
    echo "清理旧备份文件..."
    find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
    find $BACKUP_DIR -name "*.rdb" -mtime +$RETENTION_DAYS -delete
    echo "旧备份文件清理完成"
}

# 主函数
main() {
    echo "开始备份流程 - $DATE"
    
    backup_application
    backup_database
    backup_logs
    cleanup_old_backups
    
    echo "备份流程完成"
    
    # 显示备份文件信息
    echo "备份文件列表："
    ls -lh $BACKUP_DIR/*$DATE*
}

# 执行主函数
main "$@"
