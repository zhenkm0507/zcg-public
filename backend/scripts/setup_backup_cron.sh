#!/bin/bash

# 设置数据库备份定时任务脚本
# 作者: ZCG Team

# 获取脚本的绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="${SCRIPT_DIR}/backup_database.sh"

# 检查备份脚本是否存在
if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo "错误: 备份脚本不存在: $BACKUP_SCRIPT"
    exit 1
fi

# 确保备份脚本有执行权限
chmod +x "$BACKUP_SCRIPT"

# 创建临时crontab文件
TEMP_CRON=$(mktemp)

# 导出当前的crontab
crontab -l > "$TEMP_CRON" 2>/dev/null || echo "" > "$TEMP_CRON"

# 检查是否已经存在备份任务
if grep -q "backup_database.sh" "$TEMP_CRON"; then
    echo "警告: 数据库备份任务已存在，将更新为新的配置"
    # 删除旧的备份任务行
    sed -i '/backup_database.sh/d' "$TEMP_CRON"
fi

# 添加新的备份任务（每天凌晨2点执行）
echo "# 数据库备份任务 - 每天凌晨2点执行" >> "$TEMP_CRON"
echo "0 2 * * * $BACKUP_SCRIPT" >> "$TEMP_CRON"

# 安装新的crontab
if crontab "$TEMP_CRON"; then
    echo "成功: 数据库备份定时任务已设置"
    echo "备份脚本将在每天凌晨2点自动执行"
    echo "备份脚本路径: $BACKUP_SCRIPT"
    echo ""
    echo "当前crontab配置:"
    crontab -l
else
    echo "错误: 设置crontab失败"
    exit 1
fi

# 清理临时文件
rm -f "$TEMP_CRON"

echo ""
echo "提示:"
echo "1. 备份文件将保存在: /app/postgre/backup/"
echo "2. 日志文件将保存在: /app/logs/"
echo "3. 备份文件会自动压缩并保留最近7天"
echo "4. 如需手动执行备份，请运行: $BACKUP_SCRIPT" 