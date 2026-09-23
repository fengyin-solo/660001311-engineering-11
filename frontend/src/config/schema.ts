// 画布与导出配置的校验规则。配置本体在 artwork.config.json，
// 应用代码（src/config/artwork.ts）与构建自检（src/shared/verifyArtwork.ts）
// 共用这一套规则：任何一项缺失或非法都会被逐一点名，不允许静默退回默认值。

export interface ArtworkConfig {
  canvas: { width: number; height: number }
  background: { color: string }
  export: { fileNamePrefix: string; pngScale: number }
}

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/
const FILE_PREFIX = /^[A-Za-z0-9][A-Za-z0-9-_]*$/

const MIN_CANVAS = 16
const MAX_CANVAS = 16384
const MIN_PNG_SCALE = 0.25
const MAX_PNG_SCALE = 8

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function describe(v: unknown): string {
  return v === undefined ? '缺失' : `当前值 ${JSON.stringify(v)}`
}

/** 校验原始配置，返回逐项问题列表（空数组 = 通过）。 */
export function validateArtworkConfig(raw: unknown): string[] {
  if (!isRecord(raw)) {
    return [`配置整体必须是对象，${describe(raw)}`]
  }
  const errors: string[] = []

  if (!isRecord(raw.canvas)) {
    errors.push(`canvas 缺失或不是对象（${describe(raw.canvas)}）`)
  } else {
    for (const key of ['width', 'height'] as const) {
      const v = raw.canvas[key]
      if (typeof v !== 'number' || !Number.isInteger(v) || v < MIN_CANVAS || v > MAX_CANVAS) {
        errors.push(`canvas.${key} 非法：必须是 ${MIN_CANVAS}–${MAX_CANVAS} 的整数，${describe(v)}`)
      }
    }
  }

  if (!isRecord(raw.background)) {
    errors.push(`background 缺失或不是对象（${describe(raw.background)}）`)
  } else {
    const v = raw.background.color
    if (typeof v !== 'string' || !HEX_COLOR.test(v)) {
      errors.push(`background.color 非法：必须是 #RGB / #RRGGBB / #RRGGBBAA 形式的十六进制颜色，${describe(v)}`)
    }
  }

  if (!isRecord(raw.export)) {
    errors.push(`export 缺失或不是对象（${describe(raw.export)}）`)
  } else {
    const prefix = raw.export.fileNamePrefix
    if (typeof prefix !== 'string' || !FILE_PREFIX.test(prefix)) {
      errors.push(`export.fileNamePrefix 非法：必须是以字母或数字开头、仅含字母/数字/-/_ 的非空字符串，${describe(prefix)}`)
    }
    const scale = raw.export.pngScale
    if (typeof scale !== 'number' || !Number.isFinite(scale) || scale < MIN_PNG_SCALE || scale > MAX_PNG_SCALE) {
      errors.push(`export.pngScale 非法：必须是 ${MIN_PNG_SCALE}–${MAX_PNG_SCALE} 的数字，${describe(scale)}`)
    }
  }

  return errors
}

/** 校验并返回强类型配置；有任何问题就抛出列明每一项的错误。 */
export function loadArtworkConfig(raw: unknown): ArtworkConfig {
  const errors = validateArtworkConfig(raw)
  if (errors.length > 0) {
    throw new Error(
      `[artwork-config] 画布/导出配置非法，请修正 src/config/artwork.config.json：\n` +
      errors.map(e => `  - ${e}`).join('\n')
    )
  }
  return raw as ArtworkConfig
}
