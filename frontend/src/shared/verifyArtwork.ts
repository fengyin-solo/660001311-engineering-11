import type { DesignParams } from '../types'
import { THEMES } from '../themes/palettes'
import { validateArtworkConfig, type ArtworkConfig } from '../config/schema'
import { renderPreviewSvg, renderExportSvg } from './artwork'

// 本地开发与构建共用的自检：按共享配置生成一张样例作品，
// 比对「预览」与「导出」两条路径产出的尺寸、底色、旋转是否一致，
// 并核对它们是否等于配置里的期望值。

export interface SvgFacts {
  width: number | null
  height: number | null
  bgColor: string | null
  rotation: number | null
}

function matchNum(text: string, re: RegExp): number | null {
  const m = text.match(re)
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? n : null
}

/** 从 SVG 字符串里解析出画布尺寸、底色与旋转角。 */
export function inspectSvg(svg: string): SvgFacts {
  const svgTag = svg.match(/<svg\b[^>]*>/i)?.[0] ?? ''
  const rectTag = svg.match(/<rect\b[^>]*>/i)?.[0] ?? ''
  const rotate = svg.match(/rotate\(\s*(-?[\d.]+)/)
  return {
    width: matchNum(svgTag, /\bwidth="([^"]+)"/),
    height: matchNum(svgTag, /\bheight="([^"]+)"/),
    bgColor: rectTag.match(/\bfill="([^"]+)"/)?.[1] ?? null,
    rotation: rotate ? Number(rotate[1]) : null,
  }
}

// 样例固定用非零旋转角，确保旋转参数真的被两条路径带上
const SAMPLE_ROTATION = 30

function sampleParams(config: ArtworkConfig): DesignParams {
  return {
    pattern: 'spiral',
    seed: 42,
    iterations: 200,
    scale: 1,
    rotation: SAMPLE_ROTATION,
    strokeWidth: 1.5,
    opacity: 0.8,
    bgColor: config.background.color,
    palette: THEMES[0].colors,
    width: config.canvas.width,
    height: config.canvas.height,
  }
}

const fmt = (v: number | string | null) => (v === null ? '（未找到）' : String(v))

/**
 * 运行全部校验，返回问题列表（空数组 = 通过）。
 * 每一项问题都会点名：是配置里的哪个字段非法，或导出/预览的哪个属性不一致。
 */
export function verifyArtwork(rawConfig: unknown): string[] {
  const configErrors = validateArtworkConfig(rawConfig)
  if (configErrors.length > 0) {
    return configErrors.map(e => `配置项非法 —— ${e}`)
  }
  const config = rawConfig as ArtworkConfig

  const params = sampleParams(config)
  const preview = inspectSvg(renderPreviewSvg(params))
  const exported = inspectSvg(renderExportSvg(params))

  const fields: { label: string; key: keyof SvgFacts; expected: number | string }[] = [
    { label: '画布宽度 width', key: 'width', expected: config.canvas.width },
    { label: '画布高度 height', key: 'height', expected: config.canvas.height },
    { label: '底色 background.color', key: 'bgColor', expected: config.background.color },
    { label: '旋转 rotation', key: 'rotation', expected: SAMPLE_ROTATION },
  ]

  const problems: string[] = []
  for (const f of fields) {
    const p = preview[f.key]
    const e = exported[f.key]
    if (p !== e || e !== f.expected) {
      problems.push(
        `${f.label} 不一致：预览=${fmt(p)} / 导出=${fmt(e)} / 配置期望=${fmt(f.expected)}`
      )
    }
  }
  return problems
}
