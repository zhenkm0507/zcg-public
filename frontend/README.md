This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 主色调与主题色规范

### 1. 主色调定义
- 斩词阁前端系统主色调为：
  - 国风金棕色：`#bfa76a`
  - 深棕色：`#4b3a1e`
  - 米色：`#f8f5ec`
- 所有高亮、选中、主操作、按钮、Tag、卡片等视觉元素必须使用主色，严禁出现AntD默认蓝色。

### 2. 全局CSS变量
- 在 `globals.css` 中定义如下CSS变量：
  ```css
  :root {
    --primary-color: #bfa76a;
    --primary-color-dark: #4b3a1e;
    --primary-color-light: #f8f5ec;
  }
  ```
- 所有自定义样式、背景、边框、hover、active等状态均应引用上述变量。

### 3. AntD主题配置
- 通过AntD 5的 `ConfigProvider` 统一配置主题色：
  - 使用 `theme.token` 设置主色：
    ```js
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#bfa76a',
          // ...其它token
        },
        components: {
          Tag: {
            colorPrimary: '#bfa76a',
            // ...其它Tag相关配置
          },
        },
      }}
    >
      {/* ... */}
    </ConfigProvider>
    ```
  - 禁止在页面或组件中局部覆盖主色，禁止自定义主色class。
  - 所有AntD按钮、Tag、主操作等自动继承全局主色。

### 4. 组件与页面开发规范
- 新页面、新组件必须100%复用全局ConfigProvider和全局CSS变量配置。
- 禁止出现 `color="blue"`、`.primaryTag` 等本地class或局部主色覆盖。
- 如需自定义主色按钮/Tag，优先用AntD的 `type="primary"` 或 `Tag` 组件。
- 批次卡片、Tag、按钮等hover/选中/高亮状态均用主色。

### 5. 样式优先级与兼容性
- 遇到AntD 5+ CSS-in-JS样式优先级高于全局样式时，务必通过ConfigProvider的 `components.Tag` 等配置解决。
- 如遇样式未生效，强制刷新缓存或删除本地样式class，确保全局唯一。

### 6. 其它说明
- 规范内容如有更新，请同步至本文件，确保团队开发一致性。
