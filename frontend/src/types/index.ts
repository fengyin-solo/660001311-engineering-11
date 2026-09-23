export type PatternType = 'spiral' | 'fractal' | 'wave' | 'circles' | 'voronoi' | 'noise'

/**
 * 用户可在界面调整、随作品内容变化的参数。
 * 画布尺寸（width/height）与底色（bgColor）不在这里：
 * 它们属于全局共用配置 src/config/artworkConfig.ts，预览与导出共享。
 */
export interface DesignParams {
  pattern: PatternType
  seed: number
  iterations: number
  scale: number
  rotation: number
  strokeWidth: number
  opacity: number
  palette: string[]
}

export interface ColorTheme {
  id: string
  name: string
  colors: string[]
}
