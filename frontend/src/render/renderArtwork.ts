import type { ArtworkConfig } from '../config/artworkConfig'
import {
  createRng,
  generateSpiral,
  generateFractal,
  generateWave,
  generateCircles,
  generateNoise,
  type Rng,
} from '../generators/patterns'
import type { PatternType } from '../types'

/**
 * SVG 拼装的唯一实现。画布尺寸、底色、旋转只在这里拼一遍，
 * 预览（renderPreviewSvg）与导出（renderExportSvg）共用，
 * 从而保证「画布上看到的」与「导出拿到的」是同一份字符串。
 *
 * 注意：导出不再复用上次预览缓存的字符串，而是在导出时用当前
 * 参数重新调用本模块，避免缓存与当前状态脱节。
 */

/** 用户可在界面调整、与单张作品内容相关的参数 */
export interface ArtworkParams {
  pattern: PatternType
  seed: number
  iterations: number
  scale: number
  rotation: number
  strokeWidth: number
  opacity: number
  palette: string[]
}

/** 各图案生成器的统一签名 */
type Generator = (
  w: number, h: number, iterations: number, scale: number,
  palette: string[], rng: Rng, strokeWidth: number, opacity: number,
) => string

export const PATTERN_GENERATORS: Record<PatternType, Generator | undefined> = {
  spiral: generateSpiral,
  fractal: generateFractal,
  wave: generateWave,
  circles: generateCircles,
  noise: generateNoise,
  // 类型中保留但尚无生成器；命中时显式报错而不是静默输出空内容
  voronoi: undefined,
}

function generatePattern(params: ArtworkParams, width: number, height: number): string {
  const generator = PATTERN_GENERATORS[params.pattern]
  if (!generator) {
    throw new Error(`不支持的图案类型：${params.pattern}`)
  }
  const rng = createRng(params.seed)
  return generator(
    width, height, params.iterations, params.scale,
    params.palette, rng, params.strokeWidth, params.opacity,
  )
}

/**
 * 拼装整张 SVG。预览与导出都必须经由这里，
 * 任何一个调用方都不得自行拼接 width/height、底色 rect 或旋转 group。
 */
export function renderArtworkSvg(params: ArtworkParams, config: ArtworkConfig): string {
  const { width, height, bgColor } = config.canvas
  const content = generatePattern(params, width, height)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${bgColor}"/>
  <g transform="rotate(${params.rotation},${width / 2},${height / 2})">${content}</g>
</svg>`
}

/** 预览侧入口：与导出走完全相同的拼装逻辑 */
export function renderPreviewSvg(params: ArtworkParams, config: ArtworkConfig): string {
  return renderArtworkSvg(params, config)
}

/** 导出侧入口：导出时按当前参数即时生成，不复用历史缓存 */
export function renderExportSvg(params: ArtworkParams, config: ArtworkConfig): string {
  return renderArtworkSvg(params, config)
}

/** PNG 位图尺寸 = 画布尺寸 × 导出倍率，预览和导出都只信这一处计算 */
export function getPngDimensions(config: ArtworkConfig): { width: number; height: number } {
  return {
    width: Math.round(config.canvas.width * config.export.pngScale),
    height: Math.round(config.canvas.height * config.export.pngScale),
  }
}
