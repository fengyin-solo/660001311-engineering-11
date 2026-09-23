/**
 * 构建校验：按共用配置生成一张样例作品，比对「预览结果」与
 * 「导出结果」的画布尺寸、底色、旋转是否一致；同时核对二者是否
 * 与配置本身一致，并校验 PNG 导出尺寸。
 *
 * 该文件同时被 vite（本地开发启动）与 vite build（构建）以 Node
 * 环境执行（经 esbuild 打包，见 vite.config.ts 的 verifyPlugin）。
 * 因此本文件只允许使用与浏览器/DOM 无关的纯逻辑。
 */

import { ARTWORK_CONFIG } from '../config/artworkConfig'
import {
  assertValidArtworkConfig,
  formatConfigIssues,
  validateArtworkConfig,
} from '../config/validateConfig'
import { renderPreviewSvg, renderExportSvg, getPngDimensions } from '../render/renderArtwork'
import type { ArtworkParams } from '../render/renderArtwork'

/** 从一段已渲染的 SVG 中提取需要比对的属性 */
export interface SvgSnapshot {
  width: number
  height: number
  bgColor: string
  rotation: number
  rotationCx: number
  rotationCy: number
}

function extractNumber(value: string, what: string, side: string): number {
  const n = Number(value)
  if (!Number.isFinite(n)) {
    throw new Error(`${side} SVG 的 ${what} 不是合法数字：${JSON.stringify(value)}`)
  }
  return n
}

/** 解析预览/导出 SVG，提取尺寸、底色、旋转（含旋转中心） */
export function inspectSvg(svg: string, side: string): SvgSnapshot {
  const svgTag = svg.match(/<svg\b[^>]*>/)
  if (!svgTag) throw new Error(`${side} SVG 缺少 <svg> 根元素`)

  const widthAttr = svgTag[0].match(/\bwidth="([^"]+)"/)
  const heightAttr = svgTag[0].match(/\bheight="([^"]+)"/)
  if (!widthAttr) throw new Error(`${side} SVG 缺少 width 属性`)
  if (!heightAttr) throw new Error(`${side} SVG 缺少 height 属性`)

  const rect = svg.match(/<rect\b[^>]*>/)
  if (!rect) throw new Error(`${side} SVG 缺少底色 <rect>`)
  const fillAttr = rect[0].match(/\bfill="([^"]+)"/)
  if (!fillAttr) throw new Error(`${side} SVG 的底色 <rect> 缺少 fill 属性`)

  const group = svg.match(/<g\b[^>]*\btransform="rotate\(([^)]+)\)"[^>]*>/)
  if (!group) throw new Error(`${side} SVG 缺少旋转分组 transform="rotate(...)"`)
  const parts = group[1].split(',').map(p => p.trim())
  if (parts.length !== 3) {
    throw new Error(`${side} SVG 的 rotate() 参数数量应为 3（角度, 中心X, 中心Y），实际：${group[1]}`)
  }

  return {
    width: extractNumber(widthAttr[1], 'width', side),
    height: extractNumber(heightAttr[1], 'height', side),
    bgColor: fillAttr[1].trim(),
    rotation: extractNumber(parts[0], '旋转角度', side),
    rotationCx: extractNumber(parts[1], '旋转中心 X', side),
    rotationCy: extractNumber(parts[2], '旋转中心 Y', side),
  }
}

interface Diff {
  item: string
  preview: string
  exported: string
}

function compareSnapshots(preview: SvgSnapshot, exported: SvgSnapshot): Diff[] {
  const fields: { key: keyof SvgSnapshot; label: string }[] = [
    { key: 'width', label: '画布宽度' },
    { key: 'height', label: '画布高度' },
    { key: 'bgColor', label: '底色' },
    { key: 'rotation', label: '旋转角度' },
    { key: 'rotationCx', label: '旋转中心 X' },
    { key: 'rotationCy', label: '旋转中心 Y' },
  ]
  const diffs: Diff[] = []
  for (const { key, label } of fields) {
    const a = preview[key]
    const b = exported[key]
    const equal = typeof a === 'string' || typeof b === 'string'
      ? String(a).toLowerCase() === String(b).toLowerCase()
      : a === b
    if (!equal) {
      diffs.push({ item: label, preview: String(a), exported: String(b) })
    }
  }
  return diffs
}

export interface VerifyResult {
  ok: boolean
  message: string
}

