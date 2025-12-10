#!/bin/bash

# 数据库备份脚本
# 作者: ZCG Team
# 创建时间: $(date +%Y-%m-%d)

# 配置变量
DB_HOST="192.168.0.2"
DB_PORT="5433"
DB_USER="zcg"
DB_NAME="zcg"
BACKUP_DIR="/app/postgre/backup"
LOG_DIR="/app/logs"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/zcg_backup_${DATE}.sql"
LOG_FILE="${LOG_DIR}/backup_${DATE}.log"

# 创建必要的目录
mkdir -p "$BACKUP_DIR"
mkdir -p "$LOG_DIR"

# 日志函数
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 错误处理函数
handle_error() {
    log_message "错误: $1"
    exit 1
}

# 开始备份
log_message "开始数据库备份..."

# 检查数据库连接
log_message "检查数据库连接..."
if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
    handle_error "无法连接到数据库 $DB_HOST:$DB_PORT:$DB_NAME"
fi

# 执行备份
log_message "执行 pg_dump 备份..."
if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE" 2>> "$LOG_FILE"; then
    log_message "备份成功完成: $BACKUP_FILE"
    
    # 获取备份文件大小
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log_message "备份文件大小: $BACKUP_SIZE"
    
    # 压缩备份文件以节省空间
    log_message "压缩备份文件..."
    if gzip "$BACKUP_FILE"; then
        log_message "备份文件已压缩: ${BACKUP_FILE}.gz"
    else
        log_message "警告: 压缩备份文件失败"
    fi
    
    # 清理旧备份文件（保留最近7天的备份）
    log_message "清理旧备份文件..."
    find "$BACKUP_DIR" -name "zcg_backup_*.sql.gz" -mtime +7 -delete 2>/dev/null
    log_message "已删除3天前的备份文件"
    
else
    handle_error "数据库备份失败"
fi

# 备份完成
log_message "数据库备份脚本执行完成" 