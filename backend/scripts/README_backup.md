# 数据库备份脚本使用说明

## 概述

本项目提供了完整的数据库备份解决方案，包括自动备份脚本和定时任务配置。

## 文件说明

- `backup_database.sh` - 主备份脚本
- `setup_backup_cron.sh` - 定时任务配置脚本
- `README_backup.md` - 本说明文档

## 功能特性

### 备份脚本特性
- ✅ 自动检查数据库连接
- ✅ 详细的日志记录
- ✅ 错误处理和异常捕获
- ✅ 自动压缩备份文件
- ✅ 自动清理旧备份（保留5天）
- ✅ 备份文件大小统计

### 定时任务特性
- ✅ 每天凌晨2点自动执行
- ✅ 自动检测并更新现有任务
- ✅ 安全的crontab配置

## 使用方法

### 1. 手动执行备份

```bash
# 直接执行备份脚本
./backend/scripts/backup_database.sh
```

### 2. 设置定时任务

```bash
# 运行定时任务配置脚本
./backend/scripts/setup_backup_cron.sh
```

### 3. 查看当前定时任务

```bash
# 查看当前crontab配置
crontab -l
```

### 4. 手动删除定时任务

```bash
# 编辑crontab
crontab -e

# 删除包含 backup_database.sh 的行
```

## 配置说明

### 数据库配置
- **主机**: 192.168.0.2
- **端口**: 5433
- **用户**: zcg
- **数据库**: zcg

### 备份配置
- **备份目录**: `/app/postgre/backup/`
- **日志目录**: `/app/logs/`
- **保留时间**: 7天
- **执行时间**: 每天凌晨2点

### 文件命名规则
- 备份文件: `zcg_backup_YYYYMMDD_HHMMSS.sql.gz`
- 日志文件: `backup_YYYYMMDD_HHMMSS.log`

## 注意事项

### 环境要求
1. 确保系统已安装 PostgreSQL 客户端工具
2. 确保有足够的磁盘空间存储备份文件
3. 确保数据库用户有备份权限

### 权限设置
```bash
# 确保脚本有执行权限
chmod +x backend/scripts/backup_database.sh
chmod +x backend/scripts/setup_backup_cron.sh
```

### 网络连接
- 确保服务器能够访问数据库主机 192.168.0.2
- 确保防火墙允许数据库连接

## 故障排除

### 常见问题

1. **连接失败**
   ```
   错误: 无法连接到数据库 192.168.0.2:5433:zcg
   ```
   - 检查数据库服务是否运行
   - 检查网络连接
   - 检查数据库用户权限

2. **备份失败**
   ```
   错误: 数据库备份失败
   ```
   - 检查磁盘空间
   - 检查数据库用户权限
   - 查看详细日志文件

3. **定时任务不执行**
   - 检查cron服务是否运行: `systemctl status cron`
   - 检查crontab配置: `crontab -l`
   - 检查系统时间是否正确

### 日志查看

```bash
# 查看最新的备份日志
ls -la /app/logs/backup_*.log | tail -1 | xargs cat

# 实时查看日志
tail -f /app/logs/backup_*.log
```

## 恢复数据库

### 从备份文件恢复

```bash
# 解压备份文件
gunzip /app/postgre/backup/zcg_backup_YYYYMMDD_HHMMSS.sql.gz

# 恢复数据库
psql -h 192.168.0.2 -p 5433 -U zcg zcg < /app/postgre/backup/zcg_backup_YYYYMMDD_HHMMSS.sql
```

## 监控和维护

### 定期检查
1. 检查备份文件是否正常生成
2. 检查备份文件大小是否合理
3. 检查日志文件是否有错误
4. 检查磁盘空间使用情况

### 备份验证
```bash
# 检查备份文件完整性
gunzip -t /app/postgre/backup/zcg_backup_*.sql.gz

# 检查备份文件内容
gunzip -c /app/postgre/backup/zcg_backup_*.sql.gz | head -20
```

## 联系支持

如有问题，请联系开发团队或查看项目文档。 