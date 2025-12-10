#!/usr/bin/env python3
"""
生成揽月台模块的占位图片
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_placeholder_image(text, filename, size=(200, 200), bg_color=(240, 240, 240), text_color=(100, 100, 100)):
    """创建占位图片"""
    img = Image.new('RGB', size, bg_color)
    draw = ImageDraw.Draw(img)
    
    # 尝试使用系统字体
    try:
        font = ImageFont.truetype("/System/Library/Fonts/PingFang.ttc", 20)
    except:
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 20)
        except:
            font = ImageFont.load_default()
    
    # 计算文字位置
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (size[0] - text_width) // 2
    y = (size[1] - text_height) // 2
    
    # 绘制文字
    draw.text((x, y), text, fill=text_color, font=font)
    
    # 绘制边框
    draw.rectangle([0, 0, size[0]-1, size[1]-1], outline=(200, 200, 200), width=2)
    
    return img

def main():
    """主函数"""
    # 创建目录
    base_dir = "frontend/public/images"
    dirs = [
        "treasures",
        "manuals", 
        "swords",
        "armors"
    ]
    
    for dir_name in dirs:
        os.makedirs(f"{base_dir}/{dir_name}", exist_ok=True)
    
    # 珍宝图片
    treasures = [
        ("月光石", "moonstone.jpg"),
        ("星辰碎片", "star_fragment.jpg"),
        ("龙鳞", "dragon_scale.jpg"),
        ("凤凰羽毛", "phoenix_feather.jpg"),
        ("时光沙漏", "time_hourglass.jpg")
    ]
    
    for name, filename in treasures:
        img = create_placeholder_image(name, filename, (200, 150), (255, 255, 240), (139, 69, 19))
        img.save(f"{base_dir}/treasures/{filename}")
        print(f"创建珍宝图片: {filename}")
    
    # 秘籍图片
    manuals = [
        ("词汇记忆术", "memory_technique.jpg"),
        ("快速阅读法", "speed_reading.jpg"),
        ("思维导图术", "mind_mapping.jpg"),
        ("过目不忘", "photographic_memory.jpg"),
        ("词汇联想术", "word_association.jpg")
    ]
    
    for name, filename in manuals:
        img = create_placeholder_image(name, filename, (200, 120), (240, 248, 255), (25, 25, 112))
        img.save(f"{base_dir}/manuals/{filename}")
        print(f"创建秘籍图片: {filename}")
    
    # 宝剑图片
    swords = [
        ("青锋剑", "qingfeng_sword.jpg"),
        ("紫电剑", "zidian_sword.jpg"),
        ("龙渊剑", "longyuan_sword.jpg"),
        ("天问剑", "tianwen_sword.jpg"),
        ("轩辕剑", "xuanyuan_sword.jpg")
    ]
    
    for name, filename in swords:
        img = create_placeholder_image(name, filename, (200, 120), (245, 245, 245), (105, 105, 105))
        img.save(f"{base_dir}/swords/{filename}")
        print(f"创建宝剑图片: {filename}")
    
    # 盔甲图片
    armors = [
        ("青铜甲", "bronze_armor.jpg"),
        ("白银甲", "silver_armor.jpg"),
        ("黄金甲", "golden_armor.jpg"),
        ("龙鳞甲", "dragon_armor.jpg"),
        ("神光甲", "divine_armor.jpg")
    ]
    
    for name, filename in armors:
        img = create_placeholder_image(name, filename, (200, 120), (255, 248, 220), (184, 134, 11))
        img.save(f"{base_dir}/armors/{filename}")
        print(f"创建盔甲图片: {filename}")
    
    # 柜子背景图片
    cabinet_img = create_placeholder_image("华丽柜子", "drawer_cabinet.jpg", (400, 600), (139, 69, 19), (255, 215, 0))
    cabinet_img.save(f"{base_dir}/drawer_cabinet.jpg")
    print(f"创建柜子背景图片: drawer_cabinet.jpg")
    
    print("所有占位图片创建完成！")

if __name__ == "__main__":
    main() 