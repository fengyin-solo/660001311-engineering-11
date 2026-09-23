import type { ArtworkConfig, SampleArtworkConfig } from './artworkConfig'
import type { PatternType } from '../types'

/**
 * 配置逐项校验。只报错、不兜底：任何一项缺失或取值非法，
 * 都返回该项的完整路径（如 canvas.width）、原因与实际取值，
 * 由调用方决定让构建/开发服务器失败，绝不静默退回默认值。
 */

export interface ConfigIssue {
  /** 出问题的配置项路径，例如 canvas.width、export.pngScale */
  path: string
  /** 中文原因说明 */
  message: string
  /** 实际取到的值（缺失时为 undefined） */
  actual: unknown
}

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

// 与 src/render/renderArtwork.ts 实际支持的图案保持一致
const SUPPORTED_PATTERNS: ReadonlySet<PatternType> = new Set([
  'spiral', 'fractal', 'wave', 'circles', 'noise',
])

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

function isPositiveInteger(v: unknown): v is number {
  return isFiniteNumber(v) && Number.isInteger(v) && v > 0
}

/**
 * 校验配置，返回全部问题（一次列全，方便一次修完）。
 * 不做任何“修复”或默认值回填。
 */
export function validateArtworkConfig(config: unknown): ConfigIssue[] {
  const issues: ConfigIssue[] = []
  const fail = (path: string, message: string, actual: unknown) =>
    issues.push({ path, message, actual })

  if (!isObject(config)) {
    fail('artworkConfig', '配置必须是一个对象', config)
    return issues
  }

  // ---- canvas ----
  const canvas = (config as Record<string, unknown>).canvas
  if (!isObject(canvas)) {
    fail('canvas', '缺少画布配置段，或其值不是对象', canvas)
  } else {
    const { width, height, bgColor } = canvas
    if (!isPositiveInteger(width)) {
      fail('canvas.width', '必须是正整数（像素）', width)
    }
    if (!isPositiveInteger(height)) {
      fail('canvas.height', '必须是正整数（像素）', height)
    }
    if (typeof bgColor !== 'string' || !HEX_COLOR.test(bgColor.trim())) {
      fail('canvas.bgColor', '必须是十六进制颜色，形如 #rgb 或 #rrggbb', bgColor)
    }
  }

  // ---- export ----
  const exportCfg = (config as Record<string, unknown>).export
  if (!isObject(exportCfg)) {
    fail('export', '缺少导出配置段，或其值不是对象', exportCfg)
  } else {
    const { pngScale, filenamePrefix } = exportCfg
    if (!isFiniteNumber(pngScale) || pngScale <= 0) {
      fail('export.pngScale', '必须是大于 0 的数字（PNG 相对画布的倍率）', pngScale)
    }
    if (typeof filenamePrefix !== 'string' || filenamePrefix.trim() === '') {
      fail('export.filenamePrefix', '必须是非空字符串', filenamePrefix)
    } else if (/[\\/]/.test(filenamePrefix)) {
      fail('export.filenamePrefix', '不能包含路径分隔符（/ 或 \\）', filenamePrefix)
    }
  }

  // ---- sample ----
  const sample = (config as Record<string, unknown>).sample
  if (!isObject(sample)) {
    fail('sample', '缺少样例作品配置段，或其值不是对象', sample)
  } else {
    validateSample(sample, fail)
  }

  return issues
}

function validateSample(
  sample: Record<string, unknown>,
  fail: (path: string, message: string, actual: unknown) => void,
) {
  const { pattern, seed, iterations, scale, rotation, strokeWidth, opacity, palette } = sample

  if (typeof pattern !== 'string' || !SUPPORTED_PATTERNS.has(pattern as PatternType)) {
    fail(
      'sample.pattern',
      `必须是渲染器支持的图案之一：${[...SUPPORTED_PATTERNS].join('、')}`,
      pattern,
    )
  }
  if (typeof seed !== 'number' || !Number.isInteger(seed)) {
    fail('sample.seed', '必须是整数（确定性随机种子）', seed)
  }
  if (!isPositiveInteger(iterations)) {
    fail('sample.iterations', '必须是正整数', iterations)
  }
  if (!isFiniteNumber(scale) || scale <= 0) {
    fail('sample.scale', '必须是大于 0 的数字', scale)
  }
  if (!isFiniteNumber(rotation) || rotation < 0 || rotation >= 360) {
    fail('sample.rotation', '必须是不小于 0 且小于 360 的数字（角度）', rotation)
  }
  if (!isFiniteNumber(strokeWidth) || strokeWidth <= 0) {
    fail('sample.strokeWidth', '必须是大于 0 的数字', strokeWidth)
  }
  if (!isFiniteNumber(opacity) || opacity < 0 || opacity > 1) {
    fail('sample.opacity', '必须是 0 到 1 之间的数字', opacity)
  }
  if (!Array.isArray(palette) || palette.length === 0) {
    fail('sample.palette', '必须是非空颜色数组', palette)
  } else {
    palette.forEach((color, i) => {
      if (typeof color !== 'string' || !HEX_COLOR.test(color.trim())) {
        fail(`sample.palette[${i}]`, '必须是十六进制颜色，形如 #rgb 或 #rrggbb', color)
      }
    })
  }
}

export function assertValidArtworkConfig(config: unknown): asserts config is ArtworkConfig {
  const issues = validateArtworkConfig(config)
  if (issues.length > 0) {
    throw new Error(formatConfigIssues(issues))
  }
}

/** 把全部问题渲染为带配置项路径的多行日志文本 */
export function formatConfigIssues(issues: ConfigIssue[]): string {
  const lines = issues.map(i => {
    const shown = i.actual === undefined ? '（缺失）' : JSON.stringify(i.actual)
    return `  - ${i.path}：${i.message}；实际取值：${shown}`
  })
  return [
    `作品配置非法（共 ${issues.length} 项），构建中止。请修正 src/config/artworkConfig.ts 中的以下配置项：`,
    ...lines,
  ].join('\n')
}
