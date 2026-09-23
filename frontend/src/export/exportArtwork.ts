import type { ArtworkConfig } from '../config/artworkConfig'
import { renderExportSvg, getPngDimensions, type ArtworkParams } from '../render/renderArtwork'

/**
 * 预览之外的唯一导出入口。导出时用当前参数即时渲染 SVG，
 * 不读取预览缓存的字符串，避免两边不一致。
 */

export function downloadFile(href: string, filename: string) {
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  a.click()
}

export function exportSvg(params: ArtworkParams, config: ArtworkConfig): void {
  const svg = renderExportSvg(params, config)
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
  downloadFile(url, `${config.export.filenamePrefix}-${params.seed}.svg`)
  URL.revokeObjectURL(url)
}

export function exportPng(params: ArtworkParams, config: ArtworkConfig): void {
  // 关键：用当前参数重新渲染，而不是复用上一次预览写入的 svgContent
  const svg = renderExportSvg(params, config)
  const { width, height } = getPngDimensions(config)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('无法获取 Canvas 2D 上下文，PNG 导出中止')
  }

  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
  const img = new Image()
  img.onload = () => {
    ctx.drawImage(img, 0, 0, width, height)
    URL.revokeObjectURL(url)
    canvas.toBlob(blob => {
      if (!blob) {
        throw new Error('PNG 编码失败，导出中止')
      }
      downloadFile(URL.createObjectURL(blob), `${config.export.filenamePrefix}-${params.seed}.png`)
    })
  }
  img.onerror = () => {
    URL.revokeObjectURL(url)
    throw new Error('SVG 栅格化失败，PNG 导出中止')
  }
  img.src = url
}
