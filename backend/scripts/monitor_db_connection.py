#!/usr/bin/env python3
"""
数据库连接监控脚本
用于实时监控数据库连接状态和连接池信息
"""
import sys
import os
import time
import json
from datetime import datetime

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from framework.database.db_factory import check_db_connection, get_pool_status, log_pool_status
from framework.util.logger import setup_logger

logger = setup_logger(__name__)

def monitor_database_connection(interval=30, max_checks=100):
    """
    监控数据库连接状态
    
    Args:
        interval: 检查间隔（秒）
        max_checks: 最大检查次数，None表示无限循环
    """
    print(f"开始监控数据库连接状态，检查间隔: {interval}秒")
    print("=" * 60)
    
    check_count = 0
    
    while max_checks is None or check_count < max_checks:
        try:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            # 检查连接状态
            connected = check_db_connection()
            pool_status = get_pool_status()
            
            # 打印状态信息
            status_icon = "✅" if connected else "❌"
            print(f"[{timestamp}] {status_icon} 数据库连接状态: {'正常' if connected else '异常'}")
            
            # 打印连接池详细信息
            print(f"   连接池大小: {pool_status['pool_size']}")
            print(f"   已检出连接: {pool_status['checked_out']}")
            print(f"   已检入连接: {pool_status['checked_in']}")
            print(f"   溢出连接: {pool_status['overflow']}")
            print(f"   无效连接: {pool_status['invalid']}")
            
            # 计算连接使用率
            total_connections = pool_status['pool_size'] + pool_status['overflow']
            used_connections = pool_status['checked_out']
            usage_rate = (used_connections / total_connections * 100) if total_connections > 0 else 0
            
            print(f"   连接使用率: {usage_rate:.1f}%")
            
            # 检查连接池健康状态
            if pool_status['invalid'] > 0:
                print(f"   ⚠️  警告: 发现 {pool_status['invalid']} 个无效连接")
            
            if usage_rate > 80:
                print(f"   ⚠️  警告: 连接池使用率过高 ({usage_rate:.1f}%)")
            
            print("-" * 60)
            
            check_count += 1
            
            # 等待下次检查
            time.sleep(interval)
            
        except KeyboardInterrupt:
            print("\n监控已停止")
            break
        except Exception as e:
            print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ❌ 监控出错: {str(e)}")
            time.sleep(interval)

def test_connection_stability(test_count=100, interval=1):
    """
    测试连接稳定性
    
    Args:
        test_count: 测试次数
        interval: 测试间隔（秒）
    """
    print(f"开始连接稳定性测试，测试次数: {test_count}，间隔: {interval}秒")
    print("=" * 60)
    
    success_count = 0
    failure_count = 0
    
    for i in range(test_count):
        try:
            connected = check_db_connection()
            if connected:
                success_count += 1
                print(f"测试 {i+1}/{test_count}: ✅ 成功")
            else:
                failure_count += 1
                print(f"测试 {i+1}/{test_count}: ❌ 失败")
        except Exception as e:
            failure_count += 1
            print(f"测试 {i+1}/{test_count}: ❌ 异常 - {str(e)}")
        
        time.sleep(interval)
    
    # 打印测试结果
    print("=" * 60)
    print(f"连接稳定性测试完成:")
    print(f"总测试次数: {test_count}")
    print(f"成功次数: {success_count}")
    print(f"失败次数: {failure_count}")
    print(f"成功率: {success_count/test_count*100:.1f}%")

def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description="数据库连接监控工具")
    parser.add_argument("--mode", choices=["monitor", "test"], default="monitor",
                       help="运行模式: monitor(监控) 或 test(测试)")
    parser.add_argument("--interval", type=int, default=30,
                       help="检查间隔（秒），默认30秒")
    parser.add_argument("--test-count", type=int, default=100,
                       help="测试次数，默认100次")
    parser.add_argument("--test-interval", type=float, default=1.0,
                       help="测试间隔（秒），默认1秒")
    parser.add_argument("--max-checks", type=int, default=None,
                       help="最大检查次数，默认无限制")
    
    args = parser.parse_args()
    
    if args.mode == "monitor":
        monitor_database_connection(args.interval, args.max_checks)
    elif args.mode == "test":
        test_connection_stability(args.test_count, args.test_interval)

if __name__ == "__main__":
    main() 