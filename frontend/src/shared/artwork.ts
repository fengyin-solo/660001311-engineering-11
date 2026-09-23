import type { DesignParams } from '../types'
import { createRng, generateSpiral, generateFractal, generateWave, generateCircles, generateNoise } from '../generators/patterns'

// 预览与导出共用的 SVG 组装逻辑。
// 画布尺寸、底色、旋转只在这里拼一次，任何一侧要改都必须改这里；
// 构建时的 verify-artwork 校验会对两个入口的产出做样例比对。

/** 按当前参数生成图案内容（不含 <svg> 外壳）。 */
export function renderArtworkContent(p: DesignParams): string {
  const rng = createRng(p.seed)
  const { width, height, pattern, iterations, scale, palette, strokeWidth, opacity } = p
  switch (pattern) {
    case 'spiral':  return generateSpiral(width, height, iterations, scale, palette, rng, strokeWidth, opacity)
    case 'fractal': return generateFractal(width, height, iterations, scale, palette, rng, strokeWidth, opacity)
    case 'wave':    return generateWave(width, height, iterations, scale, palette, rng, strokeWidth, opacity)
    case 'circles': return generateCircles(width, height, iterations, scale, palette, rng, strokeWidth, opacity)
    case 'noise':   return generateNoise(width, height, iterations, scale, palette, rng, strokeWidth, opacity)
    default:        return ''
  }
}

/** 把图案内容装进 <svg> 外壳：尺寸 / viewBox / 底色 / 旋转。 */
export function buildSvgDocument(p: DesignParams, content: string): string {
  const { width, height, bgColor, rotation } = p
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${bgColor}"/>
  <g transform="rotate(${rotation},${width / 2},${height / 2})">${content}</g>
</svg>`
}

/** 预览入口（ArtCanvas 使用）。 */
export function renderPreviewSvg(p: DesignParams): string {
  return buildSvgDocument(p, renderArtworkContent(p))
}

/**
 * 导出入口（store 的 SVG/PNG 导出使用）。
 * 必须与 renderPreviewSvg 保持一致：构建时的 verify-artwork 校验
 * 会用同一份样例参数比对两个入口产出的尺寸、底色与旋转。
 */
export function renderExportSvg(p: DesignParams): string {
  return buildSvgDocument(p, renderArtworkContent(p))
}
