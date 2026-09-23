import type { PatternType } from '../types'

/**
 * 画布与导出的唯一配置来源。
 *
 * 预览（ArtCanvas）与导出（SVG/PNG）都必须从这里读取画布尺寸、底色与
 * 导出参数，不允许在各自代码里再写一份或退回硬编码默认值。
 *
 * 该配置会在本地开发（vite 启动）与构建（vite build）时由
 * src/verify/buildCheck.ts 逐项校验；缺失或取值非法会直接报错并指出
 * 具体是哪一项。
 */

export interface CanvasConfig {
  /** 画布宽度（px，正整数） */
  width: number
  /** 画布高度（px，正整数） */
  height: number
  /** 画布底色（#rgb 或 #rrggbb） */
  bgColor: string
}

export interface ExportConfig {
  /** PNG 导出相对画布尺寸的倍率（正数，例如 2 表示 2 倍高清图） */
  pngScale: number
  /** 导出文件名前缀（非空、不含路径分隔符） */
  filenamePrefix: string
}

/**
 * 构建校验所用的样例作品参数。固定取值（含非零旋转），
 * 保证每次构建生成同一张作品并可重复比对。
 */
export interface SampleArtworkConfig {
  pattern: PatternType
  seed: number
  iterations: number
  scale: number
  rotation: number
  strokeWidth: number
  opacity: number
  palette: string[]
}

export interface ArtworkConfig {
  canvas: CanvasConfig
  export: ExportConfig
  sample: SampleArtworkConfig
}

export const ARTWORK_CONFIG: ArtworkConfig = {
  canvas: {
    width: 800,
    height: 1000,
    bgColor: '#030712',
  },
  export: {
    pngScale: 2,
    filenamePrefix: 'art',
  },
  sample: {
    pattern: 'spiral',
    seed: 42,
    iterations: 200,
    scale: 1,
    rotation: 45,
    strokeWidth: 1.5,
    opacity: 0.8,
    palette: ['#ff6b35', '#f7c59f', '#efefd0', '#004e89', '#1a659e'],
  },
}