/**
 * 执行全部校验：
 * 1. 配置逐项校验（缺失/非法直接失败并指明配置项，不退回默认值）
 * 2. 按配置渲染样例的预览版与导出版，比对尺寸、底色、旋转
 * 3. 二者再分别与配置值核对，防止「两边一致但都错」
 * 4. 校验 PNG 导出尺寸 = 画布尺寸 × export.pngScale
 */
export function runBuildCheck(): VerifyResult {
  // 1. 配置校验：先收集全部问题再抛出，日志一次列全
  const configIssues = validateArtworkConfig(ARTWORK_CONFIG)
  if (configIssues.length > 0) {
    return { ok: false, message: formatConfigIssues(configIssues) }
  }
  assertValidArtworkConfig(ARTWORK_CONFIG)

  const sampleParams: ArtworkParams = ARTWORK_CONFIG.sample

  // 2. 模拟应用：预览走预览入口，导出走导出入口（两者内部共用同一拼装）
  const previewSvg = renderPreviewSvg(sampleParams, ARTWORK_CONFIG)
  const exportSvgString = renderExportSvg(sampleParams, ARTWORK_CONFIG)

  const preview = inspectSvg(previewSvg, '预览')
  const exported = inspectSvg(exportSvgString, '导出')

  const problems: string[] = []

  // 2a. 预览 vs 导出（用户真正关心的「所见即所出」）
  const diffs = compareSnapshots(preview, exported)
  if (diffs.length > 0) {
    problems.push(
      '预览与导出不一致：',
      ...diffs.map(d => `  - ${d.item}：预览=${d.preview}，导出=${d.exported}`),
    )
  }

  // 2b. 字符串完全相同（同一渲染逻辑下必然成立，作为兜底）
  if (previewSvg !== exportSvgString) {
    problems.push('预览 SVG 与导出 SVG 字符串不相同（应共用同一份渲染结果）')
  }

  // 3. 渲染结果必须与共用配置一致
  const { canvas } = ARTWORK_CONFIG
  const expectedCx = canvas.width / 2
  const expectedCy = canvas.height / 2
  const expectedBg = canvas.bgColor.toLowerCase()
  const vsConfig: Diff[] = []
  if (preview.width !== canvas.width) {
    vsConfig.push({ item: '画布宽度', preview: String(preview.width), exported: String(canvas.width) })
  }
  if (preview.height !== canvas.height) {
    vsConfig.push({ item: '画布高度', preview: String(preview.height), exported: String(canvas.height) })
  }
  if (preview.bgColor.toLowerCase() !== expectedBg) {
    vsConfig.push({ item: '底色', preview: preview.bgColor, exported: canvas.bgColor })
  }
  if (preview.rotation !== sampleParams.rotation) {
    vsConfig.push({ item: '旋转角度', preview: String(preview.rotation), exported: String(sampleParams.rotation) })
  }
  if (preview.rotationCx !== expectedCx) {
    vsConfig.push({ item: '旋转中心 X', preview: String(preview.rotationCx), exported: String(expectedCx) })
  }
  if (preview.rotationCy !== expectedCy) {
    vsConfig.push({ item: '旋转中心 Y', preview: String(preview.rotationCy), exported: String(expectedCy) })
  }
  if (vsConfig.length > 0) {
    problems.push(
      '渲染结果与共用配置 src/config/artworkConfig.ts 不一致：',
      ...vsConfig.map(d => `  - ${d.item}：渲染=${d.preview}，配置=${d.exported}`),
    )
  }

  // 4. PNG 导出尺寸
  const png = getPngDimensions(ARTWORK_CONFIG)
  const expectedPngWidth = Math.round(canvas.width * ARTWORK_CONFIG.export.pngScale)
  const expectedPngHeight = Math.round(canvas.height * ARTWORK_CONFIG.export.pngScale)
  if (png.width !== expectedPngWidth || png.height !== expectedPngHeight) {
    problems.push(
      'PNG 导出尺寸与配置不一致：' +
      `渲染=${png.width}x${png.height}，配置期望=${expectedPngWidth}x${expectedPngHeight}`,
    )
  }

  if (problems.length > 0) {
    return {
      ok: false,
      message: [
        '构建校验失败：样例作品的预览与导出不一致。',
        ...problems,
      ].join('\n'),
    }
  }

  return {
    ok: true,
    message: `样例作品校验通过：预览与导出一致（${preview.width}x${preview.height}，` +
      `底色 ${preview.bgColor}，旋转 ${preview.rotation}°；PNG ${png.width}x${png.height}）`,
  }
}
