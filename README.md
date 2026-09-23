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

## 运行

```bash
cd frontend && npm install && npm run dev
```

## 共享配置与构建校验

画布尺寸、底色与导出参数集中在 `frontend/src/config/artwork.config.json`：

- `canvas.width` / `canvas.height`：画布尺寸（16–16384 的整数）
- `background.color`：底色（#RGB / #RRGGBB / #RRGGBBAA 十六进制）
- `export.fileNamePrefix`：导出文件名前缀
- `export.pngScale`：PNG 导出倍率（0.25–8，2 即两倍高清）

预览（ArtCanvas）与导出（store 的 SVG/PNG 导出）都经由 `src/shared/artwork.ts`
里的同一份 SVG 组装逻辑，不再各自拼字符串。

`vite.config.ts` 里的 `verify-artwork` 插件会在 **dev 启动和 `vite build` 时**：

1. 逐项校验上述配置——缺项或取值非法会直接失败并在日志里点名是哪一项，不会退回默认值；
2. 按配置生成一张样例作品，分别走预览与导出两个入口，比对产出的尺寸、底色与旋转，
   不一致则构建失败并打印每项的「预览 / 导出 / 配置期望」差异。
