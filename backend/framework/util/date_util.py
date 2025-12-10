from datetime import datetime, timedelta
from typing import Tuple

def get_current_week_range() -> Tuple[str, str]:
    """
    获取当前时间所在周的开始时间和结束时间
    
    Returns:
        Tuple[str, str]: (start_time, end_time) 格式为 'YYYY-MM-DD HH:MM:SS'
    """
    now = datetime.now()
    
    # 获取当前周的周一（周开始）
    days_since_monday = now.weekday()  # 0=Monday, 6=Sunday
    week_start = now - timedelta(days=days_since_monday)
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # 获取当前周的周日（周结束）
    week_end = week_start + timedelta(days=6)
    week_end = week_end.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    return week_start.strftime('%Y-%m-%d %H:%M:%S'), week_end.strftime('%Y-%m-%d %H:%M:%S')

def get_current_week_range_date_only() -> Tuple[str, str]:
    """
    获取当前时间所在周的开始时间和结束时间（仅日期）
    
    Returns:
        Tuple[str, str]: (start_time, end_time) 格式为 'YYYY-MM-DD'
    """
    now = datetime.now()
    
    # 获取当前周的周一（周开始）
    days_since_monday = now.weekday()  # 0=Monday, 6=Sunday
    week_start = now - timedelta(days=days_since_monday)
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # 获取当前周的周日（周结束）
    week_end = week_start + timedelta(days=6)
    week_end = week_end.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    return week_start.strftime('%Y-%m-%d'), week_end.strftime('%Y-%m-%d')

def get_week_range(date: datetime) -> Tuple[str, str]:
    """
    获取指定日期所在周的开始时间和结束时间
    
    Args:
        date: 指定日期
        
    Returns:
        Tuple[str, str]: (start_time, end_time) 格式为 'YYYY-MM-DD HH:MM:SS'
    """
    # 获取指定日期所在周的周一（周开始）
    days_since_monday = date.weekday()  # 0=Monday, 6=Sunday
    week_start = date - timedelta(days=days_since_monday)
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # 获取指定日期所在周的周日（周结束）
    week_end = week_start + timedelta(days=6)
    week_end = week_end.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    return week_start.strftime('%Y-%m-%d %H:%M:%S'), week_end.strftime('%Y-%m-%d %H:%M:%S')

def get_week_range_date_only(date: datetime) -> Tuple[str, str]:
    """
    获取指定日期所在周的开始时间和结束时间（仅日期）
    
    Args:
        date: 指定日期
        
    Returns:
        Tuple[str, str]: (start_time, end_time) 格式为 'YYYY-MM-DD'
    """
    # 获取指定日期所在周的周一（周开始）
    days_since_monday = date.weekday()  # 0=Monday, 6=Sunday
    week_start = date - timedelta(days=days_since_monday)
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # 获取指定日期所在周的周日（周结束）
    week_end = week_start + timedelta(days=6)
    week_end = week_end.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    return week_start.strftime('%Y-%m-%d'), week_end.strftime('%Y-%m-%d')
