# OSS静态资源CORS处理方案

## 📋 概述

本文档描述了斩词阁应用的OSS静态资源CORS（跨域资源共享）处理方案。通过全局媒体元素处理器和错误处理机制，确保所有OSS资源（视频、音频、图片）能够正常加载和播放。

## 🎯 解决的问题

### 1. **CORS错误问题**
- 浏览器访问OSS资源时可能遇到跨域限制
- 影响视频播放、音频播放、图片显示等功能
- 导致Canvas操作失败（如获取视频帧）

### 2. **代码维护问题**
- 每个组件都需要手动添加CORS处理逻辑
- 新组件容易遗漏CORS处理
- 代码重复，维护困难

## 🏗️ 架构设计

### 核心组件

```
┌─────────────────────────────────────────────────────────────┐
│                    应用启动时初始化                          │
├─────────────────────────────────────────────────────────────┤
│  GlobalHandler组件                                          │
│  ├── 启动全局错误处理器                                      │
│  └── 启动媒体元素处理器                                      │
├─────────────────────────────────────────────────────────────┤
│  全局媒体元素处理器 (MediaElementHandler)                    │
│  ├── 处理已存在的媒体元素                                    │
│  ├── 监听新添加的媒体元素                                    │
│  └── 自动添加CORS处理                                        │
├─────────────────────────────────────────────────────────────┤
│  全局错误处理器 (GlobalErrorHandler)                        │
│  ├── 捕获全局CORS错误                                        │
│  └── 处理未捕获的Promise拒绝                                 │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 技术实现

### 1. **全局媒体元素处理器**

**文件位置：** `frontend/src/utils/mediaElementHandler.ts`

#### 核心功能
- **自动处理**：为所有OSS媒体元素自动添加`crossOrigin="anonymous"`
- **错误恢复**：CORS错误时自动移除crossOrigin并重试
- **实时监听**：使用MutationObserver监听新添加的媒体元素
- **智能识别**：只处理OSS URL，避免影响本地资源

#### 工作原理
```javascript
// 1. 处理已存在的媒体元素
document.querySelectorAll('video, audio, img').forEach(element => {
  if (isOSSUrl(element.src)) {
    element.crossOrigin = 'anonymous';
  }
});

// 2. 监听新添加的媒体元素
MutationObserver监听DOM变化 → 自动处理新元素
```

### 2. **全局错误处理器**

**文件位置：** `frontend/src/utils/globalErrorHandler.ts`

#### 核心功能
- **全局错误捕获**：监听所有JavaScript错误
- **CORS错误识别**：自动识别CORS相关错误
- **优雅降级**：防止CORS错误影响应用正常运行
- **错误日志**：提供详细的错误信息用于调试

### 3. **全局处理器组件**

**文件位置：** `frontend/src/components/GlobalHandler.tsx`

#### 作用
- **统一入口**：在应用启动时初始化所有全局处理器
- **自动启动**：无需手动调用，应用启动时自动生效

## 📁 文件结构

```
frontend/src/
├── utils/
│   ├── mediaElementHandler.ts    # 全局媒体元素处理器
│   └── globalErrorHandler.ts     # 全局错误处理器
├── components/
│   └── GlobalHandler.tsx         # 全局处理器组件
├── config/
│   └── resource.ts               # 资源路径配置
└── app/
    └── layout.tsx                # 根布局（使用GlobalHandler）
```

## 🚀 使用方法

### 1. **OSS配置（必须）**

#### A. 阿里云OSS控制台配置
1. 登录阿里云OSS控制台
2. 选择您的Bucket
3. 点击"权限管理" → "跨域设置CORS"
4. 点击"创建规则"，配置如下：

```json
{
  "AllowedOrigins": ["*"],
  "AllowedMethods": ["GET", "HEAD"],
  "AllowedHeaders": ["*"],
  "ExposeHeaders": ["ETag"],
  "MaxAgeSeconds": 3600
}
```

#### B. 文件上传配置
确保上传到OSS的文件设置了正确的Content-Type：
- 视频文件：`video/mp4`
- 音频文件：`audio/mpeg`
- 图片文件：`image/jpeg`

### 2. **前端配置（必须）**

#### A. 环境变量配置
在`.env`文件中设置：
```bash
NEXT_PUBLIC_OSS_BASE_URL=https://your-bucket.oss-region.aliyuncs.com
NEXT_PUBLIC_OSS_ENABLED=true
```

#### B. 资源路径配置
使用统一的资源路径配置：
```javascript
// 视频资源
RESOURCE_CONFIG.getVideoPath(VIDEO_FILES.LOGIN)

// 音频资源
RESOURCE_CONFIG.getAudioPath(AUDIO_FILES.LOGIN)

