# 生成艺术 SVG 海报设计器

参数化生成艺术工具，支持螺旋、分形树、波浪、圆环、噪声场五种图案，8 种颜色主题，SVG/PNG 导出。

## 功能

- 5 种图案类型：螺旋、分形树、波浪、圆环、噪声场
- 8 种预设颜色主题（日落、海洋、霓虹、森林、单色、糖果、火焰、极光）
- 种子随机数生成器（确定性重现）
- 参数实时预览：迭代数、缩放、旋转、描边、透明度
- SVG 矢量导出 & PNG 高清导出

## 技术栈

- React + TypeScript + Vite
- D3.js（数据处理）
- Zustand（状态管理）
- Tailwind CSS

## 共用配置与一致性校验

画布尺寸、底色与导出参数只有一份配置来源：
`frontend/src/config/artworkConfig.ts`。预览组件与 SVG/PNG 导出都经由
`frontend/src/render/renderArtwork.ts` 的同一渲染函数拼装，导出不再复用
预览缓存的字符串。

本地开发（`npm run dev`）启动与构建（`npm run build`）时都会执行一道校验
（`frontend/src/verify/buildCheck.ts`，由 `vite.config.ts` 的插件触发）：

1. 逐项校验配置：任一项缺失或取值非法都会**打印具体配置项路径、原因与实际
   取值**并中止，不会静默退回默认值；
2. 按配置中的样例参数生成一张样例作品，比对预览结果与导出结果的画布尺寸、
   底色、旋转（含旋转中心），不一致即构建失败并逐项打印差异；
3. 顺带核对渲染结果与配置本身一致、PNG 导出尺寸 = 画布尺寸 × `pngScale`。

## 运行

```bash
cd frontend && npm install && npm run dev
```
