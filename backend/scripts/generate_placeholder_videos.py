#!/usr/bin/env python3
"""
生成揽月台模块的占位视频
"""

import os
from PIL import Image, ImageDraw, ImageFont
import numpy as np

def create_placeholder_video(filename, duration=3, fps=30, size=(640, 480)):
    """创建占位视频文件（实际是图片序列）"""
    # 创建视频目录
    video_dir = os.path.dirname(filename)
    os.makedirs(video_dir, exist_ok=True)
    
    # 创建占位图片作为视频封面
    img = Image.new('RGB', size, (255, 248, 220))
    draw = ImageDraw.Draw(img)
    
    # 尝试使用系统字体
    try:
        font = ImageFont.truetype("/System/Library/Fonts/PingFang.ttc", 30)
    except:
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 30)
        except:
            font = ImageFont.load_default()
    
    # 获取文件名（不含扩展名）作为显示文字
    name = os.path.splitext(os.path.basename(filename))[0]
    name = name.replace('_', ' ').title()
    
    # 计算文字位置
    bbox = draw.textbbox((0, 0), name, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (size[0] - text_width) // 2
    y = (size[1] - text_height) // 2
    
    # 绘制文字
    draw.text((x, y), name, fill=(184, 134, 11), font=font)
    
    # 绘制边框
    draw.rectangle([0, 0, size[0]-1, size[1]-1], outline=(184, 134, 11), width=5)
    
    # 保存为图片（作为视频占位符）
    img.save(filename.replace('.mp4', '.jpg'))
    
    # 创建占位视频文件（实际是文本文件）
    with open(filename, 'w') as f:
        f.write(f"# 占位视频文件: {name}\n")
        f.write(f"# 时长: {duration}秒\n")
        f.write(f"# 分辨率: {size[0]}x{size[1]}\n")
        f.write(f"# 帧率: {fps}fps\n")
        f.write("# 实际项目中应该放置真实的视频文件\n")
    
    print(f"创建占位视频: {filename}")

def main():
    """主函数"""
    base_dir = "frontend/public/videos/armors"
    
    # 盔甲视频
    armors = [
        "bronze_armor.mp4",
        "silver_armor.mp4", 
        "golden_armor.mp4",
        "dragon_armor.mp4",
        "divine_armor.mp4"
    ]
    
    for video_name in armors:
        video_path = f"{base_dir}/{video_name}"
        create_placeholder_video(video_path)
    
    print("所有占位视频创建完成！")

if __name__ == "__main__":
    main() 