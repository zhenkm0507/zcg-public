#!/usr/bin/env python3
"""
斩词阁系统图标生成脚本
将轩辕剑图片转换为ico格式的favicon
"""

import os
import sys
from pathlib import Path

def create_favicon():
    """创建favicon.ico文件"""
    try:
        # 尝试导入PIL
        from PIL import Image
    except ImportError:
        print("错误：需要安装Pillow库")
        print("请运行：pip install Pillow")
        return False
    
    # 文件路径
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    source_image = project_root / "frontend" / "public" / "images" / "zcg.jpg"
    output_file = project_root / "frontend" / "src" / "app" / "favicon.ico"
    
    # 检查源文件是否存在
    if not source_image.exists():
        print(f"错误：源图片文件不存在: {source_image}")
        return False
    
    try:
        # 打开图片
        print(f"正在处理图片: {source_image}")
        img = Image.open(source_image)
        
        # 转换为RGBA模式（支持透明）
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # 创建不同尺寸的图标
        sizes = [16, 32, 48, 64, 128, 256]
        icons = []
        
        for size in sizes:
            # 调整图片尺寸，保持宽高比
            resized = img.resize((size, size), Image.Resampling.LANCZOS)
            icons.append(resized)
            print(f"生成 {size}x{size} 尺寸图标")
        
        # 保存为ico文件
        print(f"正在保存到: {output_file}")
        icons[0].save(
            output_file,
            format='ICO',
            sizes=[(size, size) for size in sizes],
            append_images=icons[1:]
        )
        
        print("✅ favicon.ico 创建成功！")
        print(f"文件位置: {output_file}")
        return True
        
    except Exception as e:
        print(f"错误：处理图片时出错: {e}")
        return False

if __name__ == "__main__":
    success = create_favicon()
    sys.exit(0 if success else 1) 