// 图片资源
RESOURCE_CONFIG.getImagePath(IMAGE_FILES.ZCG)
```

### 3. **组件开发（自动处理）**

#### 新组件开发
**无需手动添加CORS处理，直接使用：**
```javascript
// 视频组件
<video src="https://oss.aliyuncs.com/video.mp4" />

// 音频组件
<audio src="https://oss.aliyuncs.com/audio.mp3" />

// 图片组件
<img src="https://oss.aliyuncs.com/image.jpg" />
```

**系统会自动：**
- ✅ 添加`crossOrigin="anonymous"`
- ✅ 处理CORS错误
- ✅ 提供错误恢复机制

#### 动态创建元素
```javascript
// 动态创建媒体元素
const video = document.createElement('video');
video.src = 'https://oss.aliyuncs.com/video.mp4';
document.body.appendChild(video);

// 系统会自动处理CORS
```

## 🔍 调试和监控

### 1. **控制台日志**
系统会在控制台输出详细的处理信息：
```
[GlobalHandler] 全局错误处理和媒体元素处理器已设置
[MediaElementHandler] CORS错误，尝试移除crossOrigin设置: https://oss.aliyuncs.com/video.mp4
[GlobalErrorHandler] 检测到CORS错误: Access to video at '...' has been blocked by CORS policy
```

### 2. **错误监控**
可以在`globalErrorHandler.ts`中添加错误上报逻辑：
```javascript
window.addEventListener('error', (event) => {
  if (event.error?.message?.includes('CORS')) {
    // 上报到监控系统
    reportError('CORS_ERROR', event.error.message);
  }
});
```

### 3. **手动检查**
```javascript
// 在浏览器控制台检查OSS CORS配置
import { MediaElementHandler } from '@/utils/mediaElementHandler';

// 检查特定元素
const video = document.querySelector('video');
MediaElementHandler.processElement(video);
```

## 📊 性能优化

### 1. **智能处理**
- 只处理OSS URL，不影响本地资源
- 避免重复添加事件监听器
- 使用`once: true`确保事件监听器只执行一次

### 2. **内存管理**
- MutationObserver在组件卸载时自动清理
- 事件监听器使用`once: true`避免内存泄漏

### 3. **错误恢复**
- CORS错误时自动降级处理
- 不影响应用其他功能正常运行

## 🛠️ 故障排除

### 1. **常见问题**

#### A. 视频无法播放
**检查项：**
- OSS CORS配置是否正确
- 文件Content-Type是否正确
- 网络连接是否正常

**解决方案：**
```javascript
// 检查OSS CORS配置
const response = await fetch('https://oss.aliyuncs.com/video.mp4', {
  method: 'OPTIONS',
  mode: 'cors'
});
console.log('CORS配置:', response.ok);
```

#### B. Canvas操作失败
**原因：** 视频没有正确的CORS设置
**解决方案：** 确保OSS配置了正确的CORS规则

#### C. 音频无法播放
**检查项：**
- 音频文件格式是否支持
- OSS CORS配置是否正确
- 浏览器是否支持该音频格式

### 2. **调试步骤**
1. 检查浏览器控制台是否有CORS错误
2. 验证OSS CORS配置是否正确
3. 确认文件Content-Type设置
4. 测试网络连接

## 📈 最佳实践

### 1. **开发阶段**
- 使用本地资源进行开发测试
- 定期检查OSS CORS配置
- 监控控制台错误日志

### 2. **生产环境**
- 确保OSS CORS配置正确
- 监控CORS错误率
- 定期检查资源加载性能

### 3. **代码规范**
- 使用统一的资源路径配置
- 避免硬编码OSS URL
- 遵循错误处理最佳实践

## 🔄 版本历史

### v1.0.0 (当前版本)
- ✅ 全局媒体元素自动处理
- ✅ 全局错误捕获和处理
- ✅ 自动CORS错误恢复
- ✅ 实时DOM监听
- ✅ 统一资源路径配置

### 未来计划
- 🔄 支持更多媒体格式
- 🔄 添加性能监控
- 🔄 支持CDN配置
- 🔄 添加缓存优化

## 📞 技术支持

如果在使用过程中遇到问题，请：

1. **检查控制台日志**：查看详细的错误信息
2. **验证OSS配置**：确保CORS规则正确设置
3. **测试网络连接**：确认OSS服务可访问
4. **查看本文档**：参考故障排除部分

---

**总结：** 本方案通过全局自动处理机制，彻底解决了OSS静态资源的CORS问题，开发者无需在每个组件中手动添加CORS处理代码，新组件自动支持，大大简化了开发和维护工作。